"""exp_s001 — ¿Sobrevive el momentum absoluto (la estrategia en producción del
bot cripto, SIN retocar) en acciones e índices US?

Hipótesis: el time-series momentum está documentado en índices (Moskowitz/Ooi/
Pedersen 2012); si la familia tal cual (1 condición, grid 30/60/90/180 velas,
walk-forward 24m ajuste → 6m validación) también mejora el perfil de riesgo en
bolsa, portar el bot a IBKR tiene una base económica. Si ni en el índice
funciona, no hay nada que portar.

Disciplina del laboratorio:
- Se evalúa SOLO hasta 2024-12-31 (FECHA_CORTE_TEST): el tramo 2025-26 queda
  fuera también aquí — la estrategia se consagró ahí en cripto y ya "sabemos"
  qué hizo la bolsa; evaluarlo sería contaminación blanda.
- Registro propio del laboratorio de stocks (stocks_lab/registro.jsonl, mismo
  formato append-only). No se escribe en experimentos/registro.jsonl.
- Universo declarado ex-ante por perfil en datos_stocks.UNIVERSO.

Nota sobre el grid: en cripto 30/60/90/180 son días naturales; aquí son
sesiones de bolsa (~1,4x más tiempo natural). Se mantiene idéntico a
propósito: la pregunta es si la estrategia EN PRODUCCIÓN se porta tal cual.

Costes por lado simulados (comisión + slippage):
- 0,05%  IBKR tiered, libro grande (mínimos diluidos)
- 0,10%  IBKR realista para libro de 300-500 € en acciones US
         (mín 0,35 $ ≈ 0,09% en órdenes de ~400 $ + slippage mega-cap)
- 0,15%  paridad con el backtest cripto (conservador)
- 0,30%  ETFs UCITS con libro de 300-500 € (mín 1,25 €) = break-even de exp009

Ejecutar:  uv run python -m stocks_lab.exp_s001_momentum_stocks
"""

import json
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path

import pandas as pd
from crypto_lab.backtest import buy_and_hold, ejecutar
from crypto_lab.estrategias import momentum_absoluto
from crypto_lab.particion import FECHA_CORTE_TEST
from crypto_lab.walkforward import evaluar

from stocks_lab.datos_stocks import UNIVERSO, cargar

# Registro propio (mismo esquema que crypto_lab.registro, ruta distinta: el
# registro cripto lo está editando otra sesión y este laboratorio es aparte).
RUTA_REGISTRO = Path(__file__).resolve().parent / "registro.jsonl"

GRID = [{"velas": v} for v in (30, 60, 90, 180)]
COSTES = [0.0005, 0.0010, 0.0015, 0.0030]
COSTE_REFERENCIA = 0.0015  # el del backtest cripto: comparaciones entre clases
TRAMO_COMUN = pd.Timestamp("2019-01-01", tz="UTC")  # ventana OOS común con cripto


def registrar(experimento: str, **campos) -> None:
    linea = {
        "fecha": datetime.now(UTC).isoformat(timespec="seconds"),
        "experimento": experimento,
        **campos,
    }
    with RUTA_REGISTRO.open("a", encoding="utf-8") as fichero:
        fichero.write(json.dumps(linea, ensure_ascii=False) + "\n")


def metricas(resultado) -> dict:
    return {
        "cagr": round(resultado.cagr, 4),
        "sharpe": round(resultado.sharpe, 3),
        "max_drawdown": round(resultado.max_drawdown, 4),
        "exposicion": round(resultado.exposicion, 3),
        "num_operaciones": resultado.num_operaciones,
    }


def main() -> None:
    for ticker in UNIVERSO:
        df = cargar(ticker)
        df = df[df["open_time"] < FECHA_CORTE_TEST].reset_index(drop=True)
        periodo = f"{df['open_time'].iloc[0]:%Y-%m-%d} a {df['open_time'].iloc[-1]:%Y-%m-%d}"
        print(f"\n=== {ticker} ({periodo}, {len(df)} sesiones) ===")

        for coste in COSTES:
            r = evaluar(df, momentum_absoluto, GRID, coste_por_lado=coste)
            print(r.oos.resumen(f"  {coste:.2%}/lado"))
            if coste == COSTE_REFERENCIA:
                print(r.buy_hold.resumen("  B&H (mismo periodo OOS)"))
                ventanas = Counter(p.params["velas"] for p in r.pasos)
                elegidas = " ".join(f"{v}×{n}" for v, n in sorted(ventanas.items()))
                print(f"  ventanas elegidas por el walk-forward: {elegidas}")

                # Tramo OOS común con la validación cripto (2019→2024), re-ejecutado
                # sobre la posición cosida: comparable entre clases de activo.
                en_tramo = df.loc[r.posicion_oos.index, "open_time"] >= TRAMO_COMUN
                idx = r.posicion_oos.index[en_tramo]
                tramo = ejecutar(df.loc[idx], r.posicion_oos.loc[idx], coste)
                tramo_bh = buy_and_hold(df.loc[idx], coste)
                print(tramo.resumen("  2019-24 estrategia"))
                print(tramo_bh.resumen("  2019-24 B&H"))

            registrar(
                "exp_s001_momentum_stocks",
                activo=ticker,
                familia="momentum_absoluto",
                grid=[g["velas"] for g in GRID],
                n_hipotesis=r.n_hipotesis,
                ajuste_meses=24,
                paso_meses=6,
                coste_por_lado=coste,
                periodo_datos=periodo,
                oos=metricas(r.oos),
                buy_hold=metricas(r.buy_hold),
            )


if __name__ == "__main__":
    main()
