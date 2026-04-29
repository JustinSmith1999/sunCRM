# Paylocity Integration - Quick Start

## What You Need

1. **Paylocity Client ID** - Get from Paylocity Developer Settings
2. **Paylocity Client Secret** - Get from Paylocity Developer Settings
3. **Company ID** - Your Paylocity company identifier

## Setup in 3 Steps

### Step 1: Navigate to Paylocity Console
- Login as admin → **Admin Dashboard** → **Paylocity HR** tile

### Step 2: Enter Credentials
- Fill in Client ID, Client Secret, and Company ID
- Check "Enable Paylocity Integration"
- Click **Save Configuration**

### Step 3: Test & Sync
- Click **Test Connection** (should show employee count)
- Click **Sync Now** to import all employees
- Done!

## What Gets Synced

✅ Employee personal information (name, email, phone)
✅ Job details (title, department, hire date)
✅ Employment status (active, terminated)
✅ Compensation (salary, pay rate)
✅ Contact information (address, phone)
✅ Benefits eligibility
✅ Time off balances (PTO, sick, vacation)

## Auto-Linking

Employees automatically link to existing HR records via email matching:
- Matches `email` from Paylocity to `Personal_Email__c` or `Work_Email__c` in HR records
- Updates happen automatically after each sync
- No manual linking required!

## Viewing Data

**In the Console:**
- **Employees Tab** - View all synced employees
- **Sync Logs Tab** - Monitor sync history and errors
- **Configuration Tab** - Manage credentials and settings

**In the Database:**
- `paylocity_employees` - All employee data from Paylocity
- `paylocity_sync_logs` - Sync operation history
- `hr_records` - Updated with Paylocity data (fields: `Paylocity_Employee_ID__c`, `Paylocity_Synced_At__c`)

## Syncing Schedule

- **Manual**: Click "Sync Now" anytime
- **Scheduled**: Set up daily automatic syncs
- **Real-time**: Webhook support (coming soon)

## Troubleshooting

**Connection fails:**
- Verify credentials are correct
- Ensure API access enabled in Paylocity
- Check you're using correct API URL

**Employees don't link:**
- Verify emails match between systems
- Check email fields are populated in HR records
- Try manual email update

**Sync times out:**
- Normal for initial sync with many employees
- Subsequent syncs are incremental and faster
- Check sync logs for details

## Need Help?

📖 Full documentation: `PAYLOCITY-INTEGRATION-GUIDE.md`
🔗 Paylocity Developer Portal: https://developer.paylocity.com
💬 Contact your Paylocity representative for API access
