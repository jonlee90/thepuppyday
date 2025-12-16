/**
 * Global test setup
 */

// Set up environment variables for tests
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-unit-tests-only';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.UNSUBSCRIBE_TOKEN_SECRET = 'test-unsubscribe-secret-key-for-unit-tests-only-32-chars';
