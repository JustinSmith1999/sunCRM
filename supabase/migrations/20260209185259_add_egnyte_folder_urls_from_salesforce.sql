/*
  # Add Egnyte Folder URLs to CRM Tables
  
  1. Purpose
    - Sync Egnyte folder links from Salesforce to store project folder URLs
    - Allow users to quickly access project folders in Egnyte directly from CRM records
  
  2. Changes
    - Add `egnyte_folder_url` column to leads
    - Add `egnyte_folder_url` column to accounts
    - Add `egnyte_folder_url` column to opportunities
    - Add `egnyte_folder_url` column to salesforce_contacts
    - Add `egnyte_folder_url` column to salesforce_cases
  
  3. Notes
    - These URLs typically come from custom Salesforce fields like:
      - Egnyte_Folder_URL__c
      - Egnyte_Link__c
      - Project_Folder__c
    - URLs allow direct navigation to project documentation in Egnyte
*/

-- Add Egnyte folder URL to leads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'egnyte_folder_url'
  ) THEN
    ALTER TABLE leads ADD COLUMN egnyte_folder_url text;
    CREATE INDEX IF NOT EXISTS idx_leads_egnyte_folder ON leads(egnyte_folder_url) WHERE egnyte_folder_url IS NOT NULL;
  END IF;
END $$;

-- Add Egnyte folder URL to accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'egnyte_folder_url'
  ) THEN
    ALTER TABLE accounts ADD COLUMN egnyte_folder_url text;
    CREATE INDEX IF NOT EXISTS idx_accounts_egnyte_folder ON accounts(egnyte_folder_url) WHERE egnyte_folder_url IS NOT NULL;
  END IF;
END $$;

-- Add Egnyte folder URL to opportunities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'opportunities' AND column_name = 'egnyte_folder_url'
  ) THEN
    ALTER TABLE opportunities ADD COLUMN egnyte_folder_url text;
    CREATE INDEX IF NOT EXISTS idx_opportunities_egnyte_folder ON opportunities(egnyte_folder_url) WHERE egnyte_folder_url IS NOT NULL;
  END IF;
END $$;

-- Add Egnyte folder URL to contacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salesforce_contacts' AND column_name = 'egnyte_folder_url'
  ) THEN
    ALTER TABLE salesforce_contacts ADD COLUMN egnyte_folder_url text;
    CREATE INDEX IF NOT EXISTS idx_contacts_egnyte_folder ON salesforce_contacts(egnyte_folder_url) WHERE egnyte_folder_url IS NOT NULL;
  END IF;
END $$;

-- Add Egnyte folder URL to cases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salesforce_cases' AND column_name = 'egnyte_folder_url'
  ) THEN
    ALTER TABLE salesforce_cases ADD COLUMN egnyte_folder_url text;
    CREATE INDEX IF NOT EXISTS idx_cases_egnyte_folder ON salesforce_cases(egnyte_folder_url) WHERE egnyte_folder_url IS NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN leads.egnyte_folder_url IS 'Direct link to project folder in Egnyte (synced from Salesforce)';
COMMENT ON COLUMN accounts.egnyte_folder_url IS 'Direct link to account folder in Egnyte (synced from Salesforce)';
COMMENT ON COLUMN opportunities.egnyte_folder_url IS 'Direct link to opportunity/project folder in Egnyte (synced from Salesforce)';
COMMENT ON COLUMN salesforce_contacts.egnyte_folder_url IS 'Direct link to contact folder in Egnyte (synced from Salesforce)';
COMMENT ON COLUMN salesforce_cases.egnyte_folder_url IS 'Direct link to case folder in Egnyte (synced from Salesforce)';
