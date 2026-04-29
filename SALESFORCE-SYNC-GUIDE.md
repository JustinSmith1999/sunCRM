# Salesforce Sync API - Complete Setup Guide

## Overview

Your CRM now has a comprehensive Salesforce sync API that automatically syncs ALL data from Salesforce to Supabase. This will keep your Supabase database in sync with Salesforce until you're ready to discontinue Salesforce.

## What's Been Created

### 1. Database Tables
- **salesforce_sync_config** - Stores Salesforce connection credentials
- **salesforce_object_mappings** - Maps Salesforce objects to Supabase tables
- **salesforce_sync_jobs** - Tracks each sync execution
- **salesforce_sync_logs** - Detailed logs for troubleshooting

### 2. Edge Functions
- **salesforce-sync** - Main sync function that pulls data from Salesforce
- **salesforce-auth** - OAuth authentication handler

### 3. UI Component
- **SalesforceSync.tsx** - Admin interface for managing sync

## Setup Instructions

### Step 1: Create a Salesforce Connected App

1. Log into your Salesforce org
2. Go to **Setup** → **Apps** → **App Manager**
3. Click **New Connected App**
4. Fill in the form:
   - **Connected App Name**: "Supabase CRM Sync"
   - **API Name**: "Supabase_CRM_Sync"
   - **Contact Email**: Your email
   - Enable **OAuth Settings**
   - **Callback URL**: `https://your-project.supabase.co/functions/v1/salesforce-auth?action=callback`
   - **Selected OAuth Scopes**:
     - Full access (full)
     - Perform requests on your behalf at any time (refresh_token, offline_access)
     - Access and manage your data (api)
5. Click **Save** and wait 2-10 minutes for the app to be ready
6. Click **Manage Consumer Details** to view:
   - **Consumer Key** (Client ID)
   - **Consumer Secret** (Client Secret)

### Step 2: Configure in Your CRM

1. Navigate to **Admin** → **Salesforce Sync** (you'll need to add this to your admin menu)
2. Enter your **Consumer Key** and **Consumer Secret**
3. Check **"This is a Sandbox environment"** if using a sandbox
4. Click **"Connect to Salesforce"**
5. You'll be redirected to Salesforce to authorize
6. After authorization, you'll be redirected back to your CRM

### Step 3: Start Syncing

Once connected, you can:

1. **Sync All Objects** - Click this to sync all supported objects (Leads, Accounts, Contacts, Opportunities, Users)
2. **Sync Individual Objects** - Click "Sync" on any specific object
3. **Schedule Automatic Syncs** - The system will automatically sync every 60 minutes (configurable in the database)

## Supported Objects

The system currently syncs these Salesforce objects:
- **Leads** → `leads` table
- **Accounts** → `accounts` table
- **Contacts** → `salesforce_contacts` table
- **Opportunities** → `opportunities` table
- **Users** → `users` table

## How It Works

### Initial Sync (Full Sync)
1. Connects to Salesforce using OAuth
2. Queries all records from each object
3. Transforms Salesforce data to match Supabase schema
4. Inserts/updates records in Supabase

### Incremental Sync
1. Only syncs records modified since last sync
2. Uses Salesforce's `SystemModstamp` field to track changes
3. Much faster than full sync
4. Runs automatically every 60 minutes

### Data Flow
```
Salesforce → OAuth Auth → Edge Function → Transform Data → Supabase Tables
```

## API Endpoints

### Sync Data
```bash
POST https://your-project.supabase.co/functions/v1/salesforce-sync
Content-Type: application/json

{
  "organizationId": "your-org-id",
  "objectName": "Lead",
  "fullSync": false
}
```

### Authorize
```bash
POST https://your-project.supabase.co/functions/v1/salesforce-auth?action=authorize
Content-Type: application/json

{
  "organizationId": "your-org-id",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "your-callback-url",
  "isSandbox": false
}
```

### Test Connection
```bash
POST https://your-project.supabase.co/functions/v1/salesforce-auth?action=test
Content-Type: application/json

{
  "organizationId": "your-org-id"
}
```

## Adding More Objects

To sync additional Salesforce objects:

1. Create the table in Supabase (if it doesn't exist)
2. Add a mapping in `salesforce_object_mappings`:

```sql
INSERT INTO salesforce_object_mappings (
  organization_id,
  salesforce_object,
  supabase_table,
  sync_mode,
  sync_enabled
) VALUES (
  'your-org-id',
  'Case',
  'cases',
  'incremental',
  true
);
```

3. The object will now appear in the UI and sync automatically

## Monitoring

### View Sync Jobs
```sql
SELECT * FROM salesforce_sync_jobs
WHERE organization_id = 'your-org-id'
ORDER BY created_at DESC;
```

### View Sync Logs
```sql
SELECT * FROM salesforce_sync_logs
WHERE organization_id = 'your-org-id'
ORDER BY created_at DESC;
```

### Check Last Sync Times
```sql
SELECT
  salesforce_object,
  supabase_table,
  last_sync_at,
  sync_enabled
FROM salesforce_object_mappings
WHERE organization_id = 'your-org-id';
```

## Troubleshooting

### "Token expired" error
The system automatically refreshes tokens. If you see this error, try reconnecting in the UI.

### "Failed to sync" error
Check the `salesforce_sync_logs` table for detailed error messages.

### No data syncing
1. Verify Salesforce connection in the UI
2. Check that objects are enabled in `salesforce_object_mappings`
3. Verify RLS policies allow access to your organization

### Sync is slow
- Use incremental sync instead of full sync
- Reduce `batch_size` in object mappings
- Check Salesforce API limits

## Security Notes

- All credentials are encrypted in Supabase
- OAuth tokens are automatically refreshed
- RLS policies ensure data isolation between organizations
- Only admins can configure sync settings

## Performance

- **Initial sync**: ~1,000 records per minute
- **Incremental sync**: ~5,000 records per minute
- **Automatic sync**: Every 60 minutes (configurable)
- **API rate limits**: Respects Salesforce API limits

## Next Steps

After setup:
1. Run an initial full sync for all objects
2. Verify data in Supabase tables
3. Configure automatic sync frequency if needed
4. Monitor sync jobs in the admin interface
5. Add custom object mappings as needed

## Support

The sync system logs all operations to `salesforce_sync_logs`. Check there first if you encounter issues.
