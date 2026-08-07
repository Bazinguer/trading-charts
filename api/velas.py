"""Lectura de velas desde los parquet locales, en el formato que espera KLineChart.

Cada vela sale como {timestamp(ms), open, high, low, close, volume}. Una
fuente de verdad POR FAMILIA en disco: del diario se agregan semanal (semanas
lunes-domingo, timestamp = lunes) y mensual (timestamp = día 1); del 1h se
agrega el 4h (bloques alineados a 00 UTC).

El parquet base se refresca PEREZOSAMENTE al pedir velas (ver _refrescar):
nadie ejecuta `make datos` en producción, así que sin esto el gráfico se
queda congelado en el día que se añadió el símbolo mientras /api/resumen sí
muestra la cotización viva. La última vela puede ser la de la sesión EN CURSO
(Binance y Yahoo la sirven a medio formar): es deliberado, como TradingView,
y los indicadores se mueven sobre ella hasta el cierre.
"""

import threading
import time
from pathlib import Path

import httpx
import pandas as pd

from api import cotizaciones, datos, datos_yahoo, simbolos
from api.datos import ruta_parquet

INTERVALOS = ("1h", "4h", "1d", "1w", "1M")
FRESCURA_SEGUNDOS = 15 * 60

# Un lock por parquet: FastAPI sirve los endpoints síncronos en un threadpool,
# así que dos peticiones del mismo símbolo pueden solaparse (el StrictMode de
# React ya duplica el fetch en dev) y to_parquet no escribe de forma atómica.
_locks: dict[str, threading.Lock] = {}
_locks_lock = threading.Lock()
_ultimo_intento: dict[str, float] = {}


def _lock_de(clave: str) -> threading.Lock:
    with _locks_lock:
        return _locks.setdefault(clave, threading.Lock())


def _al_dia(destino: Path) -> bool:
    """Si el parquet se escribió hace poco, o si ya se intentó hace poco.

    El umbral se mide sobre el mtime del FICHERO, no sobre la fecha de la
    última vela: en fin de semana o festivo no nace vela nueva, así que un
    "¿la última vela es de hoy?" no quedaría satisfecho nunca y volvería a
    descargar en cada carga del gráfico. El intento cuenta aunque falle: si
    Yahoo está caído, no colgamos cada petición con su timeout.
    """
    ahora = time.time()
    if destino.exists() and ahora - destino.stat().st_mtime < FRESCURA_SEGUNDOS:
        return True
    return ahora - _ultimo_intento.get(destino.name, 0) < FRESCURA_SEGUNDOS


def _refrescar(simbolo: str, intervalo: str) -> None:
    """Descarga o completa el parquet base si ya no está al día.

    Cubre también la primera descarga (parquet inexistente). Un fallo de red
    no deja sin gráfico: si ya hay parquet se sirve tal cual —algo viejo es
    mejor que un 502—; si no lo hay, cargar() lanza su FileNotFoundError.
    """
    destino = ruta_parquet(simbolo, intervalo)
    if _al_dia(destino):
        return
    with _lock_de(destino.name):
        if _al_dia(destino):  # otra petición pudo refrescarlo mientras esperábamos
            return
        _ultimo_intento[destino.name] = time.time()
        fuente = simbolos.fuentes([simbolo]).get(simbolo, "binance")
        try:
            if fuente == "yahoo":
                datos_yahoo.actualizar(simbolo, intervalo)
            else:
                desde = datos.DESDE if intervalo == "1d" else datos.desde_intradia()
                datos.actualizar(simbolo, desde, intervalo)
        # SystemExit: datos.actualizar es también CLI y avisa así de "sin datos"
        except (ValueError, SystemExit, httpx.HTTPError, OSError):
            pass


