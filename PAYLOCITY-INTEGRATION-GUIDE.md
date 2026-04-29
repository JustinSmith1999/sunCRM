# Paylocity Integration Setup Guide

This guide will help you integrate Paylocity HR and Payroll system with your application.

## Overview

The Paylocity integration automatically syncs employee data, payroll information, benefits, and time-off balances between Paylocity and your internal HR system. This eliminates manual data entry and ensures your HR records are always up to date.

## Features

- **Employee Sync**: Automatically sync all employee records including personal info, job details, and compensation
- **Payroll Integration**: Access payroll data including YTD earnings, deductions, and pay statements
- **Benefits Management**: Track employee benefits enrollment and eligibility
- **Time Off Tracking**: Sync PTO, sick time, and vacation balances
- **Auto-Linking**: Automatically links Paylocity employees to existing HR records via email matching
- **Bi-directional Updates**: Changes in Paylocity automatically update your HR system

## Prerequisites

Before setting up the Paylocity integration, you need:

1. **Paylocity Account**: An active Paylocity account with API access enabled
2. **API Credentials**: Client ID and Client Secret from Paylocity
3. **Company ID**: Your Paylocity Company ID
4. **Admin Access**: Admin-level access to your application

## Getting API Credentials from Paylocity

### Step 1: Request API Access

