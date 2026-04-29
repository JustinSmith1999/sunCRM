/*
  # Recreate Leads Table with All Required Columns

  1. Drop and recreate leads table with complete schema
  2. Includes all Salesforce fields
  3. Security enabled with RLS policies
*/

-- Drop existing table and policies
DROP TABLE IF EXISTS leads CASCADE;

-- Create complete leads table
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Name fields
  first_name text NOT NULL,
  last_name text NOT NULL,

  -- Contact fields
  email text,
  primary_phone text,
  mobile_phone text,

  -- Address fields
  street text,
  city text,
  state text,
  zip_postal_code text,
  county text,
  country text DEFAULT 'USA',

  -- Business fields
  company text,
  title text,

  -- Lead management
  lead_status text DEFAULT 'Open' CHECK (lead_status IN ('Open', 'Contacted', 'Qualified', 'Disqualified', 'Converted', 'Nurturing', 'Lost')),
  lead_source text,
  other_source text,

  -- Custom fields
  type_of_installation text,
  created_by_alias text,

  -- Assignment
  owner_id uuid REFERENCES user_profiles(id),

  -- Lead scoring
  lead_score integer DEFAULT 0,

  -- Conversion tracking
  converted boolean DEFAULT false,
  converted_date timestamptz,
  converted_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,

  -- Additional
  description text,
  notes text,

  -- System fields
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_leads_org ON leads(organization_id);
CREATE INDEX idx_leads_status ON leads(lead_status);
CREATE INDEX idx_leads_source ON leads(lead_source);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view organization leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()
    )
  );
