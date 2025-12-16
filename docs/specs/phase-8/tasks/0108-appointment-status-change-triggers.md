# Task 0108: Implement appointment status change triggers

## Description
Add notification triggers for appointment status changes (Checked In and Ready).

## Acceptance Criteria
- [ ] Create function to send status notification on "Checked In"
- [ ] Create function to send status notification on "Ready"
- [ ] Do NOT send notification on "Completed" (report card handles this)
- [ ] Implement retry once after 30 seconds on failure
- [ ] Support manual trigger from admin (bypass automatic rules)
- [ ] Integrate into appointment status update API
- [ ] Write integration tests for each status change

## References
- Req 6.1, Req 6.2, Req 6.3, Req 6.4, Req 6.5, Req 6.6, Req 6.7

## Complexity
Medium

## Category
Notification Triggers
