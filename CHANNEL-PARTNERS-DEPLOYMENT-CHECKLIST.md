# Channel Partners System - Deployment Checklist

## Overview
Complete step-by-step guide to deploy the Channel Partners system with all 22 partners.

---

## Phase 1: Database Setup

### Step 1.1: Run Main Migration ✅
```
File: channel-partners-migration.sql
Location: Supabase SQL Editor
URL: https://husbupeealwuxyopfwwb.supabase.co/project/_/sql/new
```

**What it does**:
- Creates `channel_partners` table
- Creates `partner_contacts` table
- Creates `partner_commissions` table
- Adds `partner_id` and `partner_lead_source` columns to `leads`
- Sets up RLS policies for security

**Verification**:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('channel_partners', 'partner_contacts', 'partner_commissions');
```

Expected: 3 rows

---

### Step 1.2: Insert All 22 Partners ✅
```
File: setup-all-channel-partners.sql
Location: Supabase SQL Editor
```

**What it does**:
- Inserts all 22 channel partners
- Sets default 10% commission rate
- Creates slugs matching SUNation URLs
- Sets all partners to active status

**Verification**:
```sql
SELECT COUNT(*) FROM channel_partners;
```

Expected: 22

**View all partners**:
```sql
SELECT id, name, slug, status FROM channel_partners ORDER BY name;
```

---

### Step 1.3: Link Existing Leads (Optional) ⏳
```
File: link-existing-partner-leads.sql
Location: Supabase SQL Editor
```

**What it does**:
- Finds existing leads with partner info in LeadSource or Partner__c
- Links them to the correct partner
- Preserves historical attribution

**Verification**:
```sql
SELECT
  cp.name,
  COUNT(l.id) as leads
FROM channel_partners cp
LEFT JOIN leads l ON l.partner_id = cp.id
GROUP BY cp.name
ORDER BY leads DESC;
```

---

## Phase 2: Partner Contact Setup

### Step 2.1: Find Jessica Grady's User ID ⏳
```sql
SELECT id, email, raw_user_meta_data->>'full_name' as name
FROM auth.users
WHERE email = 'jgrady@sunation.com';
```

**Expected**: 1 row with her user ID

---

### Step 2.2: Link Jessica to Partner(s) ⏳

**Option A: Link to specific partner**
```sql
-- Example: Link Jessica to 3 Sons Energy
INSERT INTO partner_contacts (partner_id, user_id, role, can_view_leads)
VALUES (
  (SELECT id FROM channel_partners WHERE slug = '3sonsenergy'),
  '<jessica-user-id-from-step-2.1>',
  'primary',
  true
);
```

**Option B: Link to multiple partners** (if she manages multiple)
```sql
-- Repeat for each partner she manages
INSERT INTO partner_contacts (partner_id, user_id, role, can_view_leads)
VALUES
  ((SELECT id FROM channel_partners WHERE slug = 'partner1'), '<user-id>', 'primary', true),
  ((SELECT id FROM channel_partners WHERE slug = 'partner2'), '<user-id>', 'primary', true);
```

---

### Step 2.3: Create Gary Roffman's Account ⏳

**Gary was not found in the system. Two options:**

**Option A: Create via Admin Console**
1. Log in as admin
2. Go to Admin → User Mappings
3. Click "Create User"
4. Enter Gary's email
5. Set temporary password
6. Save

**Option B: Have Gary register**
1. Send Gary the registration link
2. He creates his own account
3. You link his account to partners (Step 2.4)

---

### Step 2.4: Link Gary to Partner(s) ⏳
```sql
-- Find Gary's user ID first
SELECT id, email FROM auth.users WHERE email = 'gary@email.com';

