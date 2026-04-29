/*
  # Add Salesforce timestamp columns to documents
  
  1. Changes
    - Add CreatedDate column
    - Add LastModifiedDate column
    
  2. Purpose
    - Store Salesforce timestamps for sync tracking
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'CreatedDate') THEN
    ALTER TABLE documents ADD COLUMN CreatedDate timestamp with time zone;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'LastModifiedDate') THEN
    ALTER TABLE documents ADD COLUMN LastModifiedDate timestamp with time zone;
  END IF;
END $$;