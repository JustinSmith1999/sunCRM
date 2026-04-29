/*
  # Create Solar Installation Project Tracking System
  
  1. New Tables
    - solar_projects: Main installation project tracking  
    - solar_permits: Permit and compliance tracking
    - solar_inspections: Inspection scheduling and results
    - solar_milestones: Project milestone tracking
    - solar_equipment_inventory: Track equipment for installations
    
  2. Purpose
    - Track solar installation from contract to PTO
    - Manage permits, inspections, and compliance
    - Monitor project progress and timelines
    - Track equipment allocation to projects
    
  3. Security
    - Enable RLS on all tables
    - Policies for project managers and staff
*/

-- Solar Projects table (main project tracking)
CREATE TABLE IF NOT EXISTS solar_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships (using text to match Salesforce IDs)
  opportunity_salesforce_id text,
  lead_salesforce_id text,
  account_salesforce_id text,
  aurora_project_id uuid REFERENCES aurora_projects(id),
  
  -- Project basics
  project_name text NOT NULL,
  project_number text UNIQUE,
  project_type text NOT NULL DEFAULT 'residential',
  
  -- System details
  system_size_kw numeric(10,2),
  panel_count integer,
  panel_model text,
  inverter_type text,
  inverter_model text,
  battery_included boolean DEFAULT false,
  battery_model text,
  battery_capacity_kwh numeric(10,2),
  
  -- Installation details
  installation_address text,
  installation_city text,
  installation_state text,
  installation_zip text,
  roof_type text,
  mounting_type text,
  
  -- Timeline
  contract_signed_date date,
  estimated_installation_date date,
  actual_installation_start_date date,
  actual_installation_complete_date date,
  pto_date date,
  project_completion_date date,
  
  -- Status and stage
  project_status text DEFAULT 'pending',
  current_stage text DEFAULT 'contract_signed',
  stage_updated_at timestamptz DEFAULT now(),
  
  -- Team assignment
  project_manager_id uuid,
  sales_rep_id uuid,
  lead_installer_id uuid,
  crew_assigned jsonb,
  
  -- Financial
  contract_amount numeric(12,2),
  total_cost numeric(12,2),
  profit_margin numeric(5,2),
  payment_schedule jsonb,
  
  -- Notes and documents
  special_instructions text,
  site_notes text,
  document_urls jsonb,
  
  -- Tracking
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Solar Permits table
CREATE TABLE IF NOT EXISTS solar_permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES solar_projects(id) ON DELETE CASCADE,
  
  -- Permit details
  permit_type text NOT NULL,
  permit_number text,
  issuing_authority text NOT NULL,
  jurisdiction text,
  
  -- Status and timeline
  permit_status text DEFAULT 'not_started',
  application_date date,
  submission_date date,
  approval_date date,
  expiration_date date,
  inspection_required boolean DEFAULT true,
  
  -- Documents
  application_documents jsonb,
  approval_documents jsonb,
  stamp_received boolean DEFAULT false,
  
  -- Costs
  permit_fee numeric(10,2),
  fee_paid boolean DEFAULT false,
  fee_paid_date date,
  
  -- Notes
  notes text,
  requirements_checklist jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Solar Inspections table
CREATE TABLE IF NOT EXISTS solar_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES solar_projects(id) ON DELETE CASCADE,
  permit_id uuid REFERENCES solar_permits(id),
  
  -- Inspection details
  inspection_type text NOT NULL,
  inspection_authority text NOT NULL,
  inspector_name text,
  inspector_contact text,
  
  -- Scheduling
  scheduled_date date,
  scheduled_time time,
  actual_inspection_date date,
  rescheduled_count integer DEFAULT 0,
  
  -- Results
  inspection_status text DEFAULT 'scheduled',
  passed boolean,
  inspection_result text,
  deficiencies_found jsonb,
  correction_required text,
  
  -- Follow-up
  reinspection_required boolean DEFAULT false,
  reinspection_scheduled_date date,
  reinspection_passed boolean,
  
  -- Documentation
  inspection_report_url text,
  photos jsonb,
  
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Solar Project Milestones table
CREATE TABLE IF NOT EXISTS solar_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES solar_projects(id) ON DELETE CASCADE,
  
  -- Milestone details
  milestone_name text NOT NULL,
  milestone_type text NOT NULL,
  milestone_order integer,
  
  -- Status
  status text DEFAULT 'pending',
  is_completed boolean DEFAULT false,
  completion_percentage integer DEFAULT 0,
  
  -- Timeline
  planned_start_date date,
  planned_end_date date,
  actual_start_date date,
  actual_end_date date,
  
  -- Assignment
  assigned_to uuid,
  assigned_team jsonb,
  
  -- Documentation
  completion_photos jsonb,
  completion_notes text,
  
  -- Dependencies
  depends_on_milestone_id uuid REFERENCES solar_milestones(id),
  blocking_milestones jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_by uuid,
  completed_at timestamptz
);

