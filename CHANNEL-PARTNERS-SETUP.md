# Channel Partners System Setup Guide

## Overview
Complete system for managing channel partner relationships, custom webhook forms, and commission tracking.

## Step 1: Run Database Migration

Open Supabase SQL Editor and run the migration file:
**https://husbupeealwuxyopfwwb.supabase.co/project/_/sql/new**

Run the contents of: `channel-partners-migration.sql`

This creates:
- `channel_partners` table
- `partner_contacts` table
- `partner_commissions` table
- Adds `partner_id` and `partner_lead_source` to `leads` table

## Step 2: Set Up Initial Partners

After running the migration, insert the initial partner data:

```sql
-- Insert 3 Brothers (3 Sons Energy)
INSERT INTO channel_partners (name, slug, contact_email, commission_rate, commission_type, notes)
VALUES (
  '3 Brothers',
  '3-brothers',
  'contact@3brothers.com',
  10.00,
  'percentage',
  'Also known as 3 Sons Energy in Salesforce'
)
RETURNING id;

-- Insert MelCo Solar
INSERT INTO channel_partners (name, slug, contact_email, commission_rate, commission_type, notes)
VALUES (
  'MelCo Solar',
  'melco-solar',
  'contact@melcosolar.com',
  10.00,
  'percentage',
  'Channel partner'
)
RETURNING id;
```

## Step 3: Link Partner Contacts

### Jessica Grady (Found in System)
- **Name**: Grady, Jessica
- **Email**: jgrady@sunation.com
- **Personal Email**: jessicagrady124@gmail.com
- **Position**: Sales Administrator
- **HR Record ID**: a0c4X00000TOgbzQAD

First, find Jessica's auth user_id:
```sql
-- Find Jessica in auth.users
SELECT id, email FROM auth.users WHERE email ILIKE '%jgrady%sunation%';
```

Then link her to partner(s):
```sql
-- Link Jessica to a partner (replace user_id and partner_id)
INSERT INTO partner_contacts (partner_id, user_id, role, can_view_leads)
VALUES (
  '<partner_id_from_step2>',
  '<jessica_user_id>',
  'primary',
  true
);
```

### Gary Roffman (Not Found - Need to Create)
If Gary doesn't exist in the system:
1. Create his user account via Admin Dashboard > Users
2. Then link him to partner via SQL above

## Step 4: Features

### Admin Features (Channel Partners Console)
- View all partners
- Add/edit partner information
- Set commission rates
- Assign partner contacts
- View partner performance metrics
- Manage commissions

### Partner Contact Features (Partner Portal)
- View their assigned partner
- See all leads from their partner
- Track lead status/progress
- View commission information
- Download reports

### Public Features
- Custom webhook forms per partner
- Unique URLs: `/partner-form/[partner-slug]`
- Example: `/partner-form/3-brothers`
- Auto-assigns leads to partner
- Sends email notifications

## Webhook Form URLs

After setup, partners will have these URLs:

- **3 Brothers**: https://[your-domain]/partner-form/3-brothers
- **MelCo Solar**: https://[your-domain]/partner-form/melco-solar

Each form:
- Pre-fills Partner and LeadSource fields (hidden)
- Includes reCAPTCHA validation
- Sends email notification on submission
- Auto-creates lead in database
- Links lead to partner for tracking

## Email Notifications

When a partner lead is submitted:
1. Creates lead in database
2. Links to partner via partner_id
3. Sends email to:
   - Partner contact email
   - Designated sales team recipients
4. Email format matches your Salesforce format:
   ```
   Lead: [Name] has been created
   Created By: Channel Partner / [Date]

   [Full Name]
   Address: [Street], [City], [State] [Zip]
   Utility Account: [Account]
   Utility: [Utility]

   Phone: [Phone]
   Email: [Email]
   Lead Source: [Partner Name]

   *** PARTNER: [Partner Name]
   Sales Notes: [Notes]

   Link to Lead: [URL]
   ```

## Commission Tracking

Commissions are automatically tracked:
- Created when partner lead converts to sale
- Status: pending/paid/cancelled
- Commission amount calculated from partner rate
- Payment tracking with paid_date
- Full audit trail

## Next Steps

1. ✅ Run migration SQL
2. ✅ Insert initial partners
3. ✅ Link Jessica Grady
4. ⏳ Create/link Gary Roffman
5. ⏳ Test webhook forms
6. ⏳ Configure email notifications
7. ⏳ Train partners on portal access

## Database Schema

### channel_partners
- `id`: UUID primary key
- `name`: Partner company name
- `slug`: URL-friendly identifier
- `webhook_url`: Auto-generated webhook endpoint
- `contact_email`: Primary contact
- `commission_rate`: Default rate (percentage or flat)
- `commission_type`: 'percentage' | 'flat_fee'
- `status`: 'active' | 'inactive'

### partner_contacts
- Links auth.users to channel_partners
- Grants portal access
- Defines role (primary/secondary/contact)

### partner_commissions
- Tracks all commissions
- Links to leads and (future) deals
- Payment status tracking
- Audit trail

## Existing Partners Found in Database

Based on Salesforce data:
- ✅ 3 Sons Energy (4 leads)
- Solar Pro Roofing
- Renewable Earth Inc
- T&S Energy LLC
- Sunchain Energy
- IntelliSun

Consider setting these up as additional partners.
