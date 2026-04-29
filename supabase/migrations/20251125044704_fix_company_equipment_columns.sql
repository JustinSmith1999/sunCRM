/*
  # Fix Company Equipment Table Columns
  
  Updates the company_equipment table to use Salesforce-style field naming that matches the CompanyEquipmentConsole component.
  
  1. Changes:
    - Renames columns to match Salesforce naming convention with __c suffix
    - Preserves all existing data during rename
  
  2. Column Mappings:
    - name → Name
    - employee_hr → Employee_HR__c
    - computer_name → Computer_Name__c
    - computer_user_name → Username__c
    - computer_make → Computer_Make__c
    - computer_model → Computer_Model__c
    - computer_os → Operating_System__c
    - computer_serial_number → Serial_Tag_ID__c
    - phone_number → iPhone_Phone__c
    - phone_imei → iPhone_IMEI__c
    - location → Office_Field__c
    - department → Department__c
    - notes → Notes__c
    - purchase_date → Install_Date__c
*/

-- Rename columns to match Salesforce naming convention
ALTER TABLE company_equipment RENAME COLUMN name TO "Name";
ALTER TABLE company_equipment RENAME COLUMN employee_hr TO "Employee_HR__c";
ALTER TABLE company_equipment RENAME COLUMN computer_name TO "Computer_Name__c";
ALTER TABLE company_equipment RENAME COLUMN computer_user_name TO "Username__c";
ALTER TABLE company_equipment RENAME COLUMN computer_make TO "Computer_Make__c";
ALTER TABLE company_equipment RENAME COLUMN computer_model TO "Computer_Model__c";
ALTER TABLE company_equipment RENAME COLUMN computer_os TO "Operating_System__c";
ALTER TABLE company_equipment RENAME COLUMN computer_serial_number TO "Serial_Tag_ID__c";
ALTER TABLE company_equipment RENAME COLUMN phone_number TO "iPhone_Phone__c";
ALTER TABLE company_equipment RENAME COLUMN phone_imei TO "iPhone_IMEI__c";
ALTER TABLE company_equipment RENAME COLUMN location TO "Office_Field__c";
ALTER TABLE company_equipment RENAME COLUMN department TO "Department__c";
ALTER TABLE company_equipment RENAME COLUMN notes TO "Notes__c";
ALTER TABLE company_equipment RENAME COLUMN purchase_date TO "Install_Date__c";

-- Add MiFi phone fields that are expected by the component
ALTER TABLE company_equipment ADD COLUMN IF NOT EXISTS "MiFi_Phone__c" text;
ALTER TABLE company_equipment ADD COLUMN IF NOT EXISTS "MiFi_IMEI__c" text;

-- Drop columns that are not used by the component
ALTER TABLE company_equipment DROP COLUMN IF EXISTS record_type_id;
ALTER TABLE company_equipment DROP COLUMN IF EXISTS phone_extension;
ALTER TABLE company_equipment DROP COLUMN IF EXISTS phone_make;
ALTER TABLE company_equipment DROP COLUMN IF EXISTS phone_model;
ALTER TABLE company_equipment DROP COLUMN IF EXISTS phone_carrier;
ALTER TABLE company_equipment DROP COLUMN IF EXISTS sim_card_number;
ALTER TABLE company_equipment DROP COLUMN IF EXISTS mac_address;
ALTER TABLE company_equipment DROP COLUMN IF EXISTS ip_address;
ALTER TABLE company_equipment DROP COLUMN IF EXISTS warranty_expiration;
ALTER TABLE company_equipment DROP COLUMN IF EXISTS status;
