import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

console.log('Creating core CRM tables in Supabase...\n');
console.log('='.repeat(80));
console.log('\nIMPORTANT: You need to run this SQL in the Supabase Dashboard SQL Editor');
console.log(`URL: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new\n`);
console.log('='.repeat(80));
console.log('\nCopy and paste the SQL below:\n');
console.log('='.repeat(80));

const sql = `
-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesforce_id text UNIQUE,
  name text NOT NULL,
  account_number text,
  type text,
  industry text,
  annual_revenue numeric,
  number_of_employees integer,
  ownership text,
  rating text,
  phone text,
  fax text,
  website text,
  billing_street text,
  billing_city text,
  billing_state text,
  billing_postal_code text,
  billing_country text,
  shipping_street text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text,
  description text,
  owner_id uuid,
  parent_account_id uuid REFERENCES accounts(id),
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesforce_id text UNIQUE,
  account_id uuid REFERENCES accounts(id),
  first_name text,
  last_name text NOT NULL,
  email text,
  phone text,
  mobile_phone text,
  title text,
  department text,
  birthdate date,
  mailing_street text,
  mailing_city text,
  mailing_state text,
  mailing_postal_code text,
  mailing_country text,
  description text,
  lead_source text,
  owner_id uuid,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Opportunities Table
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesforce_id text UNIQUE,
  account_id uuid REFERENCES accounts(id),
  name text NOT NULL,
  amount numeric,
  stage_name text NOT NULL DEFAULT 'Prospecting',
  probability numeric DEFAULT 0,
  close_date date NOT NULL,
  type text,
  lead_source text,
  next_step text,
  description text,
  is_closed boolean DEFAULT false,
  is_won boolean DEFAULT false,
  forecast_category text,
  owner_id uuid,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Cases Table
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesforce_id text UNIQUE,
  case_number text UNIQUE,
  account_id uuid REFERENCES accounts(id),
  contact_id uuid REFERENCES contacts(id),
  parent_case_id uuid REFERENCES cases(id),
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'New',
  priority text DEFAULT 'Medium',
  type text,
  reason text,
  origin text DEFAULT 'Web',
  is_closed boolean DEFAULT false,
  is_escalated boolean DEFAULT false,
  closed_date timestamptz,
  supplied_name text,
  supplied_email text,
  supplied_phone text,
  supplied_company text,
  owner_id uuid,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesforce_id text UNIQUE,
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Not Started',
  priority text DEFAULT 'Normal',
  due_date date,
  activity_date date,
  reminder_date_time timestamptz,
  is_reminder_set boolean DEFAULT false,
  is_closed boolean DEFAULT false,
  is_high_priority boolean DEFAULT false,
  owner_id uuid,
  assigned_to_id uuid,
  related_to_type text,
  related_to_id uuid,
  account_id uuid REFERENCES accounts(id),
  contact_id uuid REFERENCES contacts(id),
  opportunity_id uuid REFERENCES opportunities(id),
  case_id uuid REFERENCES cases(id),
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_owner ON accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_opportunities_account ON opportunities(account_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_owner ON opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage_name);
CREATE INDEX IF NOT EXISTS idx_opportunities_close_date ON opportunities(close_date);
CREATE INDEX IF NOT EXISTS idx_cases_account ON cases(account_id);
CREATE INDEX IF NOT EXISTS idx_cases_contact ON cases(contact_id);
CREATE INDEX IF NOT EXISTS idx_cases_owner ON cases(owner_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow all access to accounts" ON accounts;
CREATE POLICY "Allow all access to accounts" ON accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to contacts" ON contacts;
CREATE POLICY "Allow all access to contacts" ON contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to opportunities" ON opportunities;
CREATE POLICY "Allow all access to opportunities" ON opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to cases" ON cases;
CREATE POLICY "Allow all access to cases" ON cases FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to tasks" ON tasks;
CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Case number generator
CREATE SEQUENCE IF NOT EXISTS case_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.case_number IS NULL THEN
    NEW.case_number := 'CASE-' || LPAD(nextval('case_number_seq')::TEXT, 8, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_case_number ON cases;
CREATE TRIGGER set_case_number BEFORE INSERT ON cases FOR EACH ROW EXECUTE FUNCTION generate_case_number();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_accounts_timestamp ON accounts;
CREATE TRIGGER update_accounts_timestamp BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_contacts_timestamp ON contacts;
CREATE TRIGGER update_contacts_timestamp BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_opportunities_timestamp ON opportunities;
CREATE TRIGGER update_opportunities_timestamp BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_cases_timestamp ON cases;
CREATE TRIGGER update_cases_timestamp BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_tasks_timestamp ON tasks;
CREATE TRIGGER update_tasks_timestamp BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

console.log(sql);
console.log('='.repeat(80));
console.log('\nAfter running the SQL, refresh your dashboard to see the tables populated!');
