# Task 0132: Notification Dashboard API - Example Response

## Endpoint
```
GET /api/admin/notifications/dashboard
```

## Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `period` | string | Predefined period: '7d', '30d', '90d' | `?period=7d` |
| `start_date` | string | Custom start date (ISO format) | `?start_date=2025-01-01` |
| `end_date` | string | Custom end date (ISO format) | `?end_date=2025-01-31` |

## Example Request
```bash
curl -X GET 'http://localhost:3000/api/admin/notifications/dashboard?period=30d' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

## Example Response
```json
{
  "period": {
    "start": "2024-12-18T00:00:00.000Z",
    "end": "2025-01-16T23:59:59.999Z",
    "label": "30 days"
  },
  "summary": {
    "total_sent": 1500,
    "total_delivered": 1420,
    "total_failed": 80,
    "delivery_rate": 94.67,
    "click_rate": 12.5,
    "trends": {
      "sent_change_percent": 15.2,
      "delivery_rate_change_percent": -2.1
    }
  },
  "by_channel": {
    "email": {
      "sent": 1000,
      "delivered": 950,
      "failed": 50,
      "delivery_rate": 95.0
    },
    "sms": {
      "sent": 500,
      "delivered": 470,
      "failed": 30,
      "delivery_rate": 94.0
    }
  },
  "by_type": [
    {
      "type": "appointment_reminder",
      "sent": 500,
      "delivered": 490,
      "failed": 10,
      "success_rate": 98.0
    },
    {
      "type": "booking_confirmation",
      "sent": 400,
      "delivered": 380,
      "failed": 20,
      "success_rate": 95.0
    },
    {
      "type": "report_card_completion",
      "sent": 300,
      "delivered": 285,
      "failed": 15,
      "success_rate": 95.0
    },
    {
      "type": "retention_reminder",
      "sent": 200,
      "delivered": 180,
      "failed": 20,
      "success_rate": 90.0
    },
    {
      "type": "waitlist_notification",
      "sent": 100,
      "delivered": 85,
      "failed": 15,
      "success_rate": 85.0
    }
  ],
  "timeline": [
    {
      "date": "2024-12-18",
      "sent": 45,
      "delivered": 43,
      "failed": 2
    },
    {
      "date": "2024-12-19",
      "sent": 52,
      "delivered": 50,
      "failed": 2
    },
    {
      "date": "2024-12-20",
      "sent": 48,
      "delivered": 45,
      "failed": 3
    },
    {
      "date": "2024-12-21",
      "sent": 0,
      "delivered": 0,
      "failed": 0
    },
    {
      "date": "2024-12-22",
      "sent": 0,
      "delivered": 0,
      "failed": 0
    },
    {
      "date": "2024-12-23",
      "sent": 55,
      "delivered": 52,
      "failed": 3
    }
  ],
  "failure_reasons": [
    {
      "reason": "Invalid email address",
      "count": 30,
      "percentage": 37.5
    },
    {
      "reason": "Mailbox full",
      "count": 25,
      "percentage": 31.25
    },
    {
      "reason": "Invalid phone number",
      "count": 15,
      "percentage": 18.75
    },
    {
      "reason": "Temporary provider error",
      "count": 10,
      "percentage": 12.5
    }
  ]
}
```

## Response Fields Description

### period
- **start**: ISO timestamp of period start
- **end**: ISO timestamp of period end
- **label**: Human-readable period description

### summary
- **total_sent**: Total notifications sent (status='sent' OR delivered_at is set)
- **total_delivered**: Total notifications delivered (delivered_at is set)
- **total_failed**: Total notifications failed (status='failed')
- **delivery_rate**: Percentage of sent notifications that were delivered
- **click_rate**: Percentage of delivered notifications that were clicked
- **trends.sent_change_percent**: Percentage change in sent count vs previous period
- **trends.delivery_rate_change_percent**: Percentage point change in delivery rate vs previous period

### by_channel
Breakdown by communication channel (email/sms):
- **sent**: Count of sent notifications
- **delivered**: Count of delivered notifications
- **failed**: Count of failed notifications
- **delivery_rate**: Percentage of sent that were delivered

### by_type
Array of notification type metrics, sorted by sent count descending:
- **type**: Notification type identifier
- **sent**: Count of sent notifications
- **delivered**: Count of delivered notifications
- **failed**: Count of failed notifications
- **success_rate**: Percentage of sent that were delivered

### timeline
Array of daily metrics for the entire period:
- **date**: Date in YYYY-MM-DD format
- **sent**: Count of sent notifications on this date
- **delivered**: Count of delivered notifications on this date
- **failed**: Count of failed notifications on this date

Note: All dates in the period are included, even if counts are zero.

### failure_reasons
Array of error messages grouped and sorted by frequency:
- **reason**: Error message text
- **count**: Number of failures with this reason
- **percentage**: Percentage of total failures

## Use Cases

### 1. Admin Dashboard Overview
Use the default 30-day period to show overall notification health:
```
GET /api/admin/notifications/dashboard?period=30d
```

Display:
- Total sent, delivered, failed (summary cards)
- Delivery rate trend (vs previous 30 days)
- Channel performance comparison (email vs SMS)
- Daily timeline chart

### 2. Weekly Performance Report
Generate a weekly report:
```
GET /api/admin/notifications/dashboard?period=7d
```

Display:
- Week-over-week comparison
- Top performing notification types
- Common failure reasons

### 3. Monthly Analysis
Analyze a specific month:
```
GET /api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-31
```

Display:
- Monthly metrics
- Type breakdown for optimization
- Timeline to identify patterns (e.g., weekday vs weekend)

### 4. Failure Investigation
When delivery rate drops, use failure_reasons to identify issues:
- High "Invalid email address" → Data quality issue
- High "Temporary provider error" → Provider issue
- High "Mailbox full" → Customer engagement issue

### 5. Trend Monitoring
Monitor trends to catch issues early:
- `sent_change_percent` < -10% → Drop in notification volume
- `delivery_rate_change_percent` < -5% → Delivery issue
- Spike in failed count → Investigation needed

## Chart Integration Examples

### Timeline Chart (Line Chart)
```javascript
const chartData = response.timeline.map(day => ({
  date: new Date(day.date).toLocaleDateString(),
  sent: day.sent,
  delivered: day.delivered,
  failed: day.failed
}));
```

### Channel Comparison (Pie Chart)
```javascript
const channelData = [
  { name: 'Email', value: response.by_channel.email.sent },
  { name: 'SMS', value: response.by_channel.sms.sent }
];
```

### Type Performance (Bar Chart)
```javascript
const typeData = response.by_type.map(t => ({
  type: t.type,
  successRate: t.success_rate
}));
```

### Failure Reasons (Horizontal Bar Chart)
```javascript
const failureData = response.failure_reasons.map(r => ({
  reason: r.reason,
  percentage: r.percentage
}));
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
Reason: User is not authenticated or not an admin.

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch dashboard data"
}
```
Reason: Database query failed or internal error occurred.