-- Solar Equipment Inventory table
CREATE TABLE IF NOT EXISTS solar_equipment_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Equipment details
  equipment_type text NOT NULL,
  manufacturer text,
  model_number text NOT NULL,
  serial_number text UNIQUE,
  
  -- Specifications
  specifications jsonb,
  wattage numeric(10,2),
  efficiency numeric(5,2),
  warranty_years integer,
  
  -- Inventory management
  status text DEFAULT 'in_stock',
  warehouse_location text,
  purchase_date date,
  purchase_cost numeric(10,2),
  supplier text,
  
  -- Project allocation
  allocated_to_project_id uuid REFERENCES solar_projects(id),
  allocation_date date,
  installation_date date,
  
  -- Warranty and service
  warranty_expiration_date date,
  warranty_registered boolean DEFAULT false,
  warranty_registration_date date,
  
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_solar_projects_status ON solar_projects(project_status);
CREATE INDEX IF NOT EXISTS idx_solar_projects_stage ON solar_projects(current_stage);
CREATE INDEX IF NOT EXISTS idx_solar_projects_opportunity ON solar_projects(opportunity_salesforce_id);
CREATE INDEX IF NOT EXISTS idx_solar_projects_pm ON solar_projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_solar_projects_install_date ON solar_projects(estimated_installation_date);

CREATE INDEX IF NOT EXISTS idx_solar_permits_project ON solar_permits(project_id);
CREATE INDEX IF NOT EXISTS idx_solar_permits_status ON solar_permits(permit_status);
CREATE INDEX IF NOT EXISTS idx_solar_permits_expiration ON solar_permits(expiration_date);

CREATE INDEX IF NOT EXISTS idx_solar_inspections_project ON solar_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_solar_inspections_date ON solar_inspections(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_solar_inspections_status ON solar_inspections(inspection_status);

CREATE INDEX IF NOT EXISTS idx_solar_milestones_project ON solar_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_solar_milestones_status ON solar_milestones(status);
CREATE INDEX IF NOT EXISTS idx_solar_milestones_order ON solar_milestones(milestone_order);

CREATE INDEX IF NOT EXISTS idx_solar_equipment_status ON solar_equipment_inventory(status);
CREATE INDEX IF NOT EXISTS idx_solar_equipment_project ON solar_equipment_inventory(allocated_to_project_id);
CREATE INDEX IF NOT EXISTS idx_solar_equipment_type ON solar_equipment_inventory(equipment_type);

-- Enable RLS
ALTER TABLE solar_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_equipment_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for solar_projects (permissive for all authenticated users)
CREATE POLICY "Authenticated users can view solar projects"
  ON solar_projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create solar projects"
  ON solar_projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update solar projects"
  ON solar_projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for solar_permits
CREATE POLICY "Authenticated users can view permits"
  ON solar_permits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage permits"
  ON solar_permits FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for solar_inspections
CREATE POLICY "Authenticated users can view inspections"
  ON solar_inspections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage inspections"
  ON solar_inspections FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for solar_milestones
CREATE POLICY "Authenticated users can view milestones"
  ON solar_milestones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage milestones"
  ON solar_milestones FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for solar_equipment_inventory
CREATE POLICY "Authenticated users can view equipment inventory"
  ON solar_equipment_inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage equipment inventory"
  ON solar_equipment_inventory FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE solar_projects IS 'Tracks solar installation projects from contract to completion';
COMMENT ON TABLE solar_permits IS 'Manages permits and regulatory approvals for solar installations';
COMMENT ON TABLE solar_inspections IS 'Tracks inspections and compliance checks';
COMMENT ON TABLE solar_milestones IS 'Project milestone tracking and completion';
COMMENT ON TABLE solar_equipment_inventory IS 'Equipment inventory and allocation to projects';