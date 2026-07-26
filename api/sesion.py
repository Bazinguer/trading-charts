"""Auth de usuario único por cookie de sesión firmada con HMAC (solo stdlib).

Patrón adaptado del dashboard de trading-bot, pero sin SessionMiddleware (que
arrastraría itsdangerous): la cookie lleva "usuario|caducidad|firma" y la firma
es HMAC-SHA256 con CHARTS_SECRET. Sin firma válida o caducada, no hay sesión.

Config por entorno (en desarrollo se carga del .env de la raíz, sin pisar
variables ya definidas; en producción mandan las del contenedor):

    CHARTS_USUARIO    nombre de usuario
    CHARTS_PASSWORD   contraseña
    CHARTS_SECRET     clave de firma de la cookie
    CHARTS_HTTPS      "1" en producción: cookie con flag Secure (solo HTTPS)
"""

import hashlib
import hmac
import os
import secrets
import time
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel

COOKIE = "charts_sesion"
DURACION = 30 * 24 * 3600  # ~30 días, en segundos


def _cargar_env() -> None:
    ruta = Path(__file__).resolve().parent.parent / ".env"
    if not ruta.exists():
        return
    for linea in ruta.read_text().splitlines():
        linea = linea.strip()
        if linea and not linea.startswith("#") and "=" in linea:
            clave, valor = linea.split("=", 1)
            os.environ.setdefault(clave.strip(), valor.strip())


_cargar_env()

router = APIRouter()


class Credenciales(BaseModel):
    usuario: str
    password: str


def _firmar(datos: str) -> str:
    secreto = os.environ["CHARTS_SECRET"]
    return hmac.new(secreto.encode(), datos.encode(), hashlib.sha256).hexdigest()


def _usuario_de_cookie(valor: str) -> str | None:
    """Devuelve el usuario si la cookie es válida y no ha caducado."""
    if not os.environ.get("CHARTS_SECRET"):
        return None
    partes = valor.rsplit("|", 2)
    if len(partes) != 3:
        return None
    usuario, caducidad, firma = partes
    if not hmac.compare_digest(_firmar(f"{usuario}|{caducidad}"), firma):
        return None
    if not caducidad.isdigit() or int(caducidad) < time.time():
        return None
    return usuario


def sesion_requerida(request: Request) -> str:
    valor = request.cookies.get(COOKIE)
    usuario = _usuario_de_cookie(valor) if valor else None
    if usuario is None:
        raise HTTPException(status_code=401, detail="sesión requerida")
    return usuario


@router.post("/api/login")
def login(datos: Credenciales, respuesta: Response) -> dict:
    usuario_cfg = os.environ.get("CHARTS_USUARIO", "")
    password_cfg = os.environ.get("CHARTS_PASSWORD", "")
    if not (usuario_cfg and password_cfg and os.environ.get("CHARTS_SECRET")):
        raise HTTPException(500, "Faltan CHARTS_USUARIO/CHARTS_PASSWORD/CHARTS_SECRET")
    usuario_ok = secrets.compare_digest(datos.usuario, usuario_cfg)
    password_ok = secrets.compare_digest(datos.password, password_cfg)
    if not (usuario_ok and password_ok):
        raise HTTPException(status_code=401, detail="credenciales incorrectas")
    caducidad = int(time.time()) + DURACION
    datos_cookie = f"{datos.usuario}|{caducidad}"
    respuesta.set_cookie(
        COOKIE,
        f"{datos_cookie}|{_firmar(datos_cookie)}",
        max_age=DURACION,
        httponly=True,
        samesite="lax",
        secure=os.environ.get("CHARTS_HTTPS") == "1",
    )
    return {"usuario": datos.usuario}


@router.post("/api/logout")
def logout(respuesta: Response) -> dict:
    respuesta.delete_cookie(COOKIE)
    return {"ok": True}


@router.get("/api/sesion")
def sesion_actual(usuario: str = Depends(sesion_requerida)) -> dict:
    return {"usuario": usuario}
