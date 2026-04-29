/*
  # Add Report Creator Tracking

  1. Changes
    - Add created_by field to track report creator
    - Add updated_by field to track last editor
    - Add updated_at timestamp
    - Add default values for existing reports

  2. Security
    - No RLS changes needed (existing policies still apply)
*/

-- Add creator tracking columns
ALTER TABLE reports 
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reports_updated_at_trigger ON reports;
CREATE TRIGGER update_reports_updated_at_trigger
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();
