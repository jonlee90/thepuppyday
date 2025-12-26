---
allowed-tools: all
description: "Implement epic specifications with automated review and testing"
---

# /kc:impl - Implement task specifications with automated review and testing

## Purpose

Implement task specifications with automated review and testing.

## Usage

```
/kc:impl [task-number]
```

## Arguments

- `task-number` - task number (e.g., 0001, 0002, etc.).

## Execution

**Primary Implementation Agent**: @agent-kiro-executor
The kiro-executor agent is the primary agent for implementing tasks from Kiro specs. It specializes in translating documented specifications into precise, working code with strict adherence to requirements.

**Specialized Agent Delegation**:
When @agent-kiro-executor encounters specific types of work, it MUST delegate to the appropriate specialized agent:

| Work Type | Primary Agent | Purpose |
|-----------|---------------|---------|
| **Frontend/UI Components** | @agent-frontend-expert → @agent-daisyui-expert | First get design specs from frontend-expert, then implement with daisyui-expert |
| **Database/Supabase** | @agent-supabase-nextjs-expert | All database operations, migrations, RLS policies, and Supabase integrations (always use MCP Supabase tools) |
| **Next.js Specifics** | @agent-nextjs-expert | App Router patterns, Server/Client Components, API routes, middleware |
| **Code Review** | @agent-code-reviewer | Review architecture, security, and best practices |
| **General Tasks** | @agent-general-purpose | Research, exploration, and other non-specialized work |

**Agent Workflow for Frontend Work**:
```
1. @agent-frontend-expert → Creates design specification (.claude/design/*.md)
2. @agent-daisyui-expert → Implements the design using DaisyUI + Tailwind
```

**Implementation Steps:**

1. **Read Task**: Find the task file under `./docs/specs/{feature-name}/tasks/`. Read it carefully.

2. **Plan**: Think hard to form a detailed implementation plan. Identify which specialized agents are needed.

3. **Implement**:
   - Create a new git branch for the implementation
   - **Delegate to specialized agents** based on work type (see table above)
   - For frontend: Get design from @agent-frontend-expert FIRST, then implement with @agent-daisyui-expert
   - For database: Use @agent-supabase-nextjs-expert with MCP Supabase tools
   - For Next.js patterns: Use @agent-nextjs-expert
   - Write sufficient unit/integration tests (Vitest/Jest)
   - Ensure design system adherence (Clean & Elegant Professional)

4. **Review**:
   - Review the code with @agent-code-reviewer
   - If the code is not working as expected, fix and repeat

5. **Test & Verify**:
   - For Next.js: Run `npm run dev` and verify app compiles without errors
   - Run `npm run lint` to check for linting issues
   - Run `npm test` to execute unit tests
   - Manually test functionality in browser
   - Check mobile responsiveness

6. **Commit**: Once working as expected, commit the code to the repo with descriptive message

7. **PR**: (optional) If the code has a github repo, push and create PR using `gh pr create`

8. **Update Task**: Update the task file to reflect completion status