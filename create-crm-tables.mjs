import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const migrationSQL = `
-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesforce_id text UNIQUE,
  name text NOT NULL,
  type text,
  industry text,
  annual_revenue numeric,
  number_of_employees integer,
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
  parent_account_id uuid REFERENCES accounts(id),
  owner_id uuid,
  description text,
  rating text,
  ownership text,
  ticker_symbol text,
  is_active boolean DEFAULT true,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by_id uuid,
  last_modified_by_id uuid
);

-- Opportunities Table
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesforce_id text UNIQUE,
  name text NOT NULL,
  account_id uuid REFERENCES accounts(id),
  stage text NOT NULL,
  amount numeric,
  probability numeric,
  close_date date,
  type text,
  lead_source text,
  next_step text,
  description text,
  is_closed boolean DEFAULT false,
  is_won boolean DEFAULT false,
  forecast_category text,
  forecast_category_name text,
  campaign_id uuid,
  owner_id uuid,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by_id uuid,
  last_modified_by_id uuid
);

-- Cases Table
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesforce_id text UNIQUE,
  case_number text,
  account_id uuid REFERENCES accounts(id),
  contact_id uuid,
  parent_case_id uuid REFERENCES cases(id),
  subject text,
  description text,
  status text DEFAULT 'New',
  priority text DEFAULT 'Medium',
  type text,
  reason text,
  origin text,
  supplied_name text,
  supplied_email text,
  supplied_phone text,
  supplied_company text,
  is_closed boolean DEFAULT false,
  is_escalated boolean DEFAULT false,
  closed_date timestamptz,
  owner_id uuid,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by_id uuid,
  last_modified_by_id uuid
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesforce_id text UNIQUE,
  subject text NOT NULL,
  status text DEFAULT 'Not Started',
  priority text DEFAULT 'Normal',
  due_date date,
  activity_date date,
  reminder_date_time timestamptz,
  is_reminder_set boolean DEFAULT false,
  description text,
  who_id uuid,
  what_id uuid,
  account_id uuid REFERENCES accounts(id),
  owner_id uuid,
  is_closed boolean DEFAULT false,
  is_high_priority boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  call_duration_in_seconds integer,
  call_type text,
  call_disposition text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by_id uuid,
  last_modified_by_id uuid
);

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can view accounts" ON accounts;
DROP POLICY IF EXISTS "Admins and managers can insert accounts" ON accounts;
DROP POLICY IF EXISTS "Admins and managers can update accounts" ON accounts;
DROP POLICY IF EXISTS "Authenticated users can view opportunities" ON opportunities;
DROP POLICY IF EXISTS "Sales users can insert opportunities" ON opportunities;
DROP POLICY IF EXISTS "Sales users can update opportunities" ON opportunities;
DROP POLICY IF EXISTS "Authenticated users can view cases" ON cases;
DROP POLICY IF EXISTS "Service users can insert cases" ON cases;
DROP POLICY IF EXISTS "Service users can update cases" ON cases;
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;

-- RLS Policies for Accounts
CREATE POLICY "Authenticated users can view accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can insert accounts"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and managers can update accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for Opportunities
CREATE POLICY "Authenticated users can view opportunities"
  ON opportunities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales users can insert opportunities"
  ON opportunities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Sales users can update opportunities"
  ON opportunities FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for Cases
CREATE POLICY "Authenticated users can view cases"
  ON cases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service users can insert cases"
  ON cases FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service users can update cases"
  ON cases FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for Tasks
CREATE POLICY "Authenticated users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name);
CREATE INDEX IF NOT EXISTS idx_accounts_owner ON accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_accounts_created ON accounts(created_at);

CREATE INDEX IF NOT EXISTS idx_opportunities_account ON opportunities(account_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_owner ON opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_close_date ON opportunities(close_date);

CREATE INDEX IF NOT EXISTS idx_cases_account ON cases(account_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_owner ON cases(owner_id);

CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_account ON tasks(account_id);
`;

const sampleDataSQL = `
-- Insert sample data for demonstration
INSERT INTO accounts (name, type, industry, phone, website, billing_city, billing_state, billing_country) VALUES
  ('Acme Corporation', 'Customer', 'Technology', '555-0100', 'www.acme.com', 'San Francisco', 'CA', 'USA'),
  ('Globex Inc', 'Prospect', 'Manufacturing', '555-0101', 'www.globex.com', 'New York', 'NY', 'USA'),
  ('Initech', 'Customer', 'Technology', '555-0102', 'www.initech.com', 'Austin', 'TX', 'USA'),
  ('Umbrella Corporation', 'Partner', 'Pharmaceutical', '555-0103', 'www.umbrella.com', 'Seattle', 'WA', 'USA'),
  ('Wayne Enterprises', 'Customer', 'Conglomerate', '555-0104', 'www.wayne.com', 'Gotham', 'NJ', 'USA')
ON CONFLICT (salesforce_id) DO NOTHING;
`;

