# Admin Access Quick Fix

## The Problem

Jessica and Gary need access to **BOTH**:
1. **Admin Console** - To manage all channel partners from Admin → Channel Partners
2. **Partner Portal** - To view individual partner data with dropdown selector

Currently they only see "Not a Partner Contact" because:
- ✅ They have user accounts
- ❌ They DON'T have admin roles
- ❌ They DON'T have partner_contacts links

## The Solution (2 Minutes)

### Single Command Setup

1. **Open Supabase SQL Editor:**
   ```
   https://husbupeealwuxyopfwwb.supabase.co/project/_/sql/new
   ```

2. **Copy and Run:**
   - File: `setup-complete-admin-access.sql`
   - Paste entire contents
   - Click "Run"
   - Wait 30 seconds

3. **Done!** ✅

## What This Does

### Creates These Tables (if needed):
- `organizations` - Company information
- `user_profiles` - User profile data
- `user_organization_roles` - Admin role assignments

### Grants Both Users:
- ✅ User profile created
- ✅ Admin role in organization
- ✅ Linked to all 22 channel partners
- ✅ Admin permissions for each partner

## Test It Works

### Test 1: Log In
```
Email: jgrady@sunation.com
Password: sunation9454
```

### Test 2: Check Admin Console
1. Look at sidebar
2. Should see "Admin" menu item (shield icon)
3. Click "Admin"
4. Click "Channel Partners"
5. Should see list of all 22 partners

### Test 3: Check Partner Portal
1. Click "Partner Portal" in sidebar
2. Should see dropdown: "Select Partner"
3. Dropdown contains all 22 partners
4. Select any partner
5. See their leads and data

### Test 4: Repeat with Gary
```
Email: groffman@sunation.com
Password: sunation9454
```

## Expected Results

Both users should have:

**Admin Console:**
- Can navigate to Admin → Channel Partners
- Can view all partner details
- Can manage partner settings
- Can add/edit partner contacts
- Full administrative access

**Partner Portal:**
- Dropdown with 22 partners
- Can switch between any partner
- View each partner's leads
- Track commissions per partner
- Access referral links

## If It Doesn't Work

### Issue: "Not a Partner Contact" still showing

**Run this check:**
```sql
SELECT u.email, COUNT(pc.id) as partner_count
FROM auth.users u
LEFT JOIN partner_contacts pc ON pc.user_id = u.id
WHERE u.email IN ('jgrady@sunation.com', 'groffman@sunation.com')
GROUP BY u.email;
```

**Should show:** 22 partners for each user

**If 0:** Run `setup-complete-admin-access.sql` again

### Issue: "Admin" not in sidebar

**Run this check:**
```sql
SELECT u.email, uor.role
FROM auth.users u
LEFT JOIN user_organization_roles uor ON uor.user_id = u.id
WHERE u.email IN ('jgrady@sunation.com', 'groffman@sunation.com');
```

**Should show:** role = 'admin' for both

**If NULL:** Run `setup-complete-admin-access.sql` again

### Issue: Users don't exist

**If accounts not created:**
```bash
# Option 1: Use edge function
curl -X POST https://husbupeealwuxyopfwwb.supabase.co/functions/v1/create-users \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Option 2: Create manually in Supabase Dashboard
# Go to Authentication → Users → Add User
```

Then run `setup-complete-admin-access.sql` again.

## What Gets Created

### Database Tables:
```
organizations (1 row - Sunation Energy)
user_profiles (2 rows - Jessica, Gary)
user_organization_roles (2 rows - both admins)
partner_contacts (44 rows - 22 partners × 2 users)
```

### Permissions:
```
Admin Role = Full system access
Partner Contact = Per-partner data access
Both Combined = Complete visibility
```

## Files

- `setup-complete-admin-access.sql` ⭐ **RUN THIS ONE**
- `COMPLETE-ADMIN-SETUP-GUIDE.md` - Full documentation
- `setup-admin-roles.mjs` - Node alternative (requires service key)
- `setup-admin-access.mjs` - Node alternative (requires service key)

## Time Required

- **Run SQL:** 1 minute
- **Test access:** 2 minutes
- **Total:** 3 minutes

---

## TL;DR

**Run `setup-complete-admin-access.sql` in Supabase SQL Editor. Done.**

Both users get:
- ✅ Admin Console access
- ✅ Channel Partners management
- ✅ Partner Portal with 22-partner dropdown
- ✅ Full lead & commission visibility
