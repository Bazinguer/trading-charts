# Current Work Log — trading-charts

## 🎯 Estado Actual del Proyecto

**PRODUCCIÓN VIVA**: charts.bazinguer.es está desplegado y verificado E2E.
Fondos UCITS resueltos SOLO con Yahoo (Morningstar descartado por
licencia/complejidad). La app hace todo lo pedido: gráfico con intervalos
1H/4H/1D/1S/1M, escala del eje de precios **lineal o logarítmica por
símbolo** (persistida en BD junto al análisis), indicadores (con ojo de
mostrar/ocultar en su leyenda) y dibujos por símbolo persistentes (texto
seleccionable/arrastrable, Fibonacci con niveles fracción del rango de
precio como TradingView, fieles a su PANEL, con ojo GLOBAL para
ocultar/mostrar todos de golpe sin borrarlos), barra de dibujo completa,
listas y símbolos reordenables arrastrando filas/tabs, pestaña activa de
Inicio persistente entre navegaciones/F5, adaptación móvil/tablet, velas
que se refrescan solas al abrir el gráfico (refresco perezoso, sin
scheduler), y filas de tabla abribles en pestaña nueva (clic
secundario/central/Ctrl+clic) sin romper el arrastre para reordenar. El
buscador de Binance cubre pares USDT y USDC. Doce redeploys reales en PRD
sin incidencias. El usuario ya usa la app en real (listas y símbolos
propios, análisis guardados, intradía 1h, desde PC y móvil). Sin
pendientes bloqueantes; un fleco cosmético opcional (ver Notas
Importantes).

## 📍 Última Sesión Completada

### Fecha: 2026-08-08 — "escala logarítmica del eje de precios"

### Contexto de la Sesión:

El usuario pidió escala logarítmica para el eje de precios: en lineal la
distancia vertical mide euros, no rentabilidad, y una serie de crecimiento
compuesto (S&P) parece insostenible al final y plana al principio.

### Trabajo Completado:

- ✅ **Spec de diseño** (`30e3626`,
  `docs/superpowers/specs/2026-08-08-escala-logaritmica-design.md`) antes de
  tocar código, con las decisiones de abajo.
- ✅ **Escala lineal/log por símbolo, guardada en BD** (`5c86dce`): columna
  nueva `escala TEXT NOT NULL DEFAULT 'lineal'` en `dibujos.db` (migración
  aditiva, patrón de `indicadores`), TEXT y no booleano para que el eje
  `percentage` de KLineChart entre sin volver a migrar el día que haga
  falta. Se descartó `localStorage` a propósito: una recta en lineal ES una
  curva en log, así que el símbolo debe reabrirse en la escala en que se
  dibujó. `overrideYAxis` SIN `paneId: "candle_pane"` para no afectar a
  RSI/MACD (verificado en `index.esm.js:15309` que sin filtrar alcanza a
  TODOS los paneles). Botón `LOG` en el grupo de tipo/rejilla (PC) y en la
  barra inferior (móvil).
- ✅ **Descartado a fondo, no implementado**: duplicar los dibujos por
  escala (idea propuesta por el usuario). Ni TradingView ni KLineChart lo
  hacen así (en TV es un apaño manual vía Object Tree), contradice "dibujos
  por símbolo, no por símbolo+timeframe", y duplicaría el mantenimiento del
  AT.
- ✅ **Fix de Fibonacci tras medir sobre datos reales** (`a3c0015`): los
  niveles son fracción del RANGO DE PRECIO y el eje decide su altura en
  píxeles (`convertToPixel`), no un retroceso geométrico en el espacio log.
  Es el default de TradingView ("Fib levels based on log scale" viene
  desactivado) y el estándar del sector. Se implementó primero la variante
  contraria y se revirtió al medir sobre el S&P real del usuario: movía el
  nivel 0.5 de 5.582 a 5.203 (7%) — un Fibonacci saca su fuerza del consenso
  de quienes miran el mismo número.
