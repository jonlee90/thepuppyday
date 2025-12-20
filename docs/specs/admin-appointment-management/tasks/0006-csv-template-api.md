# Task 0006: CSV Template Download API

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0002
**Estimated Effort**: 1 hour

## Objective

Create API endpoint for downloading CSV import template with example data.

## Requirements

- REQ-10.4: Template provides all required columns
- REQ-10.5: Template includes example data
- REQ-12.1: Column headers match import requirements
- REQ-12.2: Example data follows business rules

## Implementation Details

### Files to Create

**`src/app/api/admin/appointments/import/template/route.ts`**

Implement GET endpoint:
```typescript
import { NextResponse } from 'next/server';

const CSV_HEADERS = [
  'customer_name',
  'customer_email',
  'customer_phone',
  'pet_name',
  'pet_breed',
  'pet_size',
  'pet_weight',
  'service_name',
  'addons',
  'date',
  'time',
  'notes',
  'payment_status',
  'amount_paid',
  'payment_method',
];

const EXAMPLE_ROWS = [
  {
    customer_name: 'John Smith',
    customer_email: 'john.smith@example.com',
    customer_phone: '(555) 123-4567',
    pet_name: 'Max',
    pet_breed: 'Golden Retriever',
    pet_size: 'large',
    pet_weight: '65',
    service_name: 'Premium Grooming',
    addons: 'Teeth Brushing, Pawdicure',
    date: '2025-01-25',
    time: '10:00 AM',
    notes: 'Friendly dog, loves treats',
    payment_status: 'pending',
    amount_paid: '',
    payment_method: '',
  },
  {
    customer_name: 'Jane Doe',
    customer_email: 'jane.doe@example.com',
    customer_phone: '(555) 987-6543',
    pet_name: 'Bella',
    pet_breed: 'Poodle',
    pet_size: 'small',
    pet_weight: '12',
    service_name: 'Basic Grooming',
    addons: 'Flea & Tick Treatment',
    date: '2025-01-26',
    time: '2:00 PM',
    notes: '',
    payment_status: 'paid',
    amount_paid: '50.00',
    payment_method: 'credit_card',
  },
  {
    customer_name: 'Bob Johnson',
    customer_email: 'bob.j@example.com',
    customer_phone: '(555) 456-7890',
    pet_name: 'Charlie',
    pet_breed: 'Labrador',
    pet_size: 'x-large',
    pet_weight: '75',
    service_name: 'Premium Grooming',
    addons: '',
    date: '2025-01-27',
    time: '11:30 AM',
    notes: 'First time customer',
    payment_status: 'partially_paid',
    amount_paid: '50.00',
    payment_method: 'cash',
  },
];

export async function GET() {
  // Build CSV content
  const headerRow = CSV_HEADERS.join(',');
  const dataRows = EXAMPLE_ROWS.map((row) =>
    CSV_HEADERS.map((header) => {
      const value = row[header as keyof typeof row] || '';
      // Escape commas and quotes
      if (value.includes(',') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  const csvContent = [headerRow, ...dataRows].join('\n');

  // Return as downloadable CSV
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="appointment_import_template.csv"',
    },
  });
}
```

### Template Specifications

**Required Columns:**
- customer_name, customer_email, customer_phone
- pet_name, pet_breed, pet_size, pet_weight
- service_name, date, time

**Optional Columns:**
- addons (comma-separated list)
- notes
- payment_status (pending, paid, partially_paid)
- amount_paid (required if paid/partially_paid)
- payment_method (required if paid/partially_paid)

**Example Data Rules:**
- Valid email formats
- Phone in (555) 123-4567 format
- Pet size: small, medium, large, x-large
- Date: YYYY-MM-DD or MM/DD/YYYY
- Time: 12-hour format with AM/PM
- Service names match actual services in database
- Addons comma-separated, match actual addons

## Acceptance Criteria

- [ ] GET endpoint returns CSV file
- [ ] Downloads as `appointment_import_template.csv`
- [ ] Contains all required column headers
- [ ] Includes 3 example rows with valid data
- [ ] Example data follows business rules:
  - Valid email/phone formats
  - Correct pet sizes
  - Existing service/addon names
  - Valid date/time formats
  - Proper payment status values
- [ ] CSV properly escapes commas and quotes
- [ ] Content-Type and Content-Disposition headers set correctly

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-10.4, 10.5, 12.1, 12.2)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 3.1.1)
