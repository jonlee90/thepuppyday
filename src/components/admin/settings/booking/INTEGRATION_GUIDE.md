# RecurringBlockedDays Integration Guide

## Quick Start

### 1. Import the Component

```tsx
import { RecurringBlockedDays } from '@/components/admin/settings/booking';
```

### 2. Basic Usage

```tsx
function BookingSettingsPage() {
  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    min_advance_hours: 2,
    max_advance_days: 90,
    cancellation_cutoff_hours: 24,
    buffer_minutes: 15,
    blocked_dates: [],
    recurring_blocked_days: [0], // Sundays blocked
  });

  return (
    <RecurringBlockedDays
      bookingSettings={bookingSettings}
      onSettingsSaved={(updatedSettings) => {
        setBookingSettings(updatedSettings);
      }}
    />
  );
}
```

## Integration Scenarios

### Scenario 1: Standalone Page

Use RecurringBlockedDays as the primary component on its own page.

```tsx
// app/(admin)/settings/recurring-blocks/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { RecurringBlockedDays } from '@/components/admin/settings/booking';
import type { BookingSettings } from '@/types/settings';

export default function RecurringBlocksPage() {
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/booking');
      const data = await response.json();
      setSettings(data.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading loading-spinner"></div>;
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#434E54] mb-6">
        Recurring Blocked Days
      </h1>
      <RecurringBlockedDays
        bookingSettings={settings}
        onSettingsSaved={setSettings}
      />
    </div>
  );
}
```

### Scenario 2: Tabbed Settings Page

Integrate RecurringBlockedDays as one tab in a larger settings interface.

