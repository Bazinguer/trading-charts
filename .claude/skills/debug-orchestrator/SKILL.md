---
name: debug-orchestrator
description: "Use when user reports frontend, backend, or integration issues. Coordinates subagents for diagnosis and fix."
disable-model-invocation: true
argument-hint: [problem description]
allowed-tools: Task, Read, MultiEdit, Edit, Bash, Grep, Glob
---

# Debug Orchestrator - Full-Stack

## EXECUTION PROTOCOL

When the user reports any frontend, backend, or integration issue, follow this orchestration workflow:

1. **ANALYZE** the user's problem description to identify keywords and classify issue type
2. **GATHER CONTEXT** by examining relevant files if needed
3. **INVOKE SUBAGENTS** based on classification with specific instructions
4. **COORDINATE** information flow between subagents when needed
5. **INVESTIGATE FINDINGS** from subagent reports before taking action
6. **IMPLEMENT SOLUTION** only after thorough analysis
7. **VALIDATE** the fix works as expected

## AUTOMATIC CLASSIFICATION

Analyze user description for these patterns:

| Keywords Detected                               | Issue Type           | Investigation Strategy                      |
| ----------------------------------------------- | -------------------- | ------------------------------------------- |
| "button", "click", "no response", "not working" | Frontend UI          | Start with `ui-tester-console`              |
| "error 500", "API", "request", "backend"        | Backend/API          | Start with `error-logs-analyst`             |
| "form", "submit", "not saving", "data lost"     | Full-Stack Flow      | Both: UI reproduction + backend correlation |
| "undefined", "console error", "React"           | JavaScript/Framework | `ui-tester-console` with console focus      |
| "validate", "end-to-end", "complete flow"       | Integration Testing  | Coordinated multi-agent approach            |
| "looks wrong", "layout", "visual", "responsive" | UI Visual Issues     | Start with `ui-tester` for visual evidence  |

## ORCHESTRATION PATTERNS

### Pattern A: Frontend Investigation

```
1. Invoke ui-tester-console with specific URL and reproduction steps
2. Analyze console errors and network issues from report
3. Examine relevant frontend code if errors identified
4. Apply fix if cause is clear
5. Re-validate with ui-tester-console
```

### Pattern B: Backend Investigation

```
1. Invoke error-logs-analyst to examine recent logs
2. If frontend correlation needed, invoke ui-tester-console for reproduction
3. Correlate timestamps and request data
4. Apply backend fix
5. Validate with appropriate agent
```

### Pattern C: Full-Stack Investigation

```
1. Invoke ui-tester-console to reproduce issue and capture exact timing
2. Use timestamp from UI reproduction to invoke error-logs-analyst
3. Correlate frontend actions with backend processing
4. Identify root cause across layers
5. Apply coordinated fix
6. Validate end-to-end functionality
```

### Pattern D: Visual/UX Investigation

```
1. Invoke ui-tester for comprehensive UI testing with screenshots
2. Analyze visual evidence and accessibility issues from report
3. Examine relevant frontend code for styling/layout issues
4. Apply visual/UX fixes based on evidence
5. Re-validate with ui-tester to confirm visual improvements
```

## SUBAGENT COORDINATION INSTRUCTIONS

### For ui-tester-console:

- Provide **specific URL** and **exact actions** to reproduce
- Request **console message capture** and **network analysis**
- Ask for **timestamps** when coordination with backend is needed
- Focus on **technical diagnostics** not visual issues
- **Critical screenshots**: Agent provides filenames when visual context is needed for technical errors

### For error-logs-analyst:

- Provide **time window** for log analysis when available from UI testing
- Request **correlation** with specific events or timestamps
- Ask for **root cause identification** not just symptom reporting

### For validator:

- Use after fixes are applied to confirm functionality
- Request **regression checking** for related features
- Ask for **end-to-end validation** when multiple layers were affected

### For ui-tester:

- Use when **visual evidence** is needed for UI/UX problems
- Request **comprehensive testing** with screenshots and accessibility audit
- Ask for **responsive validation** across multiple viewports
- Focus on **user experience** rather than technical diagnostics
- **Screenshots available**: Agent will provide filenames of generated screenshots in `.playwright-mcp/`

## CRITICAL EXECUTION RULES

1. **INVESTIGATE FIRST** - Always gather information before implementing fixes
2. **CORRELATE DATA** - Use timestamps and specific details to connect frontend/backend issues
3. **VALIDATE THOROUGHLY** - Confirm fixes work and don't break other functionality
4. **ITERATE WHEN NEEDED** - Re-invoke subagents if initial findings are unclear
5. **DOCUMENT CHANGES** - Clearly explain what was fixed and why

**REMEMBER**: You orchestrate and decide - subagents execute and report back to you.

## See Also

- **orquestador**: General subagent delegation patterns and available agents inventory
- **base-conocimiento**: For architectural context when debugging domain-specific issues
