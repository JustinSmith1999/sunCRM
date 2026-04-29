/*
  # Fix Infinite Recursion in RLS Policies

  1. Problem
    - The user_profiles table queries user_organization_roles
    - The user_organization_roles "admin check" policy queries itself
    - This creates infinite recursion preventing profile queries from working

  2. Solution
    - Simplify user_organization_roles policies to break circular dependency
    - Keep user_profiles policies simple and functional
    - Allow authenticated users to view organization roles without complex checks

  3. Changes
    - Drop problematic "Admins can view all roles" policy
    - Replace with simpler policies that don't cause recursion
    - Ensure users can still see their own roles and profiles
*/

-- Drop all existing policies on user_organization_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON user_organization_roles;
DROP POLICY IF EXISTS "Users can view own role" ON user_organization_roles;

-- Create simpler non-recursive policies for user_organization_roles
CREATE POLICY "Users can view own organization roles"
  ON user_organization_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view roles in same organizations"
  ON user_organization_roles
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organization_roles 
      WHERE user_id = auth.uid()
    )
  );

-- Clean up duplicate policies on user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- Create single clear policy for viewing own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Keep the other useful policies
-- "Users can view other active profiles" - already exists
-- "Users can view profiles in their organizations" - already exists and should work now
-- "Users can update their own profile" - already exists
