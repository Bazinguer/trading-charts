"""Listas de seguimiento (watchlists) en SQLite, misma BD que los dibujos.

Dos tablas: `listas` (nombre y orden) y `lista_simbolos` (símbolos de cada
lista, con su orden). El contenido de una lista se reemplaza entero de una vez
(un solo endpoint para añadir/quitar/reordenar). Borrar una lista NO toca los
dibujos: esos viven por símbolo, no por lista.
"""

import sqlite3

from api.dibujos import DB_PATH

_ESQUEMA = """
CREATE TABLE IF NOT EXISTS listas (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS lista_simbolos (
    lista_id INTEGER,
    simbolo TEXT,
    orden INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (lista_id, simbolo)
);
"""

SEMILLA_NOMBRE = "Cripto"
SEMILLA_SIMBOLOS = ["BTCUSDT", "ETHUSDT"]


def _conexion() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(exist_ok=True)
    conexion = sqlite3.connect(DB_PATH)
    conexion.executescript(_ESQUEMA)
    return conexion


def asegurar_semilla() -> None:
    """Si no hay ninguna lista (primer arranque), crea la de ejemplo."""
    with _conexion() as conexion:
        if conexion.execute("SELECT COUNT(*) FROM listas").fetchone()[0]:
            return
        cursor = conexion.execute(
            "INSERT INTO listas (nombre, orden) VALUES (?, 0)", (SEMILLA_NOMBRE,)
        )
        conexion.executemany(
            "INSERT INTO lista_simbolos (lista_id, simbolo, orden) VALUES (?, ?, ?)",
            [(cursor.lastrowid, simbolo, i) for i, simbolo in enumerate(SEMILLA_SIMBOLOS)],
        )


def obtener_todas() -> list[dict]:
    with _conexion() as conexion:
        filas = conexion.execute(
            "SELECT id, nombre, orden FROM listas ORDER BY orden, id"
        ).fetchall()
        simbolos = conexion.execute(
            "SELECT lista_id, simbolo, orden FROM lista_simbolos ORDER BY orden"
        ).fetchall()
    por_lista: dict[int, list[dict]] = {}
    for lista_id, simbolo, orden in simbolos:
        por_lista.setdefault(lista_id, []).append({"simbolo": simbolo, "orden": orden})
    return [
        {"id": id_, "nombre": nombre, "orden": orden, "simbolos": por_lista.get(id_, [])}
        for id_, nombre, orden in filas
    ]


def crear(nombre: str) -> dict:
    with _conexion() as conexion:
        orden = conexion.execute("SELECT COALESCE(MAX(orden) + 1, 0) FROM listas").fetchone()[0]
        cursor = conexion.execute(
            "INSERT INTO listas (nombre, orden) VALUES (?, ?)", (nombre, orden)
        )
    return {"id": cursor.lastrowid, "nombre": nombre, "orden": orden, "simbolos": []}


def renombrar(lista_id: int, nombre: str) -> bool:
    with _conexion() as conexion:
        cursor = conexion.execute("UPDATE listas SET nombre = ? WHERE id = ?", (nombre, lista_id))
    return cursor.rowcount > 0


def borrar(lista_id: int) -> bool:
    with _conexion() as conexion:
        conexion.execute("DELETE FROM lista_simbolos WHERE lista_id = ?", (lista_id,))
        cursor = conexion.execute("DELETE FROM listas WHERE id = ?", (lista_id,))
    return cursor.rowcount > 0


def reemplazar_simbolos(lista_id: int, simbolos: list[str]) -> bool:
    """Reemplaza el contenido completo de la lista, en el orden recibido."""
    with _conexion() as conexion:
        if not conexion.execute("SELECT 1 FROM listas WHERE id = ?", (lista_id,)).fetchone():
            return False
        conexion.execute("DELETE FROM lista_simbolos WHERE lista_id = ?", (lista_id,))
        conexion.executemany(
            "INSERT INTO lista_simbolos (lista_id, simbolo, orden) VALUES (?, ?, ?)",
            [(lista_id, simbolo, i) for i, simbolo in enumerate(simbolos)],
        )
    return True
