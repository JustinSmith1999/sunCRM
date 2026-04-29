-- Fix RLS policies for accounts, opportunities, cases, and tasks tables
-- These tables exist but don't have proper anon access policies

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view accounts" ON accounts;
DROP POLICY IF EXISTS "Authenticated users can view opportunities" ON opportunities;
DROP POLICY IF EXISTS "Authenticated users can view cases" ON cases;
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;

-- Create permissive policies that allow anon and authenticated access
CREATE POLICY "Anyone can view accounts"
  ON accounts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view opportunities"
  ON opportunities FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view cases"
  ON cases FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view tasks"
  ON tasks FOR SELECT
  TO anon, authenticated
  USING (true);

-- Keep restrictive INSERT/UPDATE/DELETE for authenticated only
CREATE POLICY "Authenticated users can insert accounts"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert opportunities"
  ON opportunities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update opportunities"
  ON opportunities FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cases"
  ON cases FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cases"
  ON cases FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true);
