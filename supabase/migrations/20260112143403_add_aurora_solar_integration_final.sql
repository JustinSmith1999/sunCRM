/*
  # Add Aurora Solar Integration Fields
  
  1. Changes to Opportunities Table
    - Add Aurora Solar custom fields to track solar designs
    - `Aurora_Design__c` - Aurora design name/reference
    - `Primary_Design__c` - Primary design selection
    - `Primary_Design_ID__c` - Aurora design ID
    - `System_Size_kW__c` - Solar system size in kilowatts
    - `Annual_Production_kWhr__c` - Annual energy production in kWh
    
  2. Changes to Leads Table
    - Add basic Aurora Solar tracking fields
    
  3. New Table: aurora_projects
    - Full Aurora Solar project data storage
    - Links to leads and opportunities using Salesforce IDs
    - Stores design specifications, proposals, and status
    
  4. New Table: aurora_proposals
    - Proposal tracking and history
    - Sent, viewed, and acceptance tracking
    
  5. Security
    - Enable RLS on new tables
    - Policies for authenticated users with proper role checks
*/

-- Add Aurora Solar fields to opportunities table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'opportunities' AND column_name = 'Aurora_Design__c'
  ) THEN
    ALTER TABLE opportunities ADD COLUMN "Aurora_Design__c" text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'opportunities' AND column_name = 'Primary_Design__c'
  ) THEN
    ALTER TABLE opportunities ADD COLUMN "Primary_Design__c" text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'opportunities' AND column_name = 'Primary_Design_ID__c'
  ) THEN
    ALTER TABLE opportunities ADD COLUMN "Primary_Design_ID__c" text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'opportunities' AND column_name = 'System_Size_kW__c'
  ) THEN
    ALTER TABLE opportunities ADD COLUMN "System_Size_kW__c" numeric(10,2);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'opportunities' AND column_name = 'Annual_Production_kWhr__c'
  ) THEN
    ALTER TABLE opportunities ADD COLUMN "Annual_Production_kWhr__c" numeric(12,2);
  END IF;
END $$;

-- Add Aurora Solar fields to leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'Aurora_Design__c'
  ) THEN
    ALTER TABLE leads ADD COLUMN "Aurora_Design__c" text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'System_Size_kW__c'
  ) THEN
    ALTER TABLE leads ADD COLUMN "System_Size_kW__c" numeric(10,2);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'Annual_Production_kWhr__c'
  ) THEN
    ALTER TABLE leads ADD COLUMN "Annual_Production_kWhr__c" numeric(12,2);
  END IF;
END $$;

-- Create aurora_projects table for detailed design data
CREATE TABLE IF NOT EXISTS aurora_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aurora_project_id text UNIQUE NOT NULL,
  aurora_design_id text,
  
  -- Relationships (using text to match Salesforce IDs)
  lead_salesforce_id text,
  opportunity_salesforce_id text,
  account_salesforce_id text,
  owner_id uuid,
  
  -- Design Information
  design_name text,
  primary_design text,
  design_status text DEFAULT 'Draft',
  design_version integer DEFAULT 1,
  
  -- System Specifications
  system_size_kw numeric(10,2),
  panel_count integer,
  panel_model text,
  panel_wattage numeric(6,2),
  inverter_model text,
  inverter_count integer,
  
  -- Production & Financial
  annual_production_kwhr numeric(12,2),
  first_year_production_kwhr numeric(12,2),
  lifetime_production_kwhr numeric(15,2),
  estimated_cost numeric(12,2),
  cost_per_watt numeric(8,4),
  estimated_savings numeric(12,2),
  payback_period_years numeric(5,2),
  
  -- Site Details
  roof_type text,
  roof_pitch numeric(5,2),
  roof_azimuth numeric(5,2),
  shading_analysis jsonb,
  site_address text,
  site_latitude numeric(10,6),
  site_longitude numeric(10,6),
  
  -- Proposal Information
  proposal_url text,
  proposal_pdf_url text,
  proposal_sent_at timestamptz,
  proposal_viewed_at timestamptz,
  proposal_accepted_at timestamptz,
  
  -- Engineering & Permits
  engineering_review_status text,
  permit_package_url text,
  permit_submitted_at timestamptz,
  permit_approved_at timestamptz,
  
  -- Full Design Data (JSON from Aurora API)
  design_data jsonb,
  solar_access_data jsonb,
  energy_profile jsonb,
  
  -- Audit fields
  salesforce_id text UNIQUE,
  synced_to_salesforce_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_aurora_projects_aurora_id ON aurora_projects(aurora_project_id);
