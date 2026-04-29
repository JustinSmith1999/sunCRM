/*
  # Add RLS Policies for Company Equipment Table

  1. Security Policies
    - Allow authenticated users to SELECT all company equipment records
    - Allow authenticated users to INSERT new company equipment records
    - Allow authenticated users to UPDATE company equipment records
    - Allow authenticated users to DELETE company equipment records

  This enables full CRUD access for authenticated users to manage company equipment.
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can view company equipment" ON company_equipment;
DROP POLICY IF EXISTS "Authenticated users can insert company equipment" ON company_equipment;
DROP POLICY IF EXISTS "Authenticated users can update company equipment" ON company_equipment;
DROP POLICY IF EXISTS "Authenticated users can delete company equipment" ON company_equipment;

-- Allow authenticated users to view all company equipment
CREATE POLICY "Authenticated users can view company equipment"
  ON company_equipment
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert company equipment
CREATE POLICY "Authenticated users can insert company equipment"
  ON company_equipment
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update company equipment
CREATE POLICY "Authenticated users can update company equipment"
  ON company_equipment
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete company equipment
CREATE POLICY "Authenticated users can delete company equipment"
  ON company_equipment
  FOR DELETE
  TO authenticated
  USING (true);
