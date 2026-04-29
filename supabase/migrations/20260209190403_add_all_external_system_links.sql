/*
  # Add External System Links to CRM Tables
  
  1. Purpose
    - Add Aurora Solar, Basecamp, and Egnyte links to all relevant CRM tables
    - Store direct links to external systems for quick access from record views
  
  2. Changes
    - Add aurora_solar_url, basecamp_url, egnyte_url columns to leads
    - Add aurora_solar_url, basecamp_url, egnyte_url columns to accounts
    - Add aurora_solar_url, basecamp_url, egnyte_url columns to opportunities
    - Add aurora_solar_url, basecamp_url, egnyte_url columns to contacts
    - Add aurora_solar_url, basecamp_url, egnyte_url columns to cases
  
  3. Notes
    - These URLs typically come from Salesforce custom fields
    - Allow users to jump directly to Aurora designs, Basecamp projects, and Egnyte folders
*/

-- Add external system links to leads
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'aurora_solar_url') THEN
    ALTER TABLE leads ADD COLUMN aurora_solar_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'basecamp_url') THEN
    ALTER TABLE leads ADD COLUMN basecamp_url text;
  END IF;
END $$;

-- Add external system links to accounts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'aurora_solar_url') THEN
    ALTER TABLE accounts ADD COLUMN aurora_solar_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'basecamp_url') THEN
    ALTER TABLE accounts ADD COLUMN basecamp_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'egnyte_url') THEN
    ALTER TABLE accounts ADD COLUMN egnyte_url text;
  END IF;
END $$;

-- Add external system links to opportunities
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'aurora_solar_url') THEN
    ALTER TABLE opportunities ADD COLUMN aurora_solar_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'basecamp_url') THEN
    ALTER TABLE opportunities ADD COLUMN basecamp_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'egnyte_url') THEN
    ALTER TABLE opportunities ADD COLUMN egnyte_url text;
  END IF;
END $$;

-- Add external system links to contacts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salesforce_contacts' AND column_name = 'aurora_solar_url') THEN
    ALTER TABLE salesforce_contacts ADD COLUMN aurora_solar_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salesforce_contacts' AND column_name = 'basecamp_url') THEN
    ALTER TABLE salesforce_contacts ADD COLUMN basecamp_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salesforce_contacts' AND column_name = 'egnyte_url') THEN
    ALTER TABLE salesforce_contacts ADD COLUMN egnyte_url text;
  END IF;
END $$;

-- Add external system links to cases
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salesforce_cases' AND column_name = 'aurora_solar_url') THEN
    ALTER TABLE salesforce_cases ADD COLUMN aurora_solar_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salesforce_cases' AND column_name = 'basecamp_url') THEN
    ALTER TABLE salesforce_cases ADD COLUMN basecamp_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salesforce_cases' AND column_name = 'egnyte_url') THEN
    ALTER TABLE salesforce_cases ADD COLUMN egnyte_url text;
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_aurora_url ON leads(aurora_solar_url) WHERE aurora_solar_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_basecamp_url ON leads(basecamp_url) WHERE basecamp_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_aurora_url ON opportunities(aurora_solar_url) WHERE aurora_solar_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_basecamp_url ON opportunities(basecamp_url) WHERE basecamp_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_egnyte_url ON opportunities(egnyte_url) WHERE egnyte_url IS NOT NULL;
