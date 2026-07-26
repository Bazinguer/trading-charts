---
name: ejecutar-plan
description: "Execute an implementation plan using the optimal strategy per step: subagents for independent work, agent-teams for cross-domain coordination. Takes a plan .md file as input."
argument-hint: [plan-path] [subagents|team]
disable-model-invocation: true
allowed-tools: Task, Read, Bash, Grep, Glob, Skill, TaskCreate, TaskUpdate, TaskList, AskUserQuestion
---

# Orchestrate Plan

You are the **director of execution**. Read the plan, decide the best strategy for each step, and execute — delegating ALL implementation to subagents or agent-teams.

## Arguments

- **Plan path**: `$ARGUMENTS[0]` — Path to a markdown plan file (REQUIRED)
- **Mode override**: `$ARGUMENTS[1]` — `subagents` or `team` (OPTIONAL). Forces strategy for ALL steps.

---

## Phase 1: Read & Analyze Plan

### Step 1.1: Read the plan

Read the file at `$ARGUMENTS[0]`. If it doesn't exist, tell the user and stop.

### Step 1.2: Identify steps

Parse the plan structure to find execution units:

- **H2 headings** (`## Layer 1: Models`) → each is a STEP
- **H3 headings** (`### 1.1 Create repo`) → sub-tasks WITHIN a step
- **Numbered top-level lists** (`1. Create repos`) → alternative step format

Each H2 or top-level numbered item = one step to evaluate.

### Step 1.3: Load relevant project knowledge

Scan the plan content for keywords and load matching knowledge files from `base-conocimiento`:

| Keywords in plan | Knowledge file to read |
|---|---|
| multi-tenant, RLS, tenant, isolation | `.claude/skills/base-conocimiento/rules/multi-tenant-architecture.md` |
| config, JSONB, widget config, branding | `.claude/skills/base-conocimiento/rules/jsonb-config.md` |
| agent, AI, tools, PydanticAI, lead capture | `.claude/skills/base-conocimiento/rules/ai-agent-system.md` |
| chat, conversation, message, session | `.claude/skills/base-conocimiento/rules/chat-flow.md` |
| email, Resend, notification, template | `.claude/skills/base-conocimiento/rules/email-system.md` |
| FastAPI, SQLAlchemy, pytest, Pydantic | `.claude/skills/base-conocimiento/rules/framework-references.md` |

Read ONLY the files that match. Do NOT read all of them.

---

## Phase 2: Decide Strategy Per Step

### Step 2.1: Check for override

If `$ARGUMENTS[1]` is `subagents` or `team`, use that strategy for ALL steps. Skip signal evaluation.

### Step 2.2: Evaluate 3 signals per step

For each step, evaluate these signals. If ANY is true → **team candidate**. If NONE → **subagents**.

**SIGNAL 1: Cross-validation?**
Does the step require one worker to question/verify what another found?
- Examples: documentation↔code, RLS policies↔application code, schema↔tests

**SIGNAL 2: Shared contracts?**
Do two or more workers produce code that must fit a common interface?
- Examples: backend endpoint + frontend consumer, DB schema + repo queries

**SIGNAL 3: Temporal dependency within the step?**
Does one worker produce something another consumes WITHIN the same step?
- Examples: schema first → backend consumes → frontend consumes

### Step 2.3: Quick-reference decision table

| Step type | Strategy | Signal |
|---|---|---|
| Models/repos (same domain) | **Subagents** parallel | Independent, only result matters |
| Services (same domain) | **Subagents** parallel | Each service is self-contained |
| API endpoints + consumers | **Team** | Signal 2: shared contracts |
| Research / investigation | **Subagents** parallel | Only need the answer |
| Testing / validation | **Subagents** | Independent per domain |
| Documentation audit (docs↔code) | **Team** | Signal 1: cross-validation |
| Refactoring cross-layer | **Team** | Signal 2+3: coordinated renaming |
| Security audit cross-layer | **Team** | Signal 1: policies↔code↔tests |
| Single-domain feature | **Subagents** | No inter-worker communication |
| UI components (dashboard) | **Subagents** | Delegate to ui-shadcn |

**Default (ambiguous):** Subagents. Conservative bias.

### Step 2.4: Team lifecycle check

