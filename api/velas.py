"""Lectura de velas desde los parquet locales, en el formato que espera KLineChart.

Cada vela sale como {timestamp(ms), open, high, low, close, volume}. Una
fuente de verdad POR FAMILIA en disco: del diario se agregan semanal (semanas
lunes-domingo, timestamp = lunes) y mensual (timestamp = día 1); del 1h se
agrega el 4h (bloques alineados a 00 UTC). El parquet 1h se descarga bajo
demanda la primera vez que se pide (Binance o Yahoo según la fuente del
símbolo) y después se completa incremental.
"""

import pandas as pd

from api import cotizaciones, datos, datos_yahoo, simbolos
from api.datos import ruta_parquet

INTERVALOS = ("1h", "4h", "1d", "1w", "1M")


def _asegurar_1h(simbolo: str) -> None:
    """Descarga el histórico 1h si aún no existe (primera vez que se pide)."""
    if ruta_parquet(simbolo, "1h").exists():
        return
    fuente = simbolos.fuentes([simbolo]).get(simbolo, "binance")
    if fuente == "yahoo":
        datos_yahoo.actualizar(simbolo, "1h")
    else:
        datos.actualizar(simbolo, datos.desde_intradia(), "1h")


def cargar(simbolo: str, intervalo: str) -> list[dict]:
    if intervalo not in INTERVALOS:
        raise ValueError(f"Intervalo no soportado: {intervalo}")

    base = "1h" if intervalo in ("1h", "4h") else "1d"
    if base == "1h":
        _asegurar_1h(simbolo)
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
    calcula contra el cierre de la última vela en disco. `fecha` es siempre
    la de la última vela guardada. Un símbolo sin parquet no es un error:
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
