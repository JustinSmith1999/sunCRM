# User Accounts Setup

All Salesforce users with email addresses have been successfully imported as authentication users with role-based permissions.

## Available User Accounts

### Administrator
- **Email:** admin@example.com
- **Password:** Welcome123!
- **Role:** Administrator
- **Permissions:** Full system access, user management, settings, analytics, Salesforce management
- **Department:** IT

### Sales Manager
- **Email:** john.smith@example.com
- **Password:** Welcome123!
- **Role:** Sales Manager
- **Permissions:** View all deals, manage team deals, analytics, lead management
- **Department:** Sales

### Sales Representatives
1. **Email:** sarah.johnson@example.com
   - **Password:** Welcome123!
   - **Role:** Sales Representative
   - **Permissions:** View/manage own deals, create/view leads
   - **Department:** Sales

2. **Email:** mike.davis@example.com
   - **Password:** Welcome123!
   - **Role:** Sales Representative
   - **Permissions:** View/manage own deals, create/view leads
   - **Department:** Sales

### Support User
- **Email:** emily.chen@example.com
- **Password:** Welcome123!
- **Role:** Support User
- **Permissions:** View/manage cases, knowledge base access
- **Department:** Support

### HR Manager
- **Email:** lisa.martinez@example.com
- **Password:** Welcome123!
- **Role:** HR Manager
- **Permissions:** View/manage HR records, employee data access
- **Department:** Human Resources

### Operations Manager
- **Email:** david.wilson@example.com
- **Password:** Welcome123!
- **Role:** Operations User
- **Permissions:** View reports, manage equipment, inventory access
- **Department:** Operations

## Role Permissions Summary

### Administrator
- All permissions enabled
- User management
- System settings
- View all analytics
- Salesforce integration management

### Sales Manager
- View all deals across team
- Manage team deals
- Access to sales analytics
- Lead management
- Pipeline oversight

### Sales Representative
- View and manage own deals
- Create and view leads
- Personal sales metrics
- Customer interaction tracking

### Support User
- View and manage support cases
- Knowledge base access
- Customer service tools
- Case management

### HR Manager
- View and manage HR records
- Employee data access
- HR reporting
- Personnel management

### Operations User
- View operational reports
- Manage company equipment
- Inventory management
- Operations analytics

## Security Notes

- All users have been created with the default password: **Welcome123!**
- Users should change their password on first login
- Each user's role and permissions are automatically synced to their authentication metadata
- Row Level Security (RLS) policies ensure users can only access data appropriate to their role
- User profiles are linked to their Salesforce user records for data continuity

## Managing Users

### Changing User Roles
To change a user's role, update their `user_profiles` table:
```sql
UPDATE user_profiles
SET role_id = (SELECT id FROM user_roles WHERE name = 'new_role_name')
WHERE email = 'user@example.com';
```

### Adding New Users
1. Add the user to the Salesforce `users` table with an email address
2. Call the `/functions/v1/create-users` edge function to import them
3. Alternatively, users can be created directly through the Supabase Auth API

### Deactivating Users
```sql
UPDATE user_profiles
SET is_active = false
WHERE email = 'user@example.com';
```

## Role-Based Access Control (RBAC)

The system uses a comprehensive RBAC model:
1. **User Roles Table** (`user_roles`) - Defines available roles and their permissions
2. **User Profiles Table** (`user_profiles`) - Links auth users to roles and Salesforce data
3. **Auth Metadata** - Role information synced to `raw_app_meta_data` for quick access
4. **RLS Policies** - Database-level security enforcing role-based data access

## Testing Login

You can test login with any of the accounts above:
1. Navigate to your application's login page
2. Enter one of the email addresses above
3. Use password: Welcome123!
4. You'll be logged in with the appropriate role permissions

## Next Steps

- Users should update their passwords after first login
- Consider implementing password reset functionality
- Add role-based UI components to show/hide features based on permissions
- Implement audit logging for administrative actions
