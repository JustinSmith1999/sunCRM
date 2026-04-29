/*
  # Process Automation System

  ## Overview
  Creates comprehensive automation system for lead-to-sale processes including:
  - Automated workflow engine
  - Lead-to-call automation
  - Permitting process automation
  - Drawing/design process automation
  - Sales process automation
  - Document management automation

  ## New Tables

  ### automation_workflows
  Defines reusable automation workflows with trigger types and actions

  ### automation_executions
  Tracks every time a workflow runs with status and results

  ### lead_automation_rules
  Rules for automatic lead assignment and calling

  ### permit_workflows
  Tracks permitting process for each solar installation project

  ### design_workflows
  Tracks design process for each project with Aurora Solar integration

  ### automation_tasks
  Tasks created automatically by workflows

  ### lead_scoring
  Automatic lead scoring for prioritization

  ### automation_notifications
  Tracks notifications sent by automation

  ### document_automation
  Tracks automated document management with Egnyte

  ## Security
  - Enable RLS on all tables
  - Users can only access workflows and executions they have permission for
  - Automation tasks are visible to assigned users and admins
*/

-- Create automation_workflows table
CREATE TABLE IF NOT EXISTS automation_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL,
  trigger_conditions jsonb DEFAULT '{}',
  actions jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON automation_workflows(trigger_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workflows_priority ON automation_workflows(priority DESC) WHERE is_active = true;

-- Create automation_executions table
CREATE TABLE IF NOT EXISTS automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES automation_workflows(id) ON DELETE CASCADE,
  trigger_data jsonb DEFAULT '{}',
  status text DEFAULT 'pending',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  error_message text,
  actions_completed jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_executions_workflow ON automation_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON automation_executions(status, created_at DESC);

-- Create lead_automation_rules table
CREATE TABLE IF NOT EXISTS lead_automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  conditions jsonb DEFAULT '{}',
  assignment_type text DEFAULT 'round_robin',
  assigned_users jsonb DEFAULT '[]',
  call_scheduling jsonb DEFAULT '{}',
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_rules_active ON lead_automation_rules(priority DESC) WHERE is_active = true;

-- Create permit_workflows table
CREATE TABLE IF NOT EXISTS permit_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_sf_id text,
  permit_status text DEFAULT 'not_started',
  jurisdiction text,
  application_number text,
  submitted_date date,
  approval_date date,
  required_documents jsonb DEFAULT '[]',
  collected_documents jsonb DEFAULT '[]',
  assigned_to uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permit_opportunity ON permit_workflows(opportunity_sf_id);
CREATE INDEX IF NOT EXISTS idx_permit_status ON permit_workflows(permit_status);
CREATE INDEX IF NOT EXISTS idx_permit_assigned ON permit_workflows(assigned_to) WHERE permit_status NOT IN ('approved', 'rejected');

-- Create design_workflows table
CREATE TABLE IF NOT EXISTS design_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_sf_id text,
  design_status text DEFAULT 'not_started',
  aurora_project_id text,
  assigned_designer uuid REFERENCES auth.users(id),
  design_started_at timestamptz,
  design_completed_at timestamptz,
  customer_approved_at timestamptz,
  revision_count integer DEFAULT 0,
  system_size_kw numeric(10,2),
  panel_count integer,
  design_files jsonb DEFAULT '[]',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_design_opportunity ON design_workflows(opportunity_sf_id);
CREATE INDEX IF NOT EXISTS idx_design_status ON design_workflows(design_status);
CREATE INDEX IF NOT EXISTS idx_design_assigned ON design_workflows(assigned_designer) WHERE design_status IN ('in_progress', 'pending_review');

-- Create automation_tasks table
CREATE TABLE IF NOT EXISTS automation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id uuid REFERENCES automation_executions(id) ON DELETE SET NULL,
  task_type text NOT NULL,
  assigned_to uuid REFERENCES auth.users(id),
  related_record_type text,
  related_record_id text,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON automation_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON automation_tasks(due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tasks_related ON automation_tasks(related_record_type, related_record_id);

-- Create lead_scoring table
CREATE TABLE IF NOT EXISTS lead_scoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE UNIQUE,
  total_score integer DEFAULT 0,
  property_score integer DEFAULT 0,
  engagement_score integer DEFAULT 0,
  demographic_score integer DEFAULT 0,
  scoring_factors jsonb DEFAULT '{}',
  score_category text DEFAULT 'cold',
  last_calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_score ON lead_scoring(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_category ON lead_scoring(score_category);

-- Create automation_notifications table
CREATE TABLE IF NOT EXISTS automation_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id uuid REFERENCES automation_executions(id) ON DELETE SET NULL,
  notification_type text NOT NULL,
  recipient_type text NOT NULL,
  recipient_id uuid,
  recipient_contact text,
  subject text,
  message text,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_status ON automation_notifications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON automation_notifications(recipient_id, notification_type);

-- Create document_automation table
CREATE TABLE IF NOT EXISTS document_automation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type text NOT NULL,
  record_id text NOT NULL,
  document_type text NOT NULL,
  document_name text NOT NULL,
  egnyte_path text,
  egnyte_file_id text,
  auto_created boolean DEFAULT false,
  created_by_workflow uuid REFERENCES automation_workflows(id) ON DELETE SET NULL,
  version integer DEFAULT 1,
  status text DEFAULT 'draft',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_docs_record ON document_automation(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_docs_type ON document_automation(document_type);
CREATE INDEX IF NOT EXISTS idx_docs_status ON document_automation(status);

-- Enable RLS
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_automation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_workflows
CREATE POLICY "Admins can manage all workflows"
  ON automation_workflows FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can view active workflows"
  ON automation_workflows FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for automation_executions
CREATE POLICY "Admins can view all executions"
  ON automation_executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for lead_automation_rules
CREATE POLICY "Admins and sales managers can manage lead rules"
  ON lead_automation_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'sales_manager')
    )
  );

-- RLS Policies for permit_workflows
CREATE POLICY "Users can view permits"
  ON permit_workflows FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'operations_manager')
    )
  );

CREATE POLICY "Assigned users can update permits"
  ON permit_workflows FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'operations_manager')
    )
  );

CREATE POLICY "Authorized users can insert permits"
  ON permit_workflows FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'operations_manager', 'sales_rep')
    )
  );

-- RLS Policies for design_workflows
CREATE POLICY "Users can view designs"
  ON design_workflows FOR SELECT
  TO authenticated
  USING (
    assigned_designer = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'design_manager')
    )
  );

CREATE POLICY "Assigned designers can update designs"
  ON design_workflows FOR UPDATE
  TO authenticated
  USING (
    assigned_designer = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'design_manager')
    )
  );

CREATE POLICY "Authorized users can insert designs"
  ON design_workflows FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'design_manager', 'sales_rep')
    )
  );

-- RLS Policies for automation_tasks
CREATE POLICY "Users can view their assigned tasks"
  ON automation_tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can update their assigned tasks"
  ON automation_tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "System can insert tasks"
  ON automation_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for lead_scoring
CREATE POLICY "Users can view lead scores"
  ON lead_scoring FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_scoring.lead_id
      AND leads.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'sales_manager')
    )
  );

CREATE POLICY "System can manage lead scores"
  ON lead_scoring FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for automation_notifications
CREATE POLICY "Users can view their notifications"
  ON automation_notifications FOR SELECT
  TO authenticated
  USING (
    recipient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert notifications"
  ON automation_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for document_automation
CREATE POLICY "Users can view documents"
  ON document_automation FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can manage documents"
  ON document_automation FOR ALL
  TO authenticated
  USING (true);