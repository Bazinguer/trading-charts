"""Descarga de velas diarias desde la API de gráficos de Yahoo.

Port de trading-bot/stocks_lab/datos_stocks.py para acciones, ETFs, índices y
fondos: endpoint público JSON (sin API key) con period1/period2 explícitos
(con range=max Yahoo degrada a velas mensuales). TODA la serie OHLC se
reescala por el factor adjclose/close de cada vela: ajustada por splits Y
dividendos.

Mismo contrato de columnas que los parquet de Binance (open_time UTC
normalizado + open/high/low/close/volume) y misma ruta vía ruta_parquet().
Sin lógica incremental: la serie diaria completa llega en una sola respuesta
y pesa poco, así que cada descarga reemplaza el parquet entero.
"""

from pathlib import Path

import httpx
import pandas as pd

from api.datos import DATA_DIR, ruta_parquet

API_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
# Yahoo rechaza los user-agent de librerías python; uno de navegador basta.
CABECERAS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
DESDE = pd.Timestamp("1990-01-01", tz="UTC")


def descargar(ticker: str, cliente: httpx.Client, intervalo: str = "1d") -> pd.DataFrame:
    """Descarga el histórico de un ticker; el diario, ajustado por splits y
    dividendos (OHLC reescalado por adjclose/close). El 1h se limita a la
    ventana que Yahoo permite (~730 días) y llega sin adjclose: se guarda tal
    cual (un split reciente introduciría un escalón en lo ya acumulado)."""
    desde = DESDE if intervalo == "1d" else pd.Timestamp.now(tz="UTC") - pd.Timedelta(days=729)
    try:
        respuesta = cliente.get(
            API_URL.format(ticker=ticker),
            params={
                "period1": int(desde.timestamp()),
                "period2": int(pd.Timestamp.now(tz="UTC").timestamp()),
                "interval": intervalo,
            },
        )
        respuesta.raise_for_status()
    except httpx.HTTPStatusError as error:
        codigo = error.response.status_code
        raise ValueError(f"Yahoo devolvió HTTP {codigo} para {ticker} (¿existe?)") from error
    except httpx.HTTPError as error:
        raise ValueError(f"No se pudo conectar con Yahoo: {error}") from error

    resultado = (respuesta.json()["chart"]["result"] or [{}])[0]
    if "timestamp" not in resultado:
        raise ValueError(f"Yahoo no devolvió velas para {ticker}")

    velas = resultado["indicators"]["quote"][0]
    adjclose = (resultado["indicators"].get("adjclose") or [{}])[0].get("adjclose")
    df = pd.DataFrame(
        {
            "open_time": pd.to_datetime(resultado["timestamp"], unit="s", utc=True),
            "open": velas["open"],
            "high": velas["high"],
            "low": velas["low"],
            "close": velas["close"],
            "volume": velas["volume"],
        }
    ).dropna(subset=["close"])

    if intervalo == "1d" and adjclose is not None:
        df["adjclose"] = pd.Series(adjclose).reindex(df.index)
        df = df.dropna(subset=["adjclose"])
        # Vela diaria: nos quedamos con la fecha (el timestamp de Yahoo es la
        # apertura de sesión, cambia con los horarios de verano y no aporta).
        df["open_time"] = df["open_time"].dt.normalize()
        factor = df["adjclose"] / df["close"]
        for col in ["open", "high", "low", "close"]:
            df[col] = df[col] * factor
        df = df.drop(columns=["adjclose"])
    # Índices y fondos pueden venir sin volumen: 0 en vez de NaN (que rompería el JSON)
    df["volume"] = df["volume"].fillna(0)
    return (
        df.sort_values("open_time")
        .reset_index(drop=True)
        .astype({c: float for c in ["open", "high", "low", "close", "volume"]})
    )


def actualizar(ticker: str, intervalo: str = "1d") -> Path:
    """Descarga y guarda el histórico de un ticker en su parquet.

    El diario reemplaza el fichero entero (llega completo y re-ajustado). El
    1h ACUMULA sobre lo ya guardado: Yahoo solo sirve ~730 días, pero las
    descargas sucesivas van extendiendo el histórico local.
    """
    with httpx.Client(timeout=30, headers=CABECERAS) as cliente:
        df = descargar(ticker, cliente, intervalo)
    DATA_DIR.mkdir(exist_ok=True)
    destino = ruta_parquet(ticker, intervalo)
    if intervalo != "1d" and destino.exists():
        previo = pd.read_parquet(destino)
        df = (
            pd.concat([previo, df], ignore_index=True)
            .drop_duplicates(subset=["open_time"], keep="last")
            .sort_values("open_time")
            .reset_index(drop=True)
        )
    df.to_parquet(destino, index=False)
    return destino
