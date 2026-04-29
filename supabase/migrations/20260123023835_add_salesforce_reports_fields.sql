/*
  # Add Salesforce Reports Sync Fields

  1. New Columns
    - `salesforce_id` (text, unique) - Salesforce report ID for syncing
    - `salesforce_created_date` (timestamptz) - Original creation date in Salesforce
    - `salesforce_modified_date` (timestamptz) - Last modified date in Salesforce
    - `salesforce_owner_id` (text) - Salesforce owner ID

  2. Changes
    - Add unique constraint on salesforce_id for proper upsert operations
    - Add index on salesforce_id for faster lookups

  3. Notes
    - Allows 1-1 mapping between Salesforce reports and local reports
    - Enables tracking of Salesforce-originated reports vs custom reports
*/

-- Add Salesforce sync columns
ALTER TABLE reports ADD COLUMN IF NOT EXISTS salesforce_id text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS salesforce_created_date timestamptz;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS salesforce_modified_date timestamptz;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS salesforce_owner_id text;

-- Add unique constraint on salesforce_id (nullable for non-Salesforce reports)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reports_salesforce_id_key'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_salesforce_id_key UNIQUE (salesforce_id);
  END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reports_salesforce_id ON reports(salesforce_id) WHERE salesforce_id IS NOT NULL;

-- Add index for Salesforce sync tracking
CREATE INDEX IF NOT EXISTS idx_reports_salesforce_modified ON reports(salesforce_modified_date) WHERE salesforce_modified_date IS NOT NULL;
