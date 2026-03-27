---
description: End-to-end feature development with codebase discovery, Kiro SDD specs, and agent delegation
argument-hint: Feature description (e.g. "loyalty rewards dashboard for customers")
---

# New Feature Orchestrator

You are orchestrating a new feature for Puppy Day through 6 phases, each requiring user approval before advancing.

Feature request: $ARGUMENTS

---

## Phase 1: Discovery & Codebase Analysis

**Goal**: Understand the codebase context and gather all requirements in one pass

**Actions** (run in parallel):
1. Read `docs/architecture/ARCHITECTURE.md` for schema, RLS policies, and existing patterns
2. Read `CLAUDE.md` for current phase status and conventions
3. Use Serena `get_symbols_overview` on directories related to the feature request
4. Use Serena `find_symbol` for specific entities mentioned in the request
5. Grep/Glob for existing components, hooks, utilities, and routes that overlap with the feature

**Output to user**:
- Summary of findings: related tables, existing components, reusable patterns, integration points
- Organized list of clarifying questions covering: scope boundaries, edge cases, error handling, design preferences, backward compatibility, performance needs
- If user says "whatever you think is best", state your recommendation and get explicit confirmation

**Wait for user answers before proceeding.**

---

## Phase 2: Requirements

**Goal**: Generate structured requirements using Kiro SDD

**Actions**:
1. Launch `@kiro-requirement` agent with this context:
   - The original feature request
   - Discovery findings: related DB tables, existing components/routes, reusable patterns
   - User's answers to clarifying questions
   - Output location: `docs/specs/{feature-name}/requirements.md`

**Present requirements summary to user. Wait for approval.**

---

## Phase 3: Design

**Goal**: Create comprehensive technical design informed by project patterns

**Actions**:
1. Invoke relevant skills in parallel based on feature type:
   - `/design-system` — if UI work involved
   - `/component-patterns` — if new components needed
   - `/api-patterns` — if API routes needed
   - `/supabase-patterns` — if database work needed
   - `/state-patterns` — if new Zustand stores needed
2. Launch `@kiro-design` agent with:
   - Requirements from Phase 2
   - Discovery context from Phase 1 (tables, components, routes)
   - Skill outputs from step 1
   - Reference specific existing components/routes as implementation models
   - Output location: `docs/specs/{feature-name}/design.md`

**Present design summary to user. Wait for approval.**

---

## Phase 4: Planning

**Goal**: Break design into categorized implementation tasks

**Actions**:
1. Launch `@kiro-plan` agent with:
   - Design from Phase 3
   - Requirements from Phase 2
   - Categorize each task by agent: `app-dev` (UI), `data-dev` (DB/API), or both
   - Output location: `docs/specs/{feature-name}/tasks.md`

**Present task breakdown to user. Wait for approval.**

---

## Phase 5: Implementation

**Goal**: Execute the approved plan

**DO NOT START WITHOUT EXPLICIT USER APPROVAL.**

**Actions**:
1. Launch `@kiro-executor` agent with:
   - Spec directory: `docs/specs/{feature-name}/`
   - Starting task: Task 1 (or user-specified)
   - The executor handles agent delegation, pattern enforcement, and git workflow

---

## Phase 6: Review & Documentation

**Goal**: Quality review and architecture doc updates

**Actions**:
1. Run `git diff --name-only main` to collect all changed files
2. Launch **1** `@code-reviewer` agent on all changed files
3. Present findings to user — ask what to fix now vs. later
4. After fixes, update architecture docs as needed:
   - DB/schema changes → `docs/architecture/ARCHITECTURE.md` (Database Schema section)
   - Route changes → `docs/architecture/routes/`
   - Component changes → `docs/architecture/components/`
   - Service changes → `docs/architecture/services/`
5. Summarize: what was built, files changed, key decisions, suggested next steps
