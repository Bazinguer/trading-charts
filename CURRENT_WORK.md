# Current Work Log — trading-charts

## 🎯 Estado Actual del Proyecto

**PRODUCCIÓN VIVA**: charts.bazinguer.es está desplegado y verificado E2E
(11/11 tests, incluida la prueba reina: dibujar→guardar→F5→persiste). Fondos
UCITS resueltos SOLO con Yahoo (Morningstar descartado por licencia/complejidad).
La app hace todo lo pedido: gráfico con intervalos 1H/4H/1D/1S/1M, indicadores
y dibujos por símbolo persistentes, barra de dibujo completa, listas
reordenables arrastrando sus tabs Y sus símbolos reordenables arrastrando
filas. El buscador de Binance cubre pares USDT y USDC (MiCA retiró USDT spot
en la EEA en 2025 — el bot y las inversiones cripto del usuario operan USDC).
Ya hubo tres redeploys reales en PRD sin incidencias. Sin pendientes
bloqueantes; un fleco cosmético opcional (ver Notas Importantes).

## 📍 Última Sesión Completada

### Fecha: 2026-07-26 (noche, segunda sesión) — "reordenar símbolos + deploy"

### Contexto de la Sesión:

Antes de crear su primer dibujo real, el usuario añadió BTC+ETH a su lista y
detectó que no podía reordenar los símbolos dentro de una lista. El orden
manual es su criterio de prioridad (los más importantes/vigilados arriba).

### Trabajo Completado:

- ✅ **Reordenar símbolos arrastrando sus filas** (`d1f8776`, rama
  `feat/reordenar-simbolos` → merge ff a main → push). Solo frontend, 1
  fichero: `web/src/paginas/Inicio.tsx` (+34/−4) — el backend YA persistía
  el orden (`lista_simbolos.orden` + PUT de reemplazo completo), solo
  faltaba el gesto en la UI.
- ✅ Drag & drop nativo de filas en `TablaLista`, mismo patrón que los tabs
  de listas (convención TradingView); actualización optimista en
  `alGuardarSimbolos` (la fila se recoloca/quita sin parpadeo, `cargar()`
  confirma o revierte); con ordenación por columna activa el arrastre se
  desactiva (el orden visual es derivado).
- ✅ Verificado en dev: `make lint` OK (oxlint, no eslint/prettier);
  Playwright: arrastre en ambos sentidos persiste en BD y tras F5; con sort
  activo `draggable=false`; el clic en fila sigue navegando al gráfico.
- ✅ **Deploy a PRD verificado** (tercer deploy real, sin incidencias):
  backup previo `backups/dibujos_prd_20260726_214113.db` (32K); workflow
  Deploy disparado con curl + PAT del remote (204; run success sobre
  `d1f8776`); redeploy en Dokploy hecho por el usuario. Verificado en
  charts.bazinguer.es: contenedor `trading-charts-2hwnph-charts-1` healthy
  con imagen nueva, volumen intacto (dibujos.db 32K + parquets
  BTCUSDC/ETHUSDC/BTCUSDT), `/api/salud` 200, login HTTPS 200, prueba real
  de arrastre (persiste tras recarga, revertido a orden original del
  usuario), logout y redirección a `/login` OK.

### Estado al Finalizar:

- `main` en `d1f8776`, local, `origin/main` y producción al día. Working
  tree limpio.
- charts.bazinguer.es healthy y verificado; backup de dibujos reciente.
- Servidores dev apagados; rama `feat/reordenar-simbolos` mergeada y
  conservada (misma costumbre que `feat/base-app` y `feat/grafico`).

### Próximos Pasos Sugeridos:

1. Sin bloqueantes: la próxima sesión la marca el usuario (previsiblemente
   sus primeras listas/dibujos reales, ya con reordenado de filas disponible).
2. Fleco cosmético del logout (ver Notas Importantes) — opcional, solo si
   algún día molesta.
3. Sigue en background: adaptar referencias de skills/agents heredados de
   `.claude/` al usarlos por primera vez.

---
🔴 [FIN DE SESIÓN - BREAKPOINT]
📅 Fecha: 2026-07-26 (noche, segunda sesión)
🎯 Estado: Producción al día con reordenado de símbolos por drag & drop
    desplegado y verificado E2E; sin pendientes bloqueantes.
⏭️  Retomar: sin acción predefinida — esperar lo que traiga el usuario
    (previsiblemente sus primeras listas/dibujos reales).
---

## 📝 Sesiones Anteriores (Resumen)

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
