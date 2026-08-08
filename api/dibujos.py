"""Persistencia del análisis por símbolo (dibujos + indicadores) en SQLite.

El contrato es deliberadamente simple: por símbolo se guarda la lista completa
de overlays tal y como la serializa el frontend ({name, points, ...}) y la de
indicadores activos ({name, calcParams, panel}), cada una en su columna JSON.
Guardar reemplaza ambas listas enteras (el frontend siempre manda el estado
completo del gráfico). Los dibujos se anclan a tiempo+precio, no a un
timeframe: el análisis hecho en diario se ve también en semanal.

La escala del eje de precios ('lineal' | 'log') se guarda igual, por símbolo:
una recta en lineal ES una curva logarítmica en log, así que el análisis solo
se lee bien si el símbolo vuelve a abrirse en la escala en que se dibujó.
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
    indicadores TEXT NOT NULL DEFAULT '[]',
    escala TEXT NOT NULL DEFAULT 'lineal',
    actualizado TEXT NOT NULL
)
"""


def _conexion() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(exist_ok=True)
    conexion = sqlite3.connect(DB_PATH)
    conexion.execute(_ESQUEMA)
    # Migraciones aditivas para BD anteriores; no tocan las filas existentes,
    # que heredan el DEFAULT y siguen abriéndose exactamente igual que antes.
    columnas = {fila[1] for fila in conexion.execute("PRAGMA table_info(dibujos)")}
    if "indicadores" not in columnas:
        conexion.execute("ALTER TABLE dibujos ADD COLUMN indicadores TEXT NOT NULL DEFAULT '[]'")
    # Escala del eje de precios. TEXT y no un booleano es_log a propósito:
    # KLineChart trae un tercer eje de serie (percentage) y así entraría como
    # un valor más, sin migrar la BD otra vez.
    if "escala" not in columnas:
        conexion.execute("ALTER TABLE dibujos ADD COLUMN escala TEXT NOT NULL DEFAULT 'lineal'")
    return conexion


def obtener(simbolo: str) -> dict:
    with _conexion() as conexion:
        fila = conexion.execute(
            "SELECT overlays, indicadores, escala FROM dibujos WHERE simbolo = ?", (simbolo,)
        ).fetchone()
    if not fila:
        return {"overlays": [], "indicadores": [], "escala": "lineal"}
    return {
        "overlays": json.loads(fila[0]),
        "indicadores": json.loads(fila[1]),
        "escala": fila[2],
    }


def analisis() -> list[dict]:
    """Símbolos con análisis guardado: cuántos dibujos/indicadores y cuándo."""
    with _conexion() as conexion:
        filas = conexion.execute(
            "SELECT simbolo, overlays, indicadores, actualizado FROM dibujos "
            "ORDER BY actualizado DESC"
        ).fetchall()
    resultado = []
    for simbolo, overlays, indicadores, actualizado in filas:
        n_dibujos = len(json.loads(overlays))
        n_indicadores = len(json.loads(indicadores))
        if n_dibujos or n_indicadores:
            resultado.append(
                {
                    "simbolo": simbolo,
                    "dibujos": n_dibujos,
                    "indicadores": n_indicadores,
                    "actualizado": actualizado,
                }
            )
    return resultado


def guardar(
    simbolo: str, overlays: list[dict], indicadores: list[dict], escala: str = "lineal"
) -> None:
    ahora = datetime.now(UTC).isoformat(timespec="seconds")
    with _conexion() as conexion:
        conexion.execute(
            "INSERT INTO dibujos (simbolo, overlays, indicadores, escala, actualizado) "
            "VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(simbolo) DO UPDATE SET overlays = excluded.overlays, "
            "indicadores = excluded.indicadores, escala = excluded.escala, "
            "actualizado = excluded.actualizado",
            (simbolo, json.dumps(overlays), json.dumps(indicadores), escala, ahora),
        )
