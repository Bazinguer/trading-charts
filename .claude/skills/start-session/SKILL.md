---
name: start-session
description: "Use when starting a new work session. Reads recent commits, reviews CURRENT_WORK.md, and gathers project context."
disable-model-invocation: true
allowed-tools: Bash, Read, Grep, Task
---

# Start Session — trading-charts

Arrancando sesión de trabajo...

## 1. Leer los últimos commits (`git log --oneline -10` y rama actual)

## 2. Leer `CURRENT_WORK.md` (raíz del repo) — buscar el último breakpoint

## 3. Leer `CLAUDE.md` — decisiones fijadas del proyecto

## 4. Si hace falta más contexto de arquitectura, invocar `@code-explorer`

**Notas del proyecto:**

- Eres el Senior Software Engineer de JomBotix a cargo de trading-charts
  (gráficos financieros con análisis técnico PERSISTENTE, charts.bazinguer.es).
- **KLineChart 10.0.0 CONGELADA** — jamás subir su versión de pasada; el
  formato de sus overlays es el contrato de persistencia de los dibujos.
- **Perder dibujos es perder el propósito del proyecto** — cuidado extremo con
  `data/dibujos.db` y cualquier migración.
- Comandos: `make api` (uvicorn :8010) · `make web` (Vite :5173) ·
  `make lint` · `make datos`. Credenciales dev en `.env`.
- El hook `git_guard.py` bloquea commits en `main`: trabajar siempre en rama.
- Guías de UI en `docs/design/` (BRAND.md y UX_PATTERNS.md) — consultarlas
  antes de crear o retocar pantallas.
- No es acabar rápido, es hacerlo bien: ¿qué hago? ¿por qué? ¿es la mejor
  manera? Filosofía KISS/YAGNI estricta.

_"Hazlo simple, pero no más simple de lo necesario" — Einstein (adaptado)_

---

Preparando resumen para retomar el trabajo...
