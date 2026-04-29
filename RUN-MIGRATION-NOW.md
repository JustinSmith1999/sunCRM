# 🚀 Complete Salesforce Data Migration

## What This Does

This migration will copy **ALL** data from your Salesforce tables into your CRM replacement tables:

| Source Table | → | Destination Table | Records |
|--------------|---|-------------------|---------|
| salesforce_cases | → | cases | 5,498 |
| salesforce_events | → | activities | 8,744 |
| salesforce_tasks | → | activities | 85,731 |
| salesforce_campaigns | → | campaigns | 2 |
| salesforce_products | → | products | varies |

**Total: ~100,000+ records will be migrated**

---

## 📋 How to Run

### Option 1: Supabase SQL Editor (Recommended - 30 seconds)

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file: `MIGRATION-SQL-SCRIPT.sql`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run**
7. Wait ~30-60 seconds for completion
8. Check the results at the bottom showing record counts

### Option 2: Command Line (If you have service role key)

If you have your `SUPABASE_SERVICE_ROLE_KEY`:

1. Add it to your `.env` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_key_here
   ```

2. Run the migration script:
   ```bash
   node migrate-all-salesforce-data.mjs
   ```

---

## ✅ What Happens

### Before Migration
- activities: 0 rows
- cases: 0 rows
- campaigns: 0 rows
- products: 0 rows

### After Migration
- activities: ~94,475 rows (8,744 events + 85,731 tasks)
- cases: 5,498 rows
- campaigns: 2 rows
- products: varies rows

---

## 🔍 Verification

After running the migration, the SQL script will automatically show you a summary:

```
table_name  | record_count
------------|-------------
activities  | 94475
campaigns   | 2
cases       | 5498
products    | varies
```

You can also check in your Supabase Dashboard under "Table Editor" to see all the migrated data.

---

## 🛡️ Safety Features

- **Upserts**: If you run this twice, it won't create duplicates
- **Conflict Resolution**: Existing records are updated, not duplicated
- **Salesforce ID Tracking**: Every record keeps its original Salesforce ID for reference
- **No Data Loss**: Original Salesforce tables remain untouched

---

## 📊 What Gets Migrated

### Cases
- All case details (subject, description, status, priority)
- Related accounts and contacts
- Owner assignments
- Creation and modification dates

### Activities (Events + Tasks)
- All events and tasks combined
- Related records (accounts, contacts, opportunities)
- Due dates and schedules
- Descriptions and locations
- Assignment information

### Campaigns
- Campaign details and status
- Budget and cost tracking
- Start/end dates
- Owner information

### Products
- Product catalog
- Pricing information
- Product codes and categories
- Active status

---

## 🎯 Next Steps

After migration completes:

1. Refresh your CRM dashboard to see the data
2. Test that records are accessible
3. Verify related records are properly linked
4. Check that user assignments are correct

Your CRM is now fully populated with all historical Salesforce data!
