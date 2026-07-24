# charts

Gráficos financieros con análisis técnico PERSISTENTE (futuro charts.bazinguer.es).
Sustituye a VisualChart/GoCharting: espacios de activos y dibujos que quedan
guardados por activo, para comparar meses después la previsión con la realidad.
Proyecto personal; filosofía KISS/YAGNI estricta.

## Decisiones fijadas

- Librería de gráficos: **KLineChart 10.0.0 CONGELADA** (versión exacta, sin `^`).
  El formato de sus overlays ES el contrato de persistencia de los dibujos:
  subir de versión es un evento deliberado con prueba de round-trip de los
  dibujos guardados, nunca un `npm update` rutinario. Fork de seguridad del
  repo upstream en la cuenta de GitHub del usuario.
- Dibujos por símbolo (no por símbolo+timeframe): anclados a tiempo+precio,
  el análisis hecho en diario se ve también en semanal.
- Datos: velas 1d desde Binance (`api/datos.py`, incremental, parquet); el
  semanal se agrega desde el diario (una sola fuente de verdad en disco).
  Acciones e índices (API de Yahoo, patrón de stocks_lab) en fase posterior.
- BD de dibujos: SQLite `data/dibujos.db`. En producción irá en volumen con
  backup — perder dibujos es perder el propósito del proyecto.

## Estructura

- `api/` — FastAPI (puerto 8010 en dev): `/api/velas/{simbolo}` y
  `/api/dibujos/{simbolo}` (GET/PUT). `datos.py` descarga los parquet.
- `web/` — React + Vite + TS con KLineChart. Proxy `/api` → :8010 en dev.

## Comandos

`make install` · `make datos` · `make api` · `make web` · `make build` ·
`make lint` · `make fix`
