# API Integrations System - Complete Guide

## Overview

Your CRM now has a comprehensive API integrations management system that allows you to connect with multiple third-party services including Egnyte, Power BI, RingCentral, Aurora Solar, Salesforce, Stripe, Twilio, and SendGrid.

## What's Included

### 1. Database Tables

#### `api_credentials`
Stores encrypted API credentials for all third-party services with:
- Multi-tenant support
- OAuth token management with automatic refresh
- Connection status tracking
- Configuration storage

#### `api_integration_logs`
Tracks all API calls for monitoring and debugging:
- Request/response details
- Error tracking
- Performance metrics
- User attribution

#### `api_webhooks`
Manages incoming webhooks from services:
- Event configuration
- Secret verification
- Statistics tracking

#### `api_webhook_events`
Stores individual webhook events:
- Event payload
- Processing status
- Error handling

### 2. Admin Console

**Location:** Admin Dashboard > API Integrations

**Features:**
- Visual credential management for all services
- Connection testing
- Status monitoring
- API logs viewer
- Secure credential storage with masked secrets
- Real-time connection status

### 3. Integration Modules

#### Egnyte File Storage (`src/lib/egnyte.ts`)
- File listing and browsing
- File upload with progress tracking
- Link generation for file sharing
- Document library integration
- Access logging

**Key Functions:**
```typescript
egnyteClient.listFiles(folderPath)
egnyteClient.uploadFile(file, folderPath)
egnyteClient.getFileLink(filePath)
```

#### Power BI (`src/lib/powerbi.ts`)
- OAuth 2.0 authentication
- Automatic token refresh
- Report listing and embedding
- Dashboard access
- Dataset refresh
- Embed token generation

**Key Functions:**
```typescript
powerBIClient.getReports()
powerBIClient.getDashboards()
powerBIClient.refreshDataset(datasetId)
powerBIClient.getEmbedToken(reportId)
```

#### RingCentral (Enhanced)
Already integrated with:
- Click-to-call functionality
- Call history tracking
- Post-call logging
- Webhook support
- Embeddable widget

### 4. Testing Utilities

**Script:** `test-api-integrations.mjs`

Check integration status:
```bash
node test-api-integrations.mjs
```

Shows:
- Configuration status
- Missing credentials
- Connection health
- Setup instructions

## Setup Instructions

### Step 1: Access Admin Console

1. Log in as admin
2. Go to **Admin Dashboard**
3. Click **API Integrations** tile

### Step 2: Configure Each Service

#### Egnyte

**Required Credentials:**
- Domain (e.g., `yourcompany`)
- API Key
- Client ID (for OAuth)
- Client Secret (for OAuth)

**Configuration:**
- Base Path (e.g., `/Shared/CRM`)

**Setup:**
1. Go to `https://[your-domain].egnyte.com/web/admin/developers`
2. Create API key or OAuth application
3. Copy credentials to console
4. Test connection

#### Power BI

**Required Credentials:**
- Client ID (from Azure AD)
- Client Secret
- Tenant ID

**Configuration:**
- Workspace ID (from Power BI)

**Setup:**
1. Register app in Azure Portal
2. Add Power BI Service API permissions
3. Create client secret
4. Get workspace ID from Power BI
5. Enter credentials in console
6. Test connection

#### RingCentral

**Required Credentials:**
- Client ID
- Client Secret
- JWT Token (optional)

**Configuration:**
- Extension number
- Server URL (default: `https://platform.ringcentral.com`)

**Setup:**
1. Go to https://developers.ringcentral.com
2. Create new app
3. Set OAuth redirect URL
4. Copy credentials
5. Configure in console

#### Aurora Solar

**Required Credentials:**
- API Key
- Tenant ID

**Configuration:**
- Webhook Secret (for receiving updates)

**Setup:**
1. Contact Aurora Solar support for API access
2. Request API key and tenant ID
3. Configure webhook endpoint
4. Enter credentials

#### Salesforce

**Required Credentials:**
- Client ID (Connected App)
- Client Secret
- Username
- Password
- Security Token

**Configuration:**
- Instance URL (e.g., `https://login.salesforce.com`)
- API Version (default: `59.0`)

**Note:** Already configured via edge functions. Check existing setup.

#### Stripe

**Required Credentials:**
- Secret Key
- Publishable Key
- Webhook Secret

**Configuration:**
- Currency (default: `usd`)

**Setup:**
1. Go to https://dashboard.stripe.com/apikeys
2. Copy secret and publishable keys
3. Configure webhook in Stripe dashboard
4. Copy webhook secret

#### Twilio

**Required Credentials:**
- Account SID
- Auth Token
- Phone Number

**Setup:**
1. Go to https://console.twilio.com
2. Copy Account SID and Auth Token
3. Purchase or verify phone number
4. Enter credentials

#### SendGrid

**Required Credentials:**
- API Key

**Configuration:**
- From Email
- From Name

