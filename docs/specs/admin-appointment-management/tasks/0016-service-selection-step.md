# Task 0016: Service Selection Step

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0013, 0015
**Estimated Effort**: 3 hours

## Objective

Create service and addon selection UI with real-time pricing breakdown.

## Requirements

- REQ-4.1-4.6: Service selection
- REQ-5.1-5.6: Addon selection

## Implementation Details

### Files to Create

**`src/components/admin/appointments/steps/ServiceSelectionStep.tsx`**

**Note**: Use existing APIs:
- `GET /api/admin/services` - Services with size-based prices
- `GET /api/admin/addons` - All addons

Implement:
- Services display with radio selection
- Size-based prices shown (based on selected pet)
- Addons display with checkbox selection
- Real-time running total with breakdown
- Disabled state for services without pricing

### Pricing Display

```
Service: Premium Grooming (Medium)    $95.00
Add-ons:
  ✓ Teeth Brushing                    $10.00
  ✓ Pawdicure                          $15.00
                              ─────────────
Subtotal:                             $120.00
```

## Acceptance Criteria

- [ ] Prices displayed based on selected pet size
- [ ] Running total updates as selections change
- [ ] Addons cumulative total correct
- [ ] Missing pricing shows disabled state with message
- [ ] Service duration shown
- [ ] Clean & Elegant Professional design

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-4, 5)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 3.1.3)
- **Existing APIs**: /api/admin/services, /api/admin/addons
- **Existing Utilities**: src/lib/booking/pricing.ts
