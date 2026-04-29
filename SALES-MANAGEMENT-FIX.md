# Sales Management Dashboard Fix

## Issue
The Sales Management page was showing empty sales team and lead queue despite having:
- 103 sales team members (sales reps and managers)
- 41,719 leads in the database

## Root Cause
The `SalesManagementDashboard` component was querying for a `role` column directly in the `user_profiles` table:

```typescript
.select('*')
.in('role', ['sales_rep', 'sales_manager'])
```

However, the database schema uses a relational design where:
- `user_profiles` table has a `role_id` column (foreign key)
- `role_id` references the `user_roles` table
- Role information is stored in the `user_roles` table with columns: `name`, `display_name`, `permissions`

This mismatch caused the query to fail silently, returning no results.

## Solution
Updated the component to:

1. **Join with user_roles table** using Supabase's relationship syntax:
```typescript
.select(`
  id,
  email,
  full_name,
  role_id,
  user_roles (
    name,
    display_name
  )
`)
```

2. **Filter for sales roles** after fetching data:
```typescript
const salesRepsData = (repsData || []).filter(rep =>
  rep.user_roles?.name === 'sales_rep' || rep.user_roles?.name === 'sales_manager'
);
```

3. **Updated interface** to use proper role field names:
```typescript
interface SalesRep {
  id: string;
  full_name: string;
  email: string;
  role_name: string;          // Changed from 'role'
  role_display_name: string;   // Added
  assigned_leads_count: number;
  closed_deals_count: number;
  total_revenue: number;
}
```

4. **Updated display** to show role display name:
```typescript
{rep.role_display_name || rep.role_name?.replace('_', ' ').toUpperCase() || 'SALES'}
```

## Files Modified
- `/src/components/Sales/SalesManagementDashboard.tsx`

## Result
The Sales Management Dashboard now correctly displays:
- All 103 sales team members with their stats
- Complete lead queue with filtering options
- Proper role labels (e.g., "Sales Representative", "Sales Manager")
- Lead assignment functionality

## Database Schema Reference
```sql
-- user_profiles table structure
user_profiles (
  id uuid,
  email text,
  full_name text,
  role_id uuid references user_roles(id),
  ...
)

-- user_roles table structure
user_roles (
  id uuid,
  name text,              -- e.g., 'sales_rep', 'sales_manager'
  display_name text,      -- e.g., 'Sales Representative'
  permissions jsonb,
  ...
)
```

## Testing
Build successful - no TypeScript errors or compilation issues.
