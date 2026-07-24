"""Descarga de velas diarias de acciones/ETFs desde la API de gráficos de Yahoo.

Endpoint público JSON (sin API key): /v8/finance/chart/{ticker} con
period1/period2 explícitos (con range=max Yahoo degrada a velas mensuales).
Stooq quedó descartado: puso verificación JavaScript anti-bot.

Guarda cada serie en stocks_lab/data/{ticker}_1d.parquet con el mismo contrato
de columnas que crypto_lab (open_time UTC + open/high/low/close/volume) para
reutilizar el motor de backtest sin tocarlo. TODA la serie OHLC se reescala por
el factor adjclose/close de cada vela: ajustada por splits Y dividendos,
condición necesaria para que el B&H de referencia no quede infravalorado
(~2%/año en dividendos). El ajuste se comprueba con --verificar antes de
fiarse: splits de AAPL y deriva SPY vs índice ^GSPC (solo precio).

Uso:
    uv run python -m stocks_lab.datos_stocks
    uv run python -m stocks_lab.datos_stocks --verificar
"""

import argparse
import time
from pathlib import Path

import httpx
import pandas as pd

API_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
# Yahoo rechaza los user-agent de librerías python; uno de navegador basta.
CABECERAS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
DATA_DIR = Path(__file__).resolve().parent / "data"
DESDE = pd.Timestamp("1990-01-01", tz="UTC")

# Universo declarado EX-ANTE por perfil, no por resultado (evita el sesgo de
# superviviente de "elegir la ganadora de hoy"):
# - SPY: proxy del S&P 500 con dividendos (el porqué económico del
#   time-series momentum está documentado académicamente en índices)
# - AAPL, MSFT: mega-cap growth (lo que uno compraría "por conocido")
# - JNJ, KO: defensivas de baja beta (donde el momentum suele aportar menos)
# - INTC: cíclica deteriorada (prueba honesta: aquí el edge sería protegerte)
UNIVERSO = ["SPY", "AAPL", "MSFT", "JNJ", "KO", "INTC"]


def ruta_parquet(ticker: str) -> Path:
    return DATA_DIR / f"{ticker.replace('^', 'idx_')}_1d.parquet"


def descargar(ticker: str, cliente: httpx.Client) -> pd.DataFrame:
    """Descarga el histórico diario completo de un ticker, ajustado por
    splits y dividendos (OHLC reescalado por adjclose/close)."""
    respuesta = cliente.get(
        API_URL.format(ticker=ticker),
        params={
            "period1": int(DESDE.timestamp()),
            "period2": int(pd.Timestamp.now(tz="UTC").timestamp()),
            "interval": "1d",
        },
    )
    respuesta.raise_for_status()
    resultado = respuesta.json()["chart"]["result"][0]

    velas = resultado["indicators"]["quote"][0]
    df = pd.DataFrame(
        {
            "open_time": pd.to_datetime(resultado["timestamp"], unit="s", utc=True),
            "open": velas["open"],
            "high": velas["high"],
            "low": velas["low"],
            "close": velas["close"],
            "volume": velas["volume"],
            "adjclose": resultado["indicators"]["adjclose"][0]["adjclose"],
        }
    ).dropna(subset=["close", "adjclose"])

    # Vela diaria: nos quedamos con la fecha (el timestamp de Yahoo es la
    # apertura de sesión, cambia con los horarios de verano y no aporta).
    df["open_time"] = df["open_time"].dt.normalize()
    factor = df["adjclose"] / df["close"]
    for col in ["open", "high", "low", "close"]:
        df[col] = df[col] * factor
    return (
        df.drop(columns=["adjclose"])
        .sort_values("open_time")
        .reset_index(drop=True)
        .astype({c: float for c in ["open", "high", "low", "close", "volume"]})
    )


def actualizar(ticker: str, cliente: httpx.Client) -> Path:
    """Descarga y guarda un ticker. Sin lógica incremental: la serie diaria
    completa llega en una sola respuesta y pesa poco."""
    df = descargar(ticker, cliente)
    DATA_DIR.mkdir(exist_ok=True)
    destino = ruta_parquet(ticker)
    df.to_parquet(destino, index=False)
    print(
        f"{ticker:<6} {len(df):>6} velas | {df['open_time'].iloc[0]:%Y-%m-%d} a "
        f"{df['open_time'].iloc[-1]:%Y-%m-%d} | {destino.name}"
    )
    return destino


def cargar(ticker: str) -> pd.DataFrame:
    """Carga un histórico ya descargado. Punto de entrada para los experimentos."""
    destino = ruta_parquet(ticker)
    if not destino.exists():
        raise FileNotFoundError(
            f"No existe {destino}. Descárgalo con: uv run python -m stocks_lab.datos_stocks"
        )
    return pd.read_parquet(destino)


def verificar_ajuste() -> None:
    """Comprueba que las series están ajustadas por splits Y dividendos.

    1. Splits de AAPL (7:1 el 2014-06-09, 4:1 el 2020-08-31): si la serie fuera
       cruda habría un escalón de -86%/-75% de un día para otro.
    2. Dividendos: el ratio SPY/^GSPC debe CRECER (~+2%/año) si SPY está
       ajustado por dividendos, porque el ^GSPC es un índice de solo precio.
    """
    aapl = cargar("AAPL").set_index("open_time")["close"]
    for fecha, factor in [("2014-06-09", 7), ("2020-08-31", 4)]:
        ventana = aapl.loc[: pd.Timestamp(fecha, tz="UTC")].iloc[-2:]
        salto = ventana.iloc[-1] / ventana.iloc[0] - 1
        estado = "OK (sin escalón: ajustada)" if abs(salto) < 0.15 else "¡ESCALÓN: serie cruda!"
        print(f"AAPL split {factor}:1 {fecha}: variación diaria {salto:+.1%} → {estado}")

    spy = cargar("SPY").set_index("open_time")["close"]
    spx = cargar("^GSPC").set_index("open_time")["close"]
    ratio = (spy / spx).dropna()
    anos = (ratio.index[-1] - ratio.index[0]).days / 365.25
    deriva_anual = (ratio.iloc[-1] / ratio.iloc[0]) ** (1 / anos) - 1
    estado = "OK (dividendos reinvertidos)" if deriva_anual > 0.01 else "¡SIN dividendos!"
    print(f"Deriva SPY/^GSPC: {deriva_anual:+.2%}/año en {anos:.0f} años → {estado}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verificar", action="store_true", help="verificar ajuste de las series")
    args = parser.parse_args()
    if args.verificar:
        verificar_ajuste()
        return
    with httpx.Client(timeout=30, headers=CABECERAS) as cliente:
        for ticker in [*UNIVERSO, "^GSPC"]:
            actualizar(ticker, cliente)
            time.sleep(0.5)  # cortesía con el rate limit de Yahoo


if __name__ == "__main__":
    main()
