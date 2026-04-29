/*
  # Add Complete RLS Policies for User Profiles

  1. Problem
    - user_profiles table only has SELECT policies
    - Users cannot INSERT their own profiles on signup
    - Users cannot UPDATE their own profiles
    - This causes authentication to hang waiting for profile that can't be created

  2. Solution
    - Add INSERT policy for authenticated users to create their own profile
    - Add UPDATE policy for users to update their own profile
    - Keep existing SELECT policies intact

  3. Security
    - Users can only insert/update their OWN profile (id = auth.uid())
    - No user can modify other users' profiles
    - Role and permission management requires admin access at app level
*/

-- Drop existing UPDATE policy if any
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create INSERT policy for new user profile creation
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Create UPDATE policy for profile updates
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
