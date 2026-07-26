# Current Work Log — trading-charts

## 🎯 Estado Actual del Proyecto

**PRODUCCIÓN VIVA**: charts.bazinguer.es está desplegado y verificado E2E
(11/11 tests, incluida la prueba reina: dibujar→guardar→F5→persiste). Fondos
UCITS resueltos SOLO con Yahoo (Morningstar descartado por licencia/complejidad).
La app hace todo lo pedido: gráfico con intervalos 1H/4H/1D/1S/1M, indicadores
y dibujos por símbolo persistentes, barra de dibujo completa, listas
reordenables arrastrando sus tabs. Ya hubo un primer redeploy real en PRD
(imagen nueva, volumen intacto) sin incidencias. Quedan flecos menores (ver
Próximos Pasos) y ningún bloqueante.

## 📍 Última Sesión Completada

### Fecha: 2026-07-26 (sesión "fondos + salida a producción")

### Trabajo Completado:

- ✅ **Fondos UCITS resueltos, SOLO Yahoo**: Morningstar investigado y
  DESCARTADO (Direct Web Services API / MCP exigen licencia institucional
  Morningstar Direct ~10-17k$/año sin tier individual; `mstarpy` requiere
  Chrome headed vía Selenium = complejidad inasumible). El buscador enriquece
  fondos con `longName`/`currency` del meta del chart de Yahoo (los tickers
  `0P...` llegan sin nombre), con caché en memoria; búsqueda por ISIN como
  camino oficial. Fix de datos: NAV recientes con open/high/low a 0 → vela
  plana al cierre. Ojo: el mapeo ISIN→ticker de Yahoo no siempre acierta
  clase/divisa exacta (por eso se muestra la divisa en el badge). Verificado
  E2E en dev con dibujos intactos byte a byte. Mergeado a main (`e725809`).
- ✅ **Producción desplegada y verificada** — charts.bazinguer.es VIVO:
  - Lienzo en blanco en PRD: semillas de listas/símbolos eliminadas
    (`be23177`); mismo comportamiento dev y PRD.
  - Infra (`1499500`): FastAPI sirve la SPA (catch-all tras routers,
    `/api/salud` sin auth, cookie Secure con `CHARTS_HTTPS=1`), Dockerfile
    multi-stage (node 22 → uv python3.12-slim), `deploy.yml` manual a GHCR
    (confirm=yes, solo main, tags latest+sha), `ci.yml` de lint,
    `docker-compose.dokploy.yml` con runbook en cabecera (volumen RW
    `../files/trading-charts-data:/app/data`, Traefik letsencrypt, healthcheck
    python3, custom deploy command `--pull always`), `.env.dokploy.example`,
    `Makefile.dev` con `backup-prd`/`restore-prd` (doctrina anime-log).
  - Repo GitHub `Bazinguer/trading-charts` (privado, PAT en el remote, patrón
    de la casa); imagen publicada vía Actions.
  - Deploy en Dokploy del VPS Hetzner (mismo VPS que anime + bot, decisión del
    usuario): contenedor `trading-charts-2hwnph-charts-1` healthy, TLS Let's
    Encrypt, Traefik sin errores.
  - **E2E EN PRODUCCIÓN 11/11 PASS**: login HTTPS, lienzo en blanco, crear
    lista, añadir BTCUSDT, velas, DIBUJAR→GUARDAR→F5→PERSISTE (la prueba
    reina), limpieza completa. BTCUSDT quedó registrado con histórico en PRD
    (útil, no residuo).
  - **Backup estrenado**: `make -f Makefile.dev backup-prd` →
    `backups/dibujos_prd_20260726_191615.db`, integrity_check ok. Credenciales
    PRD en `.env.dokploy` local (gitignored).
  - `.claude/` pasa a trackearse en git (decisión del usuario, `a245a4e`;
    excluido `settings.local.json`).

#### Apéndice (post-cierre, ya en producción)

- ✅ **Reordenar listas arrastrando sus tabs** (`b5e0bdf`) — pedido por el
  usuario justo antes de estrenar la app: `PUT /api/listas/orden` (reemplazo
  completo de la secuencia de ids; registrado ANTES de `/listas/{id}` para
  que `"orden"` no se parsee como id) + drag & drop nativo HTML5 en los
  `TabsTrigger` (convención TradingView, sin dependencias nuevas),
  recolocación optimista. E2E dev 7/7 PASS (reordena, persiste tras F5, no
  rompe el click, símbolos y dibujos intactos byte a byte).
- ✅ **Primer redeploy real verificado** — nueva imagen publicada vía Actions
  (workflow Deploy) y redeploy en Dokploy hecho por el usuario. Verificado en
  PRD: contenedor healthy con la imagen nueva (mismo nombre
  `trading-charts-2hwnph-charts-1`), endpoint nuevo vivo (401 sin sesión), y
  el volumen sobrevivió al `--force-recreate` (dibujos.db + parquet BTCUSDT
  intactos) — sin incidencias.

### Estado al Finalizar:

- `main` al día con `origin/main` (`b5e0bdf` incluido, ya en producción).
- charts.bazinguer.es en producción, healthy, con la versión de reordenar
  listas desplegada y verificada; backup de dibujos probado.
- BD dev: BTCUSDT con sus 3 dibujos originales; BD PRD: BTCUSDT con dibujos
  de las pruebas E2E (limpiados) + su histórico descargado.

### Próximos Pasos Sugeridos:

1. UX menor: tras "Cerrar sesión" la SPA tarda una navegación en redirigir a
   `/login` (se ve un instante el shell con error 401); fix: `navigate('/login')`
   tras el logout.
2. Probar los fondos UCITS reales del usuario en PRD (buscar por ISIN).
3. Re-añadir SOLUSD desde el buscador (sin datos en la lista "indices" de dev).
4. Skills/agents de `.claude/` heredados: adaptar referencias de otros
   proyectos al usarlos.

---
🔴 [FIN DE SESIÓN - BREAKPOINT]
📅 Fecha: 2026-07-26 (tarde-noche)
🎯 Estado: Producción viva, verificada y con el primer redeploy real ya
    probado sin incidencias (listas reordenables incluidas); sin
    bloqueantes, solo flecos menores.
⏭️  Retomar: fix del `navigate('/login')` tras logout, o abordar los flecos
    de datos (fondos UCITS reales / SOLUSD) según lo que priorice el usuario.
---

## 📝 Sesiones Anteriores (Resumen)

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
