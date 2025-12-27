# Agent Consolidation Plan

## Overview

Consolidate 5 existing agents into 3 agents + 3 skills for better organization and reduced duplication.

**Current Structure (5 agents, ~2250 lines total):**
- `code-reviewer.md` - 565 lines
- `daisyui-expert.md` - 569 lines
- `frontend-expert.md` - 353 lines
- `nextjs-expert.md` - 154 lines
- `supabase-nextjs-expert.md` - 614 lines

**Proposed Structure:**
```
.claude/
├── agents/
│   ├── app-dev.md           # UI, React, Next.js (no MCP)
│   ├── data-dev.md          # Supabase, auth (has MCP)
│   └── code-reviewer.md     # Code review (has MCP)
│
└── skills/
    ├── nextjs-patterns/
    │   └── SKILL.md         # Next.js patterns reference
    ├── daisyui-components/
    │   └── SKILL.md         # DaisyUI + theme reference
    └── design-system/
        └── SKILL.md         # The Puppy Day design specs
```

---

## Consolidation Mapping

### 1. `app-dev.md` (NEW - combines frontend-expert + daisyui-expert + nextjs-expert)

**Source Content:**
- frontend-expert: Design authority, UX flows, visual hierarchy
- daisyui-expert: DaisyUI implementation, component patterns
- nextjs-expert: React/Next.js patterns (non-Supabase)

**Responsibilities:**
- UI/UX design specifications
- React component development
- DaisyUI + Tailwind implementation
- Next.js App Router patterns (pages, layouts, client/server components)
- Framer Motion animations
- Accessibility implementation
- Responsive design

**Key Features:**
- NO MCP tools (pure frontend)
- References skills for detailed patterns
- Can do both design AND implementation (merges the two-step workflow)

**Invocation Triggers:**
- Creating new UI components
- Implementing pages and layouts
- Adding animations/interactions
- Responsive design work
- Accessibility improvements

---

### 2. `data-dev.md` (REFACTORED from supabase-nextjs-expert)

**Source Content:**
- supabase-nextjs-expert: All content (primary source)
- code-reviewer: RLS and security patterns

**Responsibilities:**
- Supabase integration patterns
- Authentication flows (login, signup, session)
- Row Level Security (RLS) policies
- Database queries and migrations
- Realtime subscriptions
- Role-based access control
- Server Actions with database operations

**Key Features:**
- HAS MCP Supabase tools (execute_sql, list_tables, apply_migration, get_advisors)
- Database-first approach
- Security and performance advisors

**Invocation Triggers:**
- Database schema changes
- Authentication implementation
- RLS policy creation
- API routes with database access
- Realtime features

---

### 3. `code-reviewer.md` (REFINED - keep most content)

**Source Content:**
- code-reviewer: Keep checklist, severity system, output format
- Add references to new skills for design system compliance

**Responsibilities:**
- Code review with severity ratings
- Security vulnerability detection
- Performance bottleneck identification
- Architecture review
- Design system compliance checks

**Key Features:**
- HAS MCP tools for security/performance advisors
- References skills for design system validation
- Structured output format with severity levels

**Invocation Triggers:**
- After completing feature implementations
- Before creating pull requests
- After critical bug fixes
- Reviewing database migrations

---

## Skills Structure

### 1. `nextjs-patterns/SKILL.md`

**Content from:** nextjs-expert.md + code-reviewer.md (Next.js sections)

**Includes:**
- App Router patterns (file-based routing, layouts, error/loading states)
- Server vs Client Components decision tree
- Server Actions patterns
- Data fetching strategies (SSR, SSG, ISR, Streaming)
- Middleware patterns
- Performance optimization (code splitting, image optimization)
- Cache configuration (revalidate, force-cache, revalidatePath)
- Common anti-patterns to avoid

**Reference Usage:**
```
@skill nextjs-patterns
```

---

### 2. `daisyui-components/SKILL.md`

**Content from:** daisyui-expert.md

**Includes:**
- DaisyUI component reference (buttons, cards, modals, forms, etc.)
- The Puppy Day theme configuration (tailwind.config.js)
- Color palette mapping to DaisyUI semantic classes
- Component modifier reference (sizes, variants, states)
- Tailwind utility guidelines
- Component implementation examples
- Micro-interaction patterns (hover, loading, transitions)

**Reference Usage:**
```
@skill daisyui-components
```

---

### 3. `design-system/SKILL.md`

**Content from:** frontend-expert.md

**Includes:**
- Core design principles ("Clean & Elegant Professional")
- Color palette with hex values
- Typography scale (Display → Caption)
- Spacing system (XXS → 3XL)
- Shadow, border, and corner radius specs
- Visual anti-patterns to avoid
- Dog grooming theme elements
- Tone of voice in UI copy
- Accessibility requirements (WCAG 2.1 AA)

**Reference Usage:**
```
@skill design-system
```

---

## Implementation Tasks

### Phase 1: Create Skills (extract reference content)
- [ ] Create `.claude/skills/nextjs-patterns/SKILL.md`
- [ ] Create `.claude/skills/daisyui-components/SKILL.md`
- [ ] Create `.claude/skills/design-system/SKILL.md`

### Phase 2: Create New Agents
- [ ] Create `.claude/agents/app-dev.md` (combined frontend)
- [ ] Create `.claude/agents/data-dev.md` (refined Supabase)
- [ ] Update `.claude/agents/code-reviewer.md` (add skill references)

### Phase 3: Cleanup
- [ ] Delete `.claude/agents/daisyui-expert.md`
- [ ] Delete `.claude/agents/frontend-expert.md`
- [ ] Delete `.claude/agents/nextjs-expert.md`
- [ ] Delete `.claude/agents/supabase-nextjs-expert.md`

### Phase 4: Update References
- [ ] Update `CLAUDE.md` (Available Agents section)
- [ ] Update any workflow documentation

---

## Benefits

1. **Reduced Agent Count**: 5 → 3 agents (simpler to invoke)
2. **Clearer Responsibilities**: Frontend vs Backend vs Review
3. **DRY Principle**: Skills contain reference material, agents contain behavior
4. **Faster Invocation**: Skills can be loaded on-demand
5. **Better Maintenance**: Update design system in one place
6. **MCP Tool Clarity**: Only data-dev and code-reviewer have MCP

---

## Migration Notes

- The two-step workflow (frontend-expert → daisyui-expert) is now ONE agent (app-dev)
- Design specs can still be created in `.claude/design/` if needed
- Skills are reference material, not agents (loaded via @skill)
- code-reviewer remains the same conceptually, just references skills

