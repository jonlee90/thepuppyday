# Calendar Import Wizard - Frontend Implementation Guide

## Overview

This guide provides specifications for implementing the frontend UI for the Google Calendar import wizard. The backend APIs (Tasks 0028-0032) are complete and ready for integration.

---

## User Flow

### Step 1: Access Import Wizard
- Location: Admin Calendar Settings page
- Trigger: "Import from Google Calendar" button
- Pre-requisite: Active Google Calendar connection

### Step 2: Select Date Range
- User selects date range (from/to)
- Optional: Select specific calendar (if multiple connected)
- Submit to preview events

### Step 3: Preview Events
- Display table/list of events with:
  - Event title and time
  - Parsed data (customer, pet, service)
  - Validation status (valid/warnings/errors)
  - Duplicate match (if found)
  - Importable checkbox (auto-checked if valid + no high-confidence duplicate)
- User can:
  - Review parsed data
  - Select/deselect events to import
  - Configure import options

### Step 4: Configure Import Options
- **Skip duplicates**: Auto-skip events with ≥60% duplicate confidence
- **Create new customers**: Auto-create customers/pets if not found
- **Default service**: Fallback service if name parsing fails

### Step 5: Execute Import
- Submit selected events for import
- Display progress/results
- Show summary: imported, skipped, failed

---

## API Integration

### Preview Events API

**Endpoint**: `POST /api/admin/calendar/import/preview`

**Request**:
```typescript
const response = await fetch('/api/admin/calendar/import/preview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dateFrom: '2025-01-01',
    dateTo: '2025-01-31',
    calendarId: 'primary' // optional
  })
});

const data = await response.json();
```

**Response Type**:
```typescript
interface PreviewResponse {
  success: boolean;
  events: ImportPreviewEvent[];
  summary: {
    total: number;
    importable: number;
    duplicates: number;
    invalid: number;
  };
}

interface ImportPreviewEvent {
  google_event_id: string;
  title: string;
  start: string; // ISO timestamp
  end: string;   // ISO timestamp
  parsed_data: {
    title: string;
    customer: {
      name?: string;
      email?: string;
      phone?: string;
    };
    pet?: {
      name?: string;
      size?: 'small' | 'medium' | 'large' | 'xlarge';
    };
    service_name?: string;
    notes?: string;
  };
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  duplicate_match: {
    appointment_id: string;
    confidence: number; // 0-100
    reasons: string[];
    appointment: {
      id: string;
      scheduled_at: string;
      customer_name: string;
      pet_name: string;
      service_name: string;
      status: string;
    };
  } | null;
  importable: boolean;
}
```

---

### Confirm Import API

**Endpoint**: `POST /api/admin/calendar/import/confirm`

**Request**:
```typescript
const response = await fetch('/api/admin/calendar/import/confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_ids: ['evt_123', 'evt_456'],
    options: {
      skip_duplicates: true,
      create_new_customers: true,
      default_service_id: 'service-uuid' // optional
    }
  })
});

const data = await response.json();
```

**Response Type**:
```typescript
interface ConfirmResponse {
  success: boolean;
  results: ImportResult[];
  summary: {
    total: number;
    imported: number;
    skipped: number;
    failed: number;
  };
}

interface ImportResult {
  google_event_id: string;
  status: 'imported' | 'skipped' | 'failed';
  appointment_id?: string;
  error?: string;
  reason?: string;
}
```

---

## UI Components

### 1. Date Range Selector

```tsx
<div className="form-control">
  <label className="label">
    <span className="label-text">Import Date Range</span>
  </label>
  <div className="flex gap-4">
    <input
      type="date"
      className="input input-bordered"
      value={dateFrom}
      onChange={(e) => setDateFrom(e.target.value)}
    />
    <span className="self-center">to</span>
    <input
      type="date"
      className="input input-bordered"
      value={dateTo}
      onChange={(e) => setDateTo(e.target.value)}
    />
  </div>
</div>
```

---

### 2. Preview Table

Display events in a table with selection checkboxes:

**Columns**:
- **Checkbox**: Select for import (disabled if not importable)
- **Event**: Title + date/time
- **Customer**: Name, email, phone (from parsed data)
- **Pet**: Name, size (from parsed data)
- **Service**: Service name (from parsed data)
- **Status**: Badge showing validation/duplicate status
- **Actions**: View details button

