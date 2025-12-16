# Admin Notification Template APIs - Quick Reference

## Base URL
`/api/admin/notifications/templates`

## Authentication
All endpoints require admin authentication via `Authorization` header or session cookies.

---

## 1. List Templates

**Endpoint**: `GET /api/admin/notifications/templates`

**Query Parameters**:
- `type` (optional): Filter by notification type
- `trigger_event` (optional): Filter by trigger event
- `active_only` (optional): Boolean, show only active templates

**Example Request**:
```bash
curl -X GET "https://api.thepuppyday.com/api/admin/notifications/templates?active_only=true" \
  -H "Authorization: Bearer {token}"
```

**Example Response**:
```json
{
  "templates": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Booking Confirmation Email",
      "description": "Sent after customer books an appointment",
      "type": "booking_confirmation",
      "trigger_event": "appointment_created",
      "channel": "email",
      "is_active": true,
      "version": 3,
      "variables": ["customer_name", "appointment_date", "pet_name"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 2. Get Template Detail

**Endpoint**: `GET /api/admin/notifications/templates/{id}`

**Example Request**:
```bash
curl -X GET "https://api.thepuppyday.com/api/admin/notifications/templates/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer {token}"
```

**Example Response**:
```json
{
  "template": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Booking Confirmation Email",
    "description": "Sent after customer books an appointment",
    "type": "booking_confirmation",
    "trigger_event": "appointment_created",
    "channel": "email",
    "subject_template": "Booking Confirmed - {{appointment_date}} at {{appointment_time}}",
    "html_template": "<html><body><h1>Hi {{customer_name}}!</h1><p>Your appointment for {{pet_name}} is confirmed...</p></body></html>",
    "text_template": "Hi {{customer_name}}! Your appointment for {{pet_name}} is confirmed for {{appointment_date}} at {{appointment_time}}.",
    "variables": [
      {
        "name": "customer_name",
        "description": "Customer's first name",
        "required": true
      },
      {
        "name": "pet_name",
        "description": "Pet's name",
        "required": true
      },
      {
        "name": "appointment_date",
        "description": "Appointment date (formatted)",
        "required": true
      },
      {
        "name": "appointment_time",
        "description": "Appointment time (formatted)",
        "required": true
      }
    ],
    "is_active": true,
    "version": 3,
    "created_by": "admin-uuid",
    "updated_by": "admin-uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## 3. Update Template

**Endpoint**: `PUT /api/admin/notifications/templates/{id}`

**Request Body**:
```json
{
  "subject_template": "Booking Confirmed - {{appointment_date}}",
  "html_template": "<html>...</html>",
  "text_template": "Hi {{customer_name}}...",
  "variables": [
    {
      "name": "customer_name",
      "description": "Customer's first name",
      "required": true
    }
  ],
  "is_active": true,
  "change_reason": "Updated greeting message"
}
```

**Example Request**:
```bash
curl -X PUT "https://api.thepuppyday.com/api/admin/notifications/templates/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "subject_template": "Booking Confirmed - {{appointment_date}}",
    "change_reason": "Simplified subject line"
  }'
```

**Example Response**:
```json
{
  "template": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "version": 4,
    ...
  }
}
```

**Validation Rules**:
- All required variables must be used in at least one template (subject, html, or text)
- Variables use Handlebars syntax: `{{variable_name}}`
- Business context variables (e.g., `{{business.name}}`) don't need to be declared

---

## 4. Get Template History

**Endpoint**: `GET /api/admin/notifications/templates/{id}/history`

**Example Request**:
```bash
curl -X GET "https://api.thepuppyday.com/api/admin/notifications/templates/550e8400-e29b-41d4-a716-446655440000/history" \
  -H "Authorization: Bearer {token}"
```

**Example Response**:
```json
{
  "history": [
    {
      "id": "history-uuid-1",
      "template_id": "550e8400-e29b-41d4-a716-446655440000",
      "version": 3,
      "name": "Booking Confirmation Email",
      "subject_template": "...",
      "html_template": "...",
      "text_template": "...",
      "variables": [...],
      "changed_by": "admin-uuid",
      "changed_by_email": "admin@thepuppyday.com",
      "changed_by_name": "John Doe",
      "change_reason": "Updated greeting message",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "history-uuid-2",
      "template_id": "550e8400-e29b-41d4-a716-446655440000",
      "version": 2,
      ...
    }
  ]
}
```

---

## 5. Preview Template

**Endpoint**: `POST /api/admin/notifications/templates/{id}/preview`

**Request Body**:
```json
{
  "sample_data": {
    "customer_name": "Sarah",
    "pet_name": "Max",
    "appointment_date": "January 20, 2024",
    "appointment_time": "2:00 PM"
  }
}
```

**Example Request**:
```bash
curl -X POST "https://api.thepuppyday.com/api/admin/notifications/templates/550e8400-e29b-41d4-a716-446655440000/preview" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sample_data": {
      "customer_name": "Sarah",
      "pet_name": "Max",
      "appointment_date": "January 20, 2024",
      "appointment_time": "2:00 PM"
    }
  }'
```

**Example Response**:
```json
{
  "preview": {
    "template_id": "550e8400-e29b-41d4-a716-446655440000",
    "template_name": "Booking Confirmation Email",
    "channel": "email",
    "rendered_subject": "Booking Confirmed - January 20, 2024 at 2:00 PM",
    "rendered_html": "<html><body><h1>Hi Sarah!</h1><p>Your appointment for Max is confirmed...</p></body></html>",
    "rendered_text": "Hi Sarah! Your appointment for Max is confirmed for January 20, 2024 at 2:00 PM.",
    "character_count": 150,
    "segment_count": 1,
    "warnings": []
  }
}
```

**SMS Preview Example**:
```json
{
  "preview": {
    "template_id": "sms-template-uuid",
    "template_name": "Appointment Reminder SMS",
    "channel": "sms",
    "rendered_subject": null,
    "rendered_html": null,
    "rendered_text": "Hi Sarah! Reminder: Max has an appointment tomorrow at 2:00 PM. See you then! - Puppy Day",
    "character_count": 165,
    "segment_count": 2,
    "warnings": [
      "Message is 165 characters (will use 2 segments)"
    ]
  }
}
```

---

## 6. Send Test Notification

**Endpoint**: `POST /api/admin/notifications/templates/{id}/test`

**Request Body** (Email):
```json
{
  "recipient_email": "test@example.com",
  "sample_data": {
    "customer_name": "Sarah",
    "pet_name": "Max",
    "appointment_date": "January 20, 2024",
    "appointment_time": "2:00 PM"
  },
  "channel": "email"
}
```

**Request Body** (SMS):
```json
{
  "recipient_phone": "+16572522903",
  "sample_data": {
    "customer_name": "Sarah",
    "pet_name": "Max",
    "appointment_date": "January 20, 2024"
  },
  "channel": "sms"
}
```

**Example Request**:
```bash
curl -X POST "https://api.thepuppyday.com/api/admin/notifications/templates/550e8400-e29b-41d4-a716-446655440000/test" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_email": "test@example.com",
    "sample_data": {
      "customer_name": "Sarah",
      "pet_name": "Max",
      "appointment_date": "January 20, 2024",
      "appointment_time": "2:00 PM"
    }
  }'
```

**Example Response** (Success):
```json
{
  "success": true,
  "message": "Test notification sent successfully to test@example.com",
  "log_id": "log-uuid",
  "message_id": "resend-message-id"
}
```

**Example Response** (Failure):
```json
{
  "success": false,
  "error": "Failed to send email: Invalid email address",
  "log_id": "log-uuid"
}
```

**Notes**:
- Email subjects are automatically prefixed with "[TEST]"
- Test notifications are logged with `is_test=true` flag
- `channel` parameter is optional and defaults to the template's channel

---

## 7. Rollback Template

**Endpoint**: `POST /api/admin/notifications/templates/{id}/rollback`

**Request Body**:
```json
{
  "version": 2,
  "reason": "Reverting to previous working version due to formatting issues"
}
```

**Example Request**:
```bash
curl -X POST "https://api.thepuppyday.com/api/admin/notifications/templates/550e8400-e29b-41d4-a716-446655440000/rollback" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "version": 2,
    "reason": "Reverting to previous working version"
  }'
```

**Example Response**:
```json
{
  "success": true,
  "message": "Template successfully rolled back to version 2",
  "template": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "version": 4,
    ...
  },
  "previous_version": 3,
  "new_version": 4
}
```

**Notes**:
- Rollback creates a new version (doesn't overwrite current)
- Current version is saved to history before rollback
- Change reason includes rollback info: "Rolled back to version 2: {reason}"

---

## Error Responses

All endpoints follow consistent error response format:

**400 Bad Request**:
```json
{
  "error": "Invalid template ID format"
}
```

**401 Unauthorized**:
```json
{
  "error": "Unauthorized: Admin or staff access required"
}
```

**404 Not Found**:
```json
{
  "error": "Template not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Failed to update template"
}
```

---

## Variable Syntax

Templates use Handlebars-style variable syntax:

### Simple Variables
```
{{customer_name}}
{{appointment_date}}
{{pet_name}}
```

### Nested Variables (Business Context)
```
{{business.name}}
{{business.phone}}
{{business.email}}
{{business.address}}
{{business.hours}}
{{business.website}}
```

### Example Template
```html
<html>
<body>
  <h1>Hello {{customer_name}}!</h1>
  <p>Your appointment for {{pet_name}} is confirmed for {{appointment_date}} at {{appointment_time}}.</p>
  <hr>
  <footer>
    <p>{{business.name}}</p>
    <p>{{business.address}}</p>
    <p>{{business.phone}}</p>
  </footer>
</body>
</html>
```

---

## SMS Segment Calculation

- **Single segment**: Up to 160 characters
- **Multi-segment**: 153 characters per segment (7 chars used for concatenation)

**Examples**:
- 150 chars = 1 segment
- 165 chars = 2 segments (153 + 12)
- 310 chars = 3 segments (153 + 153 + 4)

---

## Business Context Variables (Always Available)

These variables are automatically available in all templates without needing to be declared:

- `{{business.name}}` - "Puppy Day"
- `{{business.address}}` - "14936 Leffingwell Rd, La Mirada, CA 90638"
- `{{business.phone}}` - "(657) 252-2903"
- `{{business.email}}` - "puppyday14936@gmail.com"
- `{{business.hours}}` - "Monday-Saturday, 9:00 AM - 5:00 PM"
- `{{business.website}}` - "https://thepuppyday.com"

---

## Common Workflows

### 1. Update and Test Flow
```bash
# 1. Get current template
GET /api/admin/notifications/templates/{id}

# 2. Update template
PUT /api/admin/notifications/templates/{id}

# 3. Preview changes
POST /api/admin/notifications/templates/{id}/preview

# 4. Send test
POST /api/admin/notifications/templates/{id}/test

# 5. If issues, rollback
POST /api/admin/notifications/templates/{id}/rollback
```

### 2. Version Management Flow
```bash
# 1. View history
GET /api/admin/notifications/templates/{id}/history

# 2. Preview specific version (use preview with historical data)
POST /api/admin/notifications/templates/{id}/preview

# 3. Rollback if needed
POST /api/admin/notifications/templates/{id}/rollback
```

---

## Rate Limiting

**Recommended Limits**:
- List/Get: 60 requests/minute
- Update: 30 requests/minute
- Preview: 30 requests/minute
- Test: 10 requests/minute (to prevent abuse)
- Rollback: 10 requests/minute

---

## Changelog

**Version 1.0** (2024-12-15):
- Initial implementation of all 7 template management endpoints
- Full CRUD operations with version history
- Preview and test capabilities
- Rollback functionality
