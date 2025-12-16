# Task 0122: Create template update API

## Description
Create API endpoint to update notification templates with validation.

## Acceptance Criteria
- [ ] Create PUT `/api/admin/notifications/templates/:id`
- [ ] Accept subject_template, html_template, text_template, variables, is_active, change_reason
- [ ] Validate all required variables are present in template
- [ ] Return error if invalid variables detected
- [ ] Update updated_by and updated_at
- [ ] Version history is saved automatically via trigger
- [ ] Require admin authentication
- [ ] Write unit tests for success and validation failure

## References
- Req 11.3, Req 11.4, Req 11.5, Req 11.6, Req 11.8, Req 13.8

## Complexity
Medium

## Category
Admin Template Management APIs