**Status Badges**:
```tsx
// Valid and importable
<span className="badge badge-success">Ready to Import</span>

// Has warnings but valid
<span className="badge badge-warning">Import with Warnings</span>

// Has validation errors
<span className="badge badge-error">Invalid</span>

// Duplicate detected (high confidence)
<span className="badge badge-info">Duplicate (85%)</span>

// Duplicate detected (medium confidence)
<span className="badge badge-warning">Possible Duplicate (65%)</span>
```

**Example Row**:
```tsx
<tr>
  <td>
    <input
      type="checkbox"
      className="checkbox"
      checked={selected}
      disabled={!event.importable}
      onChange={handleToggle}
    />
  </td>
  <td>
    <div className="font-medium">{event.title}</div>
    <div className="text-sm opacity-50">
      {formatDateTime(event.start)} - {formatTime(event.end)}
    </div>
  </td>
  <td>
    <div>{event.parsed_data.customer.name || '—'}</div>
    <div className="text-sm opacity-50">
      {event.parsed_data.customer.email || '—'}
    </div>
  </td>
  <td>
    {event.parsed_data.pet?.name || '—'}
    <span className="badge badge-sm ml-2">
      {event.parsed_data.pet?.size || '?'}
    </span>
  </td>
  <td>{event.parsed_data.service_name || '—'}</td>
  <td>
    {renderStatusBadge(event)}
  </td>
  <td>
    <button
      className="btn btn-ghost btn-sm"
      onClick={() => showDetails(event)}
    >
      Details
    </button>
  </td>
</tr>
```

---

### 3. Event Details Modal

Show detailed information about an event:

```tsx
<dialog className="modal" open={detailsOpen}>
  <div className="modal-box max-w-2xl">
    <h3 className="font-bold text-lg">{event.title}</h3>

    {/* Event Time */}
    <div className="py-4">
      <p className="text-sm opacity-70">
        {formatDateTime(event.start)} - {formatTime(event.end)}
      </p>
    </div>

    {/* Parsed Data */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="font-semibold mb-2">Customer</h4>
        <p>Name: {event.parsed_data.customer.name || 'Not found'}</p>
        <p>Email: {event.parsed_data.customer.email || 'Not found'}</p>
        <p>Phone: {event.parsed_data.customer.phone || 'Not found'}</p>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Pet</h4>
        <p>Name: {event.parsed_data.pet?.name || 'Not found'}</p>
        <p>Size: {event.parsed_data.pet?.size || 'Not found'}</p>
      </div>
    </div>

    {/* Service */}
    <div className="mt-4">
      <h4 className="font-semibold mb-2">Service</h4>
      <p>{event.parsed_data.service_name || 'Not found'}</p>
    </div>

    {/* Notes */}
    {event.parsed_data.notes && (
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Notes</h4>
        <p className="text-sm">{event.parsed_data.notes}</p>
      </div>
    )}

    {/* Validation Errors */}
    {event.validation.errors.length > 0 && (
      <div className="alert alert-error mt-4">
        <h4 className="font-semibold">Validation Errors</h4>
        <ul className="list-disc list-inside">
          {event.validation.errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      </div>
    )}

    {/* Validation Warnings */}
    {event.validation.warnings.length > 0 && (
      <div className="alert alert-warning mt-4">
        <h4 className="font-semibold">Warnings</h4>
        <ul className="list-disc list-inside">
          {event.validation.warnings.map((warn, i) => (
            <li key={i}>{warn}</li>
          ))}
        </ul>
      </div>
    )}

    {/* Duplicate Match */}
    {event.duplicate_match && (
      <div className="alert alert-info mt-4">
        <h4 className="font-semibold">
          Potential Duplicate ({event.duplicate_match.confidence}% confidence)
        </h4>
        <p>Appointment: {event.duplicate_match.appointment.customer_name} - {event.duplicate_match.appointment.pet_name}</p>
        <p className="text-sm">
          {formatDateTime(event.duplicate_match.appointment.scheduled_at)}
        </p>
        <p className="text-sm opacity-70">
          Reasons: {event.duplicate_match.reasons.join(', ')}
        </p>
      </div>
    )}

    <div className="modal-action">
      <button className="btn" onClick={closeDetails}>Close</button>
    </div>
  </div>
</dialog>
```

---

### 4. Import Options Panel

