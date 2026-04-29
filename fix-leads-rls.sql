/*
  # Fix Leads Table RLS Policies

  Issue: New row violates row-level security policy for table "leads"
  
  Solution: Drop and recreate RLS policies to ensure authenticated users can insert leads
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON leads;

-- Recreate policies with proper permissions
CREATE POLICY "leads_select_policy"
  ON leads FOR SELECT
  TO public
  USING (true);

CREATE POLICY "leads_insert_policy"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "leads_update_policy"
  ON leads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "leads_delete_policy"
  ON leads FOR DELETE
  TO authenticated
  USING (true);
