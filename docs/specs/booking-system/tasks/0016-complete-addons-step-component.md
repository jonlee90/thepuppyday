# Task 16: Complete AddonsStep Component

## Description
Enhance the AddonsStep component to display add-on cards with upsell highlighting and running total animation.

## Files to modify/create
- `src/components/booking/steps/AddonsStep.tsx`
- `src/components/booking/AddonCard.tsx`

## Requirements References
- Req 5.1: Display all active add-ons with name, description, and price
- Req 5.2: Highlight breed-specific upsells with upsell_prompt message
- Req 5.3: Add selected add-on to running total displayed on screen
- Req 5.4: Remove deselected add-on from running total
- Req 5.5: Display clear itemized list with individual prices when multiple selected
- Req 5.6: Allow skipping with "No Thanks" option

## Implementation Details

### AddonsStep Component
```typescript
export function AddonsStep() {
  const { addons, isLoading, error, getUpsellAddons } = useAddons();
  const {
    selectedAddons,
    selectedAddonIds,
    toggleAddon,
    selectedPet,
    totalPrice,
    nextStep,
    prevStep,
  } = useBookingStore();

  // Get breed-specific upsell add-ons
  const upsellAddons = getUpsellAddons(selectedPet?.breed_id || null);
  const upsellIds = new Set(upsellAddons.map(a => a.id));

  // Sort: upsells first, then by display_order
  const sortedAddons = [...addons].sort((a, b) => {
    const aIsUpsell = upsellIds.has(a.id);
    const bIsUpsell = upsellIds.has(b.id);
    if (aIsUpsell && !bIsUpsell) return -1;
    if (!aIsUpsell && bIsUpsell) return 1;
    return a.display_order - b.display_order;
  });

  const handleToggle = (addon: Addon) => {
    toggleAddon(addon);
  };

  if (isLoading) return <AddonsSkeleton />;
  if (error) return <ErrorDisplay />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Add Extra Services</h2>
        <p className="text-base-content/70">
          Enhance your pet's grooming experience with these add-ons
        </p>
      </div>

      {/* Upsell banner if applicable */}
      {upsellAddons.length > 0 && (
        <div className="alert alert-info">
          <svg className="w-6 h-6">...</svg>
          <span>We recommend these add-ons for your pet's breed!</span>
        </div>
      )}

      {/* Add-ons grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedAddons.map(addon => (
          <AddonCard
            key={addon.id}
            addon={addon}
            isSelected={selectedAddonIds.includes(addon.id)}
            onToggle={() => handleToggle(addon)}
            isUpsell={upsellIds.has(addon.id)}
            upsellMessage={addon.upsell_prompt}
          />
        ))}
      </div>

      {/* Selected add-ons summary */}
      {selectedAddons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-base-200 rounded-lg p-4"
        >
          <h3 className="font-medium mb-2">Selected Add-ons</h3>
          <ul className="space-y-1">
            {selectedAddons.map(addon => (
              <li key={addon.id} className="flex justify-between text-sm">
                <span>{addon.name}</span>
                <span>${addon.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={prevStep} className="btn btn-ghost">Back</button>
        <div className="flex gap-2">
          <button onClick={nextStep} className="btn btn-ghost">
            {selectedAddons.length === 0 ? 'Skip' : 'Continue'}
          </button>
          {selectedAddons.length > 0 && (
            <button onClick={nextStep} className="btn btn-primary">
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### AddonCard Component
```typescript
interface AddonCardProps {
  addon: Addon;
  isSelected: boolean;
  onToggle: () => void;
  isUpsell?: boolean;
  upsellMessage?: string | null;
}

export function AddonCard({
  addon,
  isSelected,
  onToggle,
  isUpsell = false,
  upsellMessage,
}: AddonCardProps) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        'card bg-base-100 cursor-pointer transition-all hover:shadow-md relative overflow-hidden',
        isSelected && 'ring-2 ring-primary',
        isUpsell && 'border-2 border-warning'
      )}
    >
      {/* Upsell badge */}
      {isUpsell && (
        <div className="absolute top-0 right-0 bg-warning text-warning-content px-2 py-1 text-xs font-medium rounded-bl">
          Recommended
        </div>
      )}

      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="card-title text-base">{addon.name}</h3>
            <p className="text-sm text-base-content/70">{addon.description}</p>
            {isUpsell && upsellMessage && (
              <p className="text-xs text-warning mt-1">{upsellMessage}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold">${addon.price.toFixed(2)}</span>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}}
              className="checkbox checkbox-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Acceptance Criteria
- [ ] Displays all active add-ons with name, description, price
- [ ] Breed-specific upsells shown first with "Recommended" badge
- [ ] Upsell message displayed when present
- [ ] Clicking card toggles selection
- [ ] Selected add-ons show check state and ring highlight
- [ ] Selected add-ons summary shows itemized list
- [ ] Running total updates with animation
- [ ] "Skip" option when no add-ons selected
- [ ] "Continue" button works with or without add-ons
- [ ] Loading skeleton shown while fetching
- [ ] Mobile-friendly layout (stacked cards)

## Estimated Complexity
Medium

## Phase
Phase 4: Step Components Enhancement

## Dependencies
- Task 3 (useAddons hook)
- Task 5 (addons API)
- Task 12 (hook integration pattern)
