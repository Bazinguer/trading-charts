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
  por dibujo. El precio de cada nivel se DERIVA de su altura preguntando al
  eje (`convertFromPixel`), nunca se interpola aparte: así la etiqueta no
  puede contradecir a la línea. En lineal da lo mismo que interpolar precios;
  en log reparte el recorrido porcentual (0.5 = media geométrica). Sus NOMBRES son parte del contrato de persistencia: renombrarlos
  rompe dibujos guardados. El PANEL de cada dibujo también es contrato: se
  guarda como `paneId` (ausente = panel del precio; `panel_<INDICADOR>`, p. ej.
  `panel_RSI`, para dibujos sobre paneles — ver `paneDe()` en GraficoVelas).
  Cambiar ese esquema de ids rompe dibujos guardados igual que renombrar
  overlays.
- Dibujos por símbolo (no por símbolo+timeframe): anclados a tiempo+precio,
  el análisis hecho en diario se ve también en semanal. Los indicadores
  activos (nombre + calcParams + panel) se guardan igual: por símbolo, junto
  a los dibujos, con el mismo botón de guardar. Máximo uno por nombre.
- Escala del eje de precios (`lineal` | `log`) POR SÍMBOLO, guardada con el
  análisis y parte del contrato de persistencia: una recta en lineal ES una
  curva en log, así que un dibujo solo se lee bien en la escala en que se
  trazó, y el símbolo debe reabrirse en ella. TEXT y no un booleano para que
  el eje `percentage` de la librería entre sin migrar. Solo cambia el panel
  del PRECIO: `overrideYAxis` SIN `paneId: "candle_pane"` alcanza a los ejes
  de TODOS los paneles, y el RSI (0-100) y el MACD (con negativos) no admiten
  log. Descartado duplicar dibujos por escala: mismo motivo que no duplicarlos
  por timeframe, y ni TradingView ni KLineChart lo hacen.
- Datos multi-fuente: velas de Binance (`api/datos.py`, incremental) y de
  Yahoo (`api/datos_yahoo.py`, acciones/índices/ETFs/fondos; el diario con
  OHLC ajustado por splits+dividendos — patrón heredado de stocks_lab); todo
  en parquet con el mismo contrato de columnas. UNA fuente de verdad POR
  FAMILIA en disco: del 1d se agregan 1w y 1M; del 1h se agrega el 4h. El 1h
  usa una ventana ~2 años, simétrica con el límite intradía de Yahoo; en Yahoo
  las descargas sucesivas ACUMULAN histórico local y llegan sin ajuste por
  splits. Al añadir un símbolo por el buscador se descarga su histórico
  diario automáticamente. Cobertura de fondos UCITS en Yahoo: irregular.
- Refresco PEREZOSO, no programado (`_refrescar` en `api/velas.py`): pedir
  velas actualiza antes el parquet base si lleva más de 15 min sin escribirse.
  Sin scheduler: en PRD nadie ejecuta `make datos`, y un cron refrescaría
  símbolos que nadie mira. El umbral se mide sobre el MTIME del fichero, no
  sobre la fecha de la última vela: en fin de semana o festivo no nace vela
  nueva y un "¿la última es de hoy?" no se satisfaría nunca. Un fallo de red
  sirve el parquet viejo antes que un 502, y el intento cuenta aunque falle
  (una caída de la fuente no cuelga cada carga con su timeout). Lock por
  parquet: los endpoints síncronos van en threadpool y `to_parquet` no es
  atómico. `/api/resumen` NO refresca (sus cotizaciones ya son live y abrir
  Inicio dispararía una descarga por símbolo).
- La última vela es la de la sesión EN CURSO, como TradingView: los
  indicadores se mueven sobre ella hasta el cierre. Yahoo cuela además en el
  INTRADÍA una pseudo-vela con el tick en vivo (timestamp
  `meta.regularMarketTime`, volumen 0) que no es una vela y que, fuera de la
  rejilla horaria, no se deduplicaría al acumular: `api/datos_yahoo.py` la
  descarta al descargar y limpia las que los parquet ya traían.
- BD de dibujos: SQLite `data/dibujos.db`. En producción irá en volumen con
  backup — perder dibujos es perder el propósito del proyecto. Las listas de
  seguimiento viven en la misma BD (tablas `listas` y `lista_simbolos`).
- Listas de seguimiento: agrupan símbolos, nada más. Los dibujos se anclan al
  símbolo, así que un símbolo en varias listas comparte su AT y borrar una
  lista nunca borra dibujos. Sin sección "favoritos": una lista cumple ese rol.
- Fondos UCITS: SOLO Yahoo (Morningstar descartado 2026-07: exige licencia
  institucional, sin tier individual). Se buscan por ISIN; el buscador
  enriquece nombre y divisa desde el meta del chart, y los NAV que llegan
  sin open/high/low se guardan como vela plana al cierre.
- Auth: un solo usuario, cookie httpOnly firmada (HMAC). Credenciales en `.env`
  (`CHARTS_USUARIO`, `CHARTS_PASSWORD`, `CHARTS_SECRET`). Todo `/api/*` la
  exige salvo login/logout/sesion y `/api/salud` (healthcheck). En PRD,
  `CHARTS_HTTPS=1` añade el flag Secure a la cookie.
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

## Despliegue (charts.bazinguer.es)

- Un solo contenedor: FastAPI sirve la API y el build de la SPA (Dockerfile
  multi-stage, puerto 8010). Imagen en GHCR vía workflow "Deploy" (manual,
  confirm=yes, solo desde main — nadie despliega en el merge). En el VPS
  Hetzner, Dokploy con `docker-compose.dokploy.yml` pegado en raw (runbook de
  alta en su cabecera) y Custom deploy command con `--pull always` (Dokploy no
  re-pullea `latest` por sí solo).
- Volumen LECTURA-ESCRITURA `../files/trading-charts-data:/app/data`: contiene
  dibujos.db y los parquet. PRD arranca en lienzo en blanco (sin semillas).
- Backup/restore de dibujos.db desde la máquina local:
  `make -f Makefile.dev backup-prd` / `restore-prd` (doctrina anime-log: lo
  que toca PRD nunca vive en el Makefile normal).

## Comandos

`make install` · `make datos` · `make api` · `make web` · `make build` ·
`make lint` · `make fix`
