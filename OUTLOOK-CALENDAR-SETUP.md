# Outlook Calendar Integration Setup

## Overview

Your CRM now supports two-way sync with Outlook Calendar. Users can:
- Connect their personal Outlook calendar
- Create appointments that automatically sync to Outlook
- Sync existing Outlook events into the CRM
- Book meetings with customers directly from lead/opportunity records
- Manage all appointments in one place

## Microsoft Azure Setup

Before users can connect their Outlook calendars, you need to register an application in Microsoft Azure:

### 1. Register an Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: Your CRM Name - Calendar Integration
   - **Supported account types**: Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts
   - **Redirect URI**:
     - Platform: Web
     - URL: `https://your-app-url.com/outlook-callback` (adjust to your actual URL)
5. Click **Register**

### 2. Get Credentials

After registration:
1. Go to **Overview** and copy:
   - **Application (client) ID**
   - **Directory (tenant) ID**

2. Go to **Certificates & secrets**
3. Click **New client secret**
4. Add a description and expiration period
5. Click **Add**
6. **IMPORTANT**: Copy the secret value immediately (you won't be able to see it again)

### 3. Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - `Calendars.ReadWrite` - Read and write user calendars
   - `User.Read` - Sign in and read user profile
   - `offline_access` - Maintain access to data
6. Click **Add permissions**
7. Click **Grant admin consent** (if you're an admin)

### 4. Configure Authentication

1. Go to **Authentication**
2. Under **Platform configurations**, click your Web platform
3. Add these redirect URIs if not already present:
   - `https://your-app-url.com/outlook-callback`
   - For local testing: `http://localhost:5173/outlook-callback`
4. Under **Implicit grant and hybrid flows**, check:
   - Access tokens
   - ID tokens
5. Save changes

## Add Credentials to CRM

1. Log into your CRM as an **admin**
2. Navigate to **Admin** → **API Integrations**
3. Click **Add Integration**
4. Fill in:
   - **Service Name**: `microsoft_graph`
   - **Display Name**: Microsoft Graph / Outlook Calendar
   - **Description**: Outlook Calendar integration for appointments
   - **Credentials** (JSON format):
     ```json
     {
       "client_id": "your-application-client-id",
       "client_secret": "your-client-secret",
       "tenant_id": "your-tenant-id",
       "redirect_uri": "https://your-app-url.com/outlook-callback"
     }
     ```
   - Check **Active**
5. Click **Save**

## User Setup

### Connecting Outlook Calendar

Once the admin has configured the Microsoft Graph integration:

1. Navigate to **Calendar** in the sidebar
2. Click **Connect Outlook**
3. You'll be redirected to Microsoft login
4. Sign in with your Microsoft account
5. Authorize the permissions
6. You'll be redirected back to the CRM
7. Your calendar is now connected!

### Creating Appointments

1. Go to **Calendar** page
2. Click **+ New Appointment**
3. Fill in:
   - Subject (required)
   - Description
   - Start time (required)
   - End time (required)
   - Location
   - Attendees (comma-separated emails)
4. Click **Create Appointment**
5. If Outlook is connected, the appointment automatically syncs

### Syncing from Outlook

1. Go to **Calendar** page
2. Click **Sync Now**
3. The system will pull all events from the last month and next 3 months
4. New events will appear in your CRM

### Disconnecting

1. Go to **Calendar** page
2. Click **Disconnect**
3. Confirm the action
4. Your Outlook calendar will no longer sync

## Automatic Sync

The system provides both manual and automatic syncing:

- **Manual Sync**: Click "Sync Now" at any time
- **Create Events**: Automatically pushes to Outlook when created
- **Update Events**: Updates in CRM sync to Outlook
- **Delete Events**: Deleting in CRM removes from Outlook

## Linking Appointments to Records

When creating appointments, you can link them to:
- **Leads**: Schedule follow-ups
- **Opportunities**: Book sales calls
- **Accounts**: Plan customer meetings

This creates a complete activity history on each record.

## Troubleshooting

### "Microsoft Graph not configured" Error

**Solution**: Admin needs to add Microsoft Graph credentials in Admin → API Integrations

### "Failed to connect Outlook" Error

**Possible causes**:
1. Wrong redirect URI in Azure
2. Expired client secret
3. Missing API permissions
4. Admin consent not granted

**Solution**: Verify Azure app configuration matches the setup above

### Events Not Syncing

**Solution**:
1. Check Outlook connection status
2. Try disconnecting and reconnecting
3. Verify API permissions in Azure
4. Check that the user's Microsoft account has calendar access

### Token Expired

**Solution**: The system automatically refreshes tokens. If this fails:
1. Disconnect Outlook
2. Reconnect Outlook
3. If problem persists, admin should verify the client secret hasn't expired

## Security Notes

1. **Tokens are encrypted**: All OAuth tokens are stored securely in the database
2. **Per-user access**: Each user connects their own calendar - no shared access
3. **Minimal permissions**: Only calendar read/write and basic profile info
4. **Automatic token refresh**: Tokens are refreshed automatically before expiry
5. **Revocable**: Users can disconnect at any time

## Features

- Create appointments with subject, description, location, times
- Add multiple attendees via email
- Two-way sync with Outlook
- View upcoming appointments
- Delete appointments (syncs to Outlook)
- Link appointments to CRM records
- Sync history and error logging
- Automatic token refresh
