# Complete Admin Access Setup Guide

## What This Does

Grants Jessica Grady and Gary Roffman **COMPLETE** admin access:

### 1. Admin Console Access
- User profiles created
- Admin role assigned
- Access to Admin → Channel Partners console
- Full partner management capabilities

### 2. Partner Portal Access
- Linked to all 22 channel partners
- Dropdown selector to switch between partners
- View leads and commissions for any partner
- Generate referral links

## Why Both Are Needed

The system has TWO separate access levels:

| Access Type | What It Controls | What They Can Do |
|-------------|------------------|------------------|
| **Admin Role** | Admin Console navigation & features | Manage partners, settings, users, system config |
| **Partner Contacts** | Partner Portal data visibility | View specific partner leads, commissions, metrics |

**Jessica and Gary need BOTH** to have complete oversight of all channel partners.

## Quick Setup (5 minutes)

### Method 1: Single SQL Script (Recommended)

1. **Open Supabase SQL Editor**
   ```
   https://husbupeealwuxyopfwwb.supabase.co/project/_/sql/new
   ```

2. **Run This File**
   - Copy contents of: `setup-complete-admin-access.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Wait for completion** (~30 seconds)

4. **Verify output** shows:
   - ✅ Found both users
   - ✅ Admin roles granted
   - ✅ 22 partners linked for each user

Done! Skip to "Testing Access" section.

### Method 2: Node.js Script (Alternative)

First, add service role key to `.env`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

Get from: https://husbupeealwuxyopfwwb.supabase.co/project/_/settings/api

Then run:
```bash
node setup-admin-roles.mjs
```

This sets up admin console access. Then run:
```bash
node setup-admin-access.mjs
```

This sets up partner portal access.

## Testing Access

### Test 1: Admin Console

1. **Log in as Jessica**
   - Email: jgrady@sunation.com
   - Password: sunation9454

2. **Check sidebar**
   - Should see "Admin" option with shield icon
   - Click "Admin"

3. **Navigate to Channel Partners**
   - Should see admin submenu
   - Click "Channel Partners"
   - Should load console with all 22 partners

4. **Verify capabilities**
   - View partner list
   - Click on any partner to see details
   - See partner contacts, stats, leads
   - Full management interface

### Test 2: Partner Portal

1. **While still logged in as Jessica**
   - Click "Partner Portal" in sidebar

2. **Check dropdown**
   - Should see "Select Partner" dropdown
   - Contains all 22 partners alphabetically

3. **Select a partner**
   - Choose any partner
   - Leads should load (if they have any)
   - Commission data should appear
   - Metrics should calculate

4. **Switch partners**
   - Select different partner from dropdown
   - Data updates automatically
   - Referral link changes

### Test 3: Repeat with Gary

Log out, then log in as:
- Email: groffman@sunation.com
- Password: sunation9454

Repeat Tests 1 and 2 above.

## Expected Results

Both users should have:

### ✅ Admin Console
- Admin menu item visible in sidebar
- Access to Channel Partners console
- Can view/edit partner details
- Can manage partner contacts
- Can see partner statistics

### ✅ Partner Portal
- Dropdown with all 22 partners
- View leads for any partner
- Track commissions
- Generate referral links
- Switch between partners smoothly

## What They Can Do

### From Admin Console (Admin → Channel Partners)

**Partner Management:**
- View all 22 partners in list
- Edit partner details (name, slug, commission rate)
- Add/remove partner contacts
- View partner statistics
- See total leads and commissions per partner
- Manage partner status (active/inactive)

**System-Wide View:**
- See complete partner overview
- Manage all partner relationships
- Configure partner settings
- Administrative functions

### From Partner Portal

**Individual Partner View:**
- Select any partner from dropdown
- View that partner's leads
- Track their commissions
- See their performance metrics
- Access their referral link
- Monitor their conversion rates

**Partner-Specific Actions:**
- Share referral links
- Review lead details
- Track commission payments
- Generate reports per partner

## Troubleshooting

### Issue: "Admin" Menu Not Visible

**Cause:** Admin role not set

**Check:**
```sql
SELECT u.email, uor.role
FROM auth.users u
LEFT JOIN user_organization_roles uor ON uor.user_id = u.id
WHERE u.email IN ('jgrady@sunation.com', 'groffman@sunation.com');
```

**Should show:** role = 'admin' for both

**Fix:** Run `setup-complete-admin-access.sql` again

### Issue: "Not a Partner Contact" in Partner Portal

**Cause:** Partner contacts not linked

**Check:**
```sql
SELECT u.email, COUNT(pc.id) as partner_count
FROM auth.users u
LEFT JOIN partner_contacts pc ON pc.user_id = u.id
WHERE u.email IN ('jgrady@sunation.com', 'groffman@sunation.com')
GROUP BY u.email;
```

**Should show:** 22 partners for each user

**Fix:** Run `setup-complete-admin-access.sql` again

### Issue: Dropdown Not Showing in Partner Portal

**Cause:** Only one partner linked (not 22)

**Check:** Run the partner_count query above

**Fix:** Run `setup-complete-admin-access.sql` to link all 22

### Issue: Can't See Partner Details in Admin Console

**Cause:** RLS policies blocking access OR missing organization role

**Check:**
```sql
SELECT u.email, up.id as profile_exists, uor.id as role_exists
FROM auth.users u
LEFT JOIN user_profiles up ON up.id = u.id
LEFT JOIN user_organization_roles uor ON uor.user_id = u.id
WHERE u.email IN ('jgrady@sunation.com', 'groffman@sunation.com');
```

**Should show:** Both profile_exists and role_exists have values

**Fix:** Run `setup-complete-admin-access.sql` again

## Files Reference

| File | Purpose |
|------|---------|
| `setup-complete-admin-access.sql` | **Single script** for complete setup (RECOMMENDED) |
| `setup-admin-roles.mjs` | Node script for admin console access only |
| `setup-admin-access.mjs` | Node script for partner portal access only |
| `setup-admin-partner-access.sql` | SQL for partner portal access only (old) |
| `COMPLETE-ADMIN-SETUP-GUIDE.md` | This file - complete documentation |

## Database Tables Involved

### For Admin Console Access:
- `user_profiles` - User profile data
- `user_organization_roles` - Role assignments (admin, manager, etc.)
- `organizations` - Organization data

### For Partner Portal Access:
- `partner_contacts` - Links users to specific partners
- `channel_partners` - Partner data
- `leads` - Lead data per partner (visible through RLS)
- `partner_commissions` - Commission tracking per partner

## Security Notes

Both users get these permissions:

**Admin Role:**
- Full access to admin console
- Can manage system settings
- Can view all data
- Trusted administrator level

**Partner Contact Admin:**
- `role: 'admin'` in partner_contacts
- `can_view_leads: true`
- `can_manage_commissions: true`
- Full visibility per partner

**RLS Policies:**
- Still apply and restrict data access appropriately
- Admin role and partner_contacts work together
- Security maintained through proper role checking

## Success Criteria

Setup is complete when:

1. ✅ Both users can log in
2. ✅ Both see "Admin" in sidebar
3. ✅ Both can access Admin → Channel Partners
4. ✅ Both can view partner details in admin console
5. ✅ Both can access Partner Portal
6. ✅ Both see dropdown with 22 partners
7. ✅ Both can view leads for any partner
8. ✅ Both can switch between partners smoothly

## Time Estimate

- **SQL method:** 2 minutes
- **Node method:** 5 minutes
- **Testing:** 5 minutes
- **Total:** 7-12 minutes

## Support

If issues persist after running setup:

1. Check that both user accounts exist (they should - already created)
2. Verify all 22 partners exist in channel_partners table
3. Check for database errors in Supabase logs
4. Verify RLS policies are not blocking admin access
5. Ensure organizations table has at least one entry

---

**Ready?** Run `setup-complete-admin-access.sql` and you're done!
