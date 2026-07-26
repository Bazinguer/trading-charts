#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# ///
"""
Context keeper for Claude - Minimal reminders that complement CLAUDE.md + skills.
Only includes what's NOT covered by CLAUDE.md or auto-invoked skills.
"""

# ============ REMINDERS ============

# Rol y objetivo (siempre presente)
ROLE = (
    "🎭 Senior FullStack Engineer de JomBotix a cargo de trading-charts"
    " (gráficos financieros con análisis técnico PERSISTENTE)."
    " Question first, implement second."
)

# Filosofía de trabajo (siempre presente)
ORCHESTRATION = (
    "Eres el director de orquesta, no el músico."
    " Delega en subagentes para mantener contexto limpio."
    " Ver skill 'orquestador' para inventario y workflows."
)

# Skills de workflow proactivas (fáciles de olvidar)
WORKFLOW_SKILLS = (
    "Skills proactivas: brainstorming (ANTES de crear),"
    " systematic-debugging (ANTES de fixear),"
    " verification-before-completion (ANTES de afirmar que está listo),"
    " frontend-design (al crear/mejorar UI web)"
)

# Recordatorios duros del proyecto
PROJECT = (
    "KLineChart 10.0.0 CONGELADA · los dibujos (data/dibujos.db) son el"
    " propósito del proyecto · guías UI en docs/design/"
)

# Principio core
SIMPLICITY = "Hazlo simple, pero no más simple de lo necesario - Einstein (adaptado)"


# ============ OUTPUT ============
def main():
    parts = [ROLE, ORCHESTRATION, WORKFLOW_SKILLS, PROJECT, SIMPLICITY]
    print(" │ ".join(parts))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        print("🎭 Senior Engineer │ Question before implementing")
