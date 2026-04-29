/*
  # Automation Flows System - Complete Salesforce Flow Replacement

  1. New Tables
    - `flows` - Flow definitions with metadata
    - `flow_versions` - Version history
    - `flow_triggers` - Trigger configurations
    - `flow_actions` - Action definitions
    - `flow_conditions` - Decision logic
    - `flow_executions` - Runtime logs
    - `flow_schedules` - Scheduled flow configs
    - `flow_email_templates` - Email templates
    - `flow_categories` - Organization
  
  2. Security
    - Enable RLS on all tables
    - Organization-level isolation
*/

-- Flows table (main flow definitions)
CREATE TABLE IF NOT EXISTS flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  api_name text NOT NULL,
  description text,
  flow_type text NOT NULL CHECK (flow_type IN (
    'record_triggered_before_save',
    'record_triggered_after_save', 
    'record_triggered_before_delete',
    'schedule_triggered',
    'screen_flow',
    'autolaunched',
    'routing_flow',
    'approval_flow',
    'field_service_mobile',
    'template_triggered_prompt'
  )),
  triggered_object text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'activated', 'canceled')),
  version_number integer DEFAULT 1,
  last_modified_by uuid REFERENCES user_profiles(id),
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  activated_at timestamptz,
  UNIQUE(organization_id, api_name)
);

-- Flow versions
CREATE TABLE IF NOT EXISTS flow_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  definition jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(flow_id, version_number)
);

-- Flow triggers
CREATE TABLE IF NOT EXISTS flow_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  trigger_type text NOT NULL CHECK (trigger_type IN (
    'on_create',
    'on_update', 
    'on_delete',
    'on_create_or_update',
    'scheduled',
    'manual'
  )),
  object_name text,
  trigger_timing text CHECK (trigger_timing IN ('before', 'after')),
  trigger_conditions jsonb,
  schedule_expression text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Flow actions
CREATE TABLE IF NOT EXISTS flow_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN (
    'create_record',
    'update_record',
    'delete_record',
    'send_email',
    'send_notification',
    'call_api',
    'create_task',
    'assign_record',
    'call_subflow',
    'decision',
    'loop',
    'wait'
  )),
  action_order integer NOT NULL DEFAULT 0,
  action_config jsonb NOT NULL,
  parent_action_id uuid REFERENCES flow_actions(id),
  condition_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Flow conditions
CREATE TABLE IF NOT EXISTS flow_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  action_id uuid REFERENCES flow_actions(id),
  condition_logic text,
  conditions jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Flow executions
CREATE TABLE IF NOT EXISTS flow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  triggered_by uuid REFERENCES user_profiles(id),
  record_id uuid,
  object_name text,
  status text NOT NULL CHECK (status IN ('running', 'success', 'failed', 'paused')),
  error_message text,
  execution_time_ms integer,
  actions_executed integer DEFAULT 0,
  execution_context jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Flow schedules
CREATE TABLE IF NOT EXISTS flow_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  schedule_type text NOT NULL CHECK (schedule_type IN (
    'daily',
    'weekly', 
    'monthly',
    'custom_cron'
  )),
  frequency text,
  start_date date,
  end_date date,
  start_time time,
  days_of_week integer[],
  day_of_month integer,
  cron_expression text,
  timezone text DEFAULT 'America/New_York',
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Flow email templates
CREATE TABLE IF NOT EXISTS flow_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_plain text,
  from_name text,
  from_email text,
  reply_to text,
  merge_fields jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Flow categories
CREATE TABLE IF NOT EXISTS flow_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flows_org ON flows(organization_id);
CREATE INDEX IF NOT EXISTS idx_flows_status ON flows(status);
CREATE INDEX IF NOT EXISTS idx_flows_type ON flows(flow_type);
CREATE INDEX IF NOT EXISTS idx_flows_object ON flows(triggered_object);
CREATE INDEX IF NOT EXISTS idx_flow_triggers_flow ON flow_triggers(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_triggers_active ON flow_triggers(is_active);
CREATE INDEX IF NOT EXISTS idx_flow_actions_flow ON flow_actions(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_executions_flow ON flow_executions(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_executions_org ON flow_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_flow_executions_status ON flow_executions(status);
CREATE INDEX IF NOT EXISTS idx_flow_schedules_active ON flow_schedules(is_active, next_run_at);

-- Enable RLS
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view organization flows"
  ON flows FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage flows"
  ON flows FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_id = auth.uid()
      AND organization_id = flows.organization_id
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_id = auth.uid()
      AND organization_id = flows.organization_id
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can view flow versions"
  ON flow_versions FOR SELECT
  TO authenticated
  USING (
    flow_id IN (
      SELECT id FROM flows WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage flow versions"
  ON flow_versions FOR ALL
  TO authenticated
  USING (
    flow_id IN (
      SELECT id FROM flows WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    flow_id IN (
      SELECT id FROM flows WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Users can view flow triggers"
  ON flow_triggers FOR SELECT
  TO authenticated
  USING (
    flow_id IN (
      SELECT id FROM flows WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage flow triggers"
  ON flow_triggers FOR ALL
  TO authenticated
  USING (
    flow_id IN (
      SELECT id FROM flows WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    flow_id IN (
      SELECT id FROM flows WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Users can view flow actions"
  ON flow_actions FOR SELECT
  TO authenticated
  USING (
    flow_id IN (
      SELECT id FROM flows WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage flow actions"
  ON flow_actions FOR ALL
  TO authenticated
  USING (
    flow_id IN (
      SELECT id FROM flows WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    flow_id IN (
      SELECT id FROM flows WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Users can view flow conditions"
  ON flow_conditions FOR SELECT
  TO authenticated
  USING (
    flow_id IN (
      SELECT id FROM flows WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage flow conditions"
  ON flow_conditions FOR ALL
  TO authenticated
  USING (
    flow_id IN (
      SELECT id FROM flows WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    flow_id IN (
      SELECT id FROM flows WHERE organization_id IN (
        SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Users can view organization executions"
  ON flow_executions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create executions"
  ON flow_executions FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view flow schedules"
  ON flow_schedules FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage flow schedules"
  ON flow_schedules FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view email templates"
  ON flow_email_templates FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage email templates"
  ON flow_email_templates FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view flow categories"
  ON flow_categories FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage flow categories"
  ON flow_categories FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