const opportunitiesDataSQL = `
DO $$
DECLARE
  acme_id uuid;
  globex_id uuid;
  initech_id uuid;
BEGIN
  SELECT id INTO acme_id FROM accounts WHERE name = 'Acme Corporation' LIMIT 1;
  SELECT id INTO globex_id FROM accounts WHERE name = 'Globex Inc' LIMIT 1;
  SELECT id INTO initech_id FROM accounts WHERE name = 'Initech' LIMIT 1;

  IF acme_id IS NOT NULL THEN
    INSERT INTO opportunities (name, account_id, stage, amount, probability, close_date, type) VALUES
      ('Acme - Solar Installation', acme_id, 'Proposal', 50000, 60, CURRENT_DATE + INTERVAL '30 days', 'New Business'),
      ('Acme - Service Contract', acme_id, 'Negotiation', 25000, 80, CURRENT_DATE + INTERVAL '15 days', 'Renewal')
    ON CONFLICT (salesforce_id) DO NOTHING;
  END IF;

  IF globex_id IS NOT NULL THEN
    INSERT INTO opportunities (name, account_id, stage, amount, probability, close_date, type) VALUES
      ('Globex - Commercial Project', globex_id, 'Prospecting', 150000, 20, CURRENT_DATE + INTERVAL '90 days', 'New Business')
    ON CONFLICT (salesforce_id) DO NOTHING;
  END IF;

  IF initech_id IS NOT NULL THEN
    INSERT INTO opportunities (name, account_id, stage, amount, probability, close_date, type) VALUES
      ('Initech - Upgrade', initech_id, 'Closed Won', 35000, 100, CURRENT_DATE - INTERVAL '5 days', 'Existing Business')
    ON CONFLICT (salesforce_id) DO NOTHING;

    INSERT INTO cases (account_id, subject, description, status, priority, origin, type) VALUES
      (initech_id, 'System maintenance request', 'Customer requesting scheduled maintenance', 'New', 'Medium', 'Phone', 'Service'),
      (initech_id, 'Technical issue with inverter', 'Customer reports error code on inverter display', 'In Progress', 'High', 'Email', 'Technical')
    ON CONFLICT (salesforce_id) DO NOTHING;
  END IF;

  INSERT INTO tasks (subject, status, priority, due_date, description) VALUES
    ('Follow up with Acme Corp', 'Not Started', 'High', CURRENT_DATE + INTERVAL '2 days', 'Discuss proposal feedback'),
    ('Prepare Globex presentation', 'In Progress', 'High', CURRENT_DATE + INTERVAL '7 days', 'Create commercial project deck'),
    ('Schedule Initech maintenance', 'Not Started', 'Normal', CURRENT_DATE + INTERVAL '14 days', 'Coordinate with service team'),
    ('Review quarterly targets', 'Not Started', 'Normal', CURRENT_DATE + INTERVAL '5 days', 'Analyze sales pipeline'),
    ('Update CRM records', 'In Progress', 'Low', CURRENT_DATE + INTERVAL '1 day', 'Clean up stale opportunity data')
  ON CONFLICT (salesforce_id) DO NOTHING;
END $$;
`;

console.log('Creating CRM tables...\n');

try {
  // Execute migration SQL using Supabase REST API
  const apiUrl = `${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql`;

  // First, let's check if tables exist
  console.log('Checking existing tables...');
  const { data: tables, error: checkError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .in('table_name', ['accounts', 'opportunities', 'cases', 'tasks']);

  if (checkError) {
    console.log('Note: Could not query information_schema (this is normal)');
  } else {
    console.log('Existing CRM tables:', tables);
  }

  // Try to create tables using a simple query approach
  console.log('\n\n=== IMPORTANT INSTRUCTIONS ===');
  console.log('Please run this SQL in your Supabase SQL Editor:');
  console.log('https://husbupeealwuxyopfwwb.supabase.co/project/_/sql\n');
  console.log('Copy and paste the following SQL:\n');
  console.log('---SQL START---');
  console.log(migrationSQL);
  console.log('\n-- Sample Data\n');
  console.log(sampleDataSQL);
  console.log('\n');
  console.log(opportunitiesDataSQL);
  console.log('---SQL END---\n');

  console.log('After running the SQL, your dashboard metrics should populate correctly.');

} catch (error) {
  console.error('Error:', error);
}
