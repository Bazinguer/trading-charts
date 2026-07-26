---
name: end-session
description: "Use when finishing a work session. Delegates cleanup, documentation, and commit to session-manager."
disable-model-invocation: true
argument-hint: [instrucciones opcionales]
allowed-tools: Task
---

# End Session — trading-charts

Delegando en `@session-manager` el cierre de sesión...

**Instrucciones adicionales:** $ARGUMENTS

---

El session-manager se encarga de:

- Actualizar `CURRENT_WORK.md` (raíz del repo): documentar la sesión y marcar
  el nuevo breakpoint
- Compactar sesiones antiguas (mantener el archivo contenido, sin hincharlo)
- Hacer el commit de `CURRENT_WORK.md` en la rama actual (si la sesión cerró
  con merge a `main`, el commit en `main` es válido: `git_guard.py` ya solo
  avisa de operaciones destructivas, no bloquea main)
- Reportar "TODO OK"

Si diste instrucciones, se tendrán en cuenta para la documentación.
