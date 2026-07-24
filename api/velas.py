"""Lectura de velas desde los parquet locales, en el formato que espera KLineChart.

Cada vela sale como {timestamp(ms), open, high, low, close, volume}. El
semanal no se descarga: se agrega desde el diario (semanas lunes-domingo,
timestamp = lunes de apertura), así solo hay UNA fuente de verdad en disco.
"""

import pandas as pd

from api import cotizaciones
from api.datos import ruta_parquet

INTERVALOS = ("1d", "1w")


def cargar(simbolo: str, intervalo: str) -> list[dict]:
    if intervalo not in INTERVALOS:
        raise ValueError(f"Intervalo no soportado: {intervalo}")

    destino = ruta_parquet(simbolo)
    if not destino.exists():
        raise FileNotFoundError(f"No hay datos de {simbolo}. Descárgalos con: make datos")

    df = pd.read_parquet(destino)
    if intervalo == "1w":
        df = _a_semanal(df)

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


def _a_semanal(df: pd.DataFrame) -> pd.DataFrame:
    agregado = (
        df.set_index("open_time")
        .resample("W-MON", label="left", closed="left")
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