```tsx
// app/(admin)/settings/booking/page.tsx
'use client';

import { useState } from 'react';
import { AdvanceBookingWindow } from '@/components/admin/settings/booking';
import { CancellationPolicy } from '@/components/admin/settings/booking';
import { BlockedDatesSection } from '@/components/admin/settings/booking';
import { RecurringBlockedDays } from '@/components/admin/settings/booking';

export default function BookingSettingsPage() {
  const [activeTab, setActiveTab] = useState('advance');
  const [settings, setSettings] = useState<BookingSettings>(/* ... */);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`tab ${activeTab === 'advance' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('advance')}
        >
          Booking Window
        </button>
        <button
          className={`tab ${activeTab === 'cancellation' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('cancellation')}
        >
          Cancellation
        </button>
        <button
          className={`tab ${activeTab === 'blocked-dates' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('blocked-dates')}
        >
          Blocked Dates
        </button>
        <button
          className={`tab ${activeTab === 'recurring' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('recurring')}
        >
          Recurring Blocks
        </button>
      </div>

      {/* Content */}
      {activeTab === 'advance' && (
        <AdvanceBookingWindow
          bookingSettings={settings}
          onSettingsSaved={setSettings}
        />
      )}

      {activeTab === 'cancellation' && (
        <CancellationPolicy
          bookingSettings={settings}
          onSettingsSaved={setSettings}
        />
      )}

      {activeTab === 'blocked-dates' && (
        <BlockedDatesSection
          blockedDates={settings.blocked_dates}
          onBlockedDatesChange={(dates) => {
            setSettings({ ...settings, blocked_dates: dates });
          }}
        />
      )}

      {activeTab === 'recurring' && (
        <RecurringBlockedDays
          bookingSettings={settings}
          onSettingsSaved={setSettings}
        />
      )}
    </div>
  );
}
```

### Scenario 3: Accordion Layout

Show RecurringBlockedDays in a collapsible accordion section.

```tsx
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { RecurringBlockedDays } from '@/components/admin/settings/booking';

export default function BookingSettingsAccordion() {
  const [openSections, setOpenSections] = useState<string[]>(['recurring']);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  return (
    <div className="space-y-4">
      {/* Recurring Blocks Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('recurring')}
          className="w-full flex items-center justify-between p-6 hover:bg-[#F8EEE5] transition-colors"
        >
          <h2 className="text-lg font-semibold text-[#434E54]">
            Recurring Blocked Days
          </h2>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              openSections.includes('recurring') ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.includes('recurring') && (
          <div className="p-6 border-t border-gray-200">
            <RecurringBlockedDays
              bookingSettings={settings}
              onSettingsSaved={setSettings}
            />
          </div>
        )}
      </div>

      {/* Other sections... */}
    </div>
  );
}
```

## State Management Examples

### With React Context

```tsx
// contexts/BookingSettingsContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { BookingSettings } from '@/types/settings';

interface BookingSettingsContextType {
  settings: BookingSettings | null;
  updateSettings: (settings: BookingSettings) => void;
  isLoading: boolean;
}

const BookingSettingsContext = createContext<BookingSettingsContextType | null>(null);

export function BookingSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/booking');
      const data = await response.json();
      setSettings(data.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BookingSettingsContext.Provider
      value={{
        settings,
        updateSettings: setSettings,
        isLoading,
      }}
    >
      {children}
    </BookingSettingsContext.Provider>
  );
}

export const useBookingSettings = () => {
  const context = useContext(BookingSettingsContext);
  if (!context) {
    throw new Error('useBookingSettings must be used within BookingSettingsProvider');
  }
  return context;
};

// Usage in component
function RecurringBlocksWithContext() {
  const { settings, updateSettings } = useBookingSettings();

  if (!settings) return null;

  return (
    <RecurringBlockedDays
      bookingSettings={settings}
      onSettingsSaved={updateSettings}
    />
  );
}
```

### With Zustand Store

```tsx
// stores/bookingSettingsStore.ts
import create from 'zustand';
import type { BookingSettings } from '@/types/settings';

interface BookingSettingsStore {
  settings: BookingSettings | null;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: BookingSettings) => void;
}

export const useBookingSettingsStore = create<BookingSettingsStore>((set) => ({
  settings: null,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/admin/settings/booking');
      const data = await response.json();
      set({ settings: data.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      set({ isLoading: false });
    }
  },

  updateSettings: (settings) => {
    set({ settings });
  },
}));

// Usage in component
function RecurringBlocksWithZustand() {
  const { settings, updateSettings } = useBookingSettingsStore();

  if (!settings) return null;

  return (
    <RecurringBlockedDays
      bookingSettings={settings}
      onSettingsSaved={updateSettings}
    />
  );
}
```

## API Integration Patterns

### With SWR (Recommended)

```tsx
import useSWR from 'swr';
import { RecurringBlockedDays } from '@/components/admin/settings/booking';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function RecurringBlocksWithSWR() {
  const { data, error, mutate } = useSWR(
    '/api/admin/settings/booking',
    fetcher
  );

  if (error) return <div>Failed to load</div>;
  if (!data) return <div className="loading loading-spinner"></div>;

  return (
    <RecurringBlockedDays
      bookingSettings={data.data}
      onSettingsSaved={(updatedSettings) => {
        // Optimistically update local state
        mutate({ data: updatedSettings }, false);
      }}
    />
  );
}
```

### With React Query

```tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { RecurringBlockedDays } from '@/components/admin/settings/booking';

function RecurringBlocksWithReactQuery() {
  const { data, isLoading } = useQuery({
    queryKey: ['bookingSettings'],
    queryFn: () =>
      fetch('/api/admin/settings/booking').then((r) => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (settings: BookingSettings) =>
      fetch('/api/admin/settings/booking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      }).then((r) => r.json()),
  });

  if (isLoading) return <div className="loading loading-spinner"></div>;
  if (!data) return null;

  return (
    <RecurringBlockedDays
      bookingSettings={data.data}
      onSettingsSaved={(updatedSettings) => {
        mutation.mutate(updatedSettings);
      }}
    />
  );
}
```

## Loading State Integration

### Show Loading Overlay

```tsx
function RecurringBlocksWithOverlay() {
  const [settings, setSettings] = useState<BookingSettings>(/* ... */);
  const [isComponentLoading, setIsComponentLoading] = useState(false);

  return (
    <div className="relative">
      <RecurringBlockedDays
        bookingSettings={settings}
        onSettingsSaved={setSettings}
        onLoadingChange={setIsComponentLoading}
      />

      {isComponentLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      )}
    </div>
  );
}
```

### Disable Other Actions

```tsx
function BookingSettingsWithActions() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <RecurringBlockedDays
        bookingSettings={settings}
        onSettingsSaved={setSettings}
        onLoadingChange={setIsLoading}
      />

      <div className="mt-6 flex gap-2">
        <button disabled={isLoading} className="btn">
          Export Settings
        </button>
        <button disabled={isLoading} className="btn">
          Import Settings
        </button>
      </div>
    </div>
  );
}
```

## Error Handling

### With Error Boundary

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function RecurringBlocksWithErrorBoundary() {
  return (
    <ErrorBoundary
      fallback={
        <div className="alert alert-error">
          <span>Failed to load recurring blocked days settings</span>
        </div>
      }
      onError={(error) => {
        console.error('RecurringBlockedDays error:', error);
      }}
    >
      <RecurringBlockedDays
        bookingSettings={settings}
        onSettingsSaved={setSettings}
      />
    </ErrorBoundary>
  );
}
```

### Manual Error Handling

```tsx
function RecurringBlocksWithErrorHandling() {
  const [error, setError] = useState<string | null>(null);

  const handleSettingsSaved = async (updatedSettings: BookingSettings) => {
    try {
      setError(null);
      const response = await fetch('/api/admin/settings/booking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await response.json();
      setSettings(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div>
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}
      <RecurringBlockedDays
        bookingSettings={settings}
        onSettingsSaved={handleSettingsSaved}
      />
    </div>
  );
}
```

## Testing

### Unit Test Example (Jest + React Testing Library)

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecurringBlockedDays } from './RecurringBlockedDays';

describe('RecurringBlockedDays', () => {
  const mockSettings: BookingSettings = {
    min_advance_hours: 2,
    max_advance_days: 90,
    cancellation_cutoff_hours: 24,
    buffer_minutes: 15,
    blocked_dates: [],
    recurring_blocked_days: [0],
  };

  it('renders day toggles', () => {
    render(
      <RecurringBlockedDays
        bookingSettings={mockSettings}
        onSettingsSaved={jest.fn()}
      />
    );

    expect(screen.getByText('Sunday')).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
    // ... etc
  });

  it('shows blocked state for Sunday', () => {
    render(
      <RecurringBlockedDays
        bookingSettings={mockSettings}
        onSettingsSaved={jest.fn()}
      />
    );

    const sundayToggle = screen.getByLabelText('Sunday');
    expect(sundayToggle).toBeChecked();
  });

  it('calls onSettingsSaved when saving', async () => {
    const onSettingsSaved = jest.fn();
    render(
      <RecurringBlockedDays
        bookingSettings={mockSettings}
        onSettingsSaved={onSettingsSaved}
      />
    );

    // Toggle Monday on
    const mondayToggle = screen.getByLabelText('Monday');
    fireEvent.click(mondayToggle);

    // Click save
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSettingsSaved).toHaveBeenCalled();
    });
  });
});
```

## Best Practices

1. **Always provide error handling** for failed API calls
2. **Use loading states** to prevent user confusion
3. **Validate settings** before saving
4. **Show feedback** via toasts or alerts
5. **Preserve user changes** during navigation
6. **Test edge cases** (all days blocked, no days blocked)
7. **Consider mobile users** with responsive design
8. **Provide help text** for complex features
9. **Log important actions** for audit trails
10. **Keep state in sync** across components
