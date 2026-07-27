# Current Work Log — trading-charts

## 🎯 Estado Actual del Proyecto

**PRODUCCIÓN VIVA**: charts.bazinguer.es está desplegado y verificado E2E
(11/11 tests, incluida la prueba reina: dibujar→guardar→F5→persiste). Fondos
UCITS resueltos SOLO con Yahoo (Morningstar descartado por licencia/complejidad).
La app hace todo lo pedido: gráfico con intervalos 1H/4H/1D/1S/1M, indicadores
(con ojo de mostrar/ocultar en su leyenda, sin perder la configuración) y
dibujos por símbolo persistentes (incluidos los de texto, seleccionables y
arrastrables), barra de dibujo completa, listas reordenables arrastrando sus
tabs y símbolos reordenables arrastrando filas. El buscador de Binance cubre
pares USDT y USDC (MiCA retiró USDT spot en la EEA en 2025 — el bot y las
inversiones cripto del usuario operan USDC). Ya hubo cinco redeploys reales
en PRD sin incidencias. El usuario ya usa la app en real (listas y símbolos
propios, análisis guardados, intradía 1h). Sin pendientes bloqueantes; un
fleco cosmético opcional (ver Notas Importantes).

## 📍 Última Sesión Completada

### Fecha: 2026-07-27 (madrugada) — "ojo de indicadores + asesoría de análisis técnico"

### Contexto de la Sesión:

Tras el cierre de la sesión anterior (dibujos de texto, `c9e33fe`), el mismo
día el usuario pidió asesoría sobre cómo configurar sus indicadores técnicos;
de esa conversación salió una mejora concreta para la app.

### Trabajo Completado:

- ✅ **Asesoría de indicadores** (sin código; fija la configuración del
  usuario, detalle en memoria auto): MA 50/100/200 simples en diario (la
  "MA" de KLineChart ES la SMA clásica; su "SMA" es la media suavizada china
  [período, peso] — meterle [50,100,200] la rompe porque peso>período da
  coeficiente negativo; para suavizadas usar EMA, ya que SMA(n,2) ≡ EMA(n)).
  RSI para DIVERGENCIAS (período ~25 en diario, más largo en 1-4h), con
  método formalizado: directriz "global" sobre pivotes del RSI + candidata +
  confirmación causal (nuevo extremo del precio + cierre del RSI al otro
  lado de la directriz). MACD 12/26/9. Quedan registradas en memoria dos
  ideas para más adelante: experimento de bot de divergencias RSI en
  `crypto_lab` (trading-bot) y backlog de mejoras de la app.
- ✅ **Feature: ojo de indicadores** (`ff07e0e`, rama `feat/ojo-indicadores`
  → merge ff a main → push; rama conservada). Tercer icono en la leyenda de
  cada indicador (👁 antes de ⚙/✕) que oculta/muestra sin quitarlo — la
  leyenda permanece (KLineChart omite líneas y valores con `visible: false`
  pero mantiene título y features). Estado persistido por símbolo:
  `visible?: boolean` en el tipo `Indicador` (solo se guarda cuando es
  `false`), viaja sin cambios de backend (el PUT guarda `list[dict]` sin
  esquema). Ficheros: `estilosGrafico.ts` (`FEATURE_OJO` + icono path),
  `GraficoVelas.tsx` (`alternarVisibilidad` + restauración), `indicadores.ts`
  (tipo).
- ✅ **Lección técnica** (documentada en comentario del código y en memoria):
  el parser de paths de KLineChart 10.0.0 resetea el punto de partida en
  cada comando — arcos (`A`) y comandos relativos se rompen (el primer
  intento del ojo pintaba una línea gigante, detectado por el usuario
  probando en dev). Para iconos path de features: solo comandos absolutos
  M/L/H/V/Q/C/Z; la pupila del ojo es un círculo aproximado con cúbicas.
- ✅ Verificado: el usuario validó visualmente en dev; agente ui-tester 6/6
  PASS (ocultar/mostrar en panel principal y aparte, payload con
  `visible: false`, restauración oculta tras F5, convivencia con ⚙/✕, BD
  restaurada al baseline), 0 errores de consola, `make lint` OK.
- ✅ **Deploy a PRD verificado** (quinto redeploy real, sin incidencias):
  backup previo `backups/dibujos_prd_20260727_035154.db` (32K); workflow
  Deploy success sobre `ff07e0e`; redeploy en Dokploy por el usuario;
  contenedor healthy con la imagen de 01:52 UTC, volumen intacto (dibujos.db
  con guardados reales del usuario + parquets incl. `BTCUSDT_1h` de uso
  intradía), `/api/salud` y SPA 200.

### Estado al Finalizar:

- `main` en `ff07e0e` (+ este cierre); local, `origin/main` y producción
  sincronizados. Working tree limpio salvo `CURRENT_WORK.md`.
- Servidores dev apagados; backup de dibujos reciente.
- El usuario ya usa la app en real (listas propias, símbolos
  ADA/THETA/VET/BTC/ETH, análisis guardados, intradía 1h).

### Próximos Pasos Sugeridos:

1. Vista dual (diario + intervalo de disparo lado a lado), pedida por el
   usuario: requiere sesión dedicada, empezando por decidir el modelo de
   guardado de dibujos entre dos paneles (riesgo de pisado — dos botones
   Guardar sobre el mismo símbolo). En backlog de memoria.
