# Task 17: Complete ReviewStep Component

## Description
Enhance the ReviewStep component with full booking summary, itemized pricing, and guest info collection for unauthenticated users.

## Files to modify/create
- `src/components/booking/steps/ReviewStep.tsx`
- `src/components/booking/GuestInfoForm.tsx`

## Requirements References
- Req 6.1: Display selected service, pet name, date/time, add-ons, and itemized pricing
- Req 6.2: Show service price, each add-on price, subtotal, and any applicable taxes/fees
- Req 6.3: Display estimated duration of appointment
- Req 6.4: Require contact information (email, phone) for guests before confirmation
- Req 7.2: Require first name, last name, email, phone for guests
- Req 7.6: Validate email and phone format for guests

## Implementation Details

### ReviewStep Component
```typescript
export function ReviewStep() {
  const { isAuthenticated, user } = useAuth();
  const {
    selectedService,
    selectedPet,
    newPetData,
    petSize,
    selectedDate,
    selectedTimeSlot,
    selectedAddons,
    servicePrice,
    addonsTotal,
    totalPrice,
    guestInfo,
    setGuestInfo,
    prevStep,
  } = useBookingStore();

  const { submit, isSubmitting, error, clearError } = useBookingSubmit();
  const [showGuestForm, setShowGuestForm] = useState(!isAuthenticated && !guestInfo);

  const handleGuestInfoSubmit = (info: GuestInfo) => {
    setGuestInfo(info);
    setShowGuestForm(false);
  };

  const handleConfirm = async () => {
    clearError();
    try {
      await submit();
      // Success - store automatically updates and moves to confirmation
    } catch (err) {
      // Error is displayed via error state
    }
  };

  const canConfirm = isAuthenticated || guestInfo;

  const petName = selectedPet?.name || newPetData?.name || 'New Pet';
  const petBreed = selectedPet?.breed_custom || newPetData?.breed_custom || '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review Your Booking</h2>
        <p className="text-base-content/70">Confirm the details before booking</p>
      </div>

      {/* Error display */}
      {error && (
        <div className="alert alert-error">
          <svg className="w-6 h-6">...</svg>
          <span>{error.message}</span>
        </div>
      )}

      {/* Booking summary card */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          {/* Service */}
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <p className="text-sm text-base-content/70">Service</p>
              <p className="font-semibold">{selectedService?.name}</p>
              <p className="text-sm text-base-content/70">
                ~{selectedService?.duration_minutes} minutes
              </p>
            </div>
            <span className="font-bold">${servicePrice.toFixed(2)}</span>
          </div>

          {/* Pet */}
          <div className="border-b py-4">
            <p className="text-sm text-base-content/70">Pet</p>
            <p className="font-semibold">{petName}</p>
            <div className="flex gap-2 mt-1">
              <span className="badge badge-outline">{petSize}</span>
              {petBreed && <span className="text-sm text-base-content/70">{petBreed}</span>}
            </div>
          </div>

          {/* Date & Time */}
          <div className="border-b py-4">
            <p className="text-sm text-base-content/70">Appointment</p>
            <p className="font-semibold">
              {formatDate(selectedDate)} at {formatTime(selectedTimeSlot)}
            </p>
          </div>

          {/* Add-ons */}
          {selectedAddons.length > 0 && (
            <div className="border-b py-4">
              <p className="text-sm text-base-content/70 mb-2">Add-ons</p>
              {selectedAddons.map(addon => (
                <div key={addon.id} className="flex justify-between text-sm">
                  <span>{addon.name}</span>
                  <span>${addon.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div className="pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold text-primary">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-base-content/50 mt-1">
              Payment collected at appointment
            </p>
          </div>
        </div>
      </div>

      {/* Guest info section */}
      {!isAuthenticated && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">Contact Information</h3>

            {showGuestForm ? (
              <GuestInfoForm
                onSubmit={handleGuestInfoSubmit}
                initialData={guestInfo || undefined}
              />
            ) : guestInfo ? (
              <div>
                <p>{guestInfo.firstName} {guestInfo.lastName}</p>
                <p className="text-sm text-base-content/70">{guestInfo.email}</p>
                <p className="text-sm text-base-content/70">{guestInfo.phone}</p>
                <button
                  onClick={() => setShowGuestForm(true)}
                  className="btn btn-ghost btn-sm mt-2"
                >
                  Edit
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Authenticated user info */}
      {isAuthenticated && user && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">Contact Information</h3>
            <p>{user.first_name} {user.last_name}</p>
            <p className="text-sm text-base-content/70">{user.email}</p>
            {user.phone && <p className="text-sm text-base-content/70">{user.phone}</p>}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={prevStep} className="btn btn-ghost" disabled={isSubmitting}>
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm || isSubmitting}
          className="btn btn-primary btn-lg"
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Processing...
            </>
          ) : (
            'Confirm Booking'
          )}
        </button>
      </div>
    </div>
  );
}
```

### GuestInfoForm Component
```typescript
interface GuestInfoFormProps {
  onSubmit: (data: GuestInfo) => void;
  initialData?: Partial<GuestInfo>;
}

export function GuestInfoForm({ onSubmit, initialData }: GuestInfoFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(guestInfoSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">First Name *</span>
          </label>
          <input
            {...register('firstName')}
            className={cn('input input-bordered', errors.firstName && 'input-error')}
          />
          {errors.firstName && (
            <span className="text-error text-sm mt-1">{errors.firstName.message}</span>
          )}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Last Name *</span>
          </label>
          <input
            {...register('lastName')}
            className={cn('input input-bordered', errors.lastName && 'input-error')}
          />
          {errors.lastName && (
            <span className="text-error text-sm mt-1">{errors.lastName.message}</span>
          )}
        </div>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Email *</span>
        </label>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          {...register('email')}
          className={cn('input input-bordered', errors.email && 'input-error')}
        />
        {errors.email && (
          <span className="text-error text-sm mt-1">{errors.email.message}</span>
        )}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Phone *</span>
        </label>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          {...register('phone')}
          className={cn('input input-bordered', errors.phone && 'input-error')}
          placeholder="(555) 123-4567"
        />
        {errors.phone && (
          <span className="text-error text-sm mt-1">{errors.phone.message}</span>
        )}
      </div>

      <button type="submit" className="btn btn-primary w-full">
        Save Contact Info
      </button>
    </form>
  );
}
```

## Acceptance Criteria
- [ ] Displays complete booking summary (service, pet, date/time, add-ons)
- [ ] Shows itemized pricing breakdown
- [ ] Shows estimated duration from service
- [ ] Guest info form shown for unauthenticated users
- [ ] Guest form validates all required fields
- [ ] Email and phone validation with helpful error messages
- [ ] Authenticated user info displayed (no form needed)
- [ ] Confirm button disabled until guest info provided
- [ ] Loading state shown during submission
- [ ] Error messages displayed on submission failure
- [ ] Back button allows returning to previous step

## Estimated Complexity
High

## Phase
Phase 4: Step Components Enhancement

## Dependencies
- Task 1 (validation schemas)
- Task 13 (useBookingSubmit hook)