- ✅ **Barrido de deuda pendiente**: al arrancar la sesión se eliminaron las
  8 ramas locales obsoletas de sesiones anteriores (`feat/base-app`,
  `feat/grafico`, `feat/ojo-indicadores`, `feat/pestana-activa-y-ojo-dibujos`,
  `feat/refresco-velas`, `feat/reordenar-simbolos`, `feat/responsive-movil`,
  `fix/mover-dibujos-texto`); ninguna existía ya en remoto.
- ✅ Verificación: `make lint`/`make build` limpios. Migración probada sobre
  COPIA de la BD real antes de tocar nada: datos intactos, filas antiguas
  heredan `'lineal'`, round-trip ok, BD nueva nace con la columna. Playwright
  contra dev: mismos precios de Fibonacci en log y lineal (6.058,29 /
  5.582,27 / 5.106,26 sobre el S&P), líneas equiespaciadas en lineal (30px)
  y comprimidas en log (17px/23px); escala persistente tras F5 y no
  contagiada entre símbolos; MACD/RSI/volumen intactos en lineal; móvil ok;
  0 errores de consola. Confirmado además que los anclajes de un dibujo NO
  se mueven al cambiar de escala (es proyección, no bug — pregunta que hizo
  el propio usuario al probar).
- ✅ **Duodécimo redeploy real a PRD, verificado**: backup previo
  (`backups/dibujos_prd_20260808_185910.db`, 132K, íntegro, 21 símbolos/136
  dibujos/54 indicadores/6 listas/40 símbolos); rama `feat/escala-logaritmica`
  mergeada fast-forward a main; imagen GHCR
  `sha256:6f0b6aa4b7e3d30a2c13d74d1100d641d76bbcedd6e8a5000c2861743402ca91`
  (tags `latest` + `a3c00156cc7b…`); el usuario pulsó Deploy en Dokploy
  (norma fija); contenedor `Up (healthy)`, 0 reinicios, `RepoDigest`
  coincide, bundle `index-BOxrhiLJ.js` idéntico byte a byte al build local
  (`sha256 b948949d…`), logs limpios, y tras la migración perezosa 136
  dibujos/54 indicadores/6 listas/40 símbolos byte a byte idénticos al
  backup, las 21 filas en `'lineal'`.

### HALLAZGO OPERATIVO (ver también Notas Importantes):

Las migraciones de `dibujos.db` son PEREZOSAS: viven en `_conexion()` y solo
corren en la PRIMERA conexión a la BD de dibujos, no al arrancar el
contenedor. El healthcheck no toca la BD, así que un contenedor recién
desplegado puede estar `healthy` con el esquema viejo — verificar PRD justo
tras el deploy y no ver la columna nueva NO es un fallo, ya documentado en
`CLAUDE.md` (`931953e`).

### Nota de contexto:

El dispatch del workflow "Deploy" por API SÍ funcionó esta vez (204, run
`31268325480` success): el 403 de la sesión anterior era `gh workflow run`,
que nunca ha funcionado en este repo; la vía buena es el PAT embebido en el
remote contra la API de dispatches (ya documentada en Notas Importantes).

### Estado al Finalizar:

- `main` en `931953e` (+ este cierre); local, `origin/main` y PRD
  sincronizados. Rama `feat/escala-logaritmica` mergeada pero NO borrada
  (fleco menor, ver Próximos Pasos).
- Servidores dev apagados. BD de dev restaurada de su backup tras las
  pruebas (GOOG con sus 2 dibujos originales). Capturas de prueba fuera del
  repo (scratchpad).

### Próximos Pasos Sugeridos:

1. Fleco menor: borrar la rama local `feat/escala-logaritmica` ya fusionada
   (el usuario suele pedirlo tras el merge).
2. Posible añadido futuro, hoy YAGNI: casilla "fib levels based on log
   scale" por dibujo, como TradingView, si algún día echa de menos el
   retroceso geométrico.
