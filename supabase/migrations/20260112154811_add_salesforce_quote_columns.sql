/*
  # Add Salesforce Quote Columns
  
  1. Changes
    - Add salesforce_id column to quotes table
    - Add billing address fields (BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry)
    - Add shipping address fields (ShippingStreet, ShippingCity, ShippingState, ShippingPostalCode, ShippingCountry)
    - Add additional Salesforce Quote fields
    - Add unique constraint on salesforce_id
    
  2. Purpose
    - Enable syncing of Quote data from Salesforce
    - Store all Salesforce Quote fields in Supabase
*/

-- Add salesforce_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'salesforce_id'
  ) THEN
    ALTER TABLE quotes ADD COLUMN salesforce_id text UNIQUE;
  END IF;
END $$;

-- Add billing address fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'BillingStreet') THEN
    ALTER TABLE quotes ADD COLUMN BillingStreet text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'BillingCity') THEN
    ALTER TABLE quotes ADD COLUMN BillingCity text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'BillingState') THEN
    ALTER TABLE quotes ADD COLUMN BillingState text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'BillingPostalCode') THEN
    ALTER TABLE quotes ADD COLUMN BillingPostalCode text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'BillingCountry') THEN
    ALTER TABLE quotes ADD COLUMN BillingCountry text;
  END IF;
END $$;

-- Add shipping address fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'ShippingStreet') THEN
    ALTER TABLE quotes ADD COLUMN ShippingStreet text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'ShippingCity') THEN
    ALTER TABLE quotes ADD COLUMN ShippingCity text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'ShippingState') THEN
    ALTER TABLE quotes ADD COLUMN ShippingState text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'ShippingPostalCode') THEN
    ALTER TABLE quotes ADD COLUMN ShippingPostalCode text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'ShippingCountry') THEN
    ALTER TABLE quotes ADD COLUMN ShippingCountry text;
  END IF;
END $$;

-- Add additional Salesforce fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'QuoteNumber') THEN
    ALTER TABLE quotes ADD COLUMN QuoteNumber text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'IsSyncing') THEN
    ALTER TABLE quotes ADD COLUMN IsSyncing boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'ExpirationDate') THEN
    ALTER TABLE quotes ADD COLUMN ExpirationDate date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'Description') THEN
    ALTER TABLE quotes ADD COLUMN Description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'Email') THEN
    ALTER TABLE quotes ADD COLUMN Email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'Phone') THEN
    ALTER TABLE quotes ADD COLUMN Phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'Fax') THEN
    ALTER TABLE quotes ADD COLUMN Fax text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'ContactName') THEN
    ALTER TABLE quotes ADD COLUMN ContactName text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'AccountName') THEN
    ALTER TABLE quotes ADD COLUMN AccountName text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'OpportunityName') THEN
    ALTER TABLE quotes ADD COLUMN OpportunityName text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'GrandTotal') THEN
    ALTER TABLE quotes ADD COLUMN GrandTotal numeric(15,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'LineItemCount') THEN
    ALTER TABLE quotes ADD COLUMN LineItemCount integer;
  END IF;
END $$;