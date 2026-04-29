# Salesforce Reports Sync Guide

This guide explains how to sync all your existing Salesforce reports into your application for a 1-1 mirror.

## Overview

The Salesforce Reports Sync feature allows you to:
- Pull all existing reports from Salesforce
- Create a 1-1 mirror in your local database
- Maintain report metadata including filters, columns, groupings, and configurations
- Distinguish between Salesforce-synced reports and custom reports
- Keep reports updated with periodic syncs

## What Gets Synced

For each Salesforce report, the following information is synchronized:

- **Report Name** - The display name of the report
- **Description** - Report description/purpose
- **Report Type** - Tabular, Summary, Matrix, or Joined (mapped to tabular/summary)
- **Source Object** - The Salesforce object the report queries (Lead, Opportunity, Account, etc.)
- **Columns** - All fields displayed in the report
- **Filters** - Report filter criteria
- **Groupings** - Group-by fields and aggregations (for summary/matrix reports)
- **Folder** - The Salesforce folder the report belongs to
- **Salesforce Metadata** - Creation date, modification date, owner ID, and Salesforce ID

## Syncing Methods

### Method 1: Using the UI (Recommended)

1. Navigate to the **Reports** section in your application
2. Look for the **"Sync from Salesforce"** button in the left sidebar (below the folders list)
3. Click the button
4. Confirm the sync operation
5. Wait for the sync to complete (this may take a few minutes depending on the number of reports)
6. View your synced reports in the reports list

Synced reports will show a blue **"Salesforce"** badge next to their type.

### Method 2: Using the CLI Script

Run the sync script from the command line:

```bash
node sync-salesforce-reports.mjs
```

This script will:
1. Connect to your Salesforce instance
2. Fetch all available reports
3. Sync them to your Supabase database
4. Display a summary of imported, failed, and total reports

## How It Works

### Architecture

1. **Edge Function**: `salesforce-reports-sync`
   - Deployed as a Supabase Edge Function
   - Handles authentication with Salesforce
   - Fetches reports using Salesforce Analytics API
   - Maps Salesforce report structure to local schema

2. **Database Schema**: Enhanced `reports` table
   - Added `salesforce_id` column (unique identifier)
   - Added `salesforce_created_date` column
   - Added `salesforce_modified_date` column
   - Added `salesforce_owner_id` column

3. **Sync Process**:
   ```
   1. Authenticate with Salesforce (SOAP login)
   2. Fetch list of all reports from Salesforce Analytics API
   3. For each report:
      - Fetch detailed metadata
      - Extract columns, filters, groupings
      - Map Salesforce report type to local type
      - Upsert into local database
   4. Return summary of sync results
   ```

### Report Type Mapping

Salesforce reports are mapped to local report types:

| Salesforce Format | Local Type |
|-------------------|------------|
| TABULAR          | tabular    |
| SUMMARY          | summary    |
| MATRIX           | summary    |
| JOINED           | summary    |

### Object Mapping

Salesforce objects are mapped to local tables:

| Salesforce Object | Local Table           |
|-------------------|----------------------|
| Opportunity       | opportunities        |
| Lead              | leads                |
| Account           | accounts             |
| Contact           | salesforce_contacts  |
| Case              | salesforce_cases     |
| Campaign          | salesforce_campaigns |
| Task              | salesforce_tasks     |
| Event             | salesforce_events    |

## Viewing Synced Reports

Synced reports appear in the Reports section alongside custom reports:

- **Blue "Salesforce" Badge**: Indicates the report was synced from Salesforce
- **Folder Organization**: Reports maintain their Salesforce folder structure
- **Full Functionality**: Run, view, export, and analyze synced reports just like custom reports

## Re-syncing Reports

You can re-sync reports at any time to:
- Pull new reports created in Salesforce
- Update existing reports that were modified in Salesforce
- Restore reports that were accidentally deleted

The sync operation uses **upsert** logic:
- New reports are inserted
- Existing reports (matched by `salesforce_id`) are updated
- Local modifications are overwritten with Salesforce data

## Troubleshooting

### Sync Fails to Start

**Problem**: "You must be logged in to sync reports"

**Solution**: Make sure you're logged into the application before attempting to sync.

---

**Problem**: Authentication error

**Solution**: Verify that Salesforce credentials are correctly configured in the edge function.

### Partial Sync

**Problem**: Some reports sync successfully, others fail

**Solution**:
- Check the sync summary for specific error messages
- Reports without metadata may be skipped
- Some custom report types may not be fully supported

### Reports Not Appearing

**Problem**: Sync completes but reports don't show in the UI

**Solution**:
- Refresh the page
- Check that the reports were actually created in Salesforce
- Verify database permissions

### Reports Missing Data

**Problem**: Synced reports don't show all columns/filters

**Solution**:
- Some advanced Salesforce report features may not map perfectly
- Complex filters might need manual adjustment
- Cross-object filters may require custom configuration

## Sync Logs

All sync operations are logged to the `salesforce_sync_logs` table:

```sql
SELECT * FROM salesforce_sync_logs
WHERE salesforce_object = 'Report'
ORDER BY created_at DESC
LIMIT 10;
```

Log entries include:
- Timestamp
- Success/error status
- Records processed/inserted/updated/failed
- Error details (if any)

## Technical Details

### API Endpoints Used

- **Salesforce Analytics API**: `/services/data/v58.0/analytics/reports`
- **Report Metadata API**: `/services/data/v58.0/analytics/reports/{id}/describe`

### Edge Function URL

```
{SUPABASE_URL}/functions/v1/salesforce-reports-sync
```

### Required Permissions

The Salesforce user must have:
- Read access to reports
- API enabled
- Permission to access Analytics API

## Best Practices

1. **Initial Sync**: Run the first sync during off-peak hours as it may take time
2. **Periodic Syncs**: Schedule regular syncs (weekly/monthly) to keep reports updated
3. **Backup**: Consider backing up your reports table before major syncs
4. **Testing**: Test synced reports to ensure filters and groupings work as expected
5. **Documentation**: Document any manual adjustments made to synced reports

## Limitations

- **Report Charts**: Visual chart configurations may not sync completely
- **Dashboard Reports**: Reports embedded in dashboards sync individually, not as dashboards
- **Custom Report Types**: Very complex custom report types may not map perfectly
- **Cross-Object Filters**: Some advanced cross-object filters may need adjustment
- **Bucketed Fields**: Bucketing logic may need to be recreated manually

## Support

For issues or questions about the Salesforce Reports Sync feature:

1. Check the sync logs for detailed error messages
2. Verify Salesforce credentials and API access
3. Review the edge function logs in Supabase dashboard
4. Consult the Salesforce Analytics API documentation

## Future Enhancements

Potential improvements for future versions:

- [ ] Bi-directional sync (push local changes back to Salesforce)
- [ ] Scheduled automatic syncs
- [ ] Selective sync (choose specific reports or folders)
- [ ] Dashboard sync support
- [ ] Advanced chart configuration sync
- [ ] Report sharing and permissions sync
