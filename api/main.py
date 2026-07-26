"""API de charts: velas, dibujos, listas de seguimiento y catálogo de símbolos.

Desarrollo: `make api` (uvicorn en :8010) + `make web` (Vite con proxy /api).
En producción no hay Vite: FastAPI sirve también el build de la SPA (web/dist)
con fallback a index.html — un solo contenedor, un solo origen (patrón del
dashboard de trading-bot). Todo requiere cookie de sesión (ver api/sesion.py)
salvo login/logout/sesion y /api/salud (healthcheck del contenedor).
"""

from pathlib import Path
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from api import busqueda, datos, datos_yahoo, dibujos, listas, sesion, simbolos, velas

RUTA_WEB = Path(__file__).resolve().parent.parent / "web" / "dist"

app = FastAPI(title="charts", docs_url=None, redoc_url=None)
app.include_router(sesion.router)


@app.get("/api/salud")
def salud() -> dict:
    return {"ok": True}


protegido = APIRouter(prefix="/api", dependencies=[Depends(sesion.sesion_requerida)])


class DibujosEntrada(BaseModel):
    overlays: list[dict]
    indicadores: list[dict] = []


class ListaEntrada(BaseModel):
    nombre: str


class SimbolosEntrada(BaseModel):
    simbolos: list[str]


class OrdenEntrada(BaseModel):
    ids: list[int]


class DatosEntrada(BaseModel):
    fuente: Literal["binance", "yahoo"]
    nombre: str
    tipo: Literal["cripto", "accion", "etf", "indice", "fondo"]


def _con_nombres(filas: list[dict]) -> list[dict]:
    """Añade a cada fila el nombre registrado (fallback: el propio símbolo)."""
    nombres = simbolos.nombres([fila["simbolo"] for fila in filas])
    for fila in filas:
        fila["nombre"] = nombres.get(fila["simbolo"]) or fila["simbolo"]
    return filas


@protegido.get("/velas/{simbolo}")
def obtener_velas(simbolo: str, intervalo: str = "1d") -> list[dict]:
    try:
        return velas.cargar(simbolo, intervalo)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@protegido.get("/resumen")
def obtener_resumen(simbolos: str) -> list[dict]:
    pedidos = [s.strip() for s in simbolos.split(",") if s.strip()]
    return _con_nombres(velas.resumen(pedidos))


@protegido.get("/buscar")
def buscar_simbolos(q: str) -> list[dict]:
    return busqueda.buscar(q)


@protegido.post("/datos/{simbolo}")
def descargar_datos(simbolo: str, entrada: DatosEntrada) -> dict:
    """Descarga el histórico diario de un símbolo y lo registra en el catálogo."""
    try:
        if entrada.fuente == "binance":
            datos.actualizar(simbolo, datos.DESDE)
        else:
            datos_yahoo.actualizar(simbolo)
    # SystemExit: datos.actualizar es también CLI y avisa así de "sin datos"
    except (ValueError, SystemExit, httpx.HTTPError) as error:
        raise HTTPException(
            status_code=502, detail=f"No se pudo descargar {simbolo}: {error}"
        ) from error
    simbolos.registrar(simbolo, entrada.nombre, entrada.tipo, entrada.fuente)
    return {"simbolo": simbolo, "velas": velas.total(simbolo)}


@protegido.get("/analisis")
def obtener_analisis() -> list[dict]:
    return _con_nombres(dibujos.analisis())


@protegido.get("/dibujos/{simbolo}")
def obtener_dibujos(simbolo: str) -> dict:
    return dibujos.obtener(simbolo)


@protegido.put("/dibujos/{simbolo}")
def guardar_dibujos(simbolo: str, entrada: DibujosEntrada) -> dict:
    dibujos.guardar(simbolo, entrada.overlays, entrada.indicadores)
    return {"dibujos": len(entrada.overlays), "indicadores": len(entrada.indicadores)}


@protegido.get("/listas")
def obtener_listas() -> list[dict]:
    return listas.obtener_todas()


@protegido.post("/listas")
def crear_lista(entrada: ListaEntrada) -> dict:
    return listas.crear(entrada.nombre)


# Antes que /listas/{lista_id}: si no, "orden" se intentaría parsear como id.
@protegido.put("/listas/orden")
def reordenar_listas(entrada: OrdenEntrada) -> dict:
    if not listas.reordenar(entrada.ids):
        raise HTTPException(status_code=400, detail="Los ids no coinciden con las listas")
    return {"orden": entrada.ids}


@protegido.put("/listas/{lista_id}")
def renombrar_lista(lista_id: int, entrada: ListaEntrada) -> dict:
    if not listas.renombrar(lista_id, entrada.nombre):
        raise HTTPException(status_code=404, detail=f"No existe la lista {lista_id}")
    return {"id": lista_id, "nombre": entrada.nombre}


@protegido.delete("/listas/{lista_id}")
def borrar_lista(lista_id: int) -> dict:
    if not listas.borrar(lista_id):
        raise HTTPException(status_code=404, detail=f"No existe la lista {lista_id}")
    return {"borrada": lista_id}


@protegido.put("/listas/{lista_id}/simbolos")
def reemplazar_simbolos(lista_id: int, entrada: SimbolosEntrada) -> dict:
    if not listas.reemplazar_simbolos(lista_id, entrada.simbolos):
        raise HTTPException(status_code=404, detail=f"No existe la lista {lista_id}")
    return {"id": lista_id, "simbolos": len(entrada.simbolos)}


app.include_router(protegido)

# El catch-all va DESPUÉS de los routers: si no, se comería /api/*. Solo en
# producción (en dev no existe web/dist y sirve Vite con su proxy).
if RUTA_WEB.exists():
    app.mount("/assets", StaticFiles(directory=RUTA_WEB / "assets"), name="assets")

    @app.get("/{ruta:path}", include_in_schema=False)
    async def spa(ruta: str) -> FileResponse:
        candidato = RUTA_WEB / ruta
        if ruta and candidato.is_file() and candidato.resolve().is_relative_to(RUTA_WEB):
            return FileResponse(candidato)
        # Fallback SPA: los deep links (/grafico/BTCUSDT) sirven index.html
        return FileResponse(RUTA_WEB / "index.html")
