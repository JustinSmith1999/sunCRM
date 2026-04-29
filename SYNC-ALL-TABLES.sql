-- ================================================================
-- COMPREHENSIVE TABLE SYNC - RUN THIS IN SUPABASE SQL EDITOR
-- ================================================================
-- Go to: https://husbupeealwuxyopfwwb.supabase.co/project/_/sql/new
-- Copy and paste this entire file, then click "Run"
-- ================================================================

-- =================
-- 1. CHANNEL PARTNERS SYSTEM
-- =================

-- Create channel_partners table
CREATE TABLE IF NOT EXISTS channel_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  webhook_url text UNIQUE,
  contact_email text,
  phone text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  commission_rate numeric(5,2) DEFAULT 0,
  commission_type text DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'flat_fee')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create partner_contacts table
CREATE TABLE IF NOT EXISTS partner_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES channel_partners(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'contact' CHECK (role IN ('primary', 'secondary', 'contact')),
  can_view_leads boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(partner_id, user_id)
);

-- Create partner_commissions table
CREATE TABLE IF NOT EXISTS partner_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES channel_partners(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  deal_id uuid,
  commission_amount numeric(10,2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add partner_id to leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'partner_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN partner_id uuid REFERENCES channel_partners(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add partner_lead_source to leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'partner_lead_source'
  ) THEN
    ALTER TABLE leads ADD COLUMN partner_lead_source text;
  END IF;
END $$;

-- =================
-- 2. COMPANY EQUIPMENT - ADD SALESFORCE COLUMNS
-- =================

-- Add all missing Salesforce-style columns to company_equipment
DO $$
BEGIN
  -- Add Name column (if using 'name' make sure we have both)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'Name'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "Name" text;
    -- Copy from lowercase if it exists
    UPDATE company_equipment SET "Name" = name WHERE name IS NOT NULL;
  END IF;

  -- Add Employee_HR__c
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'Employee_HR__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "Employee_HR__c" text;
    UPDATE company_equipment SET "Employee_HR__c" = employee_hr WHERE employee_hr IS NOT NULL;
  END IF;

  -- Add Computer_Name__c
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'Computer_Name__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "Computer_Name__c" text;
    UPDATE company_equipment SET "Computer_Name__c" = computer_name WHERE computer_name IS NOT NULL;
  END IF;

  -- Add Username__c
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'Username__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "Username__c" text;
    UPDATE company_equipment SET "Username__c" = computer_user_name WHERE computer_user_name IS NOT NULL;
  END IF;

  -- Add Computer_Make__c
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'Computer_Make__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "Computer_Make__c" text;
    UPDATE company_equipment SET "Computer_Make__c" = computer_make WHERE computer_make IS NOT NULL;
  END IF;

  -- Add Computer_Model__c
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'Computer_Model__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "Computer_Model__c" text;
    UPDATE company_equipment SET "Computer_Model__c" = computer_model WHERE computer_model IS NOT NULL;
  END IF;

  -- Add Operating_System__c
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'Operating_System__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "Operating_System__c" text;
    UPDATE company_equipment SET "Operating_System__c" = computer_os WHERE computer_os IS NOT NULL;
  END IF;

  -- Add Serial_Tag_ID__c
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'Serial_Tag_ID__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "Serial_Tag_ID__c" text;
    UPDATE company_equipment SET "Serial_Tag_ID__c" = computer_serial_number WHERE computer_serial_number IS NOT NULL;
  END IF;

  -- Add iPhone_Phone__c
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'iPhone_Phone__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "iPhone_Phone__c" text;
    UPDATE company_equipment SET "iPhone_Phone__c" = phone_number WHERE phone_number IS NOT NULL;
  END IF;

  -- Add iPhone_IMEI__c
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'iPhone_IMEI__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "iPhone_IMEI__c" text;
    UPDATE company_equipment SET "iPhone_IMEI__c" = phone_imei WHERE phone_imei IS NOT NULL;
  END IF;

  -- Add MiFi_Phone__c (placeholder)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'MiFi_Phone__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "MiFi_Phone__c" text;
  END IF;

  -- Add MiFi_IMEI__c (placeholder)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'MiFi_IMEI__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "MiFi_IMEI__c" text;
  END IF;

  -- Add Office_Field__c
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'Office_Field__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "Office_Field__c" text;
    UPDATE company_equipment SET "Office_Field__c" = location WHERE location IS NOT NULL;
  END IF;

  -- Add Department__c
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'Department__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "Department__c" text;
    UPDATE company_equipment SET "Department__c" = department WHERE department IS NOT NULL;
  END IF;

  -- Add Notes__c
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'Notes__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "Notes__c" text;
    UPDATE company_equipment SET "Notes__c" = notes WHERE notes IS NOT NULL;
  END IF;

  -- Add Install_Date__c
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_equipment' AND column_name = 'Install_Date__c'
  ) THEN
    ALTER TABLE company_equipment ADD COLUMN "Install_Date__c" text;
    UPDATE company_equipment SET "Install_Date__c" = purchase_date::text WHERE purchase_date IS NOT NULL;
  END IF;
END $$;

-- =================
-- 3. SALESFORCE TASKS - ADD MISSING COLUMNS
-- =================

-- Add AssignedTo column to salesforce_tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salesforce_tasks' AND column_name = 'AssignedTo'
  ) THEN
    ALTER TABLE salesforce_tasks ADD COLUMN "AssignedTo" text;
  END IF;