**Setup:**
1. Go to https://app.sendgrid.com/settings/api_keys
2. Create new API key
3. Copy immediately (shown only once)
4. Configure sender identity

### Step 3: Test Connections

For each service:
1. Select service in console
2. Click **Edit** to enter credentials
3. Fill in all required fields
4. Click **Save**
5. Click **Test Connection**
6. Verify green checkmark appears

### Step 4: Verify Integration Health

Run the test script:
```bash
node test-api-integrations.mjs
```

This shows:
- Which integrations are configured
- Which are active and connected
- Missing credentials
- Setup instructions for unconfigured services

## Security Best Practices

### Credential Storage
- All credentials encrypted at application level
- Masked in UI (show/hide toggle)
- Never logged in plain text
- Access restricted to admins only

### Token Management
- OAuth tokens automatically refreshed
- Expiration tracking
- Secure token storage
- Rotation support

### API Logging
- All API calls logged
- Error tracking for debugging
- Performance monitoring
- User attribution

### Webhook Security
- Secret verification
- HTTPS only
- Event validation
- Rate limiting

## Monitoring & Troubleshooting

### View API Logs

1. Go to **API Integrations Console**
2. Click **API Logs** tab
3. Review recent calls

Logs show:
- Timestamp
- Service name
- Endpoint called
- HTTP method
- Status code
- Response time

### Common Issues

#### Connection Test Fails

**Egnyte:**
- Verify domain is correct (no .egnyte.com)
- Check API key is valid
- Ensure API access is enabled

**Power BI:**
- Verify app permissions in Azure AD
- Check tenant ID matches
- Ensure workspace ID is correct
- Client secret may have expired

**RingCentral:**
- Verify redirect URI matches exactly
- Check sandbox vs production environment
- Ensure extension has permissions

#### Token Expired

**Solution:** System automatically refreshes OAuth tokens. If issues persist:
1. Delete and re-enter credentials
2. Test connection again
3. Check token expiry dates

#### Webhook Not Receiving Events

**Check:**
1. Webhook URL is publicly accessible
2. HTTPS is enabled
3. Correct events are selected in service config
4. Webhook secret matches

## Integration Usage Examples

### Egnyte File Upload

```typescript
import { egnyteClient } from './lib/egnyte';

// Upload file with progress
const file = event.target.files[0];
await egnyteClient.uploadFile(
  file,
  '/Leads/123',
  (progress) => console.log(`${progress}%`)
);
```

### Power BI Report Embedding

```typescript
import { powerBIClient } from './lib/powerbi';

// Get reports
const reports = await powerBIClient.getReports();

// Get embed token
const embedToken = await powerBIClient.getEmbedToken(reportId);

// Embed in page
// Use Power BI Embedded client library
```

### RingCentral Click-to-Call

```typescript
// Already integrated in components/RingCentral/ClickToCall.tsx
<ClickToCall phoneNumber="+1234567890" />
```

## API Rate Limits

Be aware of service rate limits:

- **Egnyte:** 1000 requests/hour
- **Power BI:** 200 requests/hour per user
- **RingCentral:** Varies by plan
- **Salesforce:** Varies by license
- **Stripe:** No fixed limit but watch for 429s
- **Twilio:** Varies by account type
- **SendGrid:** Based on plan

System logs rate limit errors automatically.

## Maintenance

### Regular Tasks

**Weekly:**
- Check API logs for errors
- Verify all connections are green
- Review webhook event processing

**Monthly:**
- Rotate API keys (if required by policy)
- Update service credentials if changed
- Review integration usage stats

**Quarterly:**
- Audit access permissions
- Update to latest API versions
- Review and optimize API calls

## Support

### Getting Help

1. Check API logs in console
2. Review service documentation
3. Run test script for diagnostics
4. Check webhook event logs

### Resources

- **Egnyte:** https://developers.egnyte.com
- **Power BI:** https://docs.microsoft.com/power-bi/developer
- **RingCentral:** https://developers.ringcentral.com
- **Aurora Solar:** Contact support
- **Salesforce:** https://developer.salesforce.com
- **Stripe:** https://stripe.com/docs/api
- **Twilio:** https://www.twilio.com/docs
- **SendGrid:** https://docs.sendgrid.com

## Future Enhancements

Planned features:
- Bulk credential import/export
- Integration health dashboard
- Custom webhook handlers
- Rate limit monitoring
- Auto-retry failed requests
- Integration analytics
- Custom API connectors

## Quick Reference

### Check Integration Status
```bash
node test-api-integrations.mjs
```

### Access Admin Console
Admin Dashboard > API Integrations

### View API Logs
API Integrations Console > API Logs tab

### Test Connection
Select service > Test Connection button

### Update Credentials
Select service > Edit > Update fields > Save

---

Your CRM now has enterprise-grade API integration capabilities with secure credential management, comprehensive logging, and easy monitoring. All integrations are ready to configure and use!
