/*
  # Sync Technicians from HR Records
  
  Populate the technicians table from hr_records where:
  - Department is Service-related
  - Job title contains technician/installer/service keywords
  - Employment status is Active
  
  1. Clear existing technicians (if any)
  2. Insert active service/installation staff from HR records
  3. Map Salesforce fields to technician fields
*/

-- Clear existing data to avoid duplicates
TRUNCATE TABLE technicians CASCADE;

-- Insert service technicians from HR records
INSERT INTO technicians (
  employee_id,
  first_name,
  last_name,
  email,
  phone,
  specialties,
  hire_date,
  employment_status
)
SELECT 
  "Name" as employee_id,
  "First_Name__c" as first_name,
  COALESCE(
    SPLIT_PART("Name", ', ', 1),
    "Name"
  ) as last_name,
  "Work_Email__c" as email,
  COALESCE("Work_Phone__c", "Personal_Phone__c") as phone,
  ARRAY[COALESCE("Department__c", 'Service'), COALESCE("Job_Title__c", 'Technician')] as specialties,
  CASE 
    WHEN "Employee_Start_Date__c" IS NOT NULL AND "Employee_Start_Date__c" != '' 
    THEN ("Employee_Start_Date__c")::date
    ELSE NULL
  END as hire_date,
  'active' as employment_status
FROM hr_records
WHERE 
  "Employment_Status__c" = 'Active'
  AND (
    "Department__c" ILIKE '%service%' 
    OR "Department__c" ILIKE '%install%'
    OR "Job_Title__c" ILIKE '%tech%'
    OR "Job_Title__c" ILIKE '%install%'
    OR "Job_Title__c" ILIKE '%service%'
    OR "Position__c" ILIKE '%tech%'
    OR "Position__c" ILIKE '%install%'
    OR "Position__c" ILIKE '%service%'
  )
  AND "First_Name__c" IS NOT NULL
  AND "Name" IS NOT NULL;
