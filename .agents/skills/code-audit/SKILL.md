---
name: code-audit
description: Scans files or directories for pattern violations and reports issues with fixes. Manual invocation only — use when you want to audit existing code for consistency.
argument-hint: "[path] [--fix]"
context: fork
agent: general-purpose
allowed-tools: Read, Grep, Glob, Bash, Edit
metadata:
  author: thepuppyday
  version: "1.0.0"
---

# Code Audit

Scans target files/directories against The Puppy Day's coding standards and reports violations. Optionally auto-fixes issues.

## Usage

```
/code-audit src/app/api/admin/services/         # Audit a directory
/code-audit src/components/admin/customers/      # Audit components
/code-audit src/app/api/admin/addons/[id]/route.ts  # Audit a single file
/code-audit src/app/api/ --fix                   # Audit + auto-fix
```

## Process

### Step 1: Identify Target Files

Read all `.ts` and `.tsx` files in `$0` (the target path). If `$0` is a file, audit just that file.

### Step 2: Classify Each File

Determine the file type:
- **API Route**: Files matching `src/app/api/**/route.ts`
- **Component**: Files matching `src/components/**/*.tsx`
- **Hook**: Files matching `src/hooks/*.ts`
- **Store**: Files matching `src/stores/*.ts`
- **Page**: Files matching `src/app/**/page.tsx`

### Step 3: Check Against Patterns

For each file, check the applicable rules:

#### API Route Checks
1. **Auth pattern**: Admin routes must use two-client pattern (`authSupabase` + `supabase` service role)
2. **Variable naming**: Must use `authSupabase`/`supabase` (not `serviceClient`)
3. **Error format**: All errors must return `{ error: string }` with correct status codes
4. **Response format**: Lists must return `{ data: [] }` (not `{ services: [] }`)
5. **Zod validation**: POST/PUT/PATCH handlers must use Zod for body validation
6. **UUID validation**: Routes with `[id]` params must call `isValidUUID()`
7. **Console.error context**: Catch blocks must have `console.error('[Context]', error)`
8. **File header**: Must have JSDoc comment listing methods and paths
9. **Dynamic export**: Must have `export const dynamic = 'force-dynamic'`

#### Component Checks
1. **Props naming**: Interface must be `ComponentNameProps` (not bare `Props`)
2. **Loading state naming**: Must use `isLoading`/`isSaving` (not `loading`/`submitting`)
3. **Toast on mutations**: All fetch POST/PUT/PATCH/DELETE must have toast.success and toast.error
4. **AdminButton usage**: Admin components must use `AdminButton` for buttons with loading state
5. **aria-busy**: Loading buttons must have `aria-busy` attribute

#### Hook Checks
1. **Return type**: Must return object with `isLoading` (not `loading`)
2. **Error type**: Must use `Error | null` (not `string | null`)
3. **Named export**: Must use named export with `use` prefix

#### Store Checks
1. **Separate interfaces**: Must have separate `State` and `Actions` interfaces
2. **Initial state**: Must have extractable initial state for reset
3. **Persist config**: Must have `name` and `version` if using persist
4. **Action naming**: Must follow `setX`/`resetX`/`fetchX` convention

### Step 4: Generate Report

Output a structured report:

```
## Audit Report: [target path]

**Files scanned:** X
**Issues found:** Y (Z auto-fixable)

### [file-path]:[line-number] — [SEVERITY] [rule-name]
**Current:** [what exists]
**Expected:** [what should be]
**Fix:** [specific change needed]

### [file-path]:[line-number] — [SEVERITY] [rule-name]
...

### Summary
| Category | Issues | Auto-fixable |
|----------|--------|-------------|
| Auth pattern | X | Y |
| Error format | X | Y |
| Response format | X | Y |
| ...
```

Severity levels:
- **CRITICAL**: Security issue or will cause bugs (wrong auth pattern, missing validation)
- **MAJOR**: Inconsistency that affects maintainability (wrong response format, missing Zod)
- **MINOR**: Style inconsistency (naming conventions, missing comments)

### Step 5: Auto-Fix (if --fix flag)

If `$1` is `--fix`:
1. Apply all auto-fixable changes using the Edit tool
2. Show a diff summary of what was changed
3. Do NOT fix issues that require structural changes (e.g., migrating a whole form to React Hook Form)
4. DO fix: variable renames, response format changes, adding missing `export const dynamic`, adding `isValidUUID` checks, fixing error response format

## Important Notes

- Read the skill files for pattern definitions before auditing:
  - `.agents/skills/api-patterns/SKILL.md`
  - `.agents/skills/component-patterns/SKILL.md`
  - `.agents/skills/form-patterns/SKILL.md`
  - `.agents/skills/supabase-patterns/SKILL.md`
  - `.agents/skills/state-patterns/SKILL.md`
- Be specific: always include file path and line number
- Group issues by file, then by severity
- For `--fix` mode, make changes incrementally and verify each one
