# Current Work Log — trading-charts

## 🎯 Estado Actual del Proyecto

**PRODUCCIÓN VIVA**: charts.bazinguer.es está desplegado y verificado E2E
(11/11 tests, incluida la prueba reina: dibujar→guardar→F5→persiste). Fondos
UCITS resueltos SOLO con Yahoo (Morningstar descartado por licencia/complejidad).
La app hace todo lo pedido: gráfico con intervalos 1H/4H/1D/1S/1M, indicadores
y dibujos por símbolo persistentes, barra de dibujo completa, listas
reordenables arrastrando sus tabs. El buscador de Binance ya cubre pares
USDT y USDC (MiCA retiró USDT spot en la EEA en 2025 — el bot y las
inversiones cripto del usuario operan USDC). Ya hubo dos redeploys reales en
PRD sin incidencias. Sin pendientes bloqueantes ni flecos activos.

## 📍 Última Sesión Completada

### Fecha: 2026-07-26 (noche) — "pares USDC + deploy"

### Contexto de la Sesión:

El usuario iba a crear su primera lista/dibujo real y detectó que el
buscador solo devolvía BTCUSDT, pero su bot y sus inversiones cripto en la
EEA operan pares USDC (MiCA retiró los pares spot USDT en 2025). Como los
dibujos se anclan al símbolo, había que arreglarlo ANTES del primer dibujo.

### Trabajo Completado:

- ✅ **Pares USDC en el buscador de Binance** (`5fbf8e4`, rama
  `feat/pares-usdc` → merge ff a main → push): `api/busqueda.py` acepta
  quotes USDT y USDC (nueva constante `QUOTES_BINANCE`, con el porqué
  comentado; filtro de `exchangeInfo` y heurística de ordenación ampliados).
  Decisión del usuario: mantener AMBOS quotes (USDT por histórico largo —
  BTCUSDT desde 2017; BTCUSDC cotiza desde 2018-12-15).
- ✅ Caché `data/binance_simbolos.json` invalidado (borrado en dev y en PRD;
  se regenera solo en la primera búsqueda tras el cambio de filtro).
- ✅ Verificado en dev: `make lint` OK; `buscar()` devuelve BTCUSDC/ETHUSDC;
  descarga real de BTCUSDC (2618 velas diarias desde 2018-12-15); smoke E2E
  por el proxy de Vite con login (ojo: el endpoint es `/api/login`, no
  `/api/sesion/login`). Revisado en el navegador por el usuario, OK.
- ✅ **Deploy a PRD verificado**: backup previo
  `backups/dibujos_prd_20260726_210421.db` (32K); workflow Deploy disparado
  por API con el PAT del remote (el `gh` de la cuenta jombotix da 403 en
  dispatch — dato guardado en memoria de infra), run success sobre `5fbf8e4`;
  redeploy en Dokploy hecho por el usuario. Verificado en
  charts.bazinguer.es: contenedor healthy con imagen nueva, volumen intacto
  (dibujos.db + parquet), `/api/salud` 200, login HTTPS 200, buscar "USDC"
  devuelve los pares USDC, buscar "BTC" devuelve BTCUSDT+BTCUSDC, `/api/listas`
  responde; caché PRD borrado por SSH y regenerado con ambos quotes; sesión
  de prueba cerrada con logout.

### Estado al Finalizar:

- `main` en `5fbf8e4`, local y `origin/main` al día.
- charts.bazinguer.es en producción, healthy, con pares USDC desplegados y
  verificados; backup de dibujos reciente.
- Servidores dev apagados; BD dev con parquet nuevo de BTCUSDC.

### Próximos Pasos Sugeridos:

1. Nada bloqueante ni fleco activo pendiente: la próxima sesión es lo que
   traiga el usuario (previsiblemente sus primeras listas/dibujos reales
   sobre pares USDC).
2. Si algún fondo UCITS que el usuario busque/use en PRD no funciona bien,
   lo avisará entonces (no es tarea activa hoy).
3. Sigue vigente en background: adaptar referencias de skills/agents
   heredados de `.claude/` al usarlos por primera vez en este proyecto.

---
🔴 [FIN DE SESIÓN - BREAKPOINT]
📅 Fecha: 2026-07-26 (noche)
🎯 Estado: Producción al día con pares USDC (Binance) desplegados y
    verificados E2E; sin pendientes bloqueantes ni flecos activos.
⏭️  Retomar: sin acción predefinida — esperar lo que traiga el usuario
    (primeras listas/dibujos reales sobre pares USDC).
---

## 📝 Sesiones Anteriores (Resumen)

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
