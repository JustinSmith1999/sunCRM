# How to Run Your SQL Scripts

You keep asking for these, so here's the simple way to run them:

## Step 1: Open Supabase SQL Editor

Go to: https://husbupeealwuxyopfwwb.supabase.co/project/_/sql/new

## Step 2: Run Channel Partners SQL

1. Open this file: `/tmp/cc-agent/57590864/project/APPLY-CHANNEL-PARTNERS.sql`
2. Copy ALL the contents
3. Paste into the Supabase SQL Editor
4. Click "Run"

This will create:
- `channel_partners` table
- `partner_contacts` table
- `partner_commissions` table
- Add `partner_id` column to leads table
- Set up all RLS policies

## Step 3: Run Web Forms SQL

1. Open this file: `/tmp/cc-agent/57590864/project/fix-web-forms.sql`
2. Copy ALL the contents
3. Paste into the Supabase SQL Editor
4. Click "Run"

This will:
- Add missing columns to web_forms table
- Create 3 sample web forms (Sunation Contact Form, Solar Consultation, Quick Quote)

## That's It!

Once both scripts run successfully, you'll have:
- ✅ Channel Partners system fully configured
- ✅ Web Forms with 3 ready-to-use forms
- ✅ All RLS policies in place

## Troubleshooting

**If you see "No admin user found"**: You need to log in to the app first to create your user account and organization. Then run the SQL again.

**If you see "already exists"**: That's fine! It means the table/column already exists. The script is designed to skip existing items.
