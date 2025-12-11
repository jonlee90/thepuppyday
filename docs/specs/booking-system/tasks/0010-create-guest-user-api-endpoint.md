# Task 10: Create POST /api/users/guest Endpoint

## Description
Create the API route for creating guest user accounts during the booking flow for unauthenticated customers.

## Files to create
- `src/app/api/users/guest/route.ts`

## Requirements References
- Req 7.3: Create user record with provided information when guest completes booking
- Req 7.5: Prompt to log in if email already exists

## Implementation Details

### Route: POST /api/users/guest

**Request Body:**
```json
{
  "email": "guest@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "555-987-6543"
}
```

**Response Format (Success):**
```json
{
  "user": {
    "id": "uuid",
    "email": "guest@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "customer"
  }
}
```

**Response Format (Email Exists):**
```json
{
  "error": "An account with this email already exists. Please log in.",
  "code": "EMAIL_EXISTS"
}
```

**Business Logic:**
1. Validate request body (email, first_name, last_name required; phone optional)
2. Check if email already exists in users table
3. If exists, return 409 with prompt to log in
4. Create new user with role = "customer"
5. (Future: Send welcome email with account claim instructions)
6. Return user data

**Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/mocks/supabase/store';
import { guestInfoSchema } from '@/lib/booking/validation';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = guestInfoSchema.parse(body);

    const store = getMockStore();

    // Check if email already exists
    const existingUsers = store.select('users', {
      column: 'email',
      value: validated.email.toLowerCase(),
    });

    if (existingUsers.length > 0) {
      return NextResponse.json({
        error: 'An account with this email already exists. Please log in.',
        code: 'EMAIL_EXISTS',
      }, { status: 409 });
    }

    // Create guest user
    const user = {
      id: uuidv4(),
      email: validated.email.toLowerCase(),
      first_name: validated.firstName,
      last_name: validated.lastName,
      phone: validated.phone || null,
      role: 'customer',
      avatar_url: null,
      preferences: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.insert('users', user);

    // TODO: Send welcome email with account claim instructions

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating guest user:', error);
    return NextResponse.json(
      { error: 'Failed to create guest account' },
      { status: 500 }
    );
  }
}
```

## Acceptance Criteria
- [x] Validates required fields (email, first_name, last_name)
- [x] Validates email format
- [x] Validates phone format if provided
- [x] Returns 400 for validation errors
- [x] Checks for existing email (case-insensitive)
- [x] Returns 409 with EMAIL_EXISTS code if email taken
- [x] Creates user with role "customer"
- [x] Stores email in lowercase
- [x] Returns user data without sensitive fields

## Status
✅ **COMPLETED** - Implemented in commit 1b00eca

## Estimated Complexity
Medium

## Phase
Phase 2: API Routes

## Dependencies
- Task 1 (validation schemas)
- Task 2 (mock data structure for users table)
