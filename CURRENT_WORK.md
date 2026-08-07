# Current Work Log — trading-charts

## 🎯 Estado Actual del Proyecto

**PRODUCCIÓN VIVA**: charts.bazinguer.es está desplegado y verificado E2E.
Fondos UCITS resueltos SOLO con Yahoo (Morningstar descartado por
licencia/complejidad). La app hace todo lo pedido: gráfico con intervalos
1H/4H/1D/1S/1M, indicadores (con ojo de mostrar/ocultar en su leyenda) y
dibujos por símbolo persistentes (texto seleccionable/arrastrable, fieles a
su PANEL, con ojo GLOBAL para ocultar/mostrar todos de golpe sin borrarlos),
barra de dibujo completa, listas y símbolos reordenables arrastrando
filas/tabs, pestaña activa de Inicio persistente entre navegaciones/F5,
adaptación móvil/tablet, y ahora **velas que se refrescan solas** al abrir el
gráfico (refresco perezoso, sin scheduler). El buscador de Binance cubre
pares USDT y USDC. Diez redeploys reales en PRD sin incidencias. El usuario
ya usa la app en real (listas y símbolos propios, análisis guardados,
intradía 1h, desde PC y móvil). Sin pendientes bloqueantes; un fleco
cosmético opcional (ver Notas Importantes).

## 📍 Última Sesión Completada

### Fecha: 2026-08-07 — "las velas se refrescan solas al abrir el gráfico"

### Contexto de la Sesión:

El usuario notó el gráfico de Unity (U) congelado en una cotización de hace
dos semanas mientras Yahoo ya estaba actualizado. Diagnóstico: las velas NO
se refrescaban NUNCA (sin scheduler/cron/`setInterval`; el parquet solo se
escribía al añadir símbolo por el buscador o con `make datos` a mano, que en
PRD no ejecuta nadie). La maquinaria incremental ya existía y funcionaba;
nadie la llamaba.

### Trabajo Completado:

- ✅ **Refresco perezoso de velas** (`2e0bd28`): `_refrescar()` en
  `api/velas.py`, umbral 15 min medido sobre el **mtime del fichero** (no la
  fecha de la última vela: en fin de semana/festivo no nace vela nueva y
  redescargaría en cada carga). Fallo de red sirve el parquet viejo antes que
  un 502, y el intento cuenta aunque falle (`_ultimo_intento`) para no
  colgar cada carga con el timeout de 30s. Lock por parquet (`_lock_de`,
  double-checked): endpoints síncronos en threadpool + `to_parquet` no
  atómico + StrictMode duplicando el fetch en dev. `/api/resumen` NO
  refresca a propósito (ya es live; refrescar ahí dispararía una descarga
  por símbolo al abrir Inicio). Destapado en el mismo commit: Yahoo cuela en
  el INTRADÍA una pseudo-vela del tick en vivo (timestamp fuera de rejilla,
  volumen 0) que no se deduplica; se descarta al descargar y
  `_sin_pseudo_velas()` limpia las que ya había en disco. El diario está
  limpio (Yahoo no añade pseudo-vela ahí).
- ✅ **Fecha de la lista = fecha del dato mostrado** (`ebf7ca5`): el
  subtítulo móvil de `Inicio.tsx` mezclaba precio live con fecha del parquet.
  Ahora usa la fecha del quote si hay cotización viva, si no la de la última
  vela, y **solo se muestra si no es de hoy** (si saliera siempre sería ruido
  repetido; así señala precios desactualizados: fondos sin NAV, acciones en
  fin de semana). Nuevo helper `hoyISO()` en `web/src/lib/formato.ts` (UTC).
- ✅ CLAUDE.md actualizado con ambas decisiones de diseño.
- ✅ Verificación: `make lint`/`make build` limpios; E2E backend por HTTP en
  1d/1w/1h/4h (404 correcto, idempotencia sin duplicados, concurrencia 8
  simultáneas sin corrupción, caché por mtime, ~0,5s primera carga / 0,01s
  siguientes); E2E navegador (Playwright) en Inicio móvil, gráfico diario y
  1H, 0 errores de consola.
