# Style & Conventions

## File Naming
- Components: PascalCase (e.g. `IconBox.tsx`, `MobileFAB.tsx`)
- No kebab-case for component files

## Design System
- Warm cream (#F8EEE5) background, charcoal (#434E54) primary
- Soft shadows (`shadow-sm/md/lg`), rounded corners (`rounded-lg/xl`)
- Icons: Lucide React. No bold borders or chunky elements.
- Dog-themed UI: paw prints, bone icons, bouncy animations

## Code Patterns
- Admin API routes: two-client pattern (auth with `createServerSupabaseClient`, query with `createServiceRoleClient`)
- Toast on every DB mutation: `toast.success()` / `toast.error()` from `@/hooks/use-toast`
- Never use `<dialog>` element in modals — use `<div role="dialog" aria-modal="true">`
- Never use `input-sm`/`input-xs` on time/date inputs (clips AM/PM)
- Brand name: "Puppy Day" (not "The Puppy Day") in user-facing copy

## Modals
- `AnimatePresence` + `fixed inset-0`, Framer Motion scale+fade
- `createFocusTrap`, `bg-white rounded-2xl shadow-2xl`
- Warm icon header `bg-[#EAE0D5]`, footer `bg-[#EAE0D5]/30`