2. Sin más bloqueantes; flecos de siempre en background (logout cosmético,
   referencias de skills heredados).

---
🔴 [FIN DE SESIÓN - BREAKPOINT]
📅 Fecha: 2026-07-27 (madrugada)
🎯 Estado: Producción al día con el ojo de indicadores desplegado y
    verificado E2E; configuración de indicadores del usuario fijada
    (asesoría, sin código); sin pendientes bloqueantes.
⏭️  Retomar: sin acción predefinida — esperar lo que traiga el usuario, o
    abordar la vista dual (diario + intervalo de disparo) si toca sesión
    dedicada.
---

## 📝 Sesiones Anteriores (Resumen)

- 2026-07-26 (noche, tercera sesión): dibujos de texto (Texto/Etiqueta)
  seleccionables y arrastrables — causa raíz `ignoreEvent: true` en las
  plantillas built-in, fix vendorizando ambas plantillas en
  `overlays/texto.ts` (`c34edf7`), deploy a PRD verificado (cuarto redeploy
  real).
- 2026-07-26 (noche, segunda sesión): símbolos reordenables arrastrando sus
  filas (`d1f8776`, backend ya persistía el orden), deploy a PRD verificado
  (tercer redeploy real).
- 2026-07-26 (noche, primera sesión): pares USDC en el buscador de Binance
  (`5fbf8e4`, `QUOTES_BINANCE` con USDT+USDC — MiCA retiró USDT spot en la
  EEA en 2025), caché de símbolos invalidado, deploy a PRD verificado
  (segundo redeploy real).
- 2026-07-26 (tarde): fondos UCITS resueltos solo con Yahoo (Morningstar
  descartado por licencia/complejidad, `e725809`); salida a producción
  completa — infra (`1499500`), lienzo en blanco en PRD (`be23177`), repo
  GitHub + imagen vía Actions, deploy en Dokploy/Hetzner, E2E en producción
  11/11 PASS (incluida dibujar→guardar→F5→persiste), backup de dibujos
  estrenado, `.claude/` trackeado en git. Apéndice post-cierre: listas
  reordenables arrastrando tabs (`b5e0bdf`) y primer redeploy real
  verificado sin incidencias.
- 2026-07-25/26: fase gráfico completa (intervalos 1H/4H/1D/1S/1M,
  velas/línea, rejilla, indicadores y dibujos por símbolo con overlays
  propios/vendorizados, fibonacci estilo TradingView, barra de dibujo
  agrupada) — dada por OK, mergeada a main.
- 2026-07-24: bases de la app (login, shell, listas con cotizaciones live
  multi-fuente, página de análisis, gráfico del prototipo integrado).

## 🏗️ Arquitectura y Decisiones Clave

Ver `CLAUDE.md` (fuente de verdad, no duplicar aquí): KLineChart congelada,
overlays propios como parte del contrato de persistencia, dibujos+indicadores
por símbolo, una fuente de verdad por familia de intervalos, auth de usuario
único, tema oscuro default.

## ⚠️ Notas Importantes

- El crumb de Yahoo (cotizaciones live/ampliado/resultados) es oficioso y puede
  romperse: hay fallback silencioso al cierre del parquet — si un día las
  cotizaciones se ven "congeladas", mirar `api/cotizaciones.py`.
- La PRIMERA carga de 1H de un símbolo descarga su histórico (unos segundos,
  con aviso "Cargando velas…"); después es incremental. El 1h de Yahoo llega
  sin ajuste por splits (solo el diario trae adjclose): un split reciente
  metería un escalón en lo acumulado.
- `POST /api/datos/{simbolo}` descarga histórico diario; símbolos raros
  (`^GSPC`, `SAN.MC`) van URL-encoded y se sanean a fichero con `^` → `idx_`.
- El % var. live compara contra el último cierre COMPLETADO (no la vela del
  día en curso) — no "arreglar" eso sin entender por qué está así.
- El diseño base del fibo y las preferencias de visualización viven en
  localStorage del navegador (tc-fibo-base, tc-tipo-grafico, tc-rejilla).
- La línea horizontal de la "Etiqueta" (simpleTag) tiene hit-area fina
  (~2px), como cualquier línea de la librería: si un día "no se deja
  seleccionar", es precisión de click, no regresión.
- Los iconos path de features de KLineChart 10.0.0 (leyenda de indicadores,
  barra de dibujo) solo admiten comandos absolutos M/L/H/V/Q/C/Z: el parser
  resetea el punto de partida en cada comando y arcos (`A`)/relativos se
  rompen (ver icono del ojo, `estilosGrafico.ts`).
- **Deploy de nueva versión**: merge a main → Actions "Deploy" (confirm=yes)
  → Dokploy Deploy (el custom command hace `--pull always`).
- **`backup-prd` ANTES** de cambios arriesgados y después de análisis
  importantes; el contenedor PRD es `trading-charts-2hwnph-charts-1` (si se
  recrea el project en Dokploy, cambia el hash → actualizar `Makefile.dev`).
- El primer arranque con volumen nuevo crea `dibujos.db` vacía automáticamente.
- Fleco cosmético opcional (preexistente, no bloqueante): al pulsar «Cerrar
  sesión» la SPA muestra un instante «No se pudieron cargar las listas»
  antes de redirigir al login (el 401 de la recarga de listas gana la
  carrera a la redirección).
