# Task 0122: Create template update API

## Description
Create API endpoint to update notification templates with validation.

## Acceptance Criteria
- [x] Create PUT `/api/admin/notifications/templates/:id`
- [x] Accept subject_template, html_template, text_template, variables, is_active, change_reason
- [x] Validate all required variables are present in template
- [x] Return error if invalid variables detected
- [x] Update updated_by and updated_at
- [x] Version history is saved automatically via trigger
- [x] Require admin authentication
- [x] Write unit tests for success and validation failure

## References
- Req 11.3, Req 11.4, Req 11.5, Req 11.6, Req 11.8, Req 13.8

## Complexity
Medium

## Category
Admin Template Management APIs

## Status
✅ **COMPLETED** - 2025-01-15

