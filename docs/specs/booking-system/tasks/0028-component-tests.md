# Task 28: Write Component Tests for Booking Steps

## Description
Create React Testing Library tests for the booking step components, testing user interactions, form submissions, and error states.

## Files to create
- `src/components/booking/__tests__/ServiceStep.test.tsx`
- `src/components/booking/__tests__/PetStep.test.tsx`
- `src/components/booking/__tests__/DateTimeStep.test.tsx`
- `src/components/booking/__tests__/AddonsStep.test.tsx`

## Requirements References
- Req 2.3: Highlight selected service and enable "Next" button
- Req 3.2: Load pet's size and update service price
- Req 4.8: Display selected date and time prominently and enable "Next" button
- Req 5.3: Add selected add-on to running total

## Implementation Details

### Test Utilities
```typescript
// test-utils/render-with-providers.tsx
import { render } from '@testing-library/react';
import { PropsWithChildren } from 'react';

function AllProviders({ children }: PropsWithChildren) {
  return (
    <div>
      {/* Add necessary providers */}
      {children}
    </div>
  );
}

export function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: AllProviders });
}

export * from '@testing-library/react';
```

### ServiceStep.test.tsx
```typescript
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils/render-with-providers';
import { ServiceStep } from '../steps/ServiceStep';
import { useBookingStore } from '@/stores/bookingStore';

// Mock the hooks
jest.mock('@/hooks/useServices', () => ({
  useServices: () => ({
    services: [
      {
        id: 'service-1',
        name: 'Basic Grooming',
        description: 'Test description',
        duration_minutes: 60,
        prices: [
          { size: 'small', price: 40 },
          { size: 'medium', price: 55 },
        ],
      },
      {
        id: 'service-2',
        name: 'Premium Grooming',
        description: 'Premium description',
        duration_minutes: 90,
        prices: [
          { size: 'small', price: 70 },
          { size: 'medium', price: 95 },
        ],
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('ServiceStep', () => {
  beforeEach(() => {
    useBookingStore.getState().reset();
  });

  it('renders all services', () => {
    renderWithProviders(<ServiceStep />);

    expect(screen.getByText('Basic Grooming')).toBeInTheDocument();
    expect(screen.getByText('Premium Grooming')).toBeInTheDocument();
  });

  it('displays price range for services', () => {
    renderWithProviders(<ServiceStep />);

    expect(screen.getByText(/\$40/)).toBeInTheDocument();
    expect(screen.getByText(/\$70/)).toBeInTheDocument();
  });

  it('Continue button is disabled when no service selected', () => {
    renderWithProviders(<ServiceStep />);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeDisabled();
  });

  it('selecting a service enables Continue button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ServiceStep />);

    const serviceCard = screen.getByText('Basic Grooming').closest('div[class*="card"]');
    await user.click(serviceCard!);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeEnabled();
  });

  it('highlights selected service', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ServiceStep />);

    const serviceCard = screen.getByText('Basic Grooming').closest('div[class*="card"]');
    await user.click(serviceCard!);

    expect(serviceCard).toHaveClass('ring-2');
  });

  it('updates store when service selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ServiceStep />);

    const serviceCard = screen.getByText('Basic Grooming').closest('div[class*="card"]');
    await user.click(serviceCard!);

    expect(useBookingStore.getState().selectedServiceId).toBe('service-1');
  });

  it('shows loading state', () => {
    jest.spyOn(require('@/hooks/useServices'), 'useServices').mockReturnValue({
      services: [],
      isLoading: true,
      error: null,
    });

    renderWithProviders(<ServiceStep />);

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});
```

### PetStep.test.tsx
```typescript
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils/render-with-providers';
import { PetStep } from '../steps/PetStep';
import { useBookingStore } from '@/stores/bookingStore';

jest.mock('@/hooks/usePets', () => ({
  usePets: () => ({
    pets: [
      { id: 'pet-1', name: 'Max', size: 'medium', breed_custom: 'Labrador' },
      { id: 'pet-2', name: 'Bella', size: 'small', breed_custom: 'Chihuahua' },
    ],
    isLoading: false,
    error: null,
    createPet: jest.fn(),
  }),
}));

describe('PetStep', () => {
  beforeEach(() => {
    useBookingStore.getState().reset();
    useBookingStore.getState().selectService({
      id: 'service-1',
      name: 'Basic',
      prices: [
        { size: 'small', price: 40 },
        { size: 'medium', price: 55 },
      ],
    });
  });

  it('renders existing pets', () => {
    renderWithProviders(<PetStep />);

    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('Bella')).toBeInTheDocument();
  });

  it('displays pet size badges', () => {
    renderWithProviders(<PetStep />);

    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('small')).toBeInTheDocument();
  });

  it('selecting pet updates store and price', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PetStep />);

    await user.click(screen.getByText('Max'));

    expect(useBookingStore.getState().selectedPetId).toBe('pet-1');
    expect(useBookingStore.getState().petSize).toBe('medium');
    expect(useBookingStore.getState().servicePrice).toBe(55);
  });

  it('shows Add New Pet option', () => {
    renderWithProviders(<PetStep />);

    expect(screen.getByText(/add new pet/i)).toBeInTheDocument();
  });

  it('clicking Add New Pet shows form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PetStep />);

    await user.click(screen.getByText(/add new pet/i));

    expect(screen.getByLabelText(/pet name/i)).toBeInTheDocument();
    expect(screen.getByText(/size/i)).toBeInTheDocument();
  });
});
```

