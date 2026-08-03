# Current Work Log — trading-charts

## 🎯 Estado Actual del Proyecto

**PRODUCCIÓN VIVA**: charts.bazinguer.es está desplegado y verificado E2E.
Fondos UCITS resueltos SOLO con Yahoo (Morningstar descartado por
licencia/complejidad). La app hace todo lo pedido: gráfico con intervalos
1H/4H/1D/1S/1M, indicadores (con ojo de mostrar/ocultar en su leyenda) y
dibujos por símbolo persistentes (texto seleccionable/arrastrable, fieles a
su PANEL, y ahora con un ojo GLOBAL para ocultar/mostrar todos de golpe sin
borrarlos), barra de dibujo completa, listas y símbolos reordenables
arrastrando filas/tabs, pestaña activa de Inicio persistente entre
navegaciones/F5, y adaptación móvil/tablet (top bar sin solape, gráfico en
modo consulta, lista estilo Investing en Inicio, dibujos bloqueados en
móvil). El buscador de Binance cubre pares USDT y USDC. Nueve redeploys
reales en PRD sin incidencias. El usuario ya usa la app en real (listas y
símbolos propios, análisis guardados, intradía 1h, desde PC y móvil). Sin
pendientes bloqueantes; un fleco cosmético opcional (ver Notas Importantes).

## 📍 Última Sesión Completada

### Fecha: 2026-08-03 — "pestaña activa persistente + ojo global de dibujos"

### Contexto de la Sesión:

Tras usar la app en real, el usuario pidió dos pulidos de UX. Ambos
implementados en rama `feat/pestana-activa-y-ojo-dibujos` (conservada),
mergeada fast-forward a main y desplegada.

### Trabajo Completado:

- ✅ **Pestaña activa de Inicio persistente** (`db23e43`): al volver de un
  gráfico (o tras F5) se restaura la pestaña de lista en la que estabas.
  localStorage `tc-tab-lista`, por ID de lista (no índice: las listas se
  reordenan); el fallback ya existente a la primera lista cubre listas
  borradas. Cambio mínimo en `web/src/paginas/Inicio.tsx` (~8 líneas).
- ✅ **Ojo global de dibujos** (`3a2d225`): botón Eye/EyeOff en la barra
  vertical de dibujo (tras el separador, antes de Guardar) que oculta/muestra
  TODOS los dibujos sin borrarlos vía `overrideOverlay({visible})` de
  KLineChart 10.0.0 — sin filtro alcanza todos los overlays de todos los
  paneles (mismo mecanismo interno que Limpiar con `removeOverlay()`).
  Decisiones de diseño: estado de vista EFÍMERO (nunca se persiste; al
  recargar o cambiar de intervalo los dibujos nacen visibles — evita el
  susto de "¿dónde está mi análisis?"); dibujar o pegar con el ojo cerrado
  muestra todo primero (convención TradingView); el guardado es inmune
  (`getOverlays` devuelve también los ocultos y `visible` no se serializa).
  En móvil no aparece (la barra entera se oculta en modo consulta). Mismo
  commit: fix de concordancia "1 dibujo restaurado" (fleco preexistente
  cazado por el ui-tester).
- ✅ **Nota de start-session corregida** (`e37ef66`): `git_guard.py` solo
  AVISA (siempre exit 0) de operaciones destructivas (reset --hard, force
  push, checkout -- .) y no mira commits en main — la nota decía que
  bloqueaba. Aclarado por el usuario y verificado leyendo el hook.
- ✅ Verificación: `make lint` y `make build` limpios; ui-tester 14/14 PASS
  (TEST A pestaña 7/7 incluyendo F5 y clave localStorage; TEST B ojo 7/7
  incluyendo la prueba CRÍTICA de guardar con el ojo cerrado sin perder
  dibujos — BTCUSDC como conejillo, restaurado a su estado previo), 0
  errores de consola. El usuario validó a mano en dev y en PRD.
- ✅ **Noveno redeploy real a PRD, verificado**: backup-prd previo
  (`backups/dibujos_prd_20260803_135113.db`, 116K vs 32K del anterior del
  27-jul — el usuario había dibujado mucho análisis nuevo, backup muy
  oportuno); workflow Deploy disparado vía API de dispatches con el PAT del
  remote (el `gh` local solo tiene lectura, patrón ya conocido), success
  sobre el commit exacto `e37ef66`; Dokploy Deploy = clic manual del
  usuario; verificación por CONTENIDO: `/api/salud` y SPA 200, bundle nuevo
  `index-CtCvYecv.js` con los 4 marcadores (`tc-tab-lista`, "Ocultar
  dibujos", "Dibujos ocultos (sin borrar)", "Dibujos visibles").

### Estado al Finalizar:

- `main` en `e37ef66` (+ este cierre); local, `origin/main` y PRD
  sincronizados. Rama `feat/pestana-activa-y-ojo-dibujos` conservada en
  `e37ef66`.
- Servidores dev apagados. BTCUSDC (conejillo de dev) restaurado a vacío.
- El usuario ha purgado `backups/` dejando solo los 2 últimos (27-jul 32K y
  03-ago 116K).

### Próximos Pasos Sugeridos:

1. Sin acción predefinida: el usuario sigue probando la app y avisará si
   encuentra algún detalle más.
2. Vista dual diario+disparo en PC sigue en backlog de memoria; requiere
   decidir el modelo de guardado ANTES de tocar código (riesgo de pisado
   entre dos paneles del mismo símbolo).
3. Fleco cosmético del logout sigue pendiente (no bloqueante).

---
🔴 [FIN DE SESIÓN - BREAKPOINT]
📅 Fecha: 2026-08-03
🎯 Estado: Producción al día con la pestaña activa de Inicio persistente y
    el ojo global de dibujos (ocultar/mostrar sin borrar) desplegados y
    verificados E2E; noveno redeploy real a PRD con backup previo oportuno.
    Sin pendientes bloqueantes.
⏭️  Retomar: sin acción predefinida — esperar feedback del usuario, o
    abordar la vista dual (diario + intervalo de disparo) si toca sesión
    dedicada.
---

## 📝 Sesiones Anteriores (Resumen)

- 2026-07-28/29: adaptación móvil/tablet completa (top bar, gráfico en modo
  consulta, lista estilo Investing en Inicio) y fix de persistencia de
  dibujos por PANEL de indicador (`paneId`, esquema `panel_<INDICADOR>`
  fijado como contrato en CLAUDE.md); ficha de consulta expandible probada
  y retirada por no funcionar en móvil real; tres redeploys a PRD (sexto,
  séptimo, octavo) verificados.
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
