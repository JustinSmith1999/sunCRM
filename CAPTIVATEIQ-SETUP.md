# CaptivateIQ Integration Setup Guide

## Overview
Your Sales Team Dashboard now integrates with CaptivateIQ to pull accurate commission and sales metrics. This provides a more reliable source of truth for revenue, pipeline, and sales performance data.

## Features
- Real-time commission and sales metrics from CaptivateIQ
- Automated data syncing
- Toggle between CaptivateIQ and Salesforce data sources
- Individual rep and company-wide metrics
- Quota attainment tracking

## Setup Steps

### 1. Get Your CaptivateIQ API Key

1. Log into your [CaptivateIQ account](https://app.captivateiq.com/)
2. Navigate to **Settings** > **API Keys**
3. Click **Create New API Key**
4. Give it a name (e.g., "Sunation CRM Integration")
5. Copy the API Key and API Secret (you'll need both)

### 2. Configure the Integration

1. In your CRM, go to **Admin** > **API Integrations**
2. Find **CaptivateIQ** in the list
3. Click **Edit** or the settings icon
4. Enter your credentials:
   - **API Key**: Paste your CaptivateIQ API key
   - **API Secret**: Paste your CaptivateIQ API secret
   - **Base URL**: Should be pre-filled as `https://api.captivateiq.com`
5. Click **Save**

### 3. Test the Connection

1. After saving, click **Test Connection**
2. If successful, you'll see a green checkmark
3. If it fails, double-check your API credentials

### 4. Initial Data Sync

1. Go to **Sales Team Dashboard**
2. Make sure the toggle is set to **"Using CaptivateIQ"** (green button)
3. Click **"Sync CaptivateIQ"** to pull your first data sync
4. Wait for the sync to complete (you'll see a success message)

### 5. View Your Data

Once synced, your dashboard will show:
- **Total Revenue**: Actual commissioned revenue from CaptivateIQ
- **Pipeline Value**: Current pipeline value
- **Closed Won**: Number of deals closed
- **Win Rate**: Quota attainment percentage
- **Average Deal Size**: Calculated from closed revenue

## Data Source Toggle

The Sales Team Dashboard has a toggle button that lets you switch between:
- **CaptivateIQ** (green): Shows commission software data (more accurate)
- **Salesforce** (gray): Shows raw opportunity data

**Recommendation**: Use CaptivateIQ as your primary data source since it reflects actual commissioned revenue and is the source of truth for sales metrics.

## API Link for CaptivateIQ Sync

The integration uses a Supabase Edge Function to sync data. The API endpoint is:

```
POST https://[your-supabase-url]/functions/v1/captivateiq-sync
```

**Request Body**:
```json
{
  "action": "sync_all",
  "period_start": "2024-01-01",
  "period_end": "2024-12-31",
  "rep_id": "optional-rep-id"
}
```

**Actions**:
- `sync_metrics`: Sync only metrics (revenue, pipeline, etc.)
- `sync_commissions`: Sync only commission records
- `sync_all`: Sync everything

## Automatic Syncing

You can enable automatic syncing:
1. Go to **API Integrations** > **CaptivateIQ**
2. Enable **"Auto Sync"**
3. Set **Sync Frequency** (default: 24 hours)

This will automatically pull fresh data from CaptivateIQ daily.

## Database Tables

The integration stores data in these tables:
- `captivateiq_config`: API credentials and settings
- `captivateiq_metrics`: Aggregated metrics (revenue, pipeline, etc.)
- `captivateiq_commissions`: Individual commission records per rep

## Permissions

Access to CaptivateIQ data follows these rules:
- **Admins**: Full access to all data and configuration
- **Sales Managers**: Can view all team metrics and commissions
- **Sales Reps**: Can only view their own metrics and commissions

## Troubleshooting

### "CaptivateIQ not configured" Error
- Make sure you've entered your API key in API Integrations Console
- Verify the API key is valid and not expired

### No Data After Sync
- Check that your CaptivateIQ account has data for the selected period
- Verify the API key has permission to access metrics and commissions
- Try syncing again with the "Sync CaptivateIQ" button

### Data Doesn't Match CaptivateIQ
- Click "Sync CaptivateIQ" to refresh the data
- Check the "Last Synced" timestamp in API Integrations
- Verify you're looking at the same time period in both systems

## Support

If you need help with CaptivateIQ integration:
1. Check your CaptivateIQ API documentation
2. Verify API key permissions
3. Review the API Integration Logs in the Admin console
