# Current Work Log — trading-charts

## 🎯 Estado Actual del Proyecto

Base de la app COMPLETA y verificada E2E en la rama `feat/base-app` (9 commits
sobre `main`): login de usuario único, shell con top bar, listas de seguimiento
con cotizaciones live multi-fuente (Binance + Yahoo), página de análisis
técnico guardados y el gráfico KLineChart del prototipo integrado con dibujos
persistentes. Pendiente de merge a `main`. Siguiente gran fase: el gráfico en
profundidad.

## 📍 Última Sesión Completada

### Fecha: 2026-07-24 (tarde-noche)

### Contexto de la Sesión:

Primera sesión completa del proyecto: montar las bases de la app partiendo del
prototipo de velas, reaprovechando el sistema de diseño JomBotix de los otros
proyectos (jd-facturacion, jd-gestion, jd-serps-ia-tracker, trading-bot).

### Trabajo Completado:

- ✅ Renombrado del directorio `charts` → `trading-charts` (queda rematarlo, ver Próximos Pasos)
- ✅ Base: login por cookie firmada (.env), tema oscuro por defecto con toggle, Tailwind v4 + shadcn new-york copiado del stack idéntico de trading-bot/dashboard
- ✅ Rediseño de navegación: top bar (Inicio | Gráficos) SIN sidebar; contenido fluido sin max-width (ultra-wide); barra de dibujo vertical contextual al gráfico
- ✅ Listas de seguimiento: tabs underline, DataTable con orden asc/desc y selector de columnas POR lista (`tc-columnas-v2`), orden de columnas estilo Investing con cabeceras compactas (🕐 Amp. / Próx. results)
- ✅ Datos multi-fuente: `api/datos_yahoo.py` (ajuste splits+dividendos, patrón stocks_lab), buscador unificado `/api/buscar` (catálogo Binance cacheado + búsqueda Yahoo), descarga automática al añadir símbolo
- ✅ Cotizaciones live (`api/cotizaciones.py`): Binance ticker + Yahoo v7 quote con cookie+crumb (funciona desde esta red), horario ampliado pre/post-market y fecha de próximos resultados; cache 60 s y fallback al parquet
- ✅ Página Gráficos (`/graficos`): listado de AT guardados desde `dibujos.db`; backLink estilo iOS con nombre del destino
- ✅ Pulido con guías jd: PageHeader serps, EmptyState, iconos estándar, fix cursor pointer de Tailwind v4, tamaños de control igualados (h-10/h-9)
- ✅ `docs/design/` propio (BRAND.md + UX_PATTERNS.md adaptados) y CLAUDE.md al día
- ✅ `stocks_lab/` traído desde trading-bot (borrado allí); los `exp_*` dependen de `crypto_lab` y aquí NO ejecutan (solo referencia)
- ✅ Skills start-session/end-session adaptadas a este proyecto

### Estado al Finalizar:

- Todo verificado E2E con Playwright (login, listas, buscador con AAPL real, gráfico con dibujos restaurados, temas, columnas) — sin errores de consola ni de red
- Servidores dev: `make api` (:8010) y `make web` (:5173); al cerrar Claude Code se paran los que lancé en background
- Rama `feat/base-app` con todo comiteado; `main` sigue en el prototipo

### Próximos Pasos Sugeridos:

1. **FASE GRÁFICO** (el objetivo de la próxima sesión): frecuencias 5min/1h/4h/1d/1s/1m — exige decidir cómo traer velas intradía sin romper "una sola fuente de verdad en disco" (`datos.py` hoy solo baja 1d y el semanal se agrega) —, tipo velas/línea, y el buscador de indicadores. Referencia visual: captura de Investing del usuario.
2. Merge `feat/base-app` → `main` (git_guard ya NO bloquea main: quedó solo con avisos de operaciones destructivas).
3. Decidir si se trackea `.claude/` en git (hoy untracked). Limpieza crítica HECHA (2026-07-25): borrados guardians/base-conocimiento/quality-gate/git-branches/security-reviewer/error-logs-analyst/default_log_system/*.bak; hooks reminder+git_guard adaptados; settings con ruff real y sin permisos docker/psql. PENDIENTE adaptar sobre la marcha cuando se usen: ui-shadcn, ui-tester(-console), commit-manager, session-manager, validator, frontend-guardian, orquestador, ejecutar-plan, researcher, debug-orchestrator (todos con referencias al proyecto médico/trading-bot).
4. Rematar el renombrado (ANTES de relanzar Claude Code): `rm /home/jombotix/workspace/charts` (symlink) y `mv ~/.claude/projects/-home-jombotix-workspace-charts ~/.claude/projects/-home-jombotix-workspace-trading-charts`.
5. Probar los fondos indexados UCITS reales del usuario en el buscador (cobertura Yahoo irregular; tickers tipo `0P0000...`).
6. La lista "indices" tiene SOLUSD sin datos (añadido con el flujo viejo): quitarlo y re-añadirlo desde el buscador.

---

## [FIN DE SESIÓN - BREAKPOINT]

## 📝 Sesiones Anteriores (Resumen)

- (ninguna — esta fue la primera sesión tras el prototipo inicial)

## 🏗️ Arquitectura y Decisiones Clave

Ver `CLAUDE.md` (fuente de verdad, no duplicar aquí): KLineChart congelada,
dibujos por símbolo, listas como pura organización, auth de usuario único,
tema oscuro default, datos multi-fuente con el mismo contrato de parquet.

## ⚠️ Notas Importantes

- El crumb de Yahoo (cotizaciones live/ampliado/resultados) es oficioso y puede
  romperse: hay fallback silencioso al cierre del parquet — si un día las
  cotizaciones se ven "congeladas", mirar `api/cotizaciones.py`.
- `POST /api/datos/{simbolo}` descarga histórico completo Yahoo / incremental
  Binance; símbolos raros (`^GSPC`, `SAN.MC`) van URL-encoded y se sanean a
  fichero con `^` → `idx_`.
- El % var. live compara contra el último cierre COMPLETADO (no la vela del
  día en curso) — no "arreglar" eso sin entender por qué está así.
