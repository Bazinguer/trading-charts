"""Lectura de velas desde los parquet locales, en el formato que espera KLineChart.

Cada vela sale como {timestamp(ms), open, high, low, close, volume}. El
semanal no se descarga: se agrega desde el diario (semanas lunes-domingo,
timestamp = lunes de apertura), así solo hay UNA fuente de verdad en disco.
"""

import pandas as pd

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
    """Último close, variación % contra el close anterior y fecha del último dato.

    Un símbolo sin parquet no es un error: sale con valores null (la lista de
    seguimiento puede contener símbolos aún no descargados).
    """
    resultado = []
    for simbolo in simbolos:
        destino = ruta_parquet(simbolo)
        if not destino.exists():
            resultado.append({"simbolo": simbolo, "ultimo": None, "var_pct": None, "fecha": None})
            continue
        df = pd.read_parquet(destino, columns=["open_time", "close"])
        ultimo = float(df["close"].iloc[-1])
        anterior = float(df["close"].iloc[-2]) if len(df) > 1 else None
        var_pct = round((ultimo / anterior - 1) * 100, 2) if anterior else None
        resultado.append(
            {
                "simbolo": simbolo,
                "ultimo": ultimo,
                "var_pct": var_pct,
                "fecha": df["open_time"].iloc[-1].date().isoformat(),
            }
        )
    return resultado


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
