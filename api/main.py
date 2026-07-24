"""API de charts: velas para el gráfico, dibujos y listas de seguimiento.

Desarrollo: `make api` (uvicorn en :8010) + `make web` (Vite con proxy /api).
Todo requiere cookie de sesión (ver api/sesion.py) salvo login/logout/sesion.
"""

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from pydantic import BaseModel

from api import dibujos, listas, sesion, velas

app = FastAPI(title="charts", docs_url=None, redoc_url=None)
app.include_router(sesion.router)

listas.asegurar_semilla()

protegido = APIRouter(prefix="/api", dependencies=[Depends(sesion.sesion_requerida)])


class DibujosEntrada(BaseModel):
    overlays: list[dict]


class ListaEntrada(BaseModel):
    nombre: str


class SimbolosEntrada(BaseModel):
    simbolos: list[str]


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
    return velas.resumen([s.strip() for s in simbolos.split(",") if s.strip()])


@protegido.get("/dibujos/{simbolo}")
def obtener_dibujos(simbolo: str) -> dict:
    return {"overlays": dibujos.obtener(simbolo)}


@protegido.put("/dibujos/{simbolo}")
def guardar_dibujos(simbolo: str, entrada: DibujosEntrada) -> dict:
    dibujos.guardar(simbolo, entrada.overlays)
    return {"guardados": len(entrada.overlays)}


@protegido.get("/listas")
def obtener_listas() -> list[dict]:
    return listas.obtener_todas()


@protegido.post("/listas")
def crear_lista(entrada: ListaEntrada) -> dict:
    return listas.crear(entrada.nombre)


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
