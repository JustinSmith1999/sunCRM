/*
  # Add Paylocity Integration to HR System

  1. Updates
    - Add Paylocity to api_credentials templates
    - Create paylocity_sync_logs table for tracking sync operations
    - Add Paylocity-specific fields to hr_records table
    - Create paylocity_employees cache table for performance

  2. New Tables
    - `paylocity_sync_logs`
      - Tracks all sync operations with Paylocity
      - Logs success/failure and record counts
    
    - `paylocity_employees`
      - Cached employee data from Paylocity
      - Includes payroll, benefits, and personal info
      - Links to hr_records via employee_id

  3. Security
    - Enable RLS on all new tables
    - Admins can manage all data
    - HR managers can view employee data
    - Regular users can view their own data
*/

-- Add Paylocity to api_credentials
INSERT INTO api_credentials (
  service_name,
  service_type,
  display_name,
  credentials,
  config,
  is_active,
  is_connected
)
VALUES (
  'paylocity',
  'hr_payroll',
  'Paylocity HR & Payroll',
  jsonb_build_object(
    'client_id', '',
    'client_secret', '',
    'company_id', '',
    'api_url', 'https://api.paylocity.com/api/v2'
  ),
  jsonb_build_object(
    'sync_frequency', 'daily',
    'webhook_secret', '',
    'sync_employees', true,
    'sync_payroll', true,
    'sync_benefits', true,
    'sync_time_off', true
  ),
  false,
  false
)
ON CONFLICT (service_name, environment) DO UPDATE SET
  service_type = EXCLUDED.service_type,
  display_name = EXCLUDED.display_name,
  credentials = EXCLUDED.credentials,
  config = EXCLUDED.config;

-- Paylocity Sync Logs
CREATE TABLE IF NOT EXISTS paylocity_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
  
  records_processed integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  
  error_message text,
  error_details jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_by uuid REFERENCES auth.users(id)
);

-- Paylocity Employees Cache
CREATE TABLE IF NOT EXISTS paylocity_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Paylocity IDs
  paylocity_employee_id text UNIQUE NOT NULL,
  company_id text NOT NULL,
  
  -- Link to our HR system (hr_records uses 'Id' as text, not uuid)
  hr_record_salesforce_id text,
  
  -- Personal Information
  first_name text,
  last_name text,
  middle_name text,
  preferred_name text,
  email text,
  
  -- Employment Details
  employee_number text,
  hire_date date,
  termination_date date,
  employment_status text,
  employment_type text,
  
  -- Job Information
  job_title text,
  department text,
  division text,
  location text,
  manager_id text,
  cost_center text,
  
  -- Compensation
  pay_rate numeric(12, 2),
  pay_frequency text,
  pay_type text,
  annual_salary numeric(12, 2),
  
  -- Contact Information
  phone_number text,
  mobile_phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip_code text,
  country text DEFAULT 'USA',
  
  -- Benefits
  benefits_eligible boolean DEFAULT false,
  benefits_start_date date,
  
  -- Time Off
  pto_balance numeric(10, 2),
  sick_balance numeric(10, 2),
  vacation_balance numeric(10, 2),
  
  -- Payroll Information
  last_payroll_date date,
  ytd_gross numeric(12, 2),
  ytd_net numeric(12, 2),
  
  -- Raw data from Paylocity
  raw_data jsonb DEFAULT '{}'::jsonb,
  
  -- Sync tracking
  last_synced_at timestamptz DEFAULT now(),
  sync_status text DEFAULT 'active',
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add Paylocity fields to hr_records if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hr_records' AND column_name = 'Paylocity_Employee_ID__c'
  ) THEN
    ALTER TABLE hr_records ADD COLUMN "Paylocity_Employee_ID__c" text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hr_records' AND column_name = 'Paylocity_Synced_At__c'
  ) THEN
    ALTER TABLE hr_records ADD COLUMN "Paylocity_Synced_At__c" timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hr_records' AND column_name = 'Paylocity_Data__c'
  ) THEN
    ALTER TABLE hr_records ADD COLUMN "Paylocity_Data__c" jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hr_records' AND column_name = 'Paylocity_Status__c'
  ) THEN
    ALTER TABLE hr_records ADD COLUMN "Paylocity_Status__c" text;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_paylocity_sync_logs_status ON paylocity_sync_logs(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_paylocity_sync_logs_type ON paylocity_sync_logs(sync_type, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_paylocity_employees_email ON paylocity_employees(email);
CREATE INDEX IF NOT EXISTS idx_paylocity_employees_employee_number ON paylocity_employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_paylocity_employees_status ON paylocity_employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_paylocity_employees_synced ON paylocity_employees(last_synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_paylocity_employees_hr_record ON paylocity_employees(hr_record_salesforce_id);
CREATE INDEX IF NOT EXISTS idx_hr_records_paylocity_id ON hr_records("Paylocity_Employee_ID__c");

-- Enable RLS
ALTER TABLE paylocity_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE paylocity_employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for paylocity_sync_logs
CREATE POLICY "Admins can manage sync logs"
  ON paylocity_sync_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN user_roles ON user_profiles.role_id = user_roles.id
      WHERE user_profiles.id = auth.uid()
      AND user_roles.name IN ('admin', 'hr_manager')
    )
  );

CREATE POLICY "HR can view sync logs"
  ON paylocity_sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN user_roles ON user_profiles.role_id = user_roles.id
      WHERE user_profiles.id = auth.uid()
      AND user_roles.name IN ('admin', 'hr_manager', 'hr_specialist')
    )
  );

