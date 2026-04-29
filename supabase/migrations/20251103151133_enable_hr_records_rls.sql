/*
  # Enable RLS and Add Policies for HR Records Table

  1. Security Changes
    - Enable Row Level Security on hr_records table
    - Add policy for authenticated users to SELECT hr records
    - Add policy for authenticated users to INSERT hr records
    - Add policy for authenticated users to UPDATE hr records
    - Add policy for authenticated users to DELETE hr records

  This enables full CRUD access for authenticated users to manage HR records.
*/

-- Enable RLS on hr_records table
ALTER TABLE hr_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can view hr records" ON hr_records;
DROP POLICY IF EXISTS "Authenticated users can insert hr records" ON hr_records;
DROP POLICY IF EXISTS "Authenticated users can update hr records" ON hr_records;
DROP POLICY IF EXISTS "Authenticated users can delete hr records" ON hr_records;

-- Allow authenticated users to view all hr records
CREATE POLICY "Authenticated users can view hr records"
  ON hr_records
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert hr records
CREATE POLICY "Authenticated users can insert hr records"
  ON hr_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update hr records
CREATE POLICY "Authenticated users can update hr records"
  ON hr_records
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete hr records
CREATE POLICY "Authenticated users can delete hr records"
  ON hr_records
  FOR DELETE
  TO authenticated
  USING (true);
