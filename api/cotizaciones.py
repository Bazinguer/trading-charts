"""Cotizaciones en vivo para /api/resumen: Binance y Yahoo, en lote.

Devuelve por símbolo un dict con las claves del contrato del resumen (ultimo,
var_pct, apertura, maximo, minimo, ampliado, ampliado_pct, resultados); las
que la fuente no da, no aparecen o van a None y el resumen conserva lo del
parquet. La fuente de cada símbolo sale de la tabla simbolos; los no
registrados no se consultan.

Yahoo exige cookie+crumb desde 2023: se obtienen una vez (fc.yahoo.com deja
la cookie, /v1/test/getcrumb da el crumb) y se cachean en memoria; ante un
401/403 se renuevan UNA vez y se reintenta. Cualquier fallo (red, crumb,
límite de peticiones) degrada a {}: el resumen cae al parquet y el endpoint
nunca se rompe por una cotización. Cache de 60 s por conjunto de símbolos
para no machacar las APIs al cambiar de pestaña.
"""

import json
import time
from datetime import UTC, datetime

import httpx

from api import simbolos
from api.datos_yahoo import CABECERAS

BINANCE_URL = "https://api.binance.com/api/v3/ticker/price"
YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v7/finance/quote"
YAHOO_COOKIE_URL = "https://fc.yahoo.com"
YAHOO_CRUMB_URL = "https://query1.finance.yahoo.com/v1/test/getcrumb"
TIMEOUT = 5
CACHE_SEGUNDOS = 60

_cache: dict[frozenset[str], tuple[float, dict[str, dict]]] = {}
_yahoo_auth: tuple[dict, str] | None = None  # (cookies, crumb) reutilizables


class _AuthCaducada(Exception):
    """El quote de Yahoo respondió 401/403: cookie+crumb a renovar."""


def obtener(pedidos: list[str]) -> dict[str, dict]:
    """Cotización en vivo de cada símbolo pedido; los que fallan no aparecen."""
    if not pedidos:
        return {}
    clave = frozenset(pedidos)
    en_cache = _cache.get(clave)
    if en_cache and time.time() - en_cache[0] < CACHE_SEGUNDOS:
        return en_cache[1]

    fuentes = simbolos.fuentes(pedidos)
    resultado = _binance([s for s in pedidos if fuentes.get(s) == "binance"])
    resultado |= _yahoo([s for s in pedidos if fuentes.get(s) == "yahoo"])
    _cache[clave] = (time.time(), resultado)
    return resultado


def _binance(lista: list[str]) -> dict[str, dict]:
    """Último precio de cada par, en una sola petición en lote."""
    if not lista:
        return {}
    try:
        with httpx.Client(timeout=TIMEOUT) as cliente:
            respuesta = cliente.get(
                BINANCE_URL, params={"symbols": json.dumps(lista, separators=(",", ":"))}
            )
            respuesta.raise_for_status()
            precios = respuesta.json()
    except (httpx.HTTPError, ValueError):
        return {}
    return {p["symbol"]: {"ultimo": float(p["price"])} for p in precios}


def _yahoo(lista: list[str]) -> dict[str, dict]:
    """Quote en lote de Yahoo; renueva cookie+crumb una vez si caducaron."""
    global _yahoo_auth
    if not lista:
        return {}
    try:
        if _yahoo_auth is None:
            _yahoo_auth = _nueva_auth()
        try:
            quotes = _pedir_quotes(lista, *_yahoo_auth)
        except _AuthCaducada:
            _yahoo_auth = _nueva_auth()
            quotes = _pedir_quotes(lista, *_yahoo_auth)
    except (httpx.HTTPError, ValueError, KeyError):
        return {}
    return {q["symbol"]: _normalizar(q) for q in quotes if q.get("symbol")}


def _nueva_auth() -> tuple[dict, str]:
    """Cookie + crumb que el endpoint de quotes exige desde 2023."""
    with httpx.Client(timeout=TIMEOUT, headers=CABECERAS) as cliente:
        cliente.get(YAHOO_COOKIE_URL)  # responde 404, pero deja la cookie en el jar
        respuesta = cliente.get(YAHOO_CRUMB_URL)
        respuesta.raise_for_status()
        crumb = respuesta.text.strip()
        cookies = dict(cliente.cookies)
    if not cookies or not crumb or "{" in crumb:  # "{" delata un JSON de error
        raise ValueError("Yahoo no devolvió cookie+crumb válidos")
    return cookies, crumb


def _pedir_quotes(lista: list[str], cookies: dict, crumb: str) -> list[dict]:
    with httpx.Client(timeout=TIMEOUT, headers=CABECERAS, cookies=cookies) as cliente:
        respuesta = cliente.get(
            YAHOO_QUOTE_URL, params={"symbols": ",".join(lista), "crumb": crumb}
        )
    if respuesta.status_code in (401, 403):
        raise _AuthCaducada
    respuesta.raise_for_status()
    return respuesta.json()["quoteResponse"]["result"]


def _normalizar(quote: dict) -> dict:
    """Traduce un quote de Yahoo al contrato del resumen.

    ampliado = post-market si hay, si no pre-market (cripto/índices/fondos no
    tienen ninguno y queda None). resultados = fecha UTC de los próximos
    resultados, si Yahoo la da.
    """
    ampliado = quote.get("postMarketPrice")
    ampliado_pct = quote.get("postMarketChangePercent")
    if ampliado is None:
        ampliado = quote.get("preMarketPrice")
        ampliado_pct = quote.get("preMarketChangePercent")
    resultados = quote.get("earningsTimestamp")
    return {
        "ultimo": quote.get("regularMarketPrice"),
        "var_pct": _redondeado(quote.get("regularMarketChangePercent")),
        "apertura": quote.get("regularMarketOpen"),
        "maximo": quote.get("regularMarketDayHigh"),
        "minimo": quote.get("regularMarketDayLow"),
        "ampliado": ampliado,
        "ampliado_pct": _redondeado(ampliado_pct),
        "resultados": (
            datetime.fromtimestamp(resultados, tz=UTC).date().isoformat() if resultados else None
        ),
    }


def _redondeado(valor: float | None) -> float | None:
    return round(valor, 2) if valor is not None else None