-- RLS Policies for paylocity_employees
CREATE POLICY "Admins can manage all Paylocity employees"
  ON paylocity_employees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN user_roles ON user_profiles.role_id = user_roles.id
      WHERE user_profiles.id = auth.uid()
      AND user_roles.name = 'admin'
    )
  );

CREATE POLICY "HR managers can view all Paylocity employees"
  ON paylocity_employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN user_roles ON user_profiles.role_id = user_roles.id
      WHERE user_profiles.id = auth.uid()
      AND user_roles.name IN ('admin', 'hr_manager', 'hr_specialist')
    )
  );

CREATE POLICY "Employees can view their own Paylocity data"
  ON paylocity_employees FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM user_profiles WHERE id = auth.uid())
  );

-- Function to auto-link Paylocity employees to HR records
CREATE OR REPLACE FUNCTION link_paylocity_to_hr_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to match by email to hr_records
  IF NEW.email IS NOT NULL THEN
    UPDATE hr_records
    SET 
      "Paylocity_Employee_ID__c" = NEW.paylocity_employee_id,
      "Paylocity_Synced_At__c" = now(),
      "Paylocity_Status__c" = NEW.employment_status
    WHERE LOWER("Personal_Email__c") = LOWER(NEW.email)
    OR LOWER("Work_Email__c") = LOWER(NEW.email);

    -- Try to find the matching hr_record ID
    NEW.hr_record_salesforce_id := (
      SELECT "Id" FROM hr_records 
      WHERE LOWER("Personal_Email__c") = LOWER(NEW.email)
      OR LOWER("Work_Email__c") = LOWER(NEW.email)
      LIMIT 1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-link on insert/update
DROP TRIGGER IF EXISTS trigger_link_paylocity_to_hr ON paylocity_employees;
CREATE TRIGGER trigger_link_paylocity_to_hr
  BEFORE INSERT OR UPDATE ON paylocity_employees
  FOR EACH ROW
  EXECUTE FUNCTION link_paylocity_to_hr_record();

-- Function to sync hr_records with Paylocity data
CREATE OR REPLACE FUNCTION sync_hr_record_from_paylocity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update hr_records with Paylocity data if linked
  IF NEW.hr_record_salesforce_id IS NOT NULL THEN
    UPDATE hr_records SET
      "First_Name__c" = COALESCE(NEW.first_name, "First_Name__c"),
      "Personal_Email__c" = COALESCE(NEW.email, "Personal_Email__c"),
      "Personal_Phone__c" = COALESCE(NEW.phone_number, "Personal_Phone__c"),
      "Job_Title__c" = COALESCE(NEW.job_title, "Job_Title__c"),
      "Department__c" = COALESCE(NEW.department, "Department__c"),
      "Employee_Start_Date__c" = COALESCE(NEW.hire_date::text, "Employee_Start_Date__c"),
      "Employment_Status__c" = COALESCE(NEW.employment_status, "Employment_Status__c"),
      "Termination_Date__c" = COALESCE(NEW.termination_date::text, "Termination_Date__c"),
      "Paylocity_Synced_At__c" = now(),
      "Paylocity_Data__c" = NEW.raw_data,
      "Paylocity_Status__c" = NEW.employment_status
    WHERE "Id" = NEW.hr_record_salesforce_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync HR records when Paylocity data updates
DROP TRIGGER IF EXISTS trigger_sync_hr_from_paylocity ON paylocity_employees;
CREATE TRIGGER trigger_sync_hr_from_paylocity
  AFTER INSERT OR UPDATE ON paylocity_employees
  FOR EACH ROW
  EXECUTE FUNCTION sync_hr_record_from_paylocity();
