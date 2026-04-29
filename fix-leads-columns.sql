-- Add missing columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS zip_postal_code text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS county text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS primary_phone text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mobile_phone text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS other_source text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_status text DEFAULT 'Open';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS type_of_installation text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by_alias text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS country text DEFAULT 'USA';

-- Show all columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;