-- Then link to partner(s)
INSERT INTO partner_contacts (partner_id, user_id, role, can_view_leads)
VALUES (
  (SELECT id FROM channel_partners WHERE slug = 'partner-slug'),
  '<gary-user-id>',
  'primary',
  true
);
```

---

## Phase 3: Edge Function Deployment

### Step 3.1: Deploy Partner Webhook ⏳
```
File: supabase/functions/partner-webhook/index.ts
```

**Method 1: Supabase Dashboard**
1. Go to Supabase Dashboard → Edge Functions
2. Click "Create Function"
3. Name: `partner-webhook`
4. Copy/paste code from file
5. Deploy

**Method 2: Supabase CLI**
```bash
supabase functions deploy partner-webhook
```

**Verification**:
```bash
curl -X POST https://husbupeealwuxyopfwwb.supabase.co/functions/v1/partner-webhook \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"partner_slug":"test"}'
```

Expected: 404 error (partner not found) - this means the function is working

---

## Phase 4: Testing

### Step 4.1: Test Partner Form ⏳

1. Visit: `http://localhost:5173/partner-form/3sonsenergy` (dev) or your domain
2. Fill out the form with test data:
   - First Name: Test
   - Last Name: Partner
   - Email: test@example.com
   - Phone: (555) 123-4567
   - Street: 123 Test St
   - City: New York
   - State: NY
   - Zip: 10001
   - County: New York
   - Utility: Con-Ed
   - Own Residence: YES
   - Installation Type: Residential
3. Submit form
4. Should redirect to thank you page

---

### Step 4.2: Verify Lead Creation ⏳

```sql
SELECT
  "Name",
  "Email",
  "LeadSource",
  "Partner__c",
  partner_lead_source,
  cp.name as partner_name
FROM leads l
LEFT JOIN channel_partners cp ON cp.id = l.partner_id
WHERE "Email" = 'test@example.com'
ORDER BY "CreatedDate" DESC
LIMIT 1;
```

**Expected**:
- Lead exists
- `partner_name` = "3 Sons Energy"
- `LeadSource` = "3 Sons Energy"
- `Partner__c` = "3 Sons Energy"

---

### Step 4.3: Test Partner Portal Access ⏳

1. Log in as Jessica (jgrady@sunation.com)
2. Click "Partner Portal" in sidebar
3. Should see:
   - Partner name
   - Dashboard with metrics
   - List of leads
   - Commission information
   - Referral link

**If Jessica sees "Not a Partner Contact"**:
- Check partner_contacts table
- Verify user_id matches her auth.users.id
- Verify can_view_leads is true

---

### Step 4.4: Test Admin Console ⏳

1. Log in as admin
2. Go to Admin → Channel Partners
3. Should see:
   - List of all 22 partners
   - Click on a partner
   - View metrics, contacts, webhook URL
   - Edit partner details
   - Add/remove contacts

---

## Phase 5: Production Deployment

### Step 5.1: Update Partner Contact Emails ⏳

Replace placeholder emails with real ones:
```sql
UPDATE channel_partners
SET contact_email = 'real@email.com',
    phone = '(555) 123-4567'
WHERE slug = 'partner-slug';
```

Do this for all 22 partners.

---

### Step 5.2: Adjust Commission Rates (Optional) ⏳

If partners have different rates:
```sql
UPDATE channel_partners
SET commission_rate = 12.00
WHERE slug = 'partner-slug';
```

---

### Step 5.3: Share Form URLs with Partners ⏳

Send each partner their unique form URL:

**Email Template**:
```
Subject: Your SUNation Partner Referral Portal

Hi [Partner Name],

We've set up a custom referral form for you to submit leads directly to SUNation.

Your Referral Form:
https://[your-domain]/partner-form/[partner-slug]

Features:
- Direct lead submission
- Automatic tracking and attribution
- Commission tracking
- Lead status updates

You can also access your Partner Portal to view all your submitted leads:
https://[your-domain]
Login with: [contact-email]

Questions? Contact your SUNation rep.

Best,
SUNation Team
```

---

### Step 5.4: Configure Email Notifications ⏳

Update the partner-webhook function to send emails:

