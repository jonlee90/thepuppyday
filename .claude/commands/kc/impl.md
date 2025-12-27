---
allowed-tools: all
description: "Implement task specifications with automated review and testing"
---

# /impl - Implement Task Specifications

## Purpose

Implement task specifications using specialized agents with automated review and testing.

## Usage

```
/impl [task-number]
```

## Arguments

- `task-number` - Task number (e.g., 0001, 0002, etc.)

## Execution

**Orchestrator**: @agent-kiro-executor

The kiro-executor agent orchestrates task implementation by:
1. Reading and analyzing the task specification
2. Delegating to specialized agents based on work type
3. Coordinating handoffs between agents
4. Managing git workflow and review

**Agent Delegation**:

| Work Type | Agent | Trigger |
|-----------|-------|---------|
| UI components, pages, forms, styling, animations | @agent-app-dev | Any frontend/React work |
| Supabase, RLS, migrations, auth, integrations | @agent-data-dev | Any database/API work |
| Security, performance, design system audit | @agent-code-reviewer | After implementation |

**Skill References** (agents read as needed):
- `.claude/skills/design-system/SKILL.md` - Brand colors, typography, spacing
- `.claude/skills/daisyui-components/SKILL.md` - Component patterns, theme config
- `.claude/skills/nextjs-patterns/SKILL.md` - App Router, data fetching patterns

## Workflow

1. **Read**: Load task from `./docs/specs/{feature-name}/tasks/{task-number}.md`
2. **Plan**: Analyze requirements, identify work types, determine agent delegation
3. **Branch**: Create `feat/{feature-name}-{task-number}`
4. **Implement**: Delegate to @agent-app-dev and/or @agent-data-dev
5. **Review**: Request @agent-code-reviewer audit
6. **Test**: `npm run dev`, `npm run lint`, `npm test`, manual browser check
7. **Commit**: Conventional commit format
8. **PR**: Optional `gh pr create`
9. **Update**: Mark task complete in spec file