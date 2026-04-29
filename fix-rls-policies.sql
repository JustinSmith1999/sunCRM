-- Fix RLS Policies for Leads Table
-- This will allow authenticated users to insert leads into their organization

-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view organization leads" ON leads;
DROP POLICY IF EXISTS "Users can create leads" ON leads;
DROP POLICY IF EXISTS "Users can update leads" ON leads;
DROP POLICY IF EXISTS "Users can delete leads" ON leads;

-- Make sure RLS is enabled
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create simpler policies that check if user has a profile with the same organization_id
-- SELECT policy - users can view leads in their organization
CREATE POLICY "Users can view organization leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- INSERT policy - users can create leads in their organization
CREATE POLICY "Users can create leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- UPDATE policy - users can update leads in their organization
CREATE POLICY "Users can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- DELETE policy - users can delete leads in their organization
CREATE POLICY "Users can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'leads';