END $$;

-- =================
-- 4. LEADS TABLE - ADD LOWERCASE ALIASES
-- =================

-- Add lowercase column aliases for leads table
DO $$
BEGIN
  -- Add first_name (maps to FirstName)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE leads ADD COLUMN first_name text;
    UPDATE leads SET first_name = "FirstName" WHERE "FirstName" IS NOT NULL;
  END IF;

  -- Add last_name (maps to LastName)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE leads ADD COLUMN last_name text;
    UPDATE leads SET last_name = "LastName" WHERE "LastName" IS NOT NULL;
  END IF;

  -- Add owner_id (maps to OwnerId)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN owner_id text;
    UPDATE leads SET owner_id = "OwnerId" WHERE "OwnerId" IS NOT NULL;
  END IF;

  -- Add company (maps to Company)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'company'
  ) THEN
    ALTER TABLE leads ADD COLUMN company text;
    UPDATE leads SET company = "Company" WHERE "Company" IS NOT NULL;
  END IF;

  -- Add status (maps to Status)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'status'
  ) THEN
    ALTER TABLE leads ADD COLUMN status text;
    UPDATE leads SET status = "Status" WHERE "Status" IS NOT NULL;
  END IF;

  -- Add email (maps to Email)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'email'
  ) THEN
    ALTER TABLE leads ADD COLUMN email text;
    UPDATE leads SET email = "Email" WHERE "Email" IS NOT NULL;
  END IF;

  -- Add phone (maps to Phone)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'phone'
  ) THEN
    ALTER TABLE leads ADD COLUMN phone text;
    UPDATE leads SET phone = "Phone" WHERE "Phone" IS NOT NULL;
  END IF;

  -- Add created_at (maps to CreatedDate)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN created_at timestamptz;
    UPDATE leads SET created_at = "CreatedDate" WHERE "CreatedDate" IS NOT NULL;
  END IF;
END $$;

-- =================
-- 5. CREATE INDEXES
-- =================

CREATE INDEX IF NOT EXISTS idx_channel_partners_slug ON channel_partners(slug);
CREATE INDEX IF NOT EXISTS idx_channel_partners_status ON channel_partners(status);
CREATE INDEX IF NOT EXISTS idx_partner_contacts_partner_id ON partner_contacts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_contacts_user_id ON partner_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_partner_id ON partner_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_lead_id ON partner_commissions(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_partner_id ON leads(partner_id);
CREATE INDEX IF NOT EXISTS idx_leads_first_name ON leads(first_name);
CREATE INDEX IF NOT EXISTS idx_leads_last_name ON leads(last_name);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id);

-- =================
-- 6. ENABLE RLS ON NEW TABLES
-- =================

ALTER TABLE channel_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_commissions ENABLE ROW LEVEL SECURITY;

-- =================
-- 7. RLS POLICIES
-- =================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage channel partners" ON channel_partners;
DROP POLICY IF EXISTS "Partner contacts can view their partner" ON channel_partners;
DROP POLICY IF EXISTS "Admins can manage partner contacts" ON partner_contacts;
DROP POLICY IF EXISTS "Users can view their own partner contacts" ON partner_contacts;
DROP POLICY IF EXISTS "Admins can manage partner commissions" ON partner_commissions;
DROP POLICY IF EXISTS "Partner contacts can view their commissions" ON partner_commissions;
DROP POLICY IF EXISTS "Partner contacts can view their partner leads" ON leads;

-- Channel Partners Policies
CREATE POLICY "Admins can manage channel partners"
  ON channel_partners FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_organization_roles.user_id = auth.uid()
      AND user_organization_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_organization_roles.user_id = auth.uid()
      AND user_organization_roles.role = 'admin'
    )
  );

CREATE POLICY "Partner contacts can view their partner"
  ON channel_partners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_contacts
      WHERE partner_contacts.partner_id = channel_partners.id
      AND partner_contacts.user_id = auth.uid()
    )
  );

-- Partner Contacts Policies
CREATE POLICY "Admins can manage partner contacts"
  ON partner_contacts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_organization_roles.user_id = auth.uid()
      AND user_organization_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_organization_roles.user_id = auth.uid()
      AND user_organization_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own partner contacts"
  ON partner_contacts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Partner Commissions Policies
CREATE POLICY "Admins can manage partner commissions"
  ON partner_commissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_organization_roles.user_id = auth.uid()
      AND user_organization_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_organization_roles.user_id = auth.uid()
      AND user_organization_roles.role = 'admin'
    )
  );

CREATE POLICY "Partner contacts can view their commissions"
  ON partner_commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_contacts
      WHERE partner_contacts.partner_id = partner_commissions.partner_id
      AND partner_contacts.user_id = auth.uid()
    )
  );

-- Leads Policy for Partners
CREATE POLICY "Partner contacts can view their partner leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_contacts
      WHERE partner_contacts.partner_id = leads.partner_id
      AND partner_contacts.user_id = auth.uid()
      AND partner_contacts.can_view_leads = true
    )
  );

-- ================================================================
-- SYNC COMPLETE!
-- ================================================================
-- All tables have been synced with the correct structure.
-- The following have been updated:
-- ✓ Channel Partners system (3 tables)
-- ✓ Company Equipment (Salesforce columns)
-- ✓ Salesforce Tasks (AssignedTo column)
-- ✓ Leads (lowercase alias columns)
-- ================================================================