- ✅ **Décimo redeploy real a PRD, verificado**: backup-prd previo
  (`backups/dibujos_prd_20260807_212122.db`, 132K vs 116K del 3-ago, íntegro,
  21 símbolos con dibujos/6 listas/40 símbolos); rama
  `feat/refresco-velas` (conservada) mergeada fast-forward, deploy vía API
  de dispatches, success sobre `ebf7ca5`; verificado bundle idéntico al
  build local, **U pasó de 31,71 a 43,02 con vela de hoy** (refresco
  disparado solo al abrir el usuario su gráfico), caché confirmada. Acceso
  de verificación: credenciales de PRD distintas de dev; se comprobó por SSH
  con `/app/.venv/bin/python` dentro del contenedor (el `python3` del
  sistema no tiene pandas).
- ✅ **Decisión explícita del usuario**: se le ofreció un calentamiento único
  por SSH para refrescar los 50 símbolos de PRD de golpe. Lo RECHAZÓ — "lo
  dejamos como está y que se vayan actualizando 1 a 1 no hay problema por
  eso". No proponer de nuevo un warm-up masivo.

### Estado al Finalizar:

- `main` en `ebf7ca5` (+ este cierre); local, `origin/main` y PRD
  sincronizados. Rama `feat/refresco-velas` conservada.
- Servidores dev apagados. Lista 2 de dev restaurada a [GOOG] tras la prueba.
- PRD tiene 50 parquets diarios: solo U al día tras esta sesión; el resto se
  irán poniendo al día 1 a 1 al abrirse (decisión explícita, ver arriba).
  2 parquets 1h de PRD (MSFT, SPCX) conservan 1 pseudo-vela cada uno; se
  limpian solos la próxima vez que se abra su 1H.

### Próximos Pasos Sugeridos:

1. Sin acción predefinida: el usuario sigue usando la app y avisará.
2. Vista dual diario+disparo en PC sigue en backlog de memoria; requiere
   decidir el modelo de guardado ANTES de tocar código (riesgo de pisado
   entre dos paneles del mismo símbolo).
3. Fleco cosmético del logout sigue pendiente (no bloqueante).

---
🔴 [FIN DE SESIÓN - BREAKPOINT]
📅 Fecha: 2026-08-07
🎯 Estado: Producción al día con refresco perezoso de velas (15 min, mtime,
    sin scheduler) y fecha de lista consistente con el dato mostrado,
    desplegados y verificados E2E; décimo redeploy real a PRD con backup
    previo. El usuario rechazó explícitamente un warm-up masivo de PRD — se
    actualizará símbolo a símbolo al abrirse. Sin pendientes bloqueantes.
⏭️  Retomar: sin acción predefinida — esperar feedback del usuario, o
    abordar la vista dual (diario + intervalo de disparo) si toca sesión
    dedicada.
---

## 📝 Sesiones Anteriores (Resumen)

- 2026-08-03: pestaña activa de Inicio persistente por ID de lista
  (`db23e43`) y ojo global de dibujos ocultar/mostrar sin borrar
  (`3a2d225`, `overrideOverlay({visible})`, estado efímero no persistido);
  noveno redeploy a PRD verificado.
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

- Las velas se refrescan solas al abrir el gráfico (umbral 15 min sobre el
  mtime del parquet, ver `_refrescar()` en `api/velas.py`); NO hay
  scheduler/cron y `/api/resumen` no refresca (sus cotizaciones ya son live).
- La última vela es la de la sesión EN CURSO: los indicadores se mueven sobre
  ella hasta el cierre (repintado normal, como TradingView).
- Yahoo cuela una pseudo-vela del tick en vivo en el intradía (volumen 0,
  timestamp fuera de rejilla); se filtra al descargar y al cargar
  (`_sin_pseudo_velas()`) — explica una vela plana rara si aparece en 1h/4h.
- Verificar PRD por dentro (pandas no está en el `python3` del sistema):
  `ssh ssh-bazinguer-vps "docker exec -i -w /app trading-charts-2hwnph-charts-1 /app/.venv/bin/python -" < script.py`
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