```tsx
<div className="card bg-base-200">
  <div className="card-body">
    <h3 className="card-title">Import Options</h3>

    <div className="form-control">
      <label className="label cursor-pointer">
        <span className="label-text">Skip duplicates (≥60% confidence)</span>
        <input
          type="checkbox"
          className="toggle"
          checked={skipDuplicates}
          onChange={(e) => setSkipDuplicates(e.target.checked)}
        />
      </label>
      <p className="text-sm opacity-70 mt-1">
        Events with high duplicate confidence will be automatically skipped
      </p>
    </div>

    <div className="form-control">
      <label className="label cursor-pointer">
        <span className="label-text">Create new customers automatically</span>
        <input
          type="checkbox"
          className="toggle"
          checked={createNewCustomers}
          onChange={(e) => setCreateNewCustomers(e.target.checked)}
        />
      </label>
      <p className="text-sm opacity-70 mt-1">
        Auto-create customer and pet records if not found
      </p>
    </div>

    <div className="form-control">
      <label className="label">
        <span className="label-text">Default Service (if not detected)</span>
      </label>
      <select
        className="select select-bordered"
        value={defaultServiceId}
        onChange={(e) => setDefaultServiceId(e.target.value)}
      >
        <option value="">-- Select Service --</option>
        {services.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <p className="text-sm opacity-70 mt-1">
        Used when service name cannot be parsed from event
      </p>
    </div>
  </div>
</div>
```

---

### 5. Summary Panel

Display preview summary:

```tsx
<div className="stats shadow">
  <div className="stat">
    <div className="stat-title">Total Events</div>
    <div className="stat-value">{summary.total}</div>
  </div>

  <div className="stat">
    <div className="stat-title">Ready to Import</div>
    <div className="stat-value text-success">{summary.importable}</div>
  </div>

  <div className="stat">
    <div className="stat-title">Duplicates</div>
    <div className="stat-value text-info">{summary.duplicates}</div>
  </div>

  <div className="stat">
    <div className="stat-title">Invalid</div>
    <div className="stat-value text-error">{summary.invalid}</div>
  </div>
</div>
```

---

### 6. Import Results Display

After import confirmation:

```tsx
<div className="space-y-4">
  <div className="alert alert-success">
    <h3 className="font-bold">Import Complete</h3>
    <p>Imported {summary.imported} of {summary.total} events</p>
  </div>

  <div className="stats shadow">
    <div className="stat">
      <div className="stat-title">Imported</div>
      <div className="stat-value text-success">{summary.imported}</div>
    </div>
    <div className="stat">
      <div className="stat-title">Skipped</div>
      <div className="stat-value text-warning">{summary.skipped}</div>
    </div>
    <div className="stat">
      <div className="stat-title">Failed</div>
      <div className="stat-value text-error">{summary.failed}</div>
    </div>
  </div>

  {/* Results Table */}
  <div className="overflow-x-auto">
    <table className="table">
      <thead>
        <tr>
          <th>Event</th>
          <th>Status</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        {results.map((result) => (
          <tr key={result.google_event_id}>
            <td>{result.google_event_id}</td>
            <td>
              {result.status === 'imported' && (
                <span className="badge badge-success">Imported</span>
              )}
              {result.status === 'skipped' && (
                <span className="badge badge-warning">Skipped</span>
              )}
              {result.status === 'failed' && (
                <span className="badge badge-error">Failed</span>
              )}
            </td>
            <td>
              {result.appointment_id && (
                <a
                  href={`/admin/appointments/${result.appointment_id}`}
                  className="link"
                >
                  View Appointment
                </a>
              )}
              {result.reason && <p className="text-sm">{result.reason}</p>}
              {result.error && <p className="text-sm text-error">{result.error}</p>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

---

## Complete Example Component

```tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';

