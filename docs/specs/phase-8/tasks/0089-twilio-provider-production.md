# Task 0089: Implement TwilioProvider for production SMS

## Description
Create the production implementation of the SMS provider using the Twilio SDK.

## Acceptance Criteria
- [x] Create `TwilioProvider` class implementing `SMSProvider` interface
- [x] Initialize with Account SID, Auth Token, and phone number from environment variables
- [x] Implement `send()` method using Twilio SDK
- [x] Use "(657) 252-2903" as from phone number (convert to E.164 format)
- [x] Return Twilio message SID and segment count on success
- [x] Handle multi-part messages automatically (messages over 160 chars)
- [x] Handle and transform Twilio-specific errors
- [x] Write integration test (disabled by default, requires credentials)
- [x] Place in `src/lib/twilio/provider.ts`

## Implementation Notes
- **TwilioProvider** (`src/lib/twilio/provider.ts`, 240 lines):
  - Implements SMSProvider interface with full type safety
  - Constructor accepts accountSid, authToken, fromPhone (optional, defaults to env vars)
  - Validates TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set
  - Dynamic SDK import with graceful failure if not installed
  - Default from phone: +16572522903 (657) 252-2903 in E.164 format
  - Console logging with [Twilio] prefix and emojis (✅ success, ❌ failure)

- **send() Method**:
  - Normalizes phone numbers to E.164 format before sending
  - Calls client.messages.create() with body, to, from
  - Extracts segment count from Twilio response (message.numSegments)
  - Returns success with SID and segment count or failure with error
  - Handles multi-part messages automatically (>160 chars)

- **Phone Number Normalization**:
  - `normalizePhoneNumber()` converts various formats to E.164
  - (657) 252-2903 → +16572522903
  - 5551234567 → +15551234567 (adds +1)
  - 15551234567 → +15551234567 (adds +)
  - Already E.164 (+1...) → unchanged
  - Strips all non-digit characters first

- **Segment Count Calculation**:
  - Uses Twilio's numSegments from response when available
  - Falls back to local calculation: 160 single, 153 multi-segment
  - Returns 0 for empty messages

- **Error Handling**:
  - `transformError()` method converts Twilio errors to user-friendly messages
  - Error 20003: "Invalid Twilio credentials. Please check your Account SID and Auth Token."
  - Error 21211: "Invalid To phone number. Please use E.164 format..."
  - Error 21212: "Invalid From phone number. Please verify your Twilio phone number."
  - Error 21408: "Phone number not verified in Twilio..."
  - Error 21610: "Message cannot be sent. Recipient may have opted out."
  - Error 30007: "Message filtered by carrier. Content flagged as spam."
  - Rate limit/429: "Twilio rate limit exceeded. Please try again later."
  - Insufficient balance: "Insufficient Twilio account balance. Please add funds."

- **Factory Functions**:
  - `createTwilioProvider(accountSid?, authToken?, fromPhone?)` - Create new instance
  - `getTwilioProvider()` - Get global singleton
  - `resetTwilioProvider()` - Reset singleton (for testing)

- **Integration Tests** (`src/lib/twilio/__tests__/provider.integration.test.ts`, 240 lines):
  - Disabled by default with .skip to prevent accidental SMS costs
  - Success scenarios: simple SMS, custom from, multi-segment messages
  - Phone normalization tests for various formats
  - Error scenarios: invalid phone, unverified numbers
  - Factory function tests
  - Environment variable validation tests
  - Detailed setup instructions included in comments

- **Setup Requirements**:
  1. Install Twilio SDK: `npm install twilio`
  2. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER environment variables
  3. Verify phone number in Twilio console (for trial accounts)

- Passes all ESLint checks with no errors

## References
- Req 3.1, Req 3.4, Req 3.6, Req 3.7, Req 3.8

## Complexity
Medium

## Category
Real Provider Implementations
