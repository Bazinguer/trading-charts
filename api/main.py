"""API de charts: velas para el gráfico y persistencia de dibujos.

Desarrollo: `make api` (uvicorn en :8010) + `make web` (Vite con proxy /api).
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from api import dibujos, velas

app = FastAPI(title="charts", docs_url=None, redoc_url=None)


class DibujosEntrada(BaseModel):
    overlays: list[dict]


@app.get("/api/velas/{simbolo}")
def obtener_velas(simbolo: str, intervalo: str = "1d") -> list[dict]:
    try:
        return velas.cargar(simbolo, intervalo)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.get("/api/dibujos/{simbolo}")
def obtener_dibujos(simbolo: str) -> dict:
    return {"overlays": dibujos.obtener(simbolo)}


@app.put("/api/dibujos/{simbolo}")
def guardar_dibujos(simbolo: str, entrada: DibujosEntrada) -> dict:
    dibujos.guardar(simbolo, entrada.overlays)
    return {"guardados": len(entrada.overlays)}
