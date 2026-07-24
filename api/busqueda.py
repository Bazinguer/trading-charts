"""Búsqueda unificada de símbolos: pares USDT de Binance + buscador de Yahoo.

Binance no tiene endpoint de búsqueda: se descarga el catálogo completo de
exchangeInfo (pares USDT en TRADING) y se cachea 24h en
data/binance_simbolos.json. Yahoo sí lo tiene (/v1/finance/search) y se
consulta en vivo. Ninguna de las dos fuentes debe romper la búsqueda: si una
falla, se devuelve lo que haya de la otra.
"""

import json
import time

import httpx

from api.datos import DATA_DIR
from api.datos_yahoo import CABECERAS

BINANCE_URL = "https://api.binance.com/api/v3/exchangeInfo"
YAHOO_URL = "https://query1.finance.yahoo.com/v1/finance/search"
CACHE_BINANCE = DATA_DIR / "binance_simbolos.json"
CACHE_SEGUNDOS = 24 * 3600
MAX_RESULTADOS = 20

TIPOS_YAHOO = {"EQUITY": "accion", "ETF": "etf", "INDEX": "indice", "MUTUALFUND": "fondo"}


def buscar(q: str) -> list[dict]:
    """Resultados combinados [{simbolo, nombre, tipo, fuente}], sin duplicados.

    Si q parece un par de Binance (contiene USDT) la cripto va primero; si no,
    manda lo de Yahoo, que es lo que se suele estar buscando por nombre.
    """
    cripto = _buscar_binance(q)
    bolsa = _buscar_yahoo(q)
    combinados = cripto + bolsa if "USDT" in q.upper() else bolsa + cripto
    vistos: set[str] = set()
    resultados = []
    for fila in combinados:
        if fila["simbolo"] not in vistos:
            vistos.add(fila["simbolo"])
            resultados.append(fila)
    return resultados[:MAX_RESULTADOS]


def _catalogo_binance() -> list[dict]:
    """Pares USDT en TRADING; del cache si tiene menos de 24h."""
    if CACHE_BINANCE.exists() and time.time() - CACHE_BINANCE.stat().st_mtime < CACHE_SEGUNDOS:
        return json.loads(CACHE_BINANCE.read_text())
    with httpx.Client(timeout=30) as cliente:
        respuesta = cliente.get(BINANCE_URL)
        respuesta.raise_for_status()
        info = respuesta.json()
    pares = [
        {"simbolo": s["symbol"], "nombre": s["baseAsset"], "tipo": "cripto", "fuente": "binance"}
        for s in info["symbols"]
        if s["quoteAsset"] == "USDT" and s["status"] == "TRADING"
    ]
    DATA_DIR.mkdir(exist_ok=True)
    CACHE_BINANCE.write_text(json.dumps(pares))
    return pares


def _buscar_binance(q: str) -> list[dict]:
    q = q.upper()
    try:
        catalogo = _catalogo_binance()
    except httpx.HTTPError:
        # Sin red hacia Binance: se tira del cache aunque esté caducado
        catalogo = json.loads(CACHE_BINANCE.read_text()) if CACHE_BINANCE.exists() else []
    return [f for f in catalogo if q in f["simbolo"] or q in f["nombre"]][:MAX_RESULTADOS]


def _buscar_yahoo(q: str) -> list[dict]:
    try:
        with httpx.Client(timeout=10, headers=CABECERAS) as cliente:
            respuesta = cliente.get(YAHOO_URL, params={"q": q})
            respuesta.raise_for_status()
            quotes = respuesta.json().get("quotes", [])
    except httpx.HTTPError:
        return []
    resultados = []
    for quote in quotes:
        tipo = TIPOS_YAHOO.get(quote.get("quoteType"))
        if not tipo or not quote.get("symbol"):
            continue
        resultados.append(
            {
                "simbolo": quote["symbol"],
                "nombre": quote.get("shortname") or quote.get("longname") or quote["symbol"],
                "tipo": tipo,
                "fuente": "yahoo",
            }
        )
    return resultados