CREATE INDEX IF NOT EXISTS idx_aurora_projects_lead_sf ON aurora_projects(lead_salesforce_id);
CREATE INDEX IF NOT EXISTS idx_aurora_projects_opp_sf ON aurora_projects(opportunity_salesforce_id);
CREATE INDEX IF NOT EXISTS idx_aurora_projects_owner ON aurora_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_aurora_projects_status ON aurora_projects(design_status);

-- Enable RLS
ALTER TABLE aurora_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for aurora_projects
CREATE POLICY "Users can view aurora projects they own or have admin/manager role"
  ON aurora_projects FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() 
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_organization_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Authenticated users can create aurora projects"
  ON aurora_projects FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update aurora projects they own or have manager role"
  ON aurora_projects FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() 
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_organization_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    owner_id = auth.uid() 
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_organization_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete aurora projects"
  ON aurora_projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create aurora_proposals table for proposal tracking
CREATE TABLE IF NOT EXISTS aurora_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES aurora_projects(id) ON DELETE CASCADE,
  opportunity_salesforce_id text,
  
  -- Proposal Details
  proposal_name text,
  proposal_version integer DEFAULT 1,
  proposal_url text,
  proposal_pdf_url text,
  
  -- Pricing
  total_cost numeric(12,2),
  incentives numeric(12,2),
  net_cost numeric(12,2),
  financing_options jsonb,
  
  -- Tracking
  status text DEFAULT 'draft',
  sent_to_email text,
  sent_at timestamptz,
  viewed_at timestamptz,
  viewed_count integer DEFAULT 0,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  expires_at timestamptz,
  
  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_aurora_proposals_project ON aurora_proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_aurora_proposals_opp_sf ON aurora_proposals(opportunity_salesforce_id);
CREATE INDEX IF NOT EXISTS idx_aurora_proposals_status ON aurora_proposals(status);

-- Enable RLS
ALTER TABLE aurora_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for aurora_proposals
CREATE POLICY "Users can view proposals for projects they have access to"
  ON aurora_proposals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM aurora_projects 
      WHERE id = aurora_proposals.project_id 
      AND (
        owner_id = auth.uid() 
        OR created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_organization_roles 
          WHERE user_id = auth.uid() 
          AND role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Authenticated users can create proposals"
  ON aurora_proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update proposals they created or have manager role"
  ON aurora_proposals FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_organization_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_organization_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete proposals"
  ON aurora_proposals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_aurora_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_aurora_projects_updated_at ON aurora_projects;
CREATE TRIGGER update_aurora_projects_updated_at
  BEFORE UPDATE ON aurora_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_aurora_updated_at();

DROP TRIGGER IF EXISTS update_aurora_proposals_updated_at ON aurora_proposals;
CREATE TRIGGER update_aurora_proposals_updated_at
  BEFORE UPDATE ON aurora_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_aurora_updated_at();

-- Add helpful comments
COMMENT ON TABLE aurora_projects IS 'Stores Aurora Solar project designs and specifications';
COMMENT ON TABLE aurora_proposals IS 'Tracks Aurora Solar proposals sent to customers';
COMMENT ON COLUMN opportunities."Aurora_Design__c" IS 'Aurora Solar design name';
COMMENT ON COLUMN opportunities."Primary_Design__c" IS 'Primary Aurora design selection';
COMMENT ON COLUMN opportunities."Primary_Design_ID__c" IS 'Aurora design ID';
COMMENT ON COLUMN opportunities."System_Size_kW__c" IS 'Solar system size in kilowatts';
COMMENT ON COLUMN opportunities."Annual_Production_kWhr__c" IS 'Annual energy production in kilowatt-hours';
