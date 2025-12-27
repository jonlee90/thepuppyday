# Task 0061: Create Mock Google Calendar API

**Phase**: 12 - Testing
**Task ID**: 12.2
**Status**: Pending

## Description

Create a comprehensive mock implementation of the Google Calendar API for testing purposes, allowing tests to run without actual API calls.

## Requirements

- Create `src/mocks/google-calendar.ts`
- Mock `events.list`, `events.insert`, `events.update`, `events.delete`
- Mock `calendarList.list` for calendar selection
- Mock OAuth token exchange
- Support configurable responses for different test scenarios
- Track API calls for verification

## Acceptance Criteria

- [ ] Mock module created at correct path
- [ ] All calendar event operations mocked
- [ ] Calendar list endpoint mocked
- [ ] OAuth operations mocked
- [ ] Configurable responses per test scenario
- [ ] API call tracking implemented
- [ ] Error simulation supported
- [ ] Rate limit simulation supported
- [ ] Proper TypeScript types defined
- [ ] Documentation for usage in tests

## Related Requirements

- Req 29.2: Mocked Google Calendar API for testing

## Mock Structure

```typescript
// src/mocks/google-calendar.ts

export interface MockConfig {
  events?: {
    list?: () => Promise<any> | Error;
    insert?: () => Promise<any> | Error;
    update?: () => Promise<any> | Error;
    delete?: () => Promise<any> | Error;
  };
  calendars?: {
    list?: () => Promise<any> | Error;
  };
  auth?: {
    getToken?: () => Promise<any> | Error;
    revokeToken?: () => Promise<any> | Error;
  };
  rateLimit?: {
    enabled: boolean;
    threshold: number;
  };
}

export class MockGoogleCalendar {
  private config: MockConfig;
  private callLog: APICall[] = [];

  constructor(config?: MockConfig) {
    this.config = config || {};
  }

  // Event operations
  async listEvents(params: any): Promise<any> {
    this.logCall('events.list', params);

    if (this.config.events?.list) {
      return this.handleMockResponse(this.config.events.list());
    }

    return this.defaultEventsList(params);
  }

  async insertEvent(params: any): Promise<any> {
    this.logCall('events.insert', params);

    if (this.config.events?.insert) {
      return this.handleMockResponse(this.config.events.insert());
    }

    return this.defaultEventsInsert(params);
  }

  async updateEvent(params: any): Promise<any> {
    this.logCall('events.update', params);

    if (this.config.events?.update) {
      return this.handleMockResponse(this.config.events.update());
    }

    return this.defaultEventsUpdate(params);
  }

  async deleteEvent(params: any): Promise<any> {
    this.logCall('events.delete', params);

    if (this.config.events?.delete) {
      return this.handleMockResponse(this.config.events.delete());
    }

    return this.defaultEventsDelete(params);
  }

  // Helper methods
  private logCall(method: string, params: any) {
    this.callLog.push({
      method,
      params,
      timestamp: new Date(),
    });
  }

  getCallLog() {
    return this.callLog;
  }

  resetCallLog() {
    this.callLog = [];
  }
}
```

## Default Mock Responses

### Events List

```typescript
private defaultEventsList(params: any) {
  return {
    data: {
      items: [
        {
          id: 'mock-event-1',
          summary: 'Full Groom - Max (John Doe)',
          description: 'Customer: John Doe\nPhone: 555-1234\nEmail: john@example.com\nPet: Max\nService: Full Grooming',
          start: { dateTime: '2025-12-26T14:00:00-08:00' },
          end: { dateTime: '2025-12-26T15:30:00-08:00' },
          location: '123 Main St, La Mirada, CA',
          colorId: '5',
          status: 'confirmed',
        },
        {
          id: 'mock-event-2',
          summary: 'Basic Bath - Bella (Jane Smith)',
          description: 'Customer: Jane Smith\nPhone: 555-5678\nPet: Bella',
          start: { dateTime: '2025-12-26T16:00:00-08:00' },
          end: { dateTime: '2025-12-26T17:00:00-08:00' },
          location: '123 Main St, La Mirada, CA',
          colorId: '5',
          status: 'confirmed',
        },
      ],
      nextPageToken: null,
    },
  };
}
```

### Events Insert

```typescript
private defaultEventsInsert(params: any) {
  return {
    data: {
      id: `mock-event-${Date.now()}`,
      ...params.resource,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      htmlLink: 'https://calendar.google.com/calendar/event?eid=mock',
    },
  };
}
```

### Calendar List

```typescript
private defaultCalendarsList() {
  return {
    data: {
      items: [
        {
          id: 'primary',
          summary: 'admin@thepuppyday.com',
          description: 'Primary calendar',
          timeZone: 'America/Los_Angeles',
          primary: true,
          accessRole: 'owner',
        },
        {
          id: 'appointments@thepuppyday.com',
          summary: 'Appointments',
          description: 'Grooming appointments',
          timeZone: 'America/Los_Angeles',
          primary: false,
          accessRole: 'owner',
        },
      ],
    },
  };
}
```

## Error Simulation

```typescript
// Simulate rate limit error
const mockWithRateLimit = new MockGoogleCalendar({
  events: {
    insert: () => {
      throw new Error('Rate limit exceeded (429)');
    },
  },
});

// Simulate auth error
const mockWithAuthError = new MockGoogleCalendar({
  events: {
    list: () => {
      throw new Error('Invalid credentials (401)');
    },
  },
});

// Simulate network timeout
const mockWithTimeout = new MockGoogleCalendar({
  events: {
    update: () => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100);
      });
    },
  },
});
```

## Usage in Tests

```typescript
import { MockGoogleCalendar } from '@/mocks/google-calendar';

describe('Calendar Sync', () => {
  let mockCalendar: MockGoogleCalendar;

  beforeEach(() => {
    mockCalendar = new MockGoogleCalendar();
    // Inject mock into calendar client
    jest.spyOn(googleClient, 'calendar').mockReturnValue(mockCalendar);
  });

  it('should create event successfully', async () => {
    const result = await syncAppointmentToGoogle(appointment);

    expect(result.success).toBe(true);
    expect(mockCalendar.getCallLog()).toHaveLength(1);
    expect(mockCalendar.getCallLog()[0].method).toBe('events.insert');
  });

  it('should handle rate limit errors', async () => {
    mockCalendar = new MockGoogleCalendar({
      events: {
        insert: () => { throw new Error('Rate limit (429)'); },
      },
    });

    await expect(syncAppointmentToGoogle(appointment)).rejects.toThrow('Rate limit');
  });
});
```

## Testing Checklist

- [ ] Mock module created
- [ ] All event operations mocked
- [ ] Calendar list mocked
- [ ] OAuth operations mocked
- [ ] Default responses implemented
- [ ] Error simulation working
- [ ] Call tracking implemented
- [ ] Documentation complete
- [ ] Used in integration tests
- [ ] TypeScript types defined
