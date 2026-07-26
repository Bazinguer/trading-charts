#!/usr/bin/env python3
"""
Git Guard - Avisa de operaciones git destructivas (sin bloquear).

Este hook intercepta comandos Bash ANTES de ejecutarse (PreToolUse).
Adaptado a trading-charts: repo personal de un solo dev y (por ahora) sin
remoto — aquí no hay flujo de PRs ni protección de main; el hook se limita
a AVISAR de operaciones que pueden perder trabajo.

Exit codes:
- 0: siempre (solo avisos, nunca bloqueos)
"""
import json
import re
import sys


def is_dangerous_reset(command: str) -> tuple[bool, str]:
    """Detecta reset --hard (puede perder trabajo sin stash previo)."""
    if re.search(r"git\s+reset\s+--hard", command, re.IGNORECASE):
        return True, "reset --hard (puede perder trabajo)"
    return False, ""


def is_force_push(command: str) -> tuple[bool, str]:
    """Detecta force push (reescribe historia; relevante si algún día hay remoto)."""
    if re.search(r"git\s+push\s+(--force|-f)\b", command, re.IGNORECASE):
        return True, "force push (reescribe historia)"
    return False, ""


def is_destructive_checkout(command: str) -> tuple[bool, str]:
    """Detecta checkout/restore que descartan cambios locales."""
    patterns = [
        (r"git\s+checkout\s+--\s+\.", "checkout -- . (descarta TODOS los cambios locales)"),
        (r"git\s+restore\s+\.", "restore . (descarta TODOS los cambios locales)"),
        (r"git\s+clean\s+-[a-z]*f", "clean -f (borra archivos sin trackear)"),
    ]
    for pattern, reason in patterns:
        if re.search(pattern, command, re.IGNORECASE):
            return True, reason
    return False, ""


def main():
    try:
        input_data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)  # fail-open

    tool_name = input_data.get("tool_name", "")
    command = input_data.get("tool_input", {}).get("command", "")

    if tool_name != "Bash" or not command:
        sys.exit(0)

    for check in (is_dangerous_reset, is_force_push, is_destructive_checkout):
        detected, reason = check(command)
        if detected:
            print(
                f"\n⚠️  GIT GUARD: Advertencia - {reason}",
                "\n   Asegúrate de tener backup o stash antes de continuar.",
                file=sys.stderr,
            )
            break  # un aviso basta

    sys.exit(0)


if __name__ == "__main__":
    main()