3. Vista dual diario+disparo en PC sigue en backlog de memoria; requiere
   decidir el modelo de guardado ANTES de tocar código.
4. Fleco cosmético del logout sigue pendiente (no bloqueante).

---
🔴 [FIN DE SESIÓN - BREAKPOINT]
📅 Fecha: 2026-08-08
🎯 Estado: Escala logarítmica del eje de precios, por símbolo y persistida en
    BD (no localStorage), con Fibonacci corregido a fracción del rango de
    precio (estándar TradingView) tras medir sobre datos reales; desplegado
    y verificado E2E. Duodécimo redeploy real a PRD con backup previo.
    Documentado que las migraciones de dibujos.db son perezosas (primera
    conexión, no arranque del contenedor). Sin pendientes bloqueantes.
⏭️  Retomar: sin acción predefinida — esperar feedback del usuario, borrar
    la rama `feat/escala-logaritmica` ya fusionada, o abordar la vista dual
    (diario + intervalo de disparo) si toca sesión dedicada.
---

## 📝 Sesiones Anteriores (Resumen)

- 2026-08-07: filas de tabla abribles en pestaña nueva vía `<Link>` real de
  react-router (`b94314f`, `draggable={false}` + `stopPropagation`
  obligatorios para no romper el arrastre de reordenado); undécimo redeploy
  a PRD verificado, rama de feature borrada tras merge a petición del
  usuario; detectado el 403 de `gh workflow run` (nunca funcionó en este
  repo, ver Notas Importantes).
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
  localStorage del navegador (tc-fibo-base, tc-tipo-grafico, tc-rejilla). La
  ESCALA del eje (lineal/log) es la excepción deliberada: va en `dibujos.db`
  por símbolo, no en localStorage, porque una recta en lineal ES una curva
  en log y el símbolo debe reabrirse en la escala en que se dibujó.
- Los niveles de Fibonacci son fracción del RANGO DE PRECIO (el eje decide
  su altura en píxeles vía `convertToPixel`), no un retroceso geométrico en
  el espacio log — es el default de TradingView y el estándar del sector;
  no "corregirlo" al revés sin releer
  `docs/superpowers/specs/2026-08-08-escala-logaritmica-design.md`.
- Las migraciones de `dibujos.db` son PEREZOSAS (`_conexion()` en
  `api/dibujos.py`): corren en la primera conexión a la BD, no al arrancar
  el contenedor. El healthcheck no toca la BD, así que un contenedor recién
  desplegado puede estar `healthy` con el esquema viejo todavía — no ver la
  columna nueva justo tras el deploy no es un fallo.
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
- **`gh workflow run` NUNCA ha funcionado** en este repo: da 403 "Must have
  admin rights to Repository" (leer runs y hacer push a main sí van). No es
  una regresión — está así desde 2026-07-26. El camino que SÍ funciona es el
  PAT embebido en el remote (`git remote get-url origin`) contra la API de
  dispatches: `POST /repos/.../actions/workflows/<id>/dispatches` con
  `{"ref":"main","inputs":{"confirm":"yes"}}` → 204.
- **El botón «Deploy» de Dokploy lo pulsa SIEMPRE el usuario** (norma
  explícita, 2026-08-08). Construir la imagen en GHCR se puede automatizar;
  el cambio de producción es decisión suya y no se automatiza ni se propone
  automatizar.
- **`backup-prd` ANTES** de cambios arriesgados y después de análisis
  importantes; el contenedor PRD es `trading-charts-2hwnph-charts-1` (si se
  recrea el project en Dokploy, cambia el hash → actualizar `Makefile.dev`).
- El primer arranque con volumen nuevo crea `dibujos.db` vacía automáticamente.
- Fleco cosmético opcional (preexistente, no bloqueante): al pulsar «Cerrar
  sesión» la SPA muestra un instante «No se pudieron cargar las listas»
  antes de redirigir al login (el 401 de la recarga de listas gana la
  carrera a la redirección).
