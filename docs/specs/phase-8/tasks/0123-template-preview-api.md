# Task 0123: Create template preview API

## Description
Create API endpoint to preview rendered templates with sample data.

## Acceptance Criteria
- [ ] Create POST `/api/admin/notifications/templates/:id/preview`
- [ ] Accept sample_data object with variable values
- [ ] Render template using template engine
- [ ] Return rendered subject, html, text
- [ ] Include character_count and segment_count for SMS
- [ ] Require admin authentication
- [ ] Write unit tests

## References
- Req 11.7

## Complexity
Small

## Category
Admin Template Management APIs
