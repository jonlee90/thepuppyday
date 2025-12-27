# Task 0065: Create Environment Variable Documentation

**Phase**: 13 - Documentation and Deployment
**Task ID**: 13.2
**Status**: Pending

## Description

Document all required environment variables for the Google Calendar integration, including generation instructions, security requirements, and configuration examples.

## Requirements

- Update `.env.example` with new variables
- Document `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` setup
- Document `CALENDAR_TOKEN_ENCRYPTION_KEY` generation
- Document webhook URL requirements
- Include security best practices
- Provide step-by-step setup guide

## Acceptance Criteria

- [ ] `.env.example` updated with calendar variables
- [ ] Google OAuth credentials documented
- [ ] Encryption key generation documented
- [ ] Webhook URL configuration documented
- [ ] Security best practices included
- [ ] Example values provided (where safe)
- [ ] Setup guide created
- [ ] Validation requirements documented

## Related Requirements

- Req 30.4: API documentation and environment variables

## Environment Variables

### 1. Update .env.example

```env
# ==========================================
# Google Calendar Integration
# ==========================================

# Google OAuth 2.0 Credentials
# Obtain from: https://console.cloud.google.com/apis/credentials
# Required scopes: https://www.googleapis.com/auth/calendar.events
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Calendar Token Encryption
# Generate with: openssl rand -base64 32
# CRITICAL: Keep this secret safe. Changing it invalidates all stored tokens.
CALENDAR_TOKEN_ENCRYPTION_KEY=your-32-byte-encryption-key-here

# Webhook Configuration
# Your app's public URL for receiving Google Calendar push notifications
# Format: https://yourdomain.com (no trailing slash)
# Must be HTTPS in production
NEXT_PUBLIC_APP_URL=https://thepuppyday.com

# Optional: Calendar API Configuration
CALENDAR_SYNC_BATCH_SIZE=10          # Number of appointments to sync per batch
CALENDAR_SYNC_RETRY_ATTEMPTS=3       # Max retry attempts for failed syncs
CALENDAR_WEBHOOK_RENEWAL_DAYS=7      # Days before expiry to renew webhook
```

### 2. Setup Documentation

Create `docs/setup/google-calendar-setup.md`:

```markdown
# Google Calendar Integration Setup

## Prerequisites

- Google Cloud Platform account
- The Puppy Day app deployed with HTTPS enabled
- Admin access to The Puppy Day

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: "The Puppy Day Calendar Integration"
4. Click "Create"
5. Wait for project creation

## Step 2: Enable Google Calendar API

1. In the Google Cloud Console, select your project
2. Navigate to **APIs & Services → Library**
3. Search for "Google Calendar API"
4. Click on it
5. Click "Enable"
6. Wait for API to be enabled

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select "External" (or "Internal" if using Google Workspace)
3. Click "Create"

**App Information:**
- App name: `The Puppy Day`
- User support email: `your-email@thepuppyday.com`
- Developer contact: `your-email@thepuppyday.com`

**Scopes:**
1. Click "Add or Remove Scopes"
2. Filter for `calendar`
3. Select: `https://www.googleapis.com/auth/calendar.events`
4. Click "Update"
5. Click "Save and Continue"

**Test Users** (for development):
- Add your Google account email
- Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "The Puppy Day Production"

**Authorized JavaScript origins:**
```
https://thepuppyday.com
```

**Authorized redirect URIs:**
```
https://thepuppyday.com/api/admin/calendar/auth/callback
```