1. Choose email provider (SendGrid, Mailgun, etc.)
2. Add credentials to Supabase Edge Function secrets
3. Update email sending code in `partner-webhook/index.ts`
4. Redeploy function

Example for SendGrid:
```typescript
// In partner-webhook/index.ts
const sendEmail = async (to: string, subject: string, body: string) => {
  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@sunation.com' },
      subject,
      content: [{ type: 'text/plain', value: body }],
    }),
  });
};
```

---

## Phase 6: Training & Documentation

### Step 6.1: Train Partner Contacts ⏳

Send training guide to Jessica, Gary, and other partner contacts:
- How to access Partner Portal
- How to view leads
- How to track commissions
- How to share referral link

---

### Step 6.2: Train Admin Team ⏳

Document admin processes:
- How to add new partners
- How to manage commissions
- How to generate reports
- How to update partner information

---

## Verification Checklist

- [ ] All 3 migration SQL files run successfully
- [ ] 22 partners show in channel_partners table
- [ ] Jessica Grady linked to partner(s)
- [ ] Gary Roffman account created and linked
- [ ] partner-webhook edge function deployed
- [ ] Test form submission successful
- [ ] Test lead appears in database with partner attribution
- [ ] Jessica can access Partner Portal
- [ ] Admin can access Channel Partners Console
- [ ] Email notifications configured (optional)
- [ ] Partner contact emails updated
- [ ] Form URLs shared with all partners
- [ ] Training completed for partner contacts
- [ ] Training completed for admin team

---

## Troubleshooting

### Issue: Partner form shows "Partner not found"
**Solution**:
- Check slug in URL matches database
- Verify partner status is 'active'
- Check browser console for errors

### Issue: Form submission fails
**Solution**:
- Check edge function is deployed
- Verify CORS headers are correct
- Check Supabase logs for errors
- Test with curl command

### Issue: Jessica can't see Partner Portal
**Solution**:
```sql
-- Verify link exists
SELECT * FROM partner_contacts WHERE user_id = '<jessica-user-id>';

-- If missing, add it
INSERT INTO partner_contacts (partner_id, user_id, role, can_view_leads)
VALUES ('<partner-id>', '<jessica-user-id>', 'primary', true);
```

### Issue: Leads not showing partner attribution
**Solution**:
- Check partner_id is set on lead
- Run link-existing-partner-leads.sql
- Verify RLS policies allow partner contacts to view

### Issue: Email notifications not sending
**Solution**:
- Check email provider credentials
- Verify edge function has API keys
- Test email provider directly
- Check Supabase function logs

---

## Support Files Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `channel-partners-migration.sql` | Create tables | First time setup |
| `setup-all-channel-partners.sql` | Insert 22 partners | After migration |
| `link-existing-partner-leads.sql` | Link historical leads | Optional, for existing data |
| `CHANNEL-PARTNERS-SETUP.md` | Detailed setup guide | Reference during setup |
| `CHANNEL-PARTNERS-IMPLEMENTATION.md` | Technical overview | Understanding system |
| `PARTNER-URLS-MAPPING.md` | URL reference | Sharing with partners |
| `supabase/functions/partner-webhook/index.ts` | Edge function code | Deploy to Supabase |

---

## Quick Start (TL;DR)

```bash
# 1. Run migrations in Supabase SQL Editor
# - channel-partners-migration.sql
# - setup-all-channel-partners.sql
# - link-existing-partner-leads.sql (optional)

# 2. Link Jessica Grady
# - Find user ID
# - INSERT into partner_contacts

# 3. Deploy edge function
supabase functions deploy partner-webhook

# 4. Test
# - Visit /partner-form/3sonsenergy
# - Submit test lead
# - Verify in database

# 5. Production
# - Update contact emails
# - Share URLs with partners
# - Train partner contacts
```

---

**Status**: Ready for deployment
**Last Updated**: January 7, 2026
**Build Status**: ✅ Passed
