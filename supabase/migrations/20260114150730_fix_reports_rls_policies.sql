/*
  # Fix Reports RLS Policies

  1. Changes
    - Drop existing organization-based policy
    - Create new policies that allow:
      - All authenticated users to view system reports (is_system = true)
      - All authenticated users to view public reports (is_public = true)
      - Users to view their own reports
      - Users to manage their own reports

  2. Security
    - System reports are read-only for all users
    - Users can only edit/delete their own custom reports
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can access reports in their organization" ON reports;
DROP POLICY IF EXISTS "Users can view public and system reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Users can update own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;

-- Create new policies
CREATE POLICY "Anyone can view system and public reports"
  ON reports FOR SELECT
  TO authenticated
  USING (is_system = true OR is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() AND (is_system IS NULL OR is_system = false));

CREATE POLICY "Users can update their own reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() AND (is_system IS NULL OR is_system = false))
  WITH CHECK (created_by = auth.uid() AND (is_system IS NULL OR is_system = false));

CREATE POLICY "Users can delete their own reports"
  ON reports FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() AND (is_system IS NULL OR is_system = false));