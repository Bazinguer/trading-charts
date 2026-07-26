# Current Work Log — trading-charts

## 🎯 Estado Actual del Proyecto

**PRODUCCIÓN VIVA**: charts.bazinguer.es está desplegado y verificado E2E
(11/11 tests, incluida la prueba reina: dibujar→guardar→F5→persiste). Fondos
UCITS resueltos SOLO con Yahoo (Morningstar descartado por licencia/complejidad).
La app hace todo lo pedido: gráfico con intervalos 1H/4H/1D/1S/1M, indicadores
y dibujos por símbolo persistentes (incluidos los de texto, ahora
seleccionables/arrastrables como el resto de herramientas), barra de dibujo
completa, listas reordenables arrastrando sus tabs Y sus símbolos reordenables
arrastrando filas. El buscador de Binance cubre pares USDT y USDC (MiCA retiró
USDT spot en la EEA en 2025 — el bot y las inversiones cripto del usuario
operan USDC). Ya hubo cuatro redeploys reales en PRD sin incidencias. Sin
pendientes bloqueantes; un fleco cosmético opcional (ver Notas Importantes).

## 📍 Última Sesión Completada

### Fecha: 2026-07-26 (noche, tercera sesión) — "dibujos de texto seleccionables/arrastrables + deploy"

### Contexto de la Sesión:

El usuario detectó en pruebas manuales que los dibujos de texto
("Texto"/simpleAnnotation y "Etiqueta"/simpleTag) no podían moverse una vez
colocados ni mostraban los botones de Ajustes/Borrar al clicarlos, a
diferencia del resto de herramientas de dibujo.

### Trabajo Completado:

- ✅ **Causa raíz**: las plantillas built-in de KLineChart 10.0.0 marcan
  TODAS sus figuras con `ignoreEvent: true` — el click las atraviesa: sin
  selección (sin botones) y sin arrastre.
- ✅ **Fix** (`c34edf7`, rama `fix/mover-dibujos-texto` → merge ff a main →
  push; rama conservada). Nuevo `web/src/lib/overlays/texto.ts` con las dos
  plantillas vendorizadas de KLineChart 10.0.0 (Apache-2.0), MISMOS nombres
  que las incorporadas para sustituirlas sin romper el contrato de
  persistencia (mismo patrón que `fibonacciLine`). Cambios deliberados: sin
  `ignoreEvent` en las figuras visibles + figuras por defecto activadas
  (punto de anclaje y etiquetas de eje, solo visibles en hover/selección).
  En `simpleTag` se deja OFF `needDefaultYAxisFigure` porque su texto de eje
  ya lo pinta `createYAxisFigures` (el default duplicaría la etiqueta).
  Registro en `overlays/index.ts` con comentario del contrato actualizado.
- ✅ Verificado E2E en dev con Playwright (agente ui-tester), 6/6 PASS sobre
  BTCUSDC: selección con botones "Ajustes"+"Borrar Texto/Etiqueta", arrastre
  libre con cambio de `points` confirmado por API tras guardar, persistencia
  tras F5, borrado con Supr, BD de dev restaurada exacta al baseline. 0
  errores de consola. `make lint` OK. El usuario lo probó también a mano en
  dev antes del deploy.
- ✅ **Deploy a PRD verificado** (cuarto deploy real, sin incidencias):
  backup previo `backups/dibujos_prd_20260726_222442.db` (32K); workflow
  Deploy disparado con curl + PAT (204; run success sobre `c34edf7`);
  redeploy en Dokploy hecho por el usuario. Verificado: contenedor
  `trading-charts-2hwnph-charts-1` healthy con la imagen nueva (creada 20:25
  UTC), volumen intacto (dibujos.db 32K + parquets — el usuario ya tiene
  ADA/THETA/VET además de BTC/ETH en USDC y USDT), `/api/salud` 200, SPA
  200. El usuario probó los dibujos de texto EN PRD y confirmó que funciona.

### Estado al Finalizar:

- `main` en `c34edf7`, local, `origin/main` y producción al día. Working
  tree limpio.
- Servidores dev apagados; backup de dibujos reciente.

### Próximos Pasos Sugeridos:

1. Sin bloqueantes: el usuario ya está usando la app en real (listas y
   símbolos propios) — la próxima sesión la marca él.
2. Fleco cosmético del logout (ver Notas Importantes) — opcional, solo si
   algún día molesta.
3. Sigue en background: adaptar referencias de skills/agents heredados de
   `.claude/` al usarlos por primera vez.

---
🔴 [FIN DE SESIÓN - BREAKPOINT]
📅 Fecha: 2026-07-26 (noche, tercera sesión)
🎯 Estado: Producción al día con dibujos de texto seleccionables/arrastrables
    desplegados y verificados E2E; sin pendientes bloqueantes.
⏭️  Retomar: sin acción predefinida — esperar lo que traiga el usuario (ya
    usando la app en real).
---

## 📝 Sesiones Anteriores (Resumen)

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
