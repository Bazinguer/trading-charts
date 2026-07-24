"""exp_s002 — Las familias descartadas en cripto, re-evaluadas en bolsa.

Hipótesis: varias familias que murieron en cripto tienen MEJOR porqué económico
en acciones/índices, porque el mecanismo que las mataba era específico de cripto:
- reversion_media: en cripto compraba cuchillos en bajistas estructurales; en un
  índice diversificado la sobre-reacción de corto plazo revierte (De Bondt/Thaler,
  y el clásico "buy the dip" en SPX).
- filtro_volatilidad: en BTC los crashes arrancan desde vol baja; en bolsa vienen
  CON vol alta (régimen VIX) y el vol-managed equity está documentado
  (Moreira & Muir 2017).
- momentum_vol_objetivo: mismo porqué, con vol objetivo recalibrada a niveles de
  bolsa (10-20% anual; el 50% de cripto no tiene sentido aquí).
- ruptura_canal (+trailing ATR): perfil defensivo ya visto en cripto (exp004).
- cruce_medias: trend following clásico de managed futures.
- momentum_ensemble: sin parámetros, imposible de sobreajustar.

Método idéntico a exp_s001: walk-forward 24m→6m, OOS cosido, SOLO hasta
2024-12-31 (2025-26 fuera también aquí), universo ex-ante de datos_stocks,
registro propio append-only en stocks_lab/registro.jsonl.

Criterio de SUPERVIVIENTE, declarado ANTES de ejecutar (al coste de referencia
0,15%/lado): sharpe >= B&H  Y  (CAGR >= B&H - 3pp  O  mejora de maxDD >= 15pp).
Aviso multiple-testing: ~35 hipótesis/activo en cribado — un superviviente es
candidato a validación más profunda, nunca conclusión.

Ejecutar:  uv run python -m stocks_lab.exp_s002_familias_stocks
"""

import numpy as np
from crypto_lab.estrategias import (
    cruce_medias,
    filtro_volatilidad,
    momentum_ensemble,
    momentum_vol_objetivo,
    reversion_media,
    ruptura_canal,
)
from crypto_lab.particion import FECHA_CORTE_TEST
from crypto_lab.walkforward import evaluar

from stocks_lab.datos_stocks import UNIVERSO, cargar
from stocks_lab.exp_s001_momentum_stocks import COSTE_REFERENCIA, COSTES, metricas, registrar

# Grids en SESIONES de bolsa (~252/año), tamaños comparables a los usados en cripto
FAMILIAS = [
    (
        "cruce_medias",
        cruce_medias,
        [
            {"rapida": r, "lenta": lenta}
            for r, lenta in [(10, 50), (10, 200), (20, 100), (20, 200), (50, 100), (50, 200)]
        ],
    ),
    (
        "reversion_media",
        reversion_media,
        [{"ventana": v, "umbral": u} for v in (10, 21, 42) for u in (-1.5, -2.0, -2.5)],
    ),
    (
        "ruptura_canal",
        ruptura_canal,
        [{"canal": c, "atr_mult": m} for c in (20, 55, 100) for m in (2.0, 3.0, 4.0)],
    ),
    (
        "filtro_volatilidad",
        filtro_volatilidad,
        [{"ventana": v, "percentil": p, "historico": 1260} for v in (21, 42) for p in (0.8, 0.9)],
    ),
    ("momentum_ensemble", momentum_ensemble, [{}]),
    (
        "momentum_vol_objetivo",
        momentum_vol_objetivo,
        [{"velas": v, "vol_objetivo": o} for v in (60, 180) for o in (0.10, 0.15, 0.20)],
    ),
]


def es_superviviente(oos, bh) -> bool:
    """Criterio pre-declarado en el docstring. maxDD es negativo: mejora = diferencia positiva."""
    if np.isnan(oos.cagr) or np.isnan(bh.cagr):
        return False
    mejora_dd = oos.max_drawdown - bh.max_drawdown
    return oos.sharpe >= bh.sharpe and (oos.cagr >= bh.cagr - 0.03 or mejora_dd >= 0.15)


def main() -> None:
    supervivientes = []
    for ticker in UNIVERSO:
        df = cargar(ticker)
        df = df[df["open_time"] < FECHA_CORTE_TEST].reset_index(drop=True)
        periodo = f"{df['open_time'].iloc[0]:%Y-%m-%d} a {df['open_time'].iloc[-1]:%Y-%m-%d}"
        print(f"\n=== {ticker} ({periodo}) ===")

        for nombre, estrategia, grid in FAMILIAS:
            for coste in COSTES:
                r = evaluar(df, estrategia, grid, coste_por_lado=coste)
                superviviente = es_superviviente(r.oos, r.buy_hold)
                if coste == COSTE_REFERENCIA:
                    print(r.oos.resumen(f"  {nombre[:22]}"))
                    if superviviente:
                        supervivientes.append((ticker, nombre, r))
                registrar(
                    "exp_s002_familias_stocks",
                    activo=ticker,
                    familia=nombre,
                    grid=grid if len(grid) > 1 else "sin_parametros",
                    n_hipotesis=r.n_hipotesis,
                    ajuste_meses=24,
                    paso_meses=6,
                    coste_por_lado=coste,
                    periodo_datos=periodo,
                    oos=metricas(r.oos),
                    buy_hold=metricas(r.buy_hold),
                    superviviente=superviviente,
                )
        print(r.buy_hold.resumen("  B&H (periodo OOS)"))

    print(f"\n=== SUPERVIVIENTES al {COSTE_REFERENCIA:.2%}/lado (criterio pre-declarado) ===")
    if not supervivientes:
        print("  ninguno")
    for ticker, nombre, r in supervivientes:
        print(r.oos.resumen(f"  {ticker} {nombre[:18]}"))
        print(r.buy_hold.resumen(f"  {ticker} B&H"))


if __name__ == "__main__":
    main()
