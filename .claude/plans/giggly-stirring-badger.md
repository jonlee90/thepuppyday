# Plan: Upgrade `/kc:impl` Command

## Context
The current `impl.md` (55 lines) is a thin stub — it describes the workflow conceptually but doesn't automate anything. It delegates to `@agent-kiro-executor` without giving it enough context about spec structure, task parsing, progress tracking, or the actual delegation logic. Goal: rewrite as a self-contained, actionable command that orchestrates implementation end-to-end.

## Files to Modify

1. **`.claude/commands/kc/impl.md`** — full rewrite

## Key Improvements

### 1. Spec-Aware Task Resolution
- Auto-detect feature directory from task number (search all `docs/specs/*/tasks*.md` for the task ID)
- Handle both single `tasks.md` and phased `tasks-phase-{label}.md` patterns
- Parse task metadata: agent delegation, files, references, acceptance criteria

### 2. Full Context Loading
Before delegating, load the full spec context:
- `requirements.md` — business rules (WHY)
- `design.md` — architecture decisions (HOW)
- `tasks.md` — the specific task + surrounding tasks for context

### 3. Smarter Delegation
- Auto-detect work type from task content (UI keywords → app-dev, DB/API keywords → data-dev, both → sequential)
- Pass task-specific context to agents (not just "implement task X")
- Include relevant file paths, REQ-N references, and design section references

### 4. Post-Implementation Pipeline
- Auto-invoke `@agent-code-reviewer` after implementation
- Mark task complete with date in tasks.md
- Update progress counter
- Git: branch creation, conventional commit with task ref

### 5. Concise & Direct
- ~80-100 lines (up from 55, but now actually useful)
- Clear step-by-step execution, not conceptual description
- No redundant sections (remove "When to Use", skill references table)

## Structure

```
Frontmatter (allowed-tools: all)
Purpose (1 sentence)
Usage + Arguments
Execution Steps:
  1. Resolve — find task in specs, parse metadata
  2. Context — load requirements.md + design.md + task details
  3. Branch — create feat/{feature}-task-{number}
  4. Delegate — auto-detect agent, pass full context
  5. Review — invoke @agent-code-reviewer
  6. Complete — mark task done, update progress, commit
Error Handling (task not found, already complete, missing specs)
```

## Verification
- Confirm command handles both single and phased task files
- Confirm auto-detection of work type (frontend/backend/both)
- Confirm full spec context is loaded before delegation
- Confirm post-implementation pipeline (review → mark complete → commit)
- Confirm error handling for missing/completed tasks
