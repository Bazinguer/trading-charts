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
adaptación móvil/tablet, velas que se refrescan solas al abrir el gráfico
(refresco perezoso, sin scheduler), y ahora **filas de tabla abribles en
pestaña nueva** (clic secundario/central/Ctrl+clic) sin romper el arrastre
para reordenar. El buscador de Binance cubre pares USDT y USDC. Once
redeploys reales en PRD sin incidencias. El usuario ya usa la app en real
(listas y símbolos propios, análisis guardados, intradía 1h, desde PC y
móvil). Sin pendientes bloqueantes; un fleco cosmético opcional (ver Notas
Importantes).

## 📍 Última Sesión Completada

### Fecha: 2026-08-07 — "abrir el gráfico de una fila en pestaña nueva"

### Contexto de la Sesión:

El usuario pidió poder abrir las filas de la tabla en otra pestaña con clic
secundario. Diagnóstico: las filas de Inicio y Gráficos navegaban con un
`onClick` de JS sobre el `<tr>`, así que el navegador no sabía que había un
destino — sin menú de "Abrir en pestaña nueva", sin efecto en clic central,
y Ctrl+clic navegando en la misma pestaña. La ruta real (`/grafico/:simbolo`)
ya existía con `BrowserRouter`; faltaba declararla en el DOM.

### Trabajo Completado:

- ✅ **Enlaces reales en las filas** (`b94314f`): la celda del símbolo (y el
  botón ↗ de Inicio) pasan a ser `<Link>` de react-router-dom — un `<a href>`
  real que solo se aparta ante Ctrl/Cmd/Shift+clic y botón central. El resto
  de la fila conserva su `onClick` de conveniencia. Encapsulado en
  `<EnlaceGrafico>` (`Inicio.tsx`); `Graficos.tsx` usa un `<Link>` directo
  (esa tabla no tiene arrastre). `FilaMovil` NO se tocó (sin clic secundario
  en un dedo).
- ✅ **Dos trampas no obvias, resueltas** (comentadas en el propio
  `Inicio.tsx` y recogidas abajo en Notas Importantes):
  `draggable={false}` en el ancla es OBLIGATORIO (un `<a>` es arrastrable de
  nativo y arrastraría su URL en vez de disparar el `dragstart` de la fila,
  rompiendo el reordenado justo por el punto más natural para agarrarla);
  `stopPropagation` en su `onClick` es OBLIGATORIO (el `onClick` del
  `<TableRow>` sigue vivo y burbujea; sin esto un Ctrl+clic abriría pestaña
  Y ADEMÁS navegaría en la actual).
- ✅ **Asumido a propósito**: en pestaña nueva se pierde el `state` del
  router, así que el enlace de volver del gráfico cae en su destino por
  defecto (`/graficos`) en vez de «Inicio» — codificar el origen en la URL
  se descartó por YAGNI (caso marginal).
- ✅ Verificación: `make lint`/`make build` limpios; Playwright contra dev:
  clic central y Ctrl+clic abren pestaña sin navegar la actual, clic normal
  genera una sola entrada de historial, arrastre agarrando por el símbolo
  reordenó y restauró BTCUSDC correctamente, enlace de volver dice «Inicio»,
  0 errores de consola (probado también en Gráficos). Verificado además el
  BUNDLE DE PRODUCCIÓN: la API local sirve `web/dist` si existe, así que
  `:8010` sirvió el mismo `index-fDEJ4jxX.js` que PRD.
- ✅ **Undécimo redeploy real a PRD, verificado**: backup previo
  (`backups/dibujos_prd_20260807_224631.db`, 132K, íntegro, 21 símbolos con
  dibujos/6 listas/40 símbolos); rama `feat/enlaces-pestana-nueva` mergeada
  fast-forward a main y BORRADA (local y remota) a petición del usuario —
  a diferencia de sesiones anteriores, que las conservaban; imagen GHCR
  `sha256:28b660470a2d1681…` (tags `b94314fa…` + `latest`, mismo digest);
  contenedor `Up (healthy)`, 0 reinicios, `RepoDigest` coincide, bundle
  servido idéntico byte a byte al build local (`sha256 feb335d6…`), logs
  limpios, datos intactos (dibujos.db 132K íntegra, 21/6/40, 53 parquets).

### INCIDENCIA OPERATIVA (ver también Notas Importantes):

Ya NO se puede disparar el workflow "Deploy" por API desde esta máquina: el
token de `gh` devuelve **HTTP 403 "Must have admin rights to Repository"**
en el dispatch de `Bazinguer/trading-charts` (la lectura de runs y el push a
main sí funcionan). En sesiones anteriores el dispatch funcionaba; ahora no.
El usuario tuvo que lanzarlo a mano desde Actions → Deploy → Run workflow.

