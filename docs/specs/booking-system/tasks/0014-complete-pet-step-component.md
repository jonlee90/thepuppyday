# Task 14: Complete PetStep Component

## Description
Enhance the PetStep component with full functionality including pet listing, selection, and creation form with real-time price updates.

## Files to modify/create
- `src/components/booking/steps/PetStep.tsx`
- `src/components/booking/PetForm.tsx`
- `src/components/booking/PetCard.tsx`

## Requirements References
- Req 3.1: Display user's existing active pets (if authenticated)
- Req 3.2: Load pet's size and update service price accordingly
- Req 3.3: Display pet creation form for new pets or when user has no pets
- Req 3.4: Require name, size; optionally breed and weight
- Req 3.6: Immediately recalculate and display updated service price
- Req 3.7: Collect pet information for guests without requiring account creation

## Implementation Details

### PetStep Component
```typescript
export function PetStep() {
  const [showForm, setShowForm] = useState(false);
  const { pets, isLoading, createPet } = usePets();
  const { isAuthenticated } = useAuth();
  const {
    selectedPetId,
    selectPet,
    setNewPetData,
    petSize,
    setPetSize,
    nextStep,
    prevStep,
  } = useBookingStore();

  // Show form immediately for guests or if user has no pets
  const shouldShowForm = !isAuthenticated || pets.length === 0 || showForm;

  const handleSelectPet = (pet: Pet) => {
    selectPet(pet);
    // Price is automatically recalculated in store
  };

  const handleCreatePet = async (data: CreatePetInput) => {
    if (isAuthenticated) {
      // Create in database
      const pet = await createPet(data);
      selectPet(pet);
    } else {
      // Store for guest - will create on booking confirmation
      setNewPetData(data);
    }
    setShowForm(false);
  };

  const canContinue = petSize !== null;

  // ... render logic
}
```

### PetCard Component
Display pet with selection state:
```typescript
interface PetCardProps {
  pet: Pet;
  isSelected: boolean;
  onSelect: (pet: Pet) => void;
  showSize?: boolean;
}

export function PetCard({ pet, isSelected, onSelect, showSize = true }: PetCardProps) {
  return (
    <div
      onClick={() => onSelect(pet)}
      className={cn(
        'card bg-base-100 cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary'
      )}
    >
      {/* Pet avatar/image */}
      <div className="card-body">
        <h3 className="card-title">{pet.name}</h3>
        {pet.breed_custom && <p className="text-sm text-base-content/70">{pet.breed_custom}</p>}
        {showSize && (
          <div className="badge badge-outline">
            {pet.size} {pet.weight && `(${pet.weight} lbs)`}
          </div>
        )}
      </div>
    </div>
  );
}
```

### PetForm Component
Form for creating new pets:
```typescript
interface PetFormProps {
  onSubmit: (data: CreatePetInput) => void;
  onCancel?: () => void;
  initialData?: Partial<CreatePetInput>;
}

const sizeOptions = [
  { value: 'small', label: 'Small (0-18 lbs)', priceHint: 'Lowest price' },
  { value: 'medium', label: 'Medium (19-35 lbs)', priceHint: '' },
  { value: 'large', label: 'Large (36-65 lbs)', priceHint: '' },
  { value: 'xlarge', label: 'X-Large (66+ lbs)', priceHint: 'Highest price' },
];

export function PetForm({ onSubmit, onCancel, initialData }: PetFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(petFormSchema),
    defaultValues: initialData,
  });

  const selectedSize = watch('size');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name field */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Pet Name *</span>
        </label>
        <input {...register('name')} className="input input-bordered" />
        {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
      </div>

      {/* Size selection - visual cards */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Size *</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          {sizeOptions.map(option => (
            <SizeOptionCard
              key={option.value}
              {...option}
              isSelected={selectedSize === option.value}
              {...register('size')}
            />
          ))}
        </div>
        {errors.size && <ErrorMessage>{errors.size.message}</ErrorMessage>}
      </div>

      {/* Optional: Breed, Weight, Notes */}
      {/* ... */}

      <div className="flex gap-4">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-ghost flex-1">
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary flex-1">
          Save Pet
        </button>
      </div>
    </form>
  );
}
```

## Acceptance Criteria
- [ ] Displays list of existing pets for authenticated users
- [ ] Shows "Add New Pet" option even if user has existing pets
- [ ] Shows pet creation form directly for guests
- [ ] PetCard shows pet name, breed, size badge
- [ ] PetCard has clear selected state (ring highlight)
- [ ] PetForm validates name (required) and size (required)
- [ ] Size selection shows weight ranges for each size
- [ ] Selecting/creating pet updates price in real-time
- [ ] Continue button enabled only when pet size is selected
- [ ] Back button returns to service step

## Estimated Complexity
Medium

## Phase
Phase 4: Step Components Enhancement

## Dependencies
- Task 3 (usePets hook)
- Task 12 (hook integration pattern)
