# Shared Email Layout with Mood System - Requirements

> **Feature**: Shared Email Layout with Mood System
> **Status**: Approved
> **Created**: 2026-03-13
> **Last Updated**: 2026-03-13
> **Depends On**: Phase 8 (Notification System), notification-templates spec

---

## 1. Background

The Puppy Day's notification system has two template layers:
1. **DB-stored templates** using Handlebars (`{{variable}}`) rendered at send time
2. **TypeScript template functions** in `email-templates.ts` using `wrapEmailContent()` + helpers from `email-base.ts`

Both layers use `email-base.html` as the outer HTML shell. The current shell is plain text with minimal branding. All 13 email templates produce visually identical layouts regardless of emotional context (celebration vs. warning vs. urgency).

## 2. Problem Statement

- The email header is a plain text "The Puppy Day" with no brand icon or visual identity
- All emails look identical regardless of emotional context (booking confirmation vs. payment failure)
- CTA buttons use charcoal (#434E54) which blends with body text and has low click-through appeal
- Time comparison layouts (reschedule emails) use side-by-side columns that break on mobile
- The footer unsubscribe link has poor contrast (#9CA3AF on white)
- No pet personalization beyond text mentions

## 3. Requirements

### REQ-MOOD-1: Mood Type System
**When** an email template is rendered, **the system shall** support a `mood` parameter that controls the visual appearance of the mood banner, with the following mood types:
- `celebration` (gold-tinted background #FFF8F0, gold CTA)
- `reminder` (blue-tinted background #F0F7FF, charcoal CTA)
- `urgent` (orange-tinted background #FFF4E6, gold CTA)
- `info` (neutral background #F8FAFB, charcoal CTA)
- `warning` (red-tinted background #FEF2F2, red CTA)
- `success` (green-tinted background #F0FDF4, no CTA)

### REQ-MOOD-2: Email Base HTML Redesign
**The system shall** update `email-base.html` to include:
- A charcoal (#434E54) header background with inline SVG paw print icon
- "The Puppy Day" in Georgia serif cream-colored text
- "Professional Dog Grooming" subtitle in gold (#D4A574)
- Gold gradient strip below the header
- A `{{MOOD_BANNER}}` placeholder between header and content
- Gold gradient divider in footer (replacing hard border)
- Improved unsubscribe link contrast (#6B7280 instead of #9CA3AF)

### REQ-MOOD-3: Mood Banner Generation
**When** `wrapEmailContent()` is called with a `mood` and optional `moodTitle`, **the system shall** generate a colored banner matching the mood's background color and insert it at the `{{MOOD_BANNER}}` position. If no mood is specified, the banner placeholder shall be removed (empty string).

### REQ-MOOD-4: New Email Components
**The system shall** add the following helper components to `email-base.ts`:
- `createPetHero(petName, context)` - centered dog emoji + pet name in Georgia serif + context subtitle
- `createPrimaryCTA(text, url)` - gold pill button (#D4A574), 50px border-radius, shadow
- `createSecondaryCTA(text, url)` - outlined pill with gold border
- `createDangerCTA(text, url)` - red (#DC2626) pill button
- `createTimeComparison(oldDate, oldTime, newDate, newTime)` - vertical stacked layout (mobile-safe)
- `createDivider()` - gold gradient horizontal rule
- `createTip(text)` - subtle info callout box

### REQ-MOOD-5: Template Updates
**The system shall** update all 13 existing email template functions to use the mood system and new components:
| Template | Mood | Key Changes |
|---|---|---|
| Booking Confirmation | `celebration` | Pet hero, gold CTA |
| Report Card | `celebration` | Photos first, pet hero |
| Retention Reminder | `reminder` | Pet hero, tip component |
| Payment Failed | `warning` | Danger CTA (red) |
| Payment Reminder | `info` | No action CTA |
| Payment Success | `success` | Success banner, no CTA |
| Payment Final Notice | `warning` | Red danger CTA, urgency box |
| Appointment Reminder | `reminder` | Pet hero, arrival tip |
| Appointment Cancelled | `info` | Pet hero, gold rebook CTA |
| Appointment Rescheduled | `info` | `createTimeComparison()` |
| Review Request | `celebration` | Pet hero, gold review CTA |
| Waitlist Added | `info` | Queue position badge |
| Waitlist Available | `urgent` | Urgency box, gold claim CTA |

### REQ-MOOD-6: Button Style Update
**The system shall** update `createButton()` to use gold pill style (border-radius: 50px, gold background) while maintaining backward compatibility by keeping old function names as aliases.

### REQ-MOOD-7: Backward Compatibility
**The system shall** maintain backward compatibility:
- Existing function signatures must continue to work
- Old button helper names must remain as aliases
- `wrapEmailContent()` must work with no mood parameter (existing behavior)
- DB-stored Handlebars templates are NOT modified by this feature

## 4. Scope

### In Scope
- `email-base.html` redesign (header, mood banner placeholder, footer)
- `email-base.ts` new types, mood logic, and component functions
- All 13 TypeScript template functions in `email-templates.ts`
- Button style updates with backward-compatible aliases

### Out of Scope
- SMS templates (no visual changes)
- Admin UI changes
- DB-stored Handlebars template content
- Notification service logic (`sendNotification()`)
- New notification types or triggers