1. Log in to your Paylocity account at [https://www.paylocity.com](https://www.paylocity.com)
2. Contact your Paylocity account representative to request API access
3. Complete any required paperwork or agreements
4. Wait for Paylocity to approve your API access request (typically 3-5 business days)

### Step 2: Obtain API Credentials

Once approved:

1. Navigate to **Settings** > **Integrations** in your Paylocity portal
2. Click **API Credentials** or **Developer Settings**
3. Generate a new API application:
   - **Application Name**: Enter a name (e.g., "CRM Integration")
   - **Redirect URI**: Not required for this integration
   - **Scopes**: Select "WebLinkAPI" scope
4. Save and copy your credentials:
   - **Client ID**: A unique identifier for your application
   - **Client Secret**: A secret key (copy immediately - won't be shown again)
   - **Company ID**: Your Paylocity company identifier

### Step 3: Note Your Environment

- **Production**: `https://api.paylocity.com/api/v2`
- **Sandbox/Test**: `https://apisandbox.paylocity.com/api/v2`

## Setup Instructions

### 1. Access Paylocity Console

1. Log in to your application as an admin
2. Navigate to **Admin Dashboard**
3. Click on **Paylocity HR** tile

### 2. Configure API Credentials

In the Paylocity Console:

1. Go to the **Configuration** tab
2. Enter your Paylocity credentials:
   - **Client ID**: Your Paylocity Client ID
   - **Client Secret**: Your Paylocity Client Secret
   - **Company ID**: Your Paylocity Company ID
   - **API URL**: Keep default (`https://api.paylocity.com/api/v2`) or use sandbox URL for testing

3. Configure sync options:
   - ☑️ **Sync Employee Data**: Enable to sync employee records
   - ☑️ **Sync Payroll Data**: Enable to sync payroll information
   - ☑️ **Sync Benefits Data**: Enable to sync benefits enrollment
   - ☑️ **Sync Time Off Data**: Enable to sync PTO/vacation balances

4. Enable the integration:
   - ☑️ **Enable Paylocity Integration**

5. Click **Save Configuration**

### 3. Test Connection

1. Click **Test Connection** button
2. Wait for the test to complete
3. If successful, you'll see: "Connection successful! Found X employees."
4. If failed, check your credentials and try again

### 4. Initial Sync

1. Click **Sync Now** button to perform initial data sync
2. The sync process will:
   - Fetch all employees from Paylocity
   - Create records in the `paylocity_employees` table
   - Automatically link to existing HR records via email matching
   - Update HR records with Paylocity data

3. Monitor progress in the **Sync Logs** tab

## Using the Integration

### View Employee Data

1. Navigate to **Employees** tab in Paylocity Console
2. View synced employee records including:
   - Name, email, and contact information
   - Job title and department
   - Employment status (Active, Terminated, etc.)
   - Link status to HR records

### Sync Logs

1. Navigate to **Sync Logs** tab
2. View history of all sync operations:
   - Sync status (completed, failed, in progress)
   - Records processed, created, and failed
   - Error messages for troubleshooting
   - Timestamp of each sync

### Scheduled Syncs

The integration supports scheduled automatic syncs:

- **Daily**: Syncs run automatically once per day
- **Manual**: Click "Sync Now" anytime to trigger immediate sync
- **Webhooks**: Real-time updates when configured (coming soon)

## Data Mapping

### Employee Fields

Paylocity data maps to your HR system as follows:

| Paylocity Field | HR System Field | Description |
|----------------|-----------------|-------------|
| `employeeId` | `Paylocity_Employee_ID__c` | Unique Paylocity identifier |
| `firstName` | `First_Name__c` | Employee first name |
| `lastName` | (Last name in Name field) | Employee last name |
| `email` | `Personal_Email__c` / `Work_Email__c` | Email address (used for matching) |
| `employeeNumber` | Employee number | Internal employee number |
| `hireDate` | `Employee_Start_Date__c` | Date of hire |
| `terminationDate` | `Termination_Date__c` | Date of termination (if applicable) |
| `status` | `Employment_Status__c` | Active, Terminated, etc. |
| `jobTitle` | `Job_Title__c` | Current job title |
| `department` | `Department__c` | Department name |
| `payRate` | Pay rate | Hourly or salary rate |
| `annualSalary` | Annual salary | Annual salary amount |

### Auto-Linking Logic

The system automatically links Paylocity employees to existing HR records:

1. **Email Matching**: Matches by email address (Personal or Work email)
2. **Case-Insensitive**: Email matching ignores case differences
3. **Updates HR Record**: Populates `Paylocity_Employee_ID__c` field
4. **Bi-directional**: Links work both ways for easy reference

## Database Schema

### Tables Created

1. **`paylocity_employees`**
   - Stores complete employee data from Paylocity
   - Links to `hr_records` via `hr_record_salesforce_id`
   - Includes raw JSON data for advanced use cases

2. **`paylocity_sync_logs`**
   - Tracks all sync operations
   - Stores success/failure status and error details
   - Provides audit trail for compliance

### New HR Record Fields

Added to existing `hr_records` table:
- `Paylocity_Employee_ID__c`: Link to Paylocity employee
- `Paylocity_Synced_At__c`: Timestamp of last sync
- `Paylocity_Data__c`: Raw JSON data from Paylocity
- `Paylocity_Status__c`: Current employment status

## Troubleshooting

### Connection Test Fails

**Problem**: "Authentication failed" or "Connection failed"

**Solutions**:
1. Verify Client ID and Client Secret are correct
2. Ensure Company ID matches your Paylocity account
3. Check if API access is enabled in your Paylocity account
4. Verify you're using the correct API URL (production vs. sandbox)

### No Employees Found

**Problem**: Sync completes but shows 0 employees

**Solutions**:
1. Verify employees exist in your Paylocity account
2. Check API permissions include employee read access
3. Ensure Company ID is correct
4. Review sync logs for detailed error messages

### Employees Not Linking to HR Records

**Problem**: Employees sync but don't link to existing HR records

**Solutions**:
1. Verify email addresses match between systems
2. Check if HR records have email populated
3. Ensure emails are in `Personal_Email__c` or `Work_Email__c` fields
4. Manually update email addresses if needed

### Sync Takes Too Long

**Problem**: Sync operation times out or takes very long

**Solutions**:
1. This is normal for initial sync with many employees
2. Subsequent syncs are incremental and faster
3. Consider scheduling syncs during off-peak hours
4. Contact support if syncs consistently fail

## API Rate Limits

Paylocity enforces API rate limits:

- **Rate Limit**: Varies by account type (typically 100-1000 requests/hour)
- **Handling**: Integration automatically respects rate limits
- **Retry Logic**: Failed requests are automatically retried
- **Monitoring**: Check sync logs for rate limit warnings

## Security & Compliance

### Data Security

- **Encryption**: API credentials encrypted at rest
- **HTTPS**: All API calls use secure HTTPS
- **Access Control**: Admin-only access to credentials
- **Audit Logs**: All sync operations logged for compliance

### Data Privacy

- **Employee Data**: Handled in compliance with privacy regulations
- **Retention**: Data retained according to your policy
- **Access**: Role-based access controls enforced
- **Deletion**: Employee data can be purged if needed

## Support

### Getting Help

1. **Sync Logs**: Check sync logs for detailed error messages
2. **Documentation**: Review Paylocity API documentation
3. **Support**: Contact your Paylocity representative
4. **System Admin**: Contact your system administrator

### Useful Links

- [Paylocity Developer Portal](https://developer.paylocity.com)
- [Paylocity API Documentation](https://developer.paylocity.com/integrations/docs/getting-started)
- [Paylocity Support](https://www.paylocity.com/support/)

## Advanced Configuration

### Custom Field Mapping

To map additional Paylocity fields:

1. Update the edge function at `supabase/functions/paylocity-sync/index.ts`
2. Add fields to the `paylocity_employees` table schema
3. Update the sync mapping logic in the function
4. Redeploy the edge function

### Webhook Integration (Coming Soon)

Real-time updates via Paylocity webhooks:

1. Configure webhook URL in Paylocity
2. Set webhook events (employee.updated, employee.created, etc.)
3. System automatically processes incoming webhooks
4. No manual sync needed for real-time updates

## Frequently Asked Questions

**Q: How often should I sync?**
A: Daily syncs are recommended. For high-volume changes, consider more frequent syncs or webhook integration.

**Q: What happens if an employee is terminated in Paylocity?**
A: The sync updates the employment status to "Terminated" and populates the termination date.

**Q: Can I sync historical payroll data?**
A: Yes, payroll sync includes historical data. Specify the year parameter when syncing payroll.

**Q: Does this replace Paylocity?**
A: No, this integration syncs data from Paylocity to your system. Paylocity remains the source of truth for HR and payroll.

**Q: What if email addresses don't match?**
A: Auto-linking won't work. You can manually update email addresses or link records via the database.

## Maintenance

### Regular Tasks

1. **Monitor Sync Logs**: Review logs weekly for errors
2. **Verify Data**: Spot-check employee data monthly
3. **Update Credentials**: Rotate API credentials annually
4. **Review Access**: Audit admin access quarterly

### Updates

- Integration updates automatically with system updates
- No manual updates required
- Check release notes for new features
