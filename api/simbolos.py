"""Registro de símbolos conocidos en SQLite, misma BD que los dibujos.

Cada símbolo se registra al descargar sus datos (POST /api/datos/{simbolo});
resumen y análisis leen de aquí el nombre legible. tipo distingue
cripto|accion|etf|indice|fondo y fuente de dónde vienen las velas
(binance|yahoo).
"""

import sqlite3

from api.dibujos import DB_PATH

_ESQUEMA = """
CREATE TABLE IF NOT EXISTS simbolos (
    simbolo TEXT PRIMARY KEY,
    nombre TEXT,
    tipo TEXT,
    fuente TEXT
)
"""

SEMILLA = [
    ("BTCUSDT", "Bitcoin", "cripto", "binance"),
    ("ETHUSDT", "Ethereum", "cripto", "binance"),
]


def _conexion() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(exist_ok=True)
    conexion = sqlite3.connect(DB_PATH)
    conexion.execute(_ESQUEMA)
    return conexion


def asegurar_semilla() -> None:
    """Registra los símbolos iniciales si aún no existen (idempotente)."""
    with _conexion() as conexion:
        conexion.executemany(
            "INSERT OR IGNORE INTO simbolos (simbolo, nombre, tipo, fuente) VALUES (?, ?, ?, ?)",
            SEMILLA,
        )


def registrar(simbolo: str, nombre: str, tipo: str, fuente: str) -> None:
    with _conexion() as conexion:
        conexion.execute(
            "INSERT INTO simbolos (simbolo, nombre, tipo, fuente) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(simbolo) DO UPDATE SET nombre = excluded.nombre, "
            "tipo = excluded.tipo, fuente = excluded.fuente",
            (simbolo, nombre, tipo, fuente),
        )


def nombres(lista: list[str]) -> dict[str, str]:
    """Nombre registrado de cada símbolo; los no registrados no aparecen."""
    return _columna("nombre", lista)


def fuentes(lista: list[str]) -> dict[str, str]:
    """Fuente (binance|yahoo) de cada símbolo; los no registrados no aparecen."""
    return _columna("fuente", lista)


def _columna(columna: str, lista: list[str]) -> dict[str, str]:
    if not lista:
        return {}
    marcas = ",".join("?" * len(lista))
    with _conexion() as conexion:
        filas = conexion.execute(
            f"SELECT simbolo, {columna} FROM simbolos WHERE simbolo IN ({marcas})", lista
        ).fetchall()
    return dict(filas)