export function CalendarImportWizard() {
  const [step, setStep] = useState<'select' | 'preview' | 'results'>('select');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [createNewCustomers, setCreateNewCustomers] = useState(true);
  const [defaultServiceId, setDefaultServiceId] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handlePreview() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/calendar/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateFrom, dateTo }),
      });
      const data = await response.json();
      setPreview(data);

      // Auto-select importable events
      const importable = new Set(
        data.events
          .filter((e: any) => e.importable)
          .map((e: any) => e.google_event_id)
      );
      setSelected(importable);

      setStep('preview');
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/calendar/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_ids: Array.from(selected),
          options: {
            skip_duplicates: skipDuplicates,
            create_new_customers: createNewCustomers,
            default_service_id: defaultServiceId || undefined,
          },
        }),
      });
      const data = await response.json();
      setResults(data);
      setStep('results');
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'select') {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Import from Google Calendar</h2>

        {/* Date Range Selector */}
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Select Date Range</span>
              </label>
              <div className="flex gap-4">
                <input
                  type="date"
                  className="input input-bordered"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <span className="self-center">to</span>
                <input
                  type="date"
                  className="input input-bordered"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="card-actions justify-end mt-4">
              <button
                className="btn btn-primary"
                onClick={handlePreview}
                disabled={!dateFrom || !dateTo || loading}
              >
                {loading ? 'Loading...' : 'Preview Events'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Preview Events</h2>
          <button className="btn btn-ghost" onClick={() => setStep('select')}>
            Back
          </button>
        </div>

        {/* Summary */}
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total</div>
            <div className="stat-value">{preview?.summary.total || 0}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Selected</div>
            <div className="stat-value">{selected.size}</div>
          </div>
        </div>

        {/* Options */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title">Import Options</h3>
            {/* ... options checkboxes ... */}
          </div>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selected.size === preview?.events.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelected(new Set(preview.events.map((ev: any) => ev.google_event_id)));
                      } else {
                        setSelected(new Set());
                      }
                    }}
                  />
                </th>
                <th>Event</th>
                <th>Customer</th>
                <th>Pet</th>
                <th>Service</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {preview?.events.map((event: any) => (
                <tr key={event.google_event_id}>
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selected.has(event.google_event_id)}
                      disabled={!event.importable}
                      onChange={(e) => {
                        const newSelected = new Set(selected);
                        if (e.target.checked) {
                          newSelected.add(event.google_event_id);
                        } else {
                          newSelected.delete(event.google_event_id);
                        }
                        setSelected(newSelected);
                      }}
                    />
                  </td>
                  <td>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm opacity-50">
                      {format(new Date(event.start), 'MMM d, yyyy h:mm a')}
                    </div>
                  </td>
                  <td>{event.parsed_data.customer.name || '—'}</td>
                  <td>{event.parsed_data.pet?.name || '—'}</td>
                  <td>{event.parsed_data.service_name || '—'}</td>
                  <td>
                    {event.importable ? (
                      <span className="badge badge-success">Ready</span>
                    ) : event.duplicate_match ? (
                      <span className="badge badge-warning">Duplicate</span>
                    ) : (
                      <span className="badge badge-error">Invalid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn" onClick={() => setStep('select')}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={selected.size === 0 || loading}
          >
            {loading ? 'Importing...' : `Import ${selected.size} Events`}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Import Complete</h2>

        <div className="alert alert-success">
          <p>Successfully imported {results?.summary.imported} events</p>
        </div>

        {/* Summary stats */}
        {/* Results table */}

        <button
          className="btn btn-primary"
          onClick={() => {
            setStep('select');
            setSelected(new Set());
            setPreview(null);
            setResults(null);
          }}
        >
          Import More Events
        </button>
      </div>
    );
  }

  return null;
}
```

---

## Error Handling

### API Errors

```typescript
try {
  const response = await fetch('/api/admin/calendar/import/preview', {
    method: 'POST',
    body: JSON.stringify({ dateFrom, dateTo }),
  });

  if (!response.ok) {
    const error = await response.json();

    if (response.status === 404) {
      toast.error('No calendar connection found. Please connect your Google Calendar first.');
    } else if (response.status === 401) {
      toast.error('Unauthorized. Please log in as an admin.');
    } else {
      toast.error(error.error || 'Failed to preview events');
    }
    return;
  }

  const data = await response.json();
  // Handle success
} catch (error) {
  console.error('Network error:', error);
  toast.error('Network error. Please try again.');
}
```

---

## Recommended File Location

```
src/
└── app/
    └── (admin)/
        └── admin/
            └── calendar/
                └── import/
                    └── page.tsx  # Main import wizard page
```

Or as a modal/dialog component in the calendar settings page:

```
src/
└── components/
    └── admin/
        └── calendar/
            └── ImportWizard.tsx
```

---

## Additional Recommendations

1. **Loading States**: Show skeleton loaders during API calls
2. **Empty States**: Handle no events found gracefully
3. **Pagination**: If implementing for >100 events, add pagination
4. **Bulk Actions**: Select all, deselect all, invert selection
5. **Filtering**: Filter by status (valid, invalid, duplicate)
6. **Sorting**: Sort by date, status, customer name
7. **Export**: Allow export of results as CSV
8. **Toast Notifications**: Use react-hot-toast for feedback
9. **Confirmation Dialogs**: Confirm before importing
10. **Help Text**: Add tooltips explaining features

---

This completes the frontend implementation guide for the Calendar Import Wizard!
