# Task 0255: Implement network and timeout error handling

**Phase**: 10.3 Error Handling
**Prerequisites**: 0253
**Estimated effort**: 2 hours

## Objective

Implement graceful handling of network errors and timeouts throughout the application.

## Requirements

- Display "Please check your internet connection" for network errors
- Display timeout messages with retry option
- Handle authentication expiry with login prompt
- Provide clear retry mechanisms

## Acceptance Criteria

- [ ] Network errors show connection message
- [ ] Timeout errors show clear message with retry
- [ ] Auth expiry redirects to login with return URL
- [ ] Retry mechanism available for failed requests
- [ ] Offline state detected and shown to user
- [ ] All network errors handled gracefully

## Implementation Details

### Files to Create

- `src/lib/errors/network-handler.ts`

### Files to Modify

- API fetch wrappers
- Auth middleware
- Components making network requests

### Network Error Handler

```typescript
export class NetworkErrorHandler {
  static async handleRequest<T>(
    requestFn: () => Promise<T>,
    options: {
      retries?: number;
      timeout?: number;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<T> {
    const { retries = 2, timeout = 30000, onError } = options;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Add timeout to request
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        );

        const result = await Promise.race([
          requestFn(),
          timeoutPromise,
        ]) as T;

        return result;
      } catch (error) {
        const isLastAttempt = attempt === retries;

        if (error instanceof TypeError && error.message.includes('fetch')) {
          if (isLastAttempt) {
            onError?.(error);
            throw new NetworkError('Please check your internet connection and try again.');
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }

        if (error.message === 'Request timeout') {
          if (isLastAttempt) {
            onError?.(error);
            throw new NetworkError('The request took too long. Please try again.');
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }

        // Non-network error, throw immediately
        throw error;
      }
    }

    throw new Error('Max retries reached');
  }

  static handleAuthExpiry() {
    const returnUrl = window.location.pathname;
    window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  }

  static isOnline(): boolean {
    return navigator.onLine;
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Usage
try {
  const data = await NetworkErrorHandler.handleRequest(
    () => fetch('/api/appointments').then(r => r.json()),
    {
      retries: 3,
      timeout: 10000,
      onError: (error) => {
        console.error('Request failed:', error);
      },
    }
  );
} catch (error) {
  if (error instanceof NetworkError) {
    showToast(error.message, 'error');
  }
}
```

### Online/Offline Detection

```typescript
// Add to root layout
useEffect(() => {
  const handleOnline = () => {
    showToast('Connection restored', 'success');
  };

  const handleOffline = () => {
    showToast('You are offline. Some features may not work.', 'warning');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

## References

- **Requirements**: Req 15.4-15.6
- **Design**: Section 10.3.4
