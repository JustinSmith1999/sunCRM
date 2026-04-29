# Salesforce User Sync Guide

## Overview

The Salesforce User Sync feature automatically creates login accounts for all active Salesforce users in your CRM system. This eliminates the need to manually create accounts for every employee.

## How It Works

1. **Fetches all active Salesforce users** from your Salesforce org
2. **Maps their roles** based on their Salesforce Profile and Role
3. **Creates login accounts** with a default password
4. **Syncs user data** including name, email, title, department, and phone

## Role Mapping

The system automatically maps Salesforce profiles to CRM roles:

| Salesforce Profile | CRM Role |
|-------------------|----------|
| System Administrator, Admin | `admin` |
| Sales Manager | `sales_manager` |
| Sales User | `sales_rep` |
| Service/Support | `support` |
| HR | `hr_manager` |
| Operations, Install, Field Tech | `operations` |
| Partner, External | `partner` |
| Default | `sales_rep` |

## Prerequisites

Before you can sync users, you must configure Salesforce credentials:

1. Go to **Admin → API Integrations Console**
2. Add Salesforce integration with:
   - Username: Your Salesforce username
   - Password: Your Salesforce password
   - Security Token: Your Salesforce security token
3. Test the connection to ensure it's working

## Using the Sync Feature

### From the Admin Panel

1. Navigate to **Admin → User Management**
2. Click **Sync from Salesforce** button (green button with refresh icon)
3. Wait for the sync to complete (may take 30-60 seconds)
4. Review the results:
   - **Total**: Number of active Salesforce users found
   - **Created**: New accounts created
   - **Updated**: Existing accounts updated
   - **Errors**: Any users that failed to sync

### Default Password

All synced users receive the default password: **`sunation9454`**

Users will be prompted to change their password on first login.

## What Gets Synced

For each Salesforce user, the system syncs:

- ✅ Email address (used as username)
- ✅ Full name (First + Last name)
- ✅ Title
- ✅ Department
- ✅ Phone number
- ✅ Mobile phone
- ✅ Role (mapped from Profile/Role)
- ✅ Salesforce User ID (for reference)

## Subsequent Syncs

When you run the sync again:

- **Existing users**: Profile data is updated (name, title, department, role)
- **New users**: Login accounts are created
- **Deleted/Inactive users**: Not affected (manual deactivation required)

## Troubleshooting

### "Salesforce integration not configured"

**Solution**: Set up Salesforce credentials in the API Integrations Console first.

### "Failed to authenticate with Salesforce"

**Solution**:
1. Verify your Salesforce username is correct
2. Ensure you're using `password + security_token` combined
3. Check if your IP is allowed in Salesforce (or use security token)

### Some users show errors

Common reasons:
- Missing email address (users without email are skipped)
- Duplicate emails (Salesforce allows duplicates, but our system doesn't)
- Invalid characters in names

### Users can't log in

**Solution**:
1. Check that the user was successfully created (look in User Management list)
2. Verify they're using their email as username
3. Confirm they're using the default password: `sunation9454`
4. Check if the account is marked as active

## Security Notes

- All passwords are hashed and encrypted
- The default password should be changed on first login
- Salesforce credentials are stored encrypted in the database
- Only admins can access the sync feature
- User sync requires admin privileges

## Best Practices

1. **Run the sync regularly** (weekly or monthly) to keep users up to date
2. **Notify new users** when their accounts are created
3. **Monitor the error list** and fix any users that failed to sync
4. **Deactivate departing employees** manually (sync doesn't remove users)
5. **Keep Salesforce profiles updated** so role mapping is accurate

## API Endpoint

The sync can also be triggered programmatically:

```bash
POST {SUPABASE_URL}/functions/v1/sync-salesforce-users
Authorization: Bearer {SUPABASE_ANON_KEY}
```

Response:
```json
{
  "success": true,
  "summary": {
    "total": 150,
    "created": 10,
    "updated": 140,
    "skipped": 0,
    "errors": 0
  },
  "details": {
    "created": [...],
    "updated": [...],
    "errors": [...]
  }
}
```

## Related Documentation

- [User Roles and Permissions](./USER-ROLES-AND-PERMISSIONS.md)
- [Salesforce Integration Setup](./SALESFORCE-SIMPLE-SETUP.md)
- [API Integrations Guide](./API-INTEGRATIONS-GUIDE.md)
