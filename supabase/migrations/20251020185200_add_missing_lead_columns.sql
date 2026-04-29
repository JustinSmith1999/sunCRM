/*
  # Add Missing Columns to Leads Table

  1. Changes
    - Add all missing columns that are needed for Salesforce data import
    - Includes city, state, street, zip, phone fields, etc.

  2. Columns Added
    - city, state, street, zip_postal_code, county (address fields)
    - primary_phone, mobile_phone (contact fields)
    - title, company (business fields)
    - lead_source, other_source (source tracking)
    - lead_status (status field with default)
    - type_of_installation, created_by_alias (custom fields)
    - country (with USA default)
*/

-- Add all missing columns to leads table
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
