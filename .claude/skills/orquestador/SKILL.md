---
name: orquestador
description: "Use when coordinating subagents for any task. Defines available agents, their capabilities, and optimal workflows for the JomBotix project."
user-invocable: true
argument-hint: [context-text]
---

# Subagent Orchestration

You are the **director** - subagents are your **musicians**. Delegate to keep context clean and tokens low.

## AVAILABLE AGENTS (9)

| Agent | Role | Can Write? | Best For |
|-------|------|-----------|----------|
| **researcher** | Technical intelligence | No (read-only) | Docs, best practices, framework questions |
| **code-explorer** | Code exploration | No (read-only) | Find references, understand architecture |
| **ui-shadcn** | UI component architect | Yes (`dashboard/src/components/`, `styles/`) | shadcn/ui components, forms, themes |
| **commit-manager** | Git automation | Yes (git only) | ALL commits - autonomous, silent on success |
| **error-logs-analyst** | Error detective | No (read-only) | Log analysis, error classification, root cause |
| **validator** | Quality guardian | No (read-only) | Post-fix validation, regression detection |
| **ui-tester-console** | Console diagnostics | No (screenshots) | JS errors, network issues, API integration |
| **ui-tester** | UI/UX testing | No (screenshots) | Visual validation, accessibility, responsive |
| **session-manager** | Session management | Yes (CURRENT_WORK.md only) | End session cleanup, documentation |

## DELEGATION RULES

1. **ALWAYS** delegate commits to `commit-manager` - never read diffs yourself
2. **ALWAYS** delegate UI component creation to `ui-shadcn` - it has shadcn MCP tools
3. **ALWAYS** delegate end-of-session to `session-manager` - total autonomy
4. **Prefer** `researcher` over doing web searches yourself - it has Context7, Tavily, Brave
5. **Prefer** `code-explorer` for broad codebase searches - it maps architecture efficiently
6. **Launch parallel** agents when tasks are independent (e.g., research + code exploration)

## WORKFLOW PATTERNS

### Frontend Development
```
researcher (patterns) → code-explorer (existing code) → implement
→ ui-shadcn (components) → ui-tester (validate) → commit-manager
```

### Backend Development
```
researcher (FastAPI/Pydantic patterns) → code-explorer (existing services)
→ implement → validator (test + verify) → commit-manager
```

### Bug Fix (Frontend)
```
ui-tester-console (reproduce + capture errors) → fix
→ ui-tester-console (verify fix) → commit-manager
```

### Bug Fix (Backend)
```
error-logs-analyst (analyze logs) → fix
→ validator (tests + health check) → commit-manager
```

### Full-Stack Feature
```
researcher + code-explorer (parallel: research + map code)
→ implement backend → validator → implement frontend
→ ui-tester → commit-manager
```

### Investigation / Research
```
researcher (docs + best practices) → code-explorer (current state)
→ synthesize findings → propose approach
```

## CONTEXT MANAGEMENT

- Subagents have **independent context** - provide enough info in the prompt
- Results come back as a single message - subagent context is discarded
- For sequential work: pass relevant findings from agent A to agent B
- For parallel work: launch multiple agents in one message (Task tool)

## WHEN NOT TO DELEGATE

- Simple 1-file edits (faster to do yourself)
- Reading a specific known file (use Read tool directly)
- Quick grep for a known term (use Grep tool directly)
- Answering a question you already know the answer to

## PROJECT KNOWLEDGE

Before spawning subagents for domain-specific work, load relevant context from `base-conocimiento`:
- Multi-tenant patterns → `.claude/skills/base-conocimiento/rules/multi-tenant-architecture.md`
- JSONB config → `.claude/skills/base-conocimiento/rules/jsonb-config.md`
- AI agent system → `.claude/skills/base-conocimiento/rules/ai-agent-system.md`

Include relevant knowledge in subagent prompts so they don't have to rediscover patterns.

## See Also

- **debug-orchestrator**: Specialized orchestration for bug triage (reactive debugging workflows)
- **ejecutar-plan**: Intelligent plan execution with auto-decision between subagents and agent-teams
- **base-conocimiento**: Architectural patterns to inject into subagent context
