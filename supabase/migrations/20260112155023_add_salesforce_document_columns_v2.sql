/*
  # Add Salesforce Document Columns
  
  1. Changes
    - Add salesforce_id column to documents table
    - Add Salesforce-specific document fields
    - Add unique constraint on salesforce_id
    
  2. Purpose
    - Enable syncing of Document data from Salesforce
*/

-- Add salesforce_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'salesforce_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN salesforce_id text UNIQUE;
  END IF;
END $$;

-- Add Salesforce document fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'Type') THEN
    ALTER TABLE documents ADD COLUMN Type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'FolderId') THEN
    ALTER TABLE documents ADD COLUMN FolderId text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'Description') THEN
    ALTER TABLE documents ADD COLUMN Description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'Keywords') THEN
    ALTER TABLE documents ADD COLUMN Keywords text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'Url') THEN
    ALTER TABLE documents ADD COLUMN Url text;
  END IF;
END $$;