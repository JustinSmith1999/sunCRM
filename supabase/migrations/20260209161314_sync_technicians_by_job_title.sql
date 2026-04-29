/*
  # Sync Technicians by Job Title
  
  Identify field technicians by job title keywords:
  - Installation roles: Installer, Crew Lead, Foreman, Electrician, Roof Lead
  - Service roles: Service Tech, Service Helper, Foreman Service
  
  EXCLUDES administrative roles with "service" in title:
  - Customer Service Rep
  - Service Sales Rep
  - Office Manager Service
  - Project Manager Service
  - Director of Service
*/

-- Clear existing data
TRUNCATE TABLE technicians CASCADE;

-- Insert field technicians based on job title
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
  AND "First_Name__c" IS NOT NULL
  AND "Name" IS NOT NULL
  AND (
    -- Installation roles
    "Job_Title__c" ILIKE '%installer%'
    OR "Job_Title__c" ILIKE '%crew lead%'
    OR "Job_Title__c" ILIKE '%foreman%'
    OR "Job_Title__c" ILIKE '%electrician%'
    OR "Job_Title__c" ILIKE '%roof lead%'
    OR "Job_Title__c" ILIKE '%apprentice%'
    OR "Job_Title__c" ILIKE '%carpenter%'
    OR "Job_Title__c" ILIKE '%painter%'
    -- Service field roles (exclude administrative)
    OR "Job_Title__c" ILIKE '%service tech%'
    OR "Job_Title__c" ILIKE '%service helper%'
    OR ("Job_Title__c" ILIKE '%foreman%' AND "Job_Title__c" ILIKE '%service%')
  )
  -- Explicitly exclude administrative roles
  AND "Job_Title__c" NOT ILIKE '%customer service%'
  AND "Job_Title__c" NOT ILIKE '%service sales%'
  AND "Job_Title__c" NOT ILIKE '%office manager%'
  AND "Job_Title__c" NOT ILIKE '%project manager%'
  AND "Job_Title__c" NOT ILIKE '%director%'
ORDER BY "Department__c", "Job_Title__c";