def cargar(simbolo: str, intervalo: str) -> list[dict]:
    if intervalo not in INTERVALOS:
        raise ValueError(f"Intervalo no soportado: {intervalo}")

    base = "1h" if intervalo in ("1h", "4h") else "1d"
    _refrescar(simbolo, base)
    destino = ruta_parquet(simbolo, base)
    if not destino.exists():
        raise FileNotFoundError(f"No hay datos de {simbolo}. Descárgalos con: make datos")

    df = pd.read_parquet(destino)
    if intervalo == "4h":
        df = _agregar(df, "4h")
    elif intervalo == "1w":
        df = _agregar(df, "W-MON", label="left", closed="left")
    elif intervalo == "1M":
        df = _agregar(df, "MS")

    df = df.rename(columns={"open_time": "timestamp"})
    # as_unit("ms") fija la resolución antes de pasar a entero: pandas 3 ya no
    # garantiza nanosegundos, así que dividir a ciegas corrompería el epoch.
    df["timestamp"] = df["timestamp"].dt.as_unit("ms").astype("int64")
    return df.to_dict(orient="records")


def resumen(simbolos: list[str]) -> list[dict]:
    """Resumen de cada símbolo: cotización en vivo si la hay, si no la última vela.

    Base: última vela diaria del parquet (cierre, variación % entre las dos
    últimas velas, OHLC y fecha). Si hay cotización en vivo, pisa esos campos
    y añade ampliado/ampliado_pct (pre/post-market) y resultados (fecha de
    próximos resultados); var_pct sin porcentaje de la fuente (Binance) se
    calcula contra el cierre de la última vela en disco. `fecha` es la del
    DATO que se devuelve: la del quote si hay cotización viva (con el mercado
    cerrado, la de su último cierre), si no la de la última vela guardada —
    así nunca acompaña a un precio de otro momento. Un símbolo sin parquet no es un error:
    sale con null en lo que no haya (la lista de seguimiento puede contener
    símbolos aún no descargados).
    """
    campos = ("ultimo", "var_pct", "apertura", "maximo", "minimo", "fecha")
    extras = ("ampliado", "ampliado_pct", "resultados")
    vivos = cotizaciones.obtener(simbolos)
    resultado = []
    for simbolo in simbolos:
        fila = {"simbolo": simbolo, **dict.fromkeys(campos + extras)}
        destino = ruta_parquet(simbolo)
        cierre_previo = None
        if destino.exists():
            df = pd.read_parquet(destino)
            ultima = df.iloc[-1]
            ultimo = float(ultima["close"])
            anterior = float(df["close"].iloc[-2]) if len(df) > 1 else None
            # Referencia para la variación live: el último cierre ANTERIOR a
            # hoy (si la última vela es la del día en curso, live vs ella ≈ 0).
            cerradas = df.loc[df["open_time"] < pd.Timestamp.now(tz="UTC").normalize(), "close"]
            cierre_previo = float(cerradas.iloc[-1]) if len(cerradas) else None
            fila.update(
                {
                    "ultimo": ultimo,
                    "var_pct": round((ultimo / anterior - 1) * 100, 2) if anterior else None,
                    "apertura": float(ultima["open"]),
                    "maximo": float(ultima["high"]),
                    "minimo": float(ultima["low"]),
                    "fecha": ultima["open_time"].date().isoformat(),
                }
            )
        vivo = vivos.get(simbolo)
        if vivo:
            fila.update({clave: valor for clave, valor in vivo.items() if valor is not None})
            if vivo.get("var_pct") is None and vivo.get("ultimo") and cierre_previo:
                fila["var_pct"] = round((vivo["ultimo"] / cierre_previo - 1) * 100, 2)
        resultado.append(fila)
    return resultado


def total(simbolo: str) -> int:
    """Número de velas diarias guardadas de un símbolo."""
    return len(pd.read_parquet(ruta_parquet(simbolo), columns=["open_time"]))


def _agregar(df: pd.DataFrame, regla: str, **kwargs) -> pd.DataFrame:
    agregado = (
        df.set_index("open_time")
        .resample(regla, **kwargs)
        .agg(
            open=("open", "first"),
            high=("high", "max"),
            low=("low", "min"),
            close=("close", "last"),
            volume=("volume", "sum"),
        )
        .dropna(subset=["open"])
        .reset_index()
    )
    return agregado
