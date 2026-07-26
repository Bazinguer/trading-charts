# Current Work Log — trading-charts

## 🎯 Estado Actual del Proyecto

FASE GRÁFICO COMPLETA y mergeada en `main` (dada por OK por el usuario).
La app hace todo lo que se le pedía al gráfico: intervalos 1H/4H/1D/1S/1M,
velas/línea, rejilla opcional, indicadores por símbolo con ajustes, barra de
dibujo agrupada estilo Investing con 20 herramientas, fibonacci estilo
TradingView configurable con diseño base, regla de medición, copiar/pegar y
borrado individual de dibujos. Falta SOLO la infra para salir a producción
(charts.bazinguer.es) — próxima sesión.

## 📍 Última Sesión Completada

### Fecha: 2026-07-25/26 (sesión larga de la fase gráfico)

### Trabajo Completado:

- ✅ Merge previo `feat/base-app` → `main`; todo lo de hoy en `feat/grafico`, mergeado también a `main` (13 commits, fast-forward)
- ✅ Frecuencias: mensual (1M) agregado del diario; **intradía 1h/4h** — familia de parquet 1h con descarga BAJO DEMANDA la primera vez (ventana ~2 años; Binance incremental, Yahoo acumula sus 730 días en local, sin ajuste por splits en intradía) y 4h agregado del 1h. Principio actualizado: una fuente de verdad POR FAMILIA (1d→1w/1M, 1h→4h)
- ✅ Tipo velas/línea + rejilla opcional (débil) con toggles en cabecera, persistidos en localStorage; estilos del chart por TEMA (tooltip legible en oscuro/claro)
- ✅ Indicadores POR SÍMBOLO (decisión usuario): catálogo de 19 nativos, buscador Command, params editables, ⚙/✕ nativos en la leyenda de cada panel (tooltip features, posición middle por estabilidad), ajustes de color/grosor por línea; persistidos en dibujos.db junto a los dibujos (columna `indicadores`, migración aditiva verificada byte a byte)
- ✅ Barra de dibujo reorganizada: Tendencia sola (más usada) + grupo Líneas con secciones (Libres/Horizontales/Verticales) + Canales/Fibonacci/Formas/Regla/Anotaciones/Pincel; iconos SVG propios estilo Investing (nodos) a 20px; botón Indicadores en la cabecera horizontal
- ✅ Overlays propios/vendorizados (Apache-2.0, en `web/src/lib/overlays/`): rect/circle/triangle (de klinecharts/pro rama v10), measure (de react-klinecharts-ui, con fix propio de dataIndex al restaurar) y `fibonacciLine` que SUSTITUYE al incorporado: acotado a los dos puntos, bandas+diagonal+color por nivel (estilo TradingView), niveles ocultables (CSV en extendData: el merge de overrideOverlay fusiona arrays por índice y rompía), color/grosor/estilo por dibujo y "Fijar como diseño base" (localStorage `tc-fibo-base`)
- ✅ UX de dibujos: selección → botones flotantes Ajustes/Borrar + Supr; Ctrl/Cmd+C/V copia y pega (offset 5 velas); cursor mano cerrada al arrastrar el gráfico
- ✅ Todo verificado E2E con Playwright en cada rebanada; dibujos del usuario restaurados intactos tras cada prueba (backup + verificación byte a byte)

### Estado al Finalizar:

- `main` = fase gráfico completa; rama `feat/grafico` puede borrarse cuando se quiera
- BD dev: BTCUSDT con sus 3 dibujos originales; parquets nuevos `*_1h.parquet` en data/ (ignorados por git)
- `.claude/` sigue untracked; skills/agents heredados aún con referencias a otros proyectos (adaptar al usarlos)

### Próximos Pasos Sugeridos:

1. **SESIÓN INFRA PRD** (charts.bazinguer.es). Decisión del usuario: PRD arranca
   con LIENZO EN BLANCO TOTAL — 0 listas y 0 dibujos. Ojo: `api/main.py` llama
   `listas.asegurar_semilla()` y `simbolos.asegurar_semilla()` → revisar que en
   PRD no siembren nada (o vaciar las semillas). Además: Docker + `make build`,
   `.env` de producción (CHARTS_USUARIO/PASSWORD/SECRET nuevos), y el VOLUMEN
   persistente con BACKUP para `data/dibujos.db` (innegociable — perder dibujos
   es perder el proyecto).
2. Validación local opcional por el usuario antes de salir (la fase gráfico ya
   está dada por OK).
3. Flecos de datos: probar los fondos UCITS reales en el buscador (tickers
   `0P0000...`, cobertura Yahoo irregular) y re-añadir SOLUSD desde el buscador
   (está sin datos en la lista "indices").
4. Decidir si se trackea `.claude/` en git.

---

## [FIN DE SESIÓN - BREAKPOINT]

## 📝 Sesiones Anteriores (Resumen)

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
