/*
  # Link Company Equipment to HR Records
  
  1. Changes
    - Add `hr_record_id` column to company_equipment table
    - Add `employee_name` column for display purposes
    - Create indexes for faster lookups
    - Add function to automatically link equipment to HR records based on Salesforce ID
    - Populate hr_record_id and employee_name for existing equipment records
  
  2. Security
    - No RLS changes needed (inherits from existing policies)
  
  Note: Not using foreign key constraint since hr_records.Id is not a primary key
*/

-- Add columns to company_equipment
ALTER TABLE company_equipment 
ADD COLUMN IF NOT EXISTS hr_record_id text,
ADD COLUMN IF NOT EXISTS employee_name text;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_equipment_hr_record_id 
ON company_equipment(hr_record_id);

CREATE INDEX IF NOT EXISTS idx_company_equipment_employee_name 
ON company_equipment(employee_name);

CREATE INDEX IF NOT EXISTS idx_hr_records_id 
ON hr_records("Id");

-- Update existing equipment records to link to HR records and populate employee name
UPDATE company_equipment ce
SET 
  hr_record_id = hr."Id",
  employee_name = hr."Name"
FROM hr_records hr
WHERE ce."Employee_HR__c" = hr."Id"
  AND ce.hr_record_id IS NULL
  AND hr."Id" IS NOT NULL
  AND ce."Employee_HR__c" IS NOT NULL;

-- Create function to auto-link equipment when synced from Salesforce
CREATE OR REPLACE FUNCTION link_equipment_to_hr()
RETURNS TRIGGER AS $$
DECLARE
  v_employee_name text;
BEGIN
  -- Try to find matching HR record by Salesforce ID
  IF NEW."Employee_HR__c" IS NOT NULL THEN
    SELECT 
      "Id",
      "Name"
    INTO NEW.hr_record_id, v_employee_name
    FROM hr_records
    WHERE "Id" = NEW."Employee_HR__c"
    LIMIT 1;
    
    IF FOUND THEN
      NEW.employee_name := v_employee_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-link on insert/update
DROP TRIGGER IF EXISTS trigger_link_equipment_to_hr ON company_equipment;
CREATE TRIGGER trigger_link_equipment_to_hr
  BEFORE INSERT OR UPDATE ON company_equipment
  FOR EACH ROW
  EXECUTE FUNCTION link_equipment_to_hr();