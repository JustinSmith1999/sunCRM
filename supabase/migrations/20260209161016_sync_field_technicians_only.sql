/*
  # Sync Field Technicians Only (Excluding Administrative Staff)
  
  Populate technicians table with ONLY field workers:
  - Commercial Installation (21 techs)
  - Residential Installation (29 techs)  
  - Service Field (13 techs)
  
  EXCLUDES:
  - Service Office staff (administrative/dispatch roles)
  - Terminated/inactive employees
  - Candidates and applicants
  
  Total: ~63 active field technicians
*/

-- Clear existing data
TRUNCATE TABLE technicians CASCADE;

-- Insert ONLY field technicians (exclude Service Office administrative staff)
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
  "Employment_Status__c" = 'Employee'
  AND (
    "Department__c" = 'Commercial Installation'
    OR "Department__c" = 'Residential Installation'
    OR "Department__c" = 'Service Field'
  )
  AND "Department__c" != 'Service Office'
  AND "First_Name__c" IS NOT NULL
  AND "Name" IS NOT NULL
ORDER BY "Department__c", "Job_Title__c";
