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
- Overlays propios en `web/src/lib/overlays/` (vendorizados Apache-2.0 de
  @klinecharts/pro y react-klinecharts-ui): rect, circle, triangle, measure.
  `fibonacciLine` SUSTITUYE al incorporado (mismo nombre, deliberado): acotado
  al ancho de sus dos puntos, niveles ocultables (extendData.niveles) y estilo
  por dibujo. Sus NOMBRES son parte del contrato de persistencia: renombrarlos
  rompe dibujos guardados.
- Dibujos por símbolo (no por símbolo+timeframe): anclados a tiempo+precio,
  el análisis hecho en diario se ve también en semanal. Los indicadores
  activos (nombre + calcParams + panel) se guardan igual: por símbolo, junto
  a los dibujos, con el mismo botón de guardar. Máximo uno por nombre.
- Datos multi-fuente: velas 1d de Binance (`api/datos.py`, incremental) y de
  Yahoo (`api/datos_yahoo.py`, acciones/índices/ETFs/fondos, OHLC ajustado por
  splits+dividendos — patrón heredado de stocks_lab); todo en parquet con el
  mismo contrato de columnas; el semanal se agrega desde el diario (una sola
  fuente de verdad en disco). Al añadir un símbolo por el buscador se descarga
  su histórico automáticamente. Cobertura de fondos UCITS en Yahoo: irregular.
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
- Navegación: top bar (Inicio | Gráficos), SIN sidebar. La única columna
  lateral es la barra de herramientas de dibujo, contextual a la vista de
  gráfico. Contenido siempre fluido: sin max-width (pantalla ultra-wide).

## Estructura

- `api/` — FastAPI (puerto 8010 en dev): `velas.py` (`/api/velas/{simbolo}`,
  `/api/resumen` con OHLC del día), `dibujos.py` (`/api/dibujos/{simbolo}`
  GET/PUT + `/api/analisis` listado de AT guardados), `listas.py`
  (`/api/listas` CRUD + PUT `/{id}/simbolos` reemplazo completo),
  `busqueda.py` (`/api/buscar` unificado Binance+Yahoo), `simbolos.py`
  (registro nombre/tipo/fuente), `sesion.py` (login/logout/sesion),
  `datos.py`/`datos_yahoo.py` (descarga; `POST /api/datos/{simbolo}`).
- `web/` — React 19 + Vite + TS + Tailwind v4 + shadcn (new-york) + KLineChart.
  Proxy `/api` → :8010 en dev. `src/`: `paginas/` (Login, Inicio con tabs por
  lista y DataTable ordenable con selector de columnas, Graficos, Grafico),
  `contextos/` (tema, sesion), `components/shell/` (top bar),
  `components/PageHeader.tsx` (backLink estilo iOS),
  `components/GraficoVelas.tsx` (gráfico + barra vertical de dibujo),
  `components/ui/` (shadcn), `lib/` (api, formato, utils).
- `stocks_lab/` — laboratorio heredado de trading-bot (origen del patrón de
  datos Yahoo). Los `exp_*` dependen de `crypto_lab` (trading-bot) y aquí NO
  corren: son referencia + registro de resultados.

## Comandos

`make install` · `make datos` · `make api` · `make web` · `make build` ·
`make lint` · `make fix`