### DateTimeStep.test.tsx
```typescript
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils/render-with-providers';
import { DateTimeStep } from '../steps/DateTimeStep';
import { useBookingStore } from '@/stores/bookingStore';

jest.mock('@/hooks/useAvailability', () => ({
  useAvailability: () => ({
    slots: [
      { time: '09:00', available: true },
      { time: '09:30', available: true },
      { time: '10:00', available: false, waitlistCount: 2 },
      { time: '10:30', available: true },
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

describe('DateTimeStep', () => {
  beforeEach(() => {
    useBookingStore.getState().reset();
    // Setup prerequisites
  });

  it('renders calendar', () => {
    renderWithProviders(<DateTimeStep />);

    expect(screen.getByLabelText(/booking progress/i)).toBeInTheDocument();
    // Check for month display
  });

  it('shows time slots when date selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DateTimeStep />);

    // Select a date
    const dateButton = screen.getByLabelText(/december 15/i);
    await user.click(dateButton);

    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('9:30 AM')).toBeInTheDocument();
  });

  it('shows unavailable slot with waitlist option', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DateTimeStep />);

    // Select a date
    const dateButton = screen.getByLabelText(/december 15/i);
    await user.click(dateButton);

    const unavailableSlot = screen.getByText('10:00 AM').closest('button');
    expect(unavailableSlot).toHaveTextContent(/join waitlist/i);
    expect(unavailableSlot).toHaveTextContent('2 waiting');
  });

  it('Continue button disabled until time selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DateTimeStep />);

    const dateButton = screen.getByLabelText(/december 15/i);
    await user.click(dateButton);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeDisabled();

    await user.click(screen.getByText('9:00 AM'));
    expect(continueButton).toBeEnabled();
  });

  it('displays selected date and time', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DateTimeStep />);

    await user.click(screen.getByLabelText(/december 15/i));
    await user.click(screen.getByText('9:00 AM'));

    expect(screen.getByText(/december 15/i)).toBeInTheDocument();
    expect(screen.getByText(/9:00 am/i)).toBeInTheDocument();
  });
});
```

### AddonsStep.test.tsx
```typescript
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils/render-with-providers';
import { AddonsStep } from '../steps/AddonsStep';
import { useBookingStore } from '@/stores/bookingStore';

jest.mock('@/hooks/useAddons', () => ({
  useAddons: () => ({
    addons: [
      { id: 'addon-1', name: 'Teeth Brushing', description: 'Test', price: 10 },
      { id: 'addon-2', name: 'Pawdicure', description: 'Test', price: 15 },
    ],
    isLoading: false,
    error: null,
    getUpsellAddons: () => [],
  }),
}));

describe('AddonsStep', () => {
  beforeEach(() => {
    useBookingStore.getState().reset();
    useBookingStore.getState().selectService({
      id: 'service-1',
      name: 'Basic',
      prices: [{ size: 'medium', price: 55 }],
    });
    useBookingStore.getState().setPetSize('medium');
  });

  it('renders all addons', () => {
    renderWithProviders(<AddonsStep />);

    expect(screen.getByText('Teeth Brushing')).toBeInTheDocument();
    expect(screen.getByText('Pawdicure')).toBeInTheDocument();
  });

  it('displays addon prices', () => {
    renderWithProviders(<AddonsStep />);

    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('$15.00')).toBeInTheDocument();
  });

  it('clicking addon toggles selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddonsStep />);

    const addonCard = screen.getByText('Teeth Brushing').closest('div[class*="card"]');
    await user.click(addonCard!);

    expect(useBookingStore.getState().selectedAddonIds).toContain('addon-1');

    await user.click(addonCard!);
    expect(useBookingStore.getState().selectedAddonIds).not.toContain('addon-1');
  });

  it('updates running total when addon selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddonsStep />);

    await user.click(screen.getByText('Teeth Brushing'));
    await user.click(screen.getByText('Pawdicure'));

    expect(useBookingStore.getState().addonsTotal).toBe(25);
    expect(useBookingStore.getState().totalPrice).toBe(80); // 55 + 25
  });

  it('shows Skip option when no addons selected', () => {
    renderWithProviders(<AddonsStep />);

    expect(screen.getByText(/skip/i)).toBeInTheDocument();
  });

  it('shows Continue when addons selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddonsStep />);

    await user.click(screen.getByText('Teeth Brushing'));

    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });
});
```

## Acceptance Criteria
- [ ] ServiceStep renders services and handles selection
- [ ] ServiceStep enables Continue when service selected
- [ ] PetStep renders existing pets
- [ ] PetStep updates price when pet selected
- [ ] PetStep shows Add New Pet form
- [ ] DateTimeStep shows time slots for selected date
- [ ] DateTimeStep shows waitlist option for unavailable slots
- [ ] DateTimeStep enables Continue when date+time selected
- [ ] AddonsStep renders addons with prices
- [ ] AddonsStep toggles selection on click
- [ ] AddonsStep updates running total
- [ ] All components handle loading states
- [ ] All tests pass with `npm run test`

## Estimated Complexity
High

## Phase
Phase 8: Testing

## Dependencies
- Tasks 14-18 (step components to test)
- Tasks 3 (hooks to mock)
