# trading-charts

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
  backup — perder dibujos es perder el propósito del proyecto. Las listas de
  seguimiento viven en la misma BD (tablas `listas` y `lista_simbolos`).
- Listas de seguimiento: agrupan símbolos, nada más. Los dibujos se anclan al
  símbolo, así que un símbolo en varias listas comparte su AT y borrar una
  lista nunca borra dibujos. Sin sección "favoritos": una lista cumple ese rol.
- Auth: un solo usuario, cookie httpOnly firmada (HMAC). Credenciales en `.env`
  (`CHARTS_USUARIO`, `CHARTS_PASSWORD`, `CHARTS_SECRET`). Todo `/api/*` la
  exige salvo login/logout/sesion.
- Tema OSCURO por defecto (`:root`), claro como override (`.light`). Sistema de
  diseño JomBotix adaptado en `docs/design/` (BRAND.md y UX_PATTERNS.md).

## Estructura

- `api/` — FastAPI (puerto 8010 en dev): `velas.py` (`/api/velas/{simbolo}`,
  `/api/resumen`), `dibujos.py` (`/api/dibujos/{simbolo}` GET/PUT),
  `listas.py` (`/api/listas` CRUD + PUT `/{id}/simbolos` reemplazo completo),
  `sesion.py` (login/logout/sesion). `datos.py` descarga los parquet.
- `web/` — React 19 + Vite + TS + Tailwind v4 + shadcn (new-york) + KLineChart.
  Proxy `/api` → :8010 en dev. `src/`: `paginas/` (Login, Inicio, Grafico),
  `contextos/` (tema, sesion), `components/shell/` (header + sidebar flotante),
  `components/ui/` (shadcn), `components/GraficoVelas.tsx` (el gráfico),
  `lib/` (api, formato, utils). Base copiada/adaptada de trading-bot/dashboard.

## Comandos

`make install` · `make datos` · `make api` · `make web` · `make build` ·
`make lint` · `make fix`
