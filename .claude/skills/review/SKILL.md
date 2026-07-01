---
name: review
description: Review code changes along two axes — Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the user asked for?). Use AFTER every non-trivial implementation to catch bugs before they compound. Also use when the user says "review", "check this", or "did I miss anything".
---

# Two-Axis Code Review

Review the changes along two independent axes:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement what the user asked for?

Both axes run independently so one doesn't mask the other.

## Career War Context

For this project, the review checks:

### Standards Axis
- **shared/ must not import external dependencies** — stay pure TypeScript
- **Game logic only on server** — client code must not calculate damage, HP, or dice outcomes
- **All socket events use Ack pattern** — `{ ok: true, ...data } | { ok: false, error: string }`
- **State sync is full Room object** — via `gameStateUpdated`, not partial patches
- **Cocos scripts use EventTarget for state** — not polling in `update()`
- **shared/ imports use `.js` extension** — ES Module compatibility
- **No forbidden file modifications** — per the task brief boundaries

### Spec Axis
- Does the code do what the user asked?
- Is there scope creep (extra features not requested)?
- Are there missing requirements?
- Does the implementation actually work for the described use case?

## Process

### 1. Identify what changed

Use `git diff` to see changed files. If there's a task brief (`docs/agent-state/TASK_BRIEF.md`), read it to understand the scope.

### 2. Standards review

Check every changed file against the project standards:
- File location correct? (UI in client, logic in shared, etc.)
- File boundary violation? (UI task touching engine.ts, etc.)
- Coding conventions followed?
- Dependencies clean?

### 3. Spec review

Compare the changes against what was asked:
- Every requirement met?
- Nothing extra added?
- Edge cases handled?

### 4. Report

One section per axis. List findings with file locations. Worst issues first.

## Report Format

```
## Standards
- [PASS/FAIL] finding description (file:line)
- ...

## Spec
- [PASS/FAIL] finding description (file:line)
- ...

## Summary
- Standards: N findings (M pass, K fail)
- Spec: N findings (M pass, K fail)
- Worst issue: [description]
```
