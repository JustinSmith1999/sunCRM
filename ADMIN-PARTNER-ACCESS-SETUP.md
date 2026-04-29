# Admin Partner Access Setup

## Overview
Grant Jessica Grady and Gary Roffman admin access to all 22 channel partners.

## Their Existing Accounts
Both users already have accounts in the system:
- **Jessica Grady**: jgrady@sunation.com
- **Gary Roffman**: groffman@sunation.com

## Quick Setup

### Step 1: Run the SQL Script

Open Supabase SQL Editor:
```
https://husbupeealwuxyopfwwb.supabase.co/project/_/sql/new
```

Run this file:
```
setup-admin-partner-access.sql
```

### Step 2: Verify Access

The script will automatically:
1. Find Jessica's and Gary's user IDs
2. Link them to all 22 channel partners
3. Grant them admin role with full permissions
4. Show verification results

### What They Get

**Permissions for ALL 22 partners:**
- ✅ View all partner leads
- ✅ Manage commissions
- ✅ View partner performance metrics
- ✅ Access Partner Portal
- ✅ Generate reports

## Expected Output

After running the script, you should see:

```
NOTICE: Found Jessica Grady: <uuid>
NOTICE: Linked Jessica to: 3 Sons Energy
NOTICE: Linked Jessica to: ASCC Consulting LLC
... (all 22 partners)
NOTICE: Found Gary Roffman: <uuid>
NOTICE: Linked Gary to: 3 Sons Energy
... (all 22 partners)
```

Then verification tables showing:
- Jessica's 22 partner links
- Gary's 22 partner links
- Summary: 2 users, 22 partners each

## What They Can Access

### Partner Portal
Both users can now:
1. Log in at your domain
2. Click "Partner Portal" in sidebar
3. See dropdown to select any of the 22 partners
4. View leads for selected partner
5. Track commissions
6. Generate reports

### Admin Console
If they also have admin role, they can:
1. Go to Admin → Channel Partners
2. View all 22 partners
3. Edit partner details
4. Manage contacts
5. Configure webhooks
6. View system-wide metrics

## Troubleshooting

### Issue: Script says "User not found"
**Solution:**
```sql
-- Verify accounts exist
SELECT id, email, raw_user_meta_data->>'full_name' as name
FROM auth.users
WHERE email IN ('jgrady@sunation.com', 'groffman@sunation.com');
```

Expected: 2 rows

If missing, accounts need to be created first.

### Issue: Partners not showing in dropdown
**Solution:**
```sql
-- Check partner_contacts table
SELECT COUNT(*) FROM partner_contacts
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN ('jgrady@sunation.com', 'groffman@sunation.com')
);
```

Expected: 44 (22 partners × 2 users)

### Issue: "Access Denied" when viewing leads
**Solution:**
```sql
-- Verify permissions
SELECT
  u.email,
  pc.role,
  pc.can_view_leads,
  pc.can_manage_commissions
FROM partner_contacts pc
JOIN auth.users u ON u.id = pc.user_id
WHERE u.email IN ('jgrady@sunation.com', 'groffman@sunation.com')
LIMIT 5;
```

Expected:
- role = 'admin'
- can_view_leads = true
- can_manage_commissions = true

## Testing

### Test as Jessica
1. Log in as jgrady@sunation.com
2. Go to Partner Portal
3. Select "3 Sons Energy" from dropdown
4. Should see all leads for that partner
5. Try another partner - should work

### Test as Gary
1. Log in as groffman@sunation.com
2. Go to Partner Portal
3. Select any partner
4. Should see all their leads
5. Check commission tracking

## Add More Admins Later

To grant another user access to all partners:

```sql
DO $$
DECLARE
  target_user_id uuid;
  partner_record RECORD;
BEGIN
  -- Get user ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'newadmin@sunation.com';

  -- Link to all partners
  IF target_user_id IS NOT NULL THEN
    FOR partner_record IN SELECT id FROM channel_partners LOOP
      INSERT INTO partner_contacts (partner_id, user_id, role, can_view_leads, can_manage_commissions)
      VALUES (partner_record.id, target_user_id, 'admin', true, true)
      ON CONFLICT (partner_id, user_id) DO UPDATE
      SET role = 'admin',
          can_view_leads = true,
          can_manage_commissions = true;
    END LOOP;
  END IF;
END $$;
```

## Remove Access

To remove a user's access:

```sql
DELETE FROM partner_contacts
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@sunation.com');
```

## Related Files
- `setup-all-channel-partners.sql` - Creates the 22 partners
- `channel-partners-migration.sql` - Creates the database tables
- `CHANNEL-PARTNERS-DEPLOYMENT-CHECKLIST.md` - Full deployment guide
- `PARTNER-URLS-MAPPING.md` - All partner URLs

---

**Status**: Ready to run
**Time to Complete**: ~30 seconds
**Users Affected**: Jessica Grady, Gary Roffman
**Partners**: All 22
