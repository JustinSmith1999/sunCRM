# Rebuild Leads Table Instructions

The migration file `supabase/migrations/20251021000000_rebuild_leads_table_with_data.sql` contains the complete SQL to:

1. Drop the existing leads table
2. Create a new simplified leads table (no organization_id requirement)
3. Insert all 213 leads from your Salesforce export

## To Apply This Migration:

### Option 1: Supabase Dashboard SQL Editor
1. Go to your Supabase project SQL Editor
2. Copy the entire contents of `supabase/migrations/20251021000000_rebuild_leads_table_with_data.sql`
3. Paste and run it

### Option 2: Run via Command Line
If you have the Supabase CLI installed:
```bash
supabase db execute -f supabase/migrations/20251021000000_rebuild_leads_table_with_data.sql
```

The migration will:
- Remove the old leads table completely
- Create a fresh table with proper columns
- Set up RLS policies that allow public read access and authenticated write access
- Insert all 213 leads with their complete data including dates, addresses, and contact info
