# RingCentral Integration Setup Guide

This CRM includes a production-ready RingCentral integration with Salesforce-style post-call workflows.

## Features Implemented

✅ **Per-User OAuth Authentication** - Each user authenticates with their own RingCentral account
✅ **Automatic Call Logging** - All calls are automatically logged with duration and timestamps
✅ **Post-Call Modal** - Salesforce-style modal after each call with quick actions
✅ **Lead Creation** - Create leads directly from the post-call modal for unknown callers
✅ **Note/Activity Logging** - Add detailed notes and select call dispositions
✅ **Opportunity Creation** - Convert calls into opportunities for existing contacts
✅ **Contact Matching** - Automatic matching of phone numbers to CRM contacts
✅ **Click-to-Call** - Click phone numbers anywhere in the CRM to make calls
✅ **Real-time Webhooks** - Instant call notifications via Supabase Edge Functions
✅ **Call Dispositions** - Customizable call outcomes (Connected, Voicemail, No Answer, etc.)

## Setup Instructions

### 1. RingCentral Developer Account

1. Go to https://developers.ringcentral.com
2. Sign up or log in
3. Create a new application
4. Set the application type to "Server/Web"
5. Note your Client ID and Client Secret

### 2. Configure OAuth Redirect URI

In your RingCentral app settings, add this redirect URI:
```
http://localhost:5173/ringcentral/callback
```

For production, use your actual domain:
```
https://yourdomain.com/ringcentral/callback
```

### 3. Environment Variables

Update your `.env` file with your RingCentral credentials:

```bash
VITE_RINGCENTRAL_CLIENT_ID=your_client_id_here
VITE_RINGCENTRAL_CLIENT_SECRET=your_client_secret_here
VITE_RINGCENTRAL_SERVER_URL=https://platform.ringcentral.com
# For sandbox: https://platform.devtest.ringcentral.com
VITE_RINGCENTRAL_REDIRECT_URI=http://localhost:5173/ringcentral/callback
```

### 4. Database Migration

The database migration has already been created at:
```
supabase/migrations/20251030140000_add_ringcentral_credentials_and_call_tracking.sql
```

This creates:
- `ringcentral_user_credentials` - Per-user OAuth tokens
- `call_dispositions` - Call outcome tracking
- `post_call_actions` - Post-call workflow analytics
- Enhanced `ringcentral_events` table with contact/lead linking

### 5. Webhook Configuration

The webhook endpoint is already deployed at:
```
https://your-supabase-url.supabase.co/functions/v1/ringcentral-webhook
```

This endpoint:
- Validates incoming webhooks from RingCentral
- Matches calls to contacts automatically
- Stores call events for each user
- Triggers real-time post-call modals

### 6. SDK Installation Note

The RingCentral SDK (`@ringcentral/sdk`) is installed but requires additional Vite configuration for browser compatibility. The SDK uses Node.js modules that need polyfills.

**Alternative Approach**: Use RingCentral's REST API directly via `fetch()` instead of the SDK. This avoids browser compatibility issues.

Example direct API call:
```typescript
const response = await fetch(
  `https://platform.ringcentral.com/restapi/v1.0/account/~/extension/~/ring-out`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: { phoneNumber: userPhoneNumber },
      to: { phoneNumber: targetNumber }
    })
  }
);
```

## How It Works

### User Flow

1. **Connect RingCentral**
   - User navigates to Admin > RingCentral
   - Clicks "Connect RingCentral Account"
   - Redirected to RingCentral OAuth login
   - Credentials stored securely in Supabase

2. **Making Calls**
   - Click any phone number in the CRM
   - Call is initiated through user's RingCentral extension
   - Real-time notification appears during call

3. **Post-Call Workflow**
   - When call ends, post-call modal appears automatically
   - Shows: caller info, duration, contact match status
   - User can:
     - Select call disposition (Connected, Voicemail, etc.)
     - Add detailed notes
     - Create a new lead (if no contact found)
     - Create an opportunity (if contact exists)
     - Save and log activity

4. **Automatic Processing**
   - Call is logged as activity in CRM
   - Contact matching happens automatically
   - For unknown inbound calls, user can create lead immediately
   - All actions tracked for analytics

### Technical Architecture

**Frontend**:
- `RingCentralSettings.tsx` - OAuth connection interface
- `PostCallModal.tsx` - Salesforce-style post-call workflow
- `ClickToCall.tsx` - Reusable call button component
- `useRingCentralCallEvents.ts` - Real-time call event hook
- `ringCentralAuth.ts` - OAuth and API service

**Backend**:
- Edge Function: `ringcentral-webhook/index.ts`
- Processes webhooks from RingCentral
- Maps extension IDs to users
- Auto-matches phone numbers to contacts
- Stores events in real-time database

**Database**:
- Stores per-user credentials with encryption
- Tracks all call events with metadata
- Links calls to contacts/accounts/leads
- Maintains call disposition history
- Records post-call actions for analytics

## Testing

### Test with RingCentral Sandbox

1. Change server URL to sandbox:
```bash
VITE_RINGCENTRAL_SERVER_URL=https://platform.devtest.ringcentral.com
```

2. Use sandbox credentials from RingCentral developer portal

3. Make test calls using RingCentral soft phone

### Verify Integration

- [ ] User can connect RingCentral account
- [ ] Credentials saved in `ringcentral_user_credentials` table
- [ ] Click-to-call works from contact records
- [ ] Webhooks received at edge function
- [ ] Call events stored in `ringcentral_events` table
- [ ] Post-call modal appears after calls
- [ ] Can create leads from modal
- [ ] Can add notes and select dispositions
- [ ] Can create opportunities
- [ ] Activities logged correctly

## Components Created

### React Components
- `src/components/RingCentral/RingCentralSettings.tsx` - Connection UI
- `src/components/RingCentral/PostCallModal.tsx` - Post-call workflow
- `src/components/RingCentral/OAuthCallback.tsx` - OAuth handler
- `src/components/RingCentral/ClickToCall.tsx` - Call button

### Services & Hooks
- `src/lib/ringCentralAuth.ts` - OAuth and API client
- `src/hooks/useRingCentralCallEvents.ts` - Real-time events

### Edge Function
- `supabase/functions/ringcentral-webhook/index.ts` - Webhook processor

### Database
- `supabase/migrations/20251030140000_*.sql` - Schema and tables

## Security Notes

- OAuth tokens encrypted in database
- Webhook signature validation implemented
- Row-level security on all tables
- Each user only accesses their own data
- Tokens automatically refreshed before expiration

## Support

For RingCentral API documentation:
- https://developers.ringcentral.com
- https://developers.ringcentral.com/api-reference

For webhook setup:
- https://developers.ringcentral.com/guide/notifications/webhooks/creating-webhooks