5. Click "Create"
6. **Copy the Client ID and Client Secret** (you'll need these for .env)

![Screenshot: OAuth credentials](screenshots/oauth-credentials.png)

## Step 5: Generate Encryption Key

Generate a secure 32-byte key for encrypting OAuth tokens:

```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
$bytes = New-Object Byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Example output:**
```
lK8/mN2pQ5rS8tU7vW9xY0zA1bC3dE4fG6hI8jK0lM=
```

⚠️ **CRITICAL**: This key encrypts all calendar access tokens. Keep it secret and never commit it to version control. Store it in environment variables only.

## Step 6: Configure Environment Variables

Create or update `.env.local` (local development) or add to your hosting platform's environment variables:

```env
# Google OAuth Credentials (from Step 4)
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx

# Encryption Key (from Step 5)
CALENDAR_TOKEN_ENCRYPTION_KEY=lK8/mN2pQ5rS8tU7vW9xY0zA1bC3dE4fG6hI8jK0lM=

# App URL (your domain)
NEXT_PUBLIC_APP_URL=https://thepuppyday.com
```

### Production Deployment

For production environments (Vercel, Netlify, etc.):

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add each variable individually
3. Select "Production" environment
4. Click "Save"

**Other Platforms:**
Follow your hosting platform's instructions for adding environment variables.

## Step 7: Verify Setup

1. Deploy your app with the new environment variables
2. Log in as admin
3. Navigate to **Settings → Calendar Integration**
4. Click "Connect Google Calendar"
5. You should see the Google OAuth consent screen
6. After granting access, you should be redirected back with success message

## Troubleshooting

### "Redirect URI mismatch" error

**Problem**: OAuth redirect fails with error message

**Solution**:
1. Check that redirect URI in Google Cloud Console exactly matches:
   ```
   https://thepuppyday.com/api/admin/calendar/auth/callback
   ```
2. No trailing slash
3. Must be HTTPS in production
4. Check for typos

### "Invalid client" error

**Solution**:
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
2. Make sure you copied them correctly (no extra spaces)
3. Check that OAuth client is enabled in Google Cloud Console

### Encryption errors

**Problem**: "Failed to decrypt token" errors

**Solution**:
1. Verify `CALENDAR_TOKEN_ENCRYPTION_KEY` is exactly 32 bytes (44 characters in base64)
2. Make sure the key hasn't changed
3. If you changed the key, existing connections will break (users must reconnect)

## Security Best Practices

### 1. Protect Your Secrets

- ❌ Never commit `.env` files to Git
- ✅ Use `.env.example` with placeholder values
- ✅ Store real values in platform environment variables
- ✅ Rotate credentials periodically

### 2. Use HTTPS

- ✅ Always use HTTPS in production
- ✅ Webhook URL must be HTTPS
- ❌ HTTP only allowed for local development

### 3. Encryption Key Management

- ✅ Generate cryptographically secure random keys
- ✅ Use different keys for different environments
- ✅ Store keys in secure secret management (AWS Secrets Manager, etc.)
- ❌ Never reuse keys across projects

### 4. OAuth Scopes

- ✅ Only request minimum necessary scopes
- ✅ We only use: `https://www.googleapis.com/auth/calendar.events`
- ❌ Don't request additional scopes unless needed

## Validation

After setup, verify all environment variables are set:

```bash
# Check environment variables (local)
npm run check-env

# Or manually check
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
echo $CALENDAR_TOKEN_ENCRYPTION_KEY
echo $NEXT_PUBLIC_APP_URL
```

All should output values (not empty).
```

## Validation Script

Create `scripts/check-calendar-env.ts`:

```typescript
#!/usr/bin/env tsx

// Check required environment variables for Google Calendar integration

const required = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'CALENDAR_TOKEN_ENCRYPTION_KEY',
  'NEXT_PUBLIC_APP_URL',
];

const missing: string[] = [];
const warnings: string[] = [];

for (const key of required) {
  const value = process.env[key];

  if (!value) {
    missing.push(key);
  } else if (key === 'CALENDAR_TOKEN_ENCRYPTION_KEY') {
    // Validate encryption key length (should be 32 bytes = 44 chars in base64)
    if (value.length !== 44) {
      warnings.push(`${key} should be 44 characters (32 bytes base64 encoded)`);
    }
  } else if (key === 'NEXT_PUBLIC_APP_URL') {
    // Validate URL format
    if (!value.startsWith('https://') && process.env.NODE_ENV === 'production') {
      warnings.push(`${key} should use HTTPS in production`);
    }
  }
}

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`   - ${key}`));
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('⚠️  Warnings:');
  warnings.forEach(msg => console.warn(`   - ${msg}`));
}

console.log('✅ All required environment variables are set');
```

## Testing Checklist

- [ ] `.env.example` updated
- [ ] Setup guide created
- [ ] All steps tested
- [ ] Screenshots added
- [ ] Validation script created
- [ ] Security best practices documented
- [ ] Troubleshooting section complete
- [ ] Links verified
