"""Descarga de velas (diarias y 1h) desde la API pública de Binance.

Guarda cada serie en data/{símbolo}_{intervalo}.parquet. Si el fichero ya
existe, continúa desde la última vela guardada (descarga incremental), por lo
que se puede relanzar cuantas veces se quiera sin re-descargar todo. El 1h
arranca en una ventana de ~2 años (DESDE_INTRADIA): basta para AT intradía y
es simétrico con el límite de Yahoo.

Mismo contrato de columnas que crypto_lab (open_time UTC + OHLCV); las
acciones e índices (API de Yahoo) viven en api/datos_yahoo.py con el mismo
contrato y la misma ruta de parquet.

Uso:
    uv run python -m api.datos
    uv run python -m api.datos --symbol ETHUSDT --desde 2020-01-01
    uv run python -m api.datos --symbol BTCUSDT --intervalo 1h
"""

import argparse
import time
from pathlib import Path

import httpx
import pandas as pd

API_URL = "https://api.binance.com/api/v3/klines"
MAX_VELAS_POR_PETICION = 1000
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
INTERVALO = "1d"
DESDE = "2017-08-01"  # BTCUSDT cotiza en Binance desde 2017-08-17

SIMBOLOS = ["BTCUSDT", "ETHUSDT"]


def desde_intradia() -> str:
    """Inicio por defecto del histórico 1h: ~2 años atrás."""
    return (pd.Timestamp.now(tz="UTC") - pd.Timedelta(days=729)).strftime("%Y-%m-%d")


COLUMNAS_API = [
    "open_time",
    "open",
    "high",
    "low",
    "close",
    "volume",
    "close_time",
    "quote_volume",
    "trades",
    "taker_buy_base",
    "taker_buy_quote",
    "_ignorar",
]


def ruta_parquet(simbolo: str, intervalo: str = INTERVALO) -> Path:
    """Ruta única del parquet de un símbolo e intervalo, sea cual sea su fuente.

    Sanea el `^` de los índices de Yahoo (^GSPC → idx_GSPC) para no meter
    caracteres incómodos en nombres de fichero (patrón de stocks_lab).
    """
    return DATA_DIR / f"{simbolo.replace('^', 'idx_')}_{intervalo}.parquet"


def _a_dataframe(filas: list[list]) -> pd.DataFrame:
    df = pd.DataFrame(filas, columns=COLUMNAS_API)
    df = df[["open_time", "open", "high", "low", "close", "volume"]].copy()
    numericas = ["open", "high", "low", "close", "volume"]
    df[numericas] = df[numericas].astype(float)
    df["open_time"] = pd.to_datetime(df["open_time"], unit="ms", utc=True)
    return df


def descargar(
    symbol: str, desde_ms: int, cliente: httpx.Client, intervalo: str = INTERVALO
) -> pd.DataFrame:
    """Descarga velas desde `desde_ms` (epoch ms) hasta el presente, paginando."""
    paginas = []
    while True:
        respuesta = cliente.get(
            API_URL,
            params={
                "symbol": symbol,
                "interval": intervalo,
                "startTime": desde_ms,
                "limit": MAX_VELAS_POR_PETICION,
            },
        )
        respuesta.raise_for_status()
        filas = respuesta.json()
        if not filas:
            break
        paginas.append(filas)
        desde_ms = filas[-1][0] + 1
        if len(filas) < MAX_VELAS_POR_PETICION:
            break
        # Pausa corta para no acercarnos al límite de peticiones de la API
        time.sleep(0.15)

    if not paginas:
        return pd.DataFrame()
    return _a_dataframe([fila for pagina in paginas for fila in pagina])


def actualizar(symbol: str, desde: str, intervalo: str = INTERVALO) -> Path:
    """Descarga (o completa) el histórico del intervalo y lo guarda en parquet."""
    destino = ruta_parquet(symbol, intervalo)
    existente = pd.read_parquet(destino) if destino.exists() else None

    if existente is not None and not existente.empty:
        # La última vela guardada podría estar a medio formar: se re-descarga.
        existente = existente.iloc[:-1]
        desde_ms = int(existente["open_time"].iloc[-1].timestamp() * 1000) + 1
    else:
        existente = None
        desde_ms = int(pd.Timestamp(desde, tz="UTC").timestamp() * 1000)

    with httpx.Client(timeout=30) as cliente:
        nuevas = descargar(symbol, desde_ms, cliente, intervalo)

    if nuevas.empty and existente is None:
        raise SystemExit(f"La API no devolvió datos para {symbol} desde {desde}")

    df = pd.concat([existente, nuevas], ignore_index=True) if existente is not None else nuevas
    DATA_DIR.mkdir(exist_ok=True)
    df.to_parquet(destino, index=False)
    print(f"{symbol}: {len(nuevas)} velas nuevas | total {len(df)} | {destino}")
    return destino


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--symbol", help="Un símbolo concreto; por defecto, todos")
    parser.add_argument("--desde", help="Fecha de inicio (YYYY-MM-DD)")
    parser.add_argument("--intervalo", default=INTERVALO, choices=["1d", "1h"])
    args = parser.parse_args()
    desde = args.desde or (DESDE if args.intervalo == "1d" else desde_intradia())
    for symbol in [args.symbol] if args.symbol else SIMBOLOS:
        actualizar(symbol, desde, args.intervalo)


if __name__ == "__main__":
    main()
