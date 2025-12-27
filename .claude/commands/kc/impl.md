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

| Work Type | Agent | Purpose |
|-----------|-------|---------|
| **Frontend/UI Components** | @agent-app-dev | UI/UX design and implementation with DaisyUI + Tailwind (uses `/frontend-design` plugin first) |
| **Database/Supabase** | @agent-data-dev | All database operations, migrations, RLS policies, auth, and Supabase integrations (has MCP tools) |
| **Code Review** | @agent-code-reviewer | Review architecture, security, performance, and design system compliance (has MCP tools) |
| **General Tasks** | @agent-general-purpose | Research, exploration, and other non-specialized work |

**Available Skills** (reference for detailed specs):
- `@skill design-system` - The Puppy Day colors, typography, spacing
- `@skill daisyui-components` - DaisyUI component patterns and theme config
- `@skill nextjs-patterns` - App Router, data fetching, Server/Client components

**Implementation Steps:**

1. **Read Task**: Find the task file under `./docs/specs/{feature-name}/tasks/`. Read it carefully.

2. **Plan**: Think hard to form a detailed implementation plan. Identify which specialized agents are needed.

3. **Implement**:
   - Create a new git branch for the implementation
   - **Delegate to specialized agents** based on work type (see table above)
   - For frontend: Use @agent-app-dev (it handles both design and implementation)
   - For database: Use @agent-data-dev with MCP Supabase tools
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