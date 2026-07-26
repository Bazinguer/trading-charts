# Skills Ecosystem

## Dependency Graph

```mermaid
graph TD
    PK["base-conocimiento<br/><i>Knowledge Hub</i>"]

    BG["backend-guardian<br/><i>auto: api/app/</i>"]
    FG["frontend-guardian<br/><i>auto: dashboard/src/</i>"]
    WG["widget-guardian<br/><i>auto: widget-web/</i>"]
    SR["security-reviewer<br/><i>/security-reviewer</i>"]
    VR["vercel-react-best-practices<br/><i>auto: React perf</i>"]

    QG["quality-gate<br/><i>/quality-gate</i>"]
    GB["git-branches<br/><i>auto: git workflow</i>"]

    ORC["orquestador<br/><i>/orquestador</i>"]
    DBG["debug-orchestrator<br/><i>/debug-orchestrator</i>"]
    OP["ejecutar-plan<br/><i>/ejecutar-plan</i>"]
    BAT["build-with-agent-team<br/><i>/build-with-agent-team</i>"]

    SS["start-session<br/><i>/start-session</i>"]
    ES["end-session<br/><i>/end-session</i>"]

    PK -->|"multi-tenant, JSONB,<br/>AI agents"| BG
    PK -->|"SuperAdmin,<br/>multi-tenant"| FG
    PK -->|"JSONB config,<br/>API contracts"| WG
    PK -->|"multi-tenant<br/>architecture"| SR
    PK -->|"architectural<br/>context"| ORC
    PK -->|"project<br/>patterns"| DBG
    PK -->|"context at<br/>session start"| SS

    VR -->|"React perf<br/>patterns"| FG

    BG -->|"source of truth<br/>backend rules"| QG
    FG -->|"source of truth<br/>frontend rules"| QG
    SR -->|"source of truth<br/>security rules"| QG
    BG -->|"backend API<br/>patterns"| WG
    BG -->|"code-level<br/>enforcement"| SR

    QG -->|"full validation<br/>before PR"| GB

    ORC <-->|"shared subagent<br/>patterns"| DBG
    ORC -->|"subagent<br/>strategy"| OP
    BAT -->|"team<br/>strategy"| OP

    style PK fill:#4a9eff,color:#fff,stroke:#2a7edf
    style OP fill:#ff6b6b,color:#fff,stroke:#df4b4b
    style ORC fill:#ffa94d,color:#fff,stroke:#df8930
    style BG fill:#51cf66,color:#fff,stroke:#37b24d
    style FG fill:#51cf66,color:#fff,stroke:#37b24d
    style WG fill:#51cf66,color:#fff,stroke:#37b24d
    style QG fill:#cc5de8,color:#fff,stroke:#ae3ec9
    style SR fill:#cc5de8,color:#fff,stroke:#ae3ec9
    style BAT fill:#ffa94d,color:#fff,stroke:#df8930
    style DBG fill:#ffa94d,color:#fff,stroke:#df8930
```

## Workflow: Plan Execution

```mermaid
graph LR
    B["brainstorming"] --> WP["writing-plans"]
    WP --> OP["ejecutar-plan"]
    OP --> VBC["verification-before-<br/>completion"]

    style B fill:#4a9eff,color:#fff
    style WP fill:#4a9eff,color:#fff
    style OP fill:#ff6b6b,color:#fff
    style VBC fill:#cc5de8,color:#fff
```

## Skills Index

### Auto-invocadas (se activan por contexto)

| Skill | Trigger | Scope |
|---|---|---|
| `backend-guardian` | Editar `api/app/` | Router→Service→Repo, multi-tenant, tipos |
| `frontend-guardian` | Editar `dashboard/src/` | Componentes, TypeScript, state, shadcn/ui |
| `widget-guardian` | Editar `widget-web/` | Backend-centric, code splitting, sessions |
| `base-conocimiento` | Trabajo en cualquier area | JSONB config, AI agents, chat, email, multi-tenant |
| `vercel-react-best-practices` | Trabajo con React | Performance patterns |

### Invocables (usuario ejecuta con /comando)

| Skill | Uso | Scope |
|---|---|---|
| `/orquestador` | Coordinar subagentes | 9 agentes, delegation rules, workflows |
| `/ejecutar-plan` | Ejecutar un plan .md | Decide subagents/team por paso |
| `/build-with-agent-team` | Build con agent-teams | In-process o split panes, contract-first |
| `/debug-orchestrator` | Debug full-stack | Multi-agente para diagnostico |
| `/quality-gate` | Pre-merge | Checks automaticos + review manual |
| `/security-reviewer` | Audit de seguridad | RLS, CSRF, JWT, multi-tenant |
| `/start-session` | Iniciar sesion | Contexto, commits recientes, breakpoints |
| `/end-session` | Cerrar sesion | Documentacion, cleanup CURRENT_WORK.md |
| `/git-branches` | Git workflow | Ramas, PRs, merge, deploy |

## Posibles mejoras

### `ejecutar-plan`: seleccion de modelo por rol

Actualmente todos los teammates/subagentes heredan el modelo del lead (Opus). Posible mejora:

| Rol | Modelo | Razon |
|---|---|---|
| Lead (ejecutar-plan) | **Opus** | Decide estrategia, coordina, valida |
| Teammates que implementan | **Sonnet** | Escriben codigo igual de bien, mas rapidos |
| Subagentes de research | **Sonnet** | Buscar docs no necesita Opus |

Opus destaca en razonamiento complejo y decisiones arquitectonicas. Para implementacion de codigo, Sonnet da resultados muy similares. Valorar si merece la pena el ahorro de tokens vs simplicidad de "todo Opus".
