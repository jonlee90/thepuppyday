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

Based on the task file, find out what agents are needed to implement the task:
- **Supabase/Database work**: Use @agent-supabase-nextjs-expert (always use /mcp supabase commands)
- **Frontend/UI components**: Use @agent-frontend-expert and @agent-daisyui-expert
- **Next.js specific**: Use @agent-nextjs-expert
- **Other tasks**: Use @general-purpose agent

Code reviewer shall use @agent-code-reviewer.

**Implementation Steps:**

1. **Read Task**: Find the task file under `./docs/specs/{feature-name}/tasks/`. Read it carefully.

2. **Plan**: Think hard to form a detailed implementation plan.

3. **Implement**:
   - Create a new git branch for the implementation
   - Implement based on the plan using the right coding agents
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