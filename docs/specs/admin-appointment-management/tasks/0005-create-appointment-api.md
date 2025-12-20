# Task 0005: Create Appointment API

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0001, 0002, 0003
**Estimated Effort**: 5 hours

## Objective

Create API endpoint for manual appointment creation with customer/pet matching and account activation flow.

## Requirements

- REQ-8.3, REQ-8.6, REQ-8.7, REQ-8.8, REQ-8.9: Appointment creation
- REQ-9.6: Payment record creation
- REQ-15.1-15.3: Customer/pet matching with account activation
- REQ-20.1: Notification sending
- REQ-21.1, REQ-21.2: Audit logging

## Implementation Details

### Files to Modify

**`src/app/api/admin/appointments/route.ts`**

Add POST handler to existing file:

**Note**: Leverage existing utilities:
- `src/lib/booking/pricing.ts` - `calculatePrice()`
- `src/lib/booking/validation.ts` - Validation schemas
- `src/lib/admin/audit-log.ts` - `logSettingsChange()` or create appointment-specific logger

Implement POST endpoint:
```typescript
import { calculatePrice } from '@/lib/booking/pricing';
import type { CreateAppointmentPayload } from '@/types/admin-appointments';

export async function POST(request: NextRequest) {
  const payload: CreateAppointmentPayload = await request.json();
  const adminUserId = await getAuthenticatedAdminId(request);

  // 1. Customer Matching (Account Activation Flow)
  let customerId: string;
  const existingCustomer = await findCustomerByEmail(payload.customer.email);

  if (existingCustomer) {
    // Use existing customer (active or inactive)
    customerId = existingCustomer.id;
  } else {
    // Create new INACTIVE customer profile
    const newCustomer = await createCustomer({
      first_name: payload.customer.first_name,
      last_name: payload.customer.last_name,
      email: payload.customer.email.toLowerCase(),
      phone: payload.customer.phone,
      is_active: false, // Inactive until customer registers
      created_by_admin: true,
      password_hash: null, // No password yet
    });
    customerId = newCustomer.id;
  }

  // 2. Pet Matching
  let petId: string;
  if (payload.pet.id) {
    petId = payload.pet.id;
  } else {
    // Create new pet
    const newPet = await createPet({
      customer_id: customerId,
      name: payload.pet.name,
      breed_id: payload.pet.breed_id,
      size: payload.pet.size,
      weight: payload.pet.weight,
    });
    petId = newPet.id;
  }

  // 3. Calculate pricing using existing utility
  const pricing = await calculatePrice({
    service_id: payload.service_id,
    addon_ids: payload.addon_ids,
    pet_size: payload.pet.size,
  });

  // 4. Create appointment
  const appointment = await createAppointment({
    customer_id: customerId,
    pet_id: petId,
    service_id: payload.service_id,
    date: payload.appointment_date,
    time: payload.appointment_time,
    notes: payload.notes,
    total_price: pricing.total,
    status: 'confirmed',
    creation_method: 'manual_admin',
    created_by_admin_id: adminUserId,
  });

  // 5. Create appointment_addons
  for (const addonId of payload.addon_ids) {
    await createAppointmentAddon({
      appointment_id: appointment.id,
      addon_id: addonId,
    });
  }

  // 6. Create payment record if paid/partially_paid
  if (payload.payment_status !== 'pending' && payload.payment_details) {
    await createPayment({
      appointment_id: appointment.id,
      amount: payload.payment_details.amount_paid,
      payment_method: payload.payment_details.payment_method,
      status: payload.payment_status === 'paid' ? 'completed' : 'partial',
    });
  }

  // 7. Audit log
  await logAppointmentCreation({
    appointment_id: appointment.id,
    admin_user_id: adminUserId,
    creation_method: 'manual_admin',
    customer_status: existingCustomer ? 'existing' : 'new_inactive',
  });

  // 8. Send notification (optional, only for active customers)
  if (payload.send_notification && existingCustomer?.is_active) {
    await sendAppointmentConfirmation(appointment.id);
  }

  return NextResponse.json({
    success: true,
    appointment_id: appointment.id,
    customer_created: !existingCustomer,
    customer_status: existingCustomer?.is_active ? 'active' : 'inactive',
    pet_created: !payload.pet.id,
  }, { status: 201 });
}
```

### Helper Functions to Implement

- `findCustomerByEmail(email)` - Case-insensitive lookup
- `createCustomer(data)` - Create inactive customer profile
- `createPet(data)` - Create pet under customer
- `createAppointment(data)` - Create appointment with creation tracking
- `createAppointmentAddon(data)` - Link addons to appointment
- `createPayment(data)` - Create payment record
- `logAppointmentCreation(data)` - Audit trail
- `sendAppointmentConfirmation(appointmentId)` - Email/SMS notification

## Acceptance Criteria

- [ ] POST endpoint creates appointment successfully
- [ ] Email-based customer matching works (case-insensitive)
- [ ] New inactive customer profiles created with correct flags:
  - `is_active = false`
  - `created_by_admin = true`
  - `password_hash = null`
- [ ] Existing customers (active or inactive) reused correctly
- [ ] New pets created when needed
- [ ] Appointment saved with `creation_method = 'manual_admin'`
- [ ] Appointment saved with `created_by_admin_id`
- [ ] Price calculated from database using existing `calculatePrice()`
- [ ] Payment records created for paid/partially_paid status
- [ ] Notifications sent only to active customers
- [ ] Audit log entry created
- [ ] Returns customer/pet creation status in response

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-8, 9, 15, 20, 21)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 1.4, 3.1)
- **Existing Utilities**: src/lib/booking/pricing.ts, src/lib/booking/validation.ts, src/lib/admin/audit-log.ts