If multiple steps are team candidates:
1. **Adjacent team steps** → group into ONE team with combined responsibilities
2. **Non-adjacent team steps** → cleanup first team before creating second
3. **3+ separated team steps** → warn about overhead, suggest regrouping

---

## Phase 3: Show Mini-Summary

Before executing, display a brief informational summary (NOT an approval gate):

```
Plan: [plan title]
  [N] steps detected

Strategy:
  Step 1 ([name]) → subagents ([N] parallel)
  Step 2 ([name]) → subagents ([N] parallel)
  Step 3 ([name]) → team ([reason])
  ...

Knowledge loaded: [list of .md files]

Executing...
```

---

## Phase 4: Execute Step by Step

Steps execute **sequentially** (step 2 depends on step 1). WITHIN a step, workers run in **parallel**.

### For SUBAGENT steps:

Follow the patterns from skill `orquestador`:

1. Identify sub-tasks within the step (H3 headings or bullet points)
2. Group independent sub-tasks for parallel execution
3. Compose prompt for each subagent:
   ```
   ## Contexto arquitectonico (de base-conocimiento)
   [relevant knowledge file content]

   ## Tu tarea
   [step instructions from the plan]

   ## Reglas del proyecto
   - Router->Service->Repo pattern (backend)
   - Tests with transactional isolation
   - Multi-tenant: CurrentTenant dependency for RLS
   - Repos return dict, never ORM objects
   - Use text() for SQL queries
   ```
4. Launch subagents using the Task tool (parallel when independent)
5. Collect results
6. Delegate commit to `commit-manager` subagent (via orquestador patterns)

### For TEAM steps:

Follow the patterns from skill `build-with-agent-team`:

**Pre-requisites check:**
1. Verify env var: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` — if not set → fallback to subagents + warning
2. Verify no active team exists — if active → cleanup first

**Permissions:** Teammates inherit the lead's permission mode. If running with `--dangerously-skip-permissions`, all teammates get bypass permissions too (no extra config needed).

**Display mode** (no setup required for default):
- **In-process** (default): all teammates run in the main terminal. Works in any terminal. Use Shift+Up/Down to select teammates.
- **Split panes**: each teammate gets its own pane. Requires tmux or iTerm2.
- Default `teammateMode: "auto"` uses split panes if already in tmux, in-process otherwise.

**Execution:**
1. Enter Delegate Mode (Shift+Tab) — do NOT implement code yourself
2. Map the contract chain (which worker produces interfaces others consume)
3. Spawn upstream workers first → get their contracts
4. Verify contracts (exact URLs, JSON shapes, status codes)
5. Forward verified contracts to downstream workers
6. Workers implement in parallel
7. Run contract diff before integration (compare actual implementations)
8. Each worker validates their domain
9. Run end-to-end validation
10. Cleanup team when step is done

**Team prompt template:**
```
You are the [ROLE] agent for this step.

## Your Ownership
- You own: [directories/files]
- Do NOT touch: [other workers' files]

## Contexto arquitectonico (de base-conocimiento)
[relevant knowledge file content]

## What You're Building
[step instructions]

## Mandatory Communication
- Your FIRST deliverable is your [API contract / schema / interface]
- Send it to the lead via SendMessage BEFORE writing implementation code
- Wait for the lead to confirm before proceeding

## Reglas del proyecto
- Router->Service->Repo pattern (backend)
- Tests with transactional isolation
- Multi-tenant: CurrentTenant dependency for RLS
- Repos return dict, never ORM objects
- Use text() for SQL queries
```

### After each step:

1. Verify the step completed successfully
2. Commit via `commit-manager` subagent
3. Note context to pass to next step (files created, patterns established)
4. If step failed → ask user: "Step [N] failed with [strategy]. Try [alternative]?"

---

## Phase 5: Final Validation

After ALL steps complete:

1. Invoke `verification-before-completion` skill
2. Run project tests: `make test` (or equivalent from the plan)
3. Report final status to user

---

## Fallback Behavior

| Situation | Action |
|---|---|
| Plan file not found | Stop, tell user |
| No steps identified | Stop, tell user plan format is unrecognized |
| Agent teams not enabled | Fallback to subagents + warning |
| Step fails with current strategy | Ask user before retrying with alternative |
| Agent team cleanup fails | Warn user. In split-pane mode: `tmux kill-session`. In in-process mode: restart Claude Code |
| Knowledge file not found | Skip it, proceed without that context |
