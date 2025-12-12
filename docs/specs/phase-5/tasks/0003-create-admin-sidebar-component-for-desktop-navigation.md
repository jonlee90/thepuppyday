# Task 0003: Create AdminSidebar component for desktop navigation

**Group**: Foundation & Auth (Week 1)

## Objective
Build collapsible sidebar navigation for desktop

## Files to create/modify
- `src/components/admin/AdminSidebar.tsx` - Desktop sidebar with nav links

## Requirements covered
- REQ-24.1, REQ-24.2, REQ-24.4, REQ-24.5, REQ-24.8, REQ-24.9, REQ-24.10

## Acceptance criteria
- [x] Displays navigation links grouped by section: Overview (Dashboard), Operations (Appointments, Customers), Configuration (Services, Add-ons, Gallery)
- [x] Expanded by default showing icons and labels
- [x] Active route highlighted with accent background
- [x] Owner-only sections (Services, Add-ons) hidden from staff
- [x] Hover tooltip on collapsed nav items
- [x] Logout link at bottom of sidebar
- [x] Smooth collapse/expand animation

## Implementation Notes
- Implemented in `src/components/admin/AdminSidebar.tsx` as Client Component
- Uses lucide-react icons for navigation
- Three sections: Overview, Operations, Configuration
- Role-based filtering: owner-only items hidden from staff (role='groomer')
- Collapse state persisted in admin-store (Zustand)
- Active route detection with pathname matching
- Completed: 2025-12-11
