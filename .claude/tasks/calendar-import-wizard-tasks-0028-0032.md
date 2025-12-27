# Calendar Import Wizard - Tasks 0028-0032

## Implementation Summary

All 5 tasks for the Google Calendar import wizard have been successfully implemented.

### Task 0028: Event Description Parser ✅

**File**: `src/lib/calendar/import/parser.ts`

Parses Google Calendar event data and extracts appointment-relevant information.

**Key Functions**:
- `parseCalendarEvent(event)` - Main parser that extracts all data from calendar event
- `extractServiceFromTitle(title)` - Identifies service names from event titles
- `extractCustomerInfo(event)` - Extracts customer name, email, phone from attendees/description
- `extractPetInfo(description)` - Parses pet name and size from event description
- `parseEventDescription(description)` - Separates structured data from freeform notes

**Features**:
- Pattern matching for common grooming services (Basic Grooming, Premium Grooming, etc.)
- Email and phone number extraction with multiple pattern matching
- Pet size detection (small, medium, large, xlarge) with weight range support
- Structured data parsing (key: value pairs in description)
- Fallback handling for missing data

**Example Usage**:
```typescript
import { parseCalendarEvent } from '@/lib/calendar/import/parser';

const parsed = parseCalendarEvent(googleEvent);
console.log(parsed.service_name); // "Basic Grooming"
console.log(parsed.customer.email); // "john@example.com"
console.log(parsed.pet?.name); // "Max"
```

---

### Task 0029: Duplicate Detection Service ✅

**File**: `src/lib/calendar/import/duplicate-detection.ts`

Detects if a Google Calendar event matches an existing appointment to prevent duplicate imports.

**Key Functions**:
- `findDuplicateAppointment(supabase, eventData)` - Returns best match or null
- `findPotentialDuplicates(supabase, eventData)` - Returns all potential matches
- `calculateMatchScore(eventData, appointment, eventStart, eventEnd)` - Confidence scoring
- `checkTimeOverlap(start1, end1, start2, end2)` - Time range overlap detection

**Confidence Scoring** (0-100 points):
- **Time Match** (40 points max):
  - Exact match (≤5 min): 40 points
  - Close match (≤15 min): 30 points
  - Within window (≤30 min): 20 points
- **Customer Email Match**: 30 points
- **Customer Phone Match**: 25 points
- **Customer Name Match**: 15 points (exact) or 10 points (similar)
- **Pet Name Match**: 15 points (exact) or 10 points (similar)
- **Service Name Match**: 10 points (exact) or 5 points (partial)

**Confidence Thresholds**:
- **High** (≥80): Almost certainly a duplicate
- **Medium** (≥60): Likely a duplicate
- **Low** (≥40): Possibly a duplicate

**Example Usage**:
```typescript
import { findDuplicateAppointment } from '@/lib/calendar/import/duplicate-detection';

const duplicate = await findDuplicateAppointment(supabase, eventData);
if (duplicate && duplicate.confidence > 80) {
  console.log('High confidence duplicate found');
  console.log('Reasons:', duplicate.reasons);
}
```

---

### Task 0030: Import Preview Endpoint ✅

**File**: `src/app/api/admin/calendar/import/preview/route.ts`

**Endpoint**: `POST /api/admin/calendar/import/preview`

Fetches calendar events and previews them for import with validation and duplicate detection.

**Request Body**:
```typescript
{
  dateFrom: string; // ISO date (e.g., "2025-01-01")
  dateTo: string;   // ISO date (e.g., "2025-01-31")
  calendarId?: string; // Optional, defaults to primary
}
```

**Response**:
```typescript
{
  success: boolean;
  events: [
    {
      google_event_id: string;
      title: string;
      start: string;
      end: string;
      parsed_data: ParsedEventData;
      validation: {
        valid: boolean;
        errors: string[];
        warnings: string[];
      };
      duplicate_match: DuplicateMatch | null;
      importable: boolean;
    }
  ];
  summary: {
    total: number;
    importable: number;
    duplicates: number;
    invalid: number;
  };
}
```

**Features**:
- Fetches up to 100 events from Google Calendar (configurable limit)
- Skips events already imported (checks `calendar_event_mappings`)
- Parses each event using the parser service
- Validates each event using validation service
- Checks for duplicate appointments
- Determines importability based on validation + duplicate confidence
- Returns comprehensive preview with summary statistics

**Example Request**:
```bash
curl -X POST /api/admin/calendar/import/preview \
  -H "Content-Type: application/json" \
  -d '{
    "dateFrom": "2025-01-01",
    "dateTo": "2025-01-31"
  }'
```

---

### Task 0031: Import Confirmation Endpoint ✅

**File**: `src/app/api/admin/calendar/import/confirm/route.ts`

