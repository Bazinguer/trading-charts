# Current Work Log — trading-charts

## 🎯 Estado Actual del Proyecto

**PRODUCCIÓN VIVA**: charts.bazinguer.es está desplegado y verificado E2E.
Fondos UCITS resueltos SOLO con Yahoo (Morningstar descartado por
licencia/complejidad). La app hace todo lo pedido: gráfico con intervalos
1H/4H/1D/1S/1M, indicadores (con ojo de mostrar/ocultar en su leyenda) y
dibujos por símbolo persistentes (texto seleccionable/arrastrable, y ahora
también fieles a su PANEL — un dibujo sobre el RSI ya no se restaura sobre el
precio), barra de dibujo completa, listas y símbolos reordenables arrastrando
filas/tabs, y adaptación móvil/tablet (top bar sin solape, gráfico en modo
consulta, lista estilo Investing en Inicio, dibujos bloqueados en móvil). El
buscador de Binance cubre pares USDT y USDC. Ocho redeploys reales en PRD sin
incidencias. El usuario ya usa la app en real (listas y símbolos propios,
análisis guardados, intradía 1h, desde PC y móvil). Sin pendientes
bloqueantes; una acción pendiente del usuario (redibujar unas directrices
antiguas) y un fleco cosmético opcional (ver Notas Importantes).

## 📍 Última Sesión Completada

### Fecha: 2026-07-28/29 — "adaptación móvil/tablet + fix de persistencia por panel"

### Contexto de la Sesión:

El usuario pidió que la app fuera usable desde el móvil (hasta ahora solo se
había probado en PC/tablet) y, en paralelo, reportó que sus directrices
dibujadas sobre el RSI "desaparecían" al recargar.

### Trabajo Completado:

- ✅ **Adaptación móvil** (`a2cf8cb`): top bar sin solape (nav en flujo bajo
  `md`, logo reducido a solo icono), gráfico en "modo consulta" por debajo de
  una variante CSS `dibujo:` (ancho ≥768 y alto ≥500 — fuera de ese umbral se
  ocultan la barra de dibujo y los botones Ajustes/Borrar), controles con
  flex-wrap, `p-2` en la ruta del gráfico en móvil.
- ✅ **Lista móvil estilo Investing** (`8289505`): en Inicio, filas
  nombre / fecha·símbolo / último / %var. coloreado (con línea 🌙 de horario
  ampliado si existe), fila entera navega al gráfico; sin tabla ni botón
  Columnas en móvil, tabs con overflow-x. Tablet/escritorio conservan la
  tabla de 8 columnas sin cambios.
- ⚠️ **Ficha de consulta + expandir a fullscreen apaisado** (`e1f03b2`) —
  **RETIRADA el mismo día** en `bdb2f19`: el botón de expandir no funcionaba
  en el móvil real del usuario (o metía scroll lateral) pese a validarse en
  el emulador. Lección: no fiarse del emulador para APIs de
  fullscreen/orientation móviles; el usuario prefiere móvil simple y
  estable, sin ficha expandible.
- ✅ **Fix importante: dibujos sobre paneles de indicadores persisten en su
  panel** (`bdb2f19`). Causa raíz de "no me guarda las directrices del RSI":
  el guardado no persistía el panel, así que la restauración recreaba todo
  en el panel del precio (valores RSI 0-100 invisibles junto al precio de
  BTC). Fix: paneles con id determinista `panel_<NOMBRE>` (helper `paneDe()`
  en `GraficoVelas.tsx`), `paneId` guardado en cada dibujo (ausente = panel
  del precio, retrocompatible con lo ya guardado), la restauración crea
  indicadores ANTES que dibujos y devuelve cada uno a su panel, copy/paste
  respeta el panel, y un dibujo cuyo panel no está presente no se pinta pero
  se re-guarda intacto (huérfanos preservados). Mismo commit: ficha móvil
  simplificada (sin expandir) y dibujos con `lock: true` en móvil
  (imposible arrastrarlos con el dedo).
- ✅ Verificado: ui-tester en 6 viewports + round-trip completo del dibujo
  sobre RSI (dibujar en panel RSI → guardar → GET con `paneId: panel_RSI` →
  F5 → restaurado en su panel) 5/5 PASS, 0 errores de consola; el usuario
  validó además a mano (incluido un dibujo sobre el panel de volumen) y
  desde su móvil real. `make lint` y build OK en cada paso.