### Estado al Finalizar:

- `main` en `b94314f` (+ este cierre); local, `origin/main` y PRD
  sincronizados. En remoto solo queda la rama `main` (las `feat/*` fusionadas
  de sesiones anteriores siguen solo en local, ver pendiente abajo).
- Servidores dev apagados. Lista Cripto de dev restaurada a su orden
  original [BTCUSDC, ETHUSDT, BTCUSDT] tras la prueba de arrastre.

### Próximos Pasos Sugeridos:

1. **Ofrecido y no resuelto**: barrer 8 ramas locales antiguas ya fusionadas
   y sin gemela en remoto (`feat/base-app`, `feat/grafico`,
   `feat/ojo-indicadores`, `feat/pestana-activa-y-ojo-dibujos`,
   `feat/refresco-velas`, `feat/reordenar-simbolos`, `feat/responsive-movil`,
   `fix/mover-dibujos-texto`). El usuario no se pronunció — tarea menor.
2. Investigar/resolver los permisos de `gh` para poder volver a disparar
   "Deploy" por API (o asumir que el lanzamiento manual es lo normal ahora).
3. Vista dual diario+disparo en PC sigue en backlog de memoria; requiere
   decidir el modelo de guardado ANTES de tocar código.
4. Fleco cosmético del logout sigue pendiente (no bloqueante).

---
🔴 [FIN DE SESIÓN - BREAKPOINT]
📅 Fecha: 2026-08-07
🎯 Estado: Filas de tabla abribles en pestaña nueva (clic secundario/central/
    Ctrl+clic) sin romper el arrastre para reordenar, desplegado y verificado
    E2E; undécimo redeploy real a PRD con backup previo. Rama de feature
    borrada tras el merge (a petición del usuario). El dispatch del workflow
    "Deploy" por API dejó de funcionar (403 de permisos) — lanzamiento manual
    por ahora. Sin pendientes bloqueantes.
⏭️  Retomar: sin acción predefinida — esperar feedback del usuario, o barrer
    las 8 ramas locales obsoletas si se confirma, o abordar la vista dual
    (diario + intervalo de disparo) si toca sesión dedicada.
---

## 📝 Sesiones Anteriores (Resumen)

- 2026-08-07 (sesión anterior): refresco perezoso de velas (`2e0bd28`, 15
  min sobre mtime, sin scheduler, filtra pseudo-velas de Yahoo) y fecha de
  lista consistente con el dato mostrado (`ebf7ca5`); décimo redeploy a PRD
  verificado; usuario rechazó explícitamente un warm-up masivo de PRD.
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
- El enlace al gráfico de una fila (`<EnlaceGrafico>` en `Inicio.tsx`, `<Link>`
  en `Graficos.tsx`) lleva DOS guardas que parecen decorativas y no lo son:
  `draggable={false}` (sin él el ancla arrastra su URL y roba el `dragstart`
  de la fila → se rompe el reordenado de símbolos justo al agarrarla por el
  punto más natural) y `stopPropagation` en su `onClick` (sin él, el `onClick`
  del `<TableRow>` burbujea y un Ctrl+clic abre pestaña nueva Y ADEMÁS navega
  en la actual). No quitarlos al "limpiar".
- **Deploy de nueva versión**: merge a main → Actions "Deploy" (confirm=yes)
  → Dokploy Deploy (el custom command hace `--pull always`). El workflow
  se salta entero (verde engañoso, nada construido) si `confirm` no es
  exactamente `yes` en minúsculas o la rama no es `main`: comprobar siempre
  que el job `build-and-push` ejecutó sus pasos.
- **El dispatch de "Deploy" por API (`gh workflow run`) dejó de funcionar**
  desde esta máquina (403 "Must have admin rights to Repository"; la lectura
  de runs y el push a main sí van) — desde 2026-08-07 el usuario lo lanza a
  mano desde Actions. Si vuelve a funcionar, quitar esta nota.
- **`backup-prd` ANTES** de cambios arriesgados y después de análisis
  importantes; el contenedor PRD es `trading-charts-2hwnph-charts-1` (si se
  recrea el project en Dokploy, cambia el hash → actualizar `Makefile.dev`).
- El primer arranque con volumen nuevo crea `dibujos.db` vacía automáticamente.
- Fleco cosmético opcional (preexistente, no bloqueante): al pulsar «Cerrar
  sesión» la SPA muestra un instante «No se pudieron cargar las listas»
  antes de redirigir al login (el 401 de la recarga de listas gana la
  carrera a la redirección).
