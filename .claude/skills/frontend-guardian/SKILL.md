---
name: frontend-guardian
description: "Use when editing TypeScript/React files in dashboard/src/. Validates component size, TypeScript safety, state management, and shadcn/ui conventions."
user-invocable: false
---

# Frontend Guardian

Rules are MANDATORY when editing `dashboard/src/`.

## CRITICAL RULES (always enforce)

- **MAX 300 LOC** per component. Decompose if larger
- **ZERO** `as any` - define proper types always
- **Tenant**: ONLY via `useWebStore`. NEVER `sessionStorage` direct, NEVER `useTenant()`
- **Server state**: TanStack Query. **UI state**: Zustand/useState. NEVER mix
- **No hardcoded strings** - use `useTranslation()`
- **shadcn/ui**: Never modify `components/ui/` - create wrappers
- **SuperAdmin has NO web_id in token** - see rules/superadmin-web-selector.md

## DETAILED RULES (read when working on specific areas)

| Area | Rule file | When to read |
|------|-----------|--------------|
| SuperAdmin tenant | `rules/superadmin-web-selector.md` | Any page/component using tenant context |
| Components | `rules/component-patterns.md` | Creating or refactoring components |
| TypeScript | `rules/typescript-safety.md` | Types, interfaces, API responses |
| State management | `rules/state-management.md` | Queries, mutations, stores, context |
| shadcn/ui + forms | `rules/shadcn-forms-a11y.md` | UI components, forms, accessibility |

## See Also

- **base-conocimiento**: For SuperAdmin pattern origin, multi-tenant architecture, JSONB config structures → `.claude/skills/base-conocimiento/rules/`
- **vercel-react-best-practices**: For React performance patterns (memoization, lazy loading, bundle optimization)