- ✅ **Tres redeploys reales a PRD** (sexto, séptimo y octavo), todos
  verificados: workflow success sobre el commit exacto, `/api/salud` y SPA
  200, bundle comprobado POR CONTENIDO (grep de marcadores positivos y
  negativos), no solo por hash. Sin backup previo por decisión del usuario
  (nada dibujado desde el último backup; cambios solo de frontend).
  `BTCUSDC` de dev usado como conejillo del test de guardado y restaurado a
  vacío vía API después.
- ✅ **Decisión fijada en `CLAUDE.md`**: el PANEL de cada dibujo (`paneId`,
  esquema `panel_<INDICADOR>`) es parte del contrato de persistencia igual
  que los nombres de overlays — cambiar el esquema rompe dibujos guardados.

### Estado al Finalizar:

- `main` en `bdb2f19` (+ este cierre); local, `origin/main` y PRD
  sincronizados. Rama `feat/responsive-movil` conservada en `bdb2f19`.
  Working tree limpio salvo `CURRENT_WORK.md`/`CLAUDE.md`.
- Servidores dev apagados.
- **⚠️ Acción pendiente del USUARIO**: redibujar en PC las directrices sobre
  RSI guardadas ANTES del fix (se guardaron sin panel, en escala 0-100:
  irrecuperables). Las nuevas ya persisten bien.

### Próximos Pasos Sugeridos:

1. Sin acción predefinida: el usuario usará la app en su día a día (ahora
   también desde móvil) y traerá feedback de mejoras/ajustes.
2. Vista dual diario+disparo en PC sigue en backlog de memoria y "puede
   seguir esperando"; requiere decidir el modelo de guardado ANTES de tocar
   código (riesgo de pisado entre dos paneles del mismo símbolo).
3. Flecos de siempre en background (logout cosmético).

---
🔴 [FIN DE SESIÓN - BREAKPOINT]
📅 Fecha: 2026-07-29
🎯 Estado: Producción al día con adaptación móvil/tablet y el fix de
    persistencia por panel desplegados y verificados E2E; el panel de cada
    dibujo es ahora parte del contrato de persistencia (CLAUDE.md). Sin
    pendientes bloqueantes; el usuario debe redibujar a mano unas
    directrices antiguas sobre RSI que se guardaron antes del fix.
⏭️  Retomar: sin acción predefinida — esperar lo que traiga el usuario, o
    abordar la vista dual (diario + intervalo de disparo) si toca sesión
    dedicada.
---

## 📝 Sesiones Anteriores (Resumen)

- 2026-07-27 (madrugada): ojo de mostrar/ocultar en la leyenda de
  indicadores (`ff07e0e`), sin perder su configuración; asesoría de
  indicadores del usuario fijada en memoria (MA 50/100/200, RSI 25 para
  divergencias, MACD 12/26/9); deploy a PRD verificado (quinto redeploy
  real).
- 2026-07-26 (noche, tercera sesión): dibujos de texto (Texto/Etiqueta)
  seleccionables y arrastrables (`c34edf7`), deploy a PRD verificado (cuarto
  redeploy real).
- 2026-07-26 (noche, segunda sesión): símbolos reordenables arrastrando sus
  filas (`d1f8776`), deploy a PRD verificado (tercer redeploy real).
- 2026-07-26 (noche, primera sesión): pares USDC en el buscador de Binance
  (`5fbf8e4` — MiCA retiró USDT spot en la EEA en 2025), deploy a PRD
  verificado (segundo redeploy real).
- 2026-07-26 (tarde): fondos UCITS resueltos solo con Yahoo; salida a
  producción completa (infra, lienzo en blanco en PRD, repo GitHub + imagen
  vía Actions, Dokploy/Hetzner, E2E 11/11 PASS, backup de dibujos
  estrenado). Apéndice: listas reordenables arrastrando tabs (`b5e0bdf`) y
  primer redeploy real verificado.
- 2026-07-25/26: fase gráfico completa (intervalos, indicadores, dibujos por
  símbolo con overlays propios/vendorizados, fibonacci estilo TradingView) —
  mergeada a main.
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
