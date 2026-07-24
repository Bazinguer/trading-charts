"""Persistencia de los dibujos (overlays de KLineChart) en SQLite.

El contrato es deliberadamente simple: por símbolo se guarda la lista completa
de overlays tal y como la serializa el frontend ({name, points, ...}), en una
columna JSON. Guardar reemplaza la lista entera (el frontend siempre manda el
estado completo del gráfico). Los dibujos se anclan a tiempo+precio, no a un
timeframe: el análisis hecho en diario se ve también en semanal.
"""

import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "dibujos.db"

_ESQUEMA = """
CREATE TABLE IF NOT EXISTS dibujos (
    simbolo TEXT PRIMARY KEY,
    overlays TEXT NOT NULL,
    actualizado TEXT NOT NULL
)
"""


def _conexion() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(exist_ok=True)
    conexion = sqlite3.connect(DB_PATH)
    conexion.execute(_ESQUEMA)
    return conexion


def obtener(simbolo: str) -> list[dict]:
    with _conexion() as conexion:
        fila = conexion.execute(
            "SELECT overlays FROM dibujos WHERE simbolo = ?", (simbolo,)
        ).fetchone()
    return json.loads(fila[0]) if fila else []


def analisis() -> list[dict]:
    """Símbolos con dibujos guardados: cuántos y cuándo se tocaron por última vez."""
    with _conexion() as conexion:
        filas = conexion.execute(
            "SELECT simbolo, overlays, actualizado FROM dibujos ORDER BY actualizado DESC"
        ).fetchall()
    return [
        {"simbolo": simbolo, "dibujos": n, "actualizado": actualizado}
        for simbolo, overlays, actualizado in filas
        if (n := len(json.loads(overlays)))
    ]


def guardar(simbolo: str, overlays: list[dict]) -> None:
    ahora = datetime.now(UTC).isoformat(timespec="seconds")
    with _conexion() as conexion:
        conexion.execute(
            "INSERT INTO dibujos (simbolo, overlays, actualizado) VALUES (?, ?, ?) "
            "ON CONFLICT(simbolo) DO UPDATE SET overlays = excluded.overlays, "
            "actualizado = excluded.actualizado",
            (simbolo, json.dumps(overlays), ahora),
        )
