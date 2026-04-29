/*
  # Add Missing Address Fields to All Objects

  1. Changes to Tables
    - `opportunities`
      - Add full mailing address fields (Street, City, State, PostalCode, Country)
      - Add geo-location fields (Latitude, Longitude)
      
    - `accounts`
      - Add shipping address fields (in addition to billing)
      
  2. Notes
    - Critical for solar business - need addresses for site surveys, installations
    - Salesforce has multiple address types (Billing, Shipping, Mailing)
    - Adding all standard Salesforce address fields
    - Using capitalized column names to match Salesforce convention
*/

-- Add address fields to opportunities
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'Street') THEN
    ALTER TABLE opportunities ADD COLUMN "Street" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'City') THEN
    ALTER TABLE opportunities ADD COLUMN "City" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'State') THEN
    ALTER TABLE opportunities ADD COLUMN "State" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'PostalCode') THEN
    ALTER TABLE opportunities ADD COLUMN "PostalCode" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'Country') THEN
    ALTER TABLE opportunities ADD COLUMN "Country" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'Latitude') THEN
    ALTER TABLE opportunities ADD COLUMN "Latitude" numeric;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'Longitude') THEN
    ALTER TABLE opportunities ADD COLUMN "Longitude" numeric;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'GeocodeAccuracy') THEN
    ALTER TABLE opportunities ADD COLUMN "GeocodeAccuracy" text;
  END IF;
END $$;

-- Add shipping address fields to accounts (billing already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'ShippingStreet') THEN
    ALTER TABLE accounts ADD COLUMN "ShippingStreet" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'ShippingCity') THEN
    ALTER TABLE accounts ADD COLUMN "ShippingCity" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'ShippingState') THEN
    ALTER TABLE accounts ADD COLUMN "ShippingState" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'ShippingPostalCode') THEN
    ALTER TABLE accounts ADD COLUMN "ShippingPostalCode" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'ShippingCountry') THEN
    ALTER TABLE accounts ADD COLUMN "ShippingCountry" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'ShippingLatitude') THEN
    ALTER TABLE accounts ADD COLUMN "ShippingLatitude" numeric;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'ShippingLongitude') THEN
    ALTER TABLE accounts ADD COLUMN "ShippingLongitude" numeric;
  END IF;
END $$;

-- Add other address fields to contacts if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salesforce_contacts' AND column_name = 'OtherStreet') THEN
    ALTER TABLE salesforce_contacts ADD COLUMN "OtherStreet" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salesforce_contacts' AND column_name = 'OtherCity') THEN
    ALTER TABLE salesforce_contacts ADD COLUMN "OtherCity" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salesforce_contacts' AND column_name = 'OtherState') THEN
    ALTER TABLE salesforce_contacts ADD COLUMN "OtherState" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salesforce_contacts' AND column_name = 'OtherPostalCode') THEN
    ALTER TABLE salesforce_contacts ADD COLUMN "OtherPostalCode" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salesforce_contacts' AND column_name = 'OtherCountry') THEN
    ALTER TABLE salesforce_contacts ADD COLUMN "OtherCountry" text;
  END IF;
END $$;

-- Create indexes for address searches (using quoted identifiers)
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads("City");
CREATE INDEX IF NOT EXISTS idx_leads_state ON leads("State");
CREATE INDEX IF NOT EXISTS idx_leads_postalcode ON leads("PostalCode");

CREATE INDEX IF NOT EXISTS idx_opportunities_city ON opportunities("City");
CREATE INDEX IF NOT EXISTS idx_opportunities_state ON opportunities("State");
CREATE INDEX IF NOT EXISTS idx_opportunities_postalcode ON opportunities("PostalCode");

CREATE INDEX IF NOT EXISTS idx_accounts_billing_city ON accounts("BillingCity");
CREATE INDEX IF NOT EXISTS idx_accounts_billing_state ON accounts("BillingState");
CREATE INDEX IF NOT EXISTS idx_accounts_shipping_city ON accounts("ShippingCity");
CREATE INDEX IF NOT EXISTS idx_accounts_shipping_state ON accounts("ShippingState");
