/*
  # Fix User Profiles Recursion Issue

  1. Problem
    - The "Users can view profiles in their organizations" policy joins user_organization_roles
    - This creates recursion when querying user_profiles
    
  2. Solution
    - Drop the problematic policy that causes recursion
    - Keep simpler policies that work without circular references
    
  3. Security
    - Users can still view their own profile
    - Users can view other active profiles (for collaboration)
    - Admin access can be handled at application level
*/

-- Drop the policy that causes recursion
DROP POLICY IF EXISTS "Users can view profiles in their organizations" ON user_profiles;

-- Ensure we have clean simple policies
DROP POLICY IF EXISTS "Users can view other active profiles" ON user_profiles;

-- Recreate with simpler logic
CREATE POLICY "Authenticated users can view active profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true OR id = auth.uid());