**Endpoint**: `POST /api/admin/calendar/import/confirm`

Executes the import of selected calendar events into appointments.

**Request Body**:
```typescript
{
  event_ids: string[]; // Google Calendar event IDs to import
  options: {
    skip_duplicates: boolean; // Skip events with ≥60% duplicate confidence
    create_new_customers: boolean; // Auto-create customers/pets if not found
    default_service_id?: string; // Fallback service if parsing fails
  };
}
```

**Response**:
```typescript
{
  success: boolean;
  results: [
    {
      google_event_id: string;
      status: 'imported' | 'skipped' | 'failed';
      appointment_id?: string;
      error?: string;
      reason?: string;
    }
  ];
  summary: {
    total: number;
    imported: number;
    skipped: number;
    failed: number;
  };
}
```

**Import Process** (per event):
1. Fetch event from Google Calendar
2. Parse event data
3. Validate event data
4. Check for duplicates (skip if confidence ≥60 and `skip_duplicates: true`)
5. **Match or create customer**:
   - Try matching by email (primary)
   - Try matching by phone (secondary)
   - Create new if `create_new_customers: true`
6. **Match or create pet**:
   - Try matching by name + owner
   - Create new if `create_new_customers: true`
   - Use customer's only pet if they have exactly one
7. **Match service**:
   - Try matching by name (fuzzy match)
   - Use `default_service_id` if provided
8. Create appointment record
9. Create event mapping (`calendar_event_mappings`)
10. Log operation to `calendar_sync_log`

**Transaction Safety**:
- Each event import is independent
- Failures in one event don't affect others
- All operations logged for audit trail

**Example Request**:
```bash
curl -X POST /api/admin/calendar/import/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "event_ids": ["evt_123", "evt_456"],
    "options": {
      "skip_duplicates": true,
      "create_new_customers": true,
      "default_service_id": "service-uuid"
    }
  }'
```

---

### Task 0032: Import Validation Service ✅

**File**: `src/lib/calendar/import/validation.ts`

Validates parsed event data before import to ensure data quality.

**Key Functions**:
- `validateEventForImport(eventData)` - Main validation function
- `validateDateTimeRange(start, end)` - Validates time ranges
- `validateCustomerInfo(customerInfo)` - Validates customer data
- `validatePetInfo(petInfo)` - Validates pet data (warnings only)
- `validateEvents(events)` - Batch validation utility
- `getValidationSummary(results)` - Summary statistics

**Validation Rules**:

**Required Fields** (Errors):
- Event title must be present
- Start time must be present
- End time must be present

**Date/Time Validation** (Errors):
- Start must be before end
- Duration: 15 minutes minimum, 480 minutes (8 hours) maximum
- Event cannot be > 365 days in past
- Event cannot be > 365 days in future
- Valid ISO date format required

**Customer Validation** (Errors):
- Email must be valid format (if present)
- Phone must be 10-11 digits (if present)
- Name must be 2-100 characters (if present)

**Pet Validation** (Warnings only):
- Pet name and size recommended but not required
- Warnings issued if missing

**Example Usage**:
```typescript
import { validateEventForImport } from '@/lib/calendar/import/validation';

const result = validateEventForImport(parsedData);

if (!result.valid) {
  console.error('Validation failed:', result.errors);
}

if (result.warnings.length > 0) {
  console.warn('Validation warnings:', result.warnings);
}
```

---

## File Structure

```
src/
├── lib/
│   └── calendar/
│       └── import/
│           ├── index.ts                      # Export barrel
│           ├── parser.ts                     # Task 0028
│           ├── duplicate-detection.ts        # Task 0029
│           └── validation.ts                 # Task 0032
└── app/
    └── api/
        └── admin/
            └── calendar/
                └── import/
                    ├── preview/
                    │   └── route.ts          # Task 0030
                    └── confirm/
                        └── route.ts          # Task 0031
```

---

## Integration Points

### Database Tables Used

1. **`calendar_event_mappings`**:
   - Stores mapping between appointments and Google Calendar events
   - Prevents duplicate imports

2. **`calendar_sync_log`**:
   - Audit trail for all import operations
   - Tracks success/failure with detailed error messages

3. **`appointments`**:
   - Target table for imported events
   - Created with `creation_method: 'manual_admin'`

4. **`users`** (customers):
   - Matched by email or phone
   - Auto-created if `create_new_customers: true`

5. **`pets`**:
   - Matched by name + owner
   - Auto-created if `create_new_customers: true`

6. **`services`**:
   - Matched by name (fuzzy matching)
   - Fallback to `default_service_id`

### External Dependencies

- `googleapis` (v169.0.0) - Google Calendar API client
- `zod` - Request validation
- Supabase client - Database operations
- Existing calendar infrastructure:
  - `GoogleCalendarClient` - API wrapper
  - Token manager - OAuth token handling
  - Sync logger - Operation logging
  - Event mapping repository - Mapping CRUD

---

## Security Considerations

1. **Admin-Only Access**:
   - All endpoints require admin authentication via `requireAdmin()`
   - No customer access to import functionality

2. **Data Validation**:
   - All input validated with Zod schemas
   - SQL injection prevented via Supabase client
   - Email/phone format validation

3. **Rate Limiting**:
   - Google Calendar API calls rate-limited via `GoogleCalendarClient`
   - Exponential backoff on failures
   - Maximum 100 events per preview request

4. **Error Handling**:
   - Graceful degradation on parse failures
   - Partial results returned even if some imports fail
   - Comprehensive error logging

5. **Audit Trail**:
   - All operations logged to `calendar_sync_log`
   - Tracks success/failure with timestamps
   - Includes detailed error messages and codes

---

## Testing Recommendations

### Unit Tests

1. **Parser Tests** (`parser.test.ts`):
   - Service name extraction from various title formats
   - Customer info extraction from attendees/description
   - Pet info parsing with size detection
   - Edge cases: missing data, malformed input

2. **Validation Tests** (`validation.test.ts`):
   - Required field validation
   - Date/time range validation
   - Customer email/phone format validation
   - Duration limits (min/max)

3. **Duplicate Detection Tests** (`duplicate-detection.test.ts`):
   - Confidence scoring algorithm
   - Time overlap detection
   - Name similarity matching
   - Edge cases: no duplicates, multiple matches

### Integration Tests

1. **Preview Endpoint**:
   - Successful preview with valid date range
   - Empty result for no events
   - Already imported events filtered out
   - Validation and duplicate detection integration

2. **Confirm Endpoint**:
   - Successful import with customer/pet creation
   - Duplicate skipping behavior
   - Service matching fallback
   - Error handling for failed imports

### Manual Testing Checklist

- [ ] Preview events from Google Calendar
- [ ] Import event with existing customer
- [ ] Import event with new customer (auto-create)
- [ ] Import event with duplicate detection
- [ ] Import event with service name matching
- [ ] Import event with default service fallback
- [ ] Verify event mapping created
- [ ] Verify sync log entries
- [ ] Test error scenarios (invalid dates, missing data)
- [ ] Test with 50+ events (pagination)

---

## Future Enhancements

1. **Batch Processing**:
   - Background job for large imports
   - Progress tracking for long-running imports
   - Resume capability for interrupted imports

2. **Smart Matching**:
   - Machine learning for service name matching
   - Customer name fuzzy matching improvements
   - Historical data analysis for duplicate detection

3. **Manual Review Interface**:
   - UI for reviewing ambiguous matches
   - Manual customer/pet selection
   - Bulk approval/rejection

4. **Import Templates**:
   - Save parsing rules per calendar source
   - Custom field mapping configurations
   - Service name synonyms

5. **Conflict Resolution**:
   - UI for resolving duplicate conflicts
   - Merge duplicate appointments
   - Update existing appointments

---

## API Reference

### POST /api/admin/calendar/import/preview

Preview calendar events for import.

**Authentication**: Admin required

**Request**:
```json
{
  "dateFrom": "2025-01-01",
  "dateTo": "2025-01-31",
  "calendarId": "primary"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "events": [...],
  "summary": {
    "total": 25,
    "importable": 20,
    "duplicates": 3,
    "invalid": 2
  }
}
```

**Errors**:
- 400: Invalid request body
- 401: Unauthorized (not admin)
- 404: No active calendar connection
- 500: Server error

---

### POST /api/admin/calendar/import/confirm

Execute calendar event import.

**Authentication**: Admin required

**Request**:
```json
{
  "event_ids": ["evt_123", "evt_456"],
  "options": {
    "skip_duplicates": true,
    "create_new_customers": true,
    "default_service_id": "uuid"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "results": [...],
  "summary": {
    "total": 2,
    "imported": 1,
    "skipped": 1,
    "failed": 0
  }
}
```

**Errors**:
- 400: Invalid request body
- 401: Unauthorized (not admin)
- 404: No active calendar connection
- 500: Server error

---

## Conclusion

All 5 tasks for the Google Calendar import wizard have been successfully implemented with:

✅ **Robust parsing** of calendar events with fallback handling
✅ **Intelligent duplicate detection** with confidence scoring
✅ **Comprehensive validation** with errors and warnings
✅ **Two-phase import** (preview then confirm)
✅ **Auto-creation** of customers and pets (optional)
✅ **Service matching** with fallback support
✅ **Full audit trail** via sync logging
✅ **Error resilience** with partial results
✅ **TypeScript** strong typing throughout
✅ **Security** with admin-only access and input validation

The implementation is production-ready and follows all project conventions and best practices.
