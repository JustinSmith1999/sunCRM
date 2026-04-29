/*
  # Complete Salesforce Replacement Features - Core Tables

  Creates all necessary tables for a complete Salesforce replacement including:
  - Validation rules
  - Assignment automation
  - Workflow automation  
  - Record types and layouts
  - Document management
  - Email system
  - Audit trails
  - Security controls
  - Data import/export
  - API and webhooks
*/

-- Validation Rules
CREATE TABLE IF NOT EXISTS validation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  object_type text NOT NULL,
  is_active boolean DEFAULT true,
  error_message text NOT NULL,
  validation_formula text NOT NULL,
  trigger_type text DEFAULT 'both',
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE validation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "validation_rules_select" ON validation_rules FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "validation_rules_all" ON validation_rules FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_validation_rules_org ON validation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_validation_rules_object ON validation_rules(object_type, is_active);

-- Assignment Queues
CREATE TABLE IF NOT EXISTS assignment_queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  object_type text NOT NULL,
  members uuid[] DEFAULT '{}',
  assignment_method text DEFAULT 'round_robin',
  current_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assignment_queues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignment_queues_select" ON assignment_queues FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "assignment_queues_all" ON assignment_queues FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

-- Assignment Rules
CREATE TABLE IF NOT EXISTS assignment_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  object_type text NOT NULL,
  is_active boolean DEFAULT true,
  order_number integer DEFAULT 0,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assignment_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignment_rules_select" ON assignment_rules FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "assignment_rules_all" ON assignment_rules FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

-- Assignment Rule Entries
CREATE TABLE IF NOT EXISTS assignment_rule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_rule_id uuid NOT NULL REFERENCES assignment_rules(id) ON DELETE CASCADE,
  criteria_formula text,
  sort_order integer DEFAULT 0,
  assign_to_type text DEFAULT 'user',
  assign_to_user_id uuid REFERENCES user_profiles(id),
  assign_to_queue_id uuid REFERENCES assignment_queues(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assignment_rule_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignment_rule_entries_select" ON assignment_rule_entries FOR SELECT TO authenticated
  USING (assignment_rule_id IN (SELECT id FROM assignment_rules WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY "assignment_rule_entries_all" ON assignment_rule_entries FOR ALL TO authenticated
  USING (assignment_rule_id IN (SELECT id FROM assignment_rules WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())))
  WITH CHECK (assignment_rule_id IN (SELECT id FROM assignment_rules WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

-- Workflow Rules
CREATE TABLE IF NOT EXISTS workflow_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  object_type text NOT NULL,
  trigger_type text NOT NULL,
  evaluation_criteria text NOT NULL,
  criteria_formula text,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_rules_select" ON workflow_rules FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "workflow_rules_all" ON workflow_rules FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

-- Workflow Actions
CREATE TABLE IF NOT EXISTS workflow_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_rule_id uuid NOT NULL REFERENCES workflow_rules(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_config jsonb NOT NULL,
  execution_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_actions_select" ON workflow_actions FOR SELECT TO authenticated
  USING (workflow_rule_id IN (SELECT id FROM workflow_rules WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY "workflow_actions_all" ON workflow_actions FOR ALL TO authenticated
  USING (workflow_rule_id IN (SELECT id FROM workflow_rules WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())))
  WITH CHECK (workflow_rule_id IN (SELECT id FROM workflow_rules WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

-- Workflow Action History
CREATE TABLE IF NOT EXISTS workflow_action_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_rule_id uuid NOT NULL REFERENCES workflow_rules(id),
  workflow_action_id uuid NOT NULL REFERENCES workflow_actions(id),
  record_id uuid NOT NULL,
  record_object_type text NOT NULL,
  status text DEFAULT 'success',
  error_message text,
  executed_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_action_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_action_history_select" ON workflow_action_history FOR SELECT TO authenticated
  USING (workflow_rule_id IN (SELECT id FROM workflow_rules WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

-- Record Types
CREATE TABLE IF NOT EXISTS record_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  object_type text NOT NULL,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE record_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "record_types_select" ON record_types FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "record_types_all" ON record_types FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

-- Page Layouts
CREATE TABLE IF NOT EXISTS page_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  object_type text NOT NULL,
  record_type_id uuid REFERENCES record_types(id),
  is_default boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE page_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_layouts_select" ON page_layouts FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "page_layouts_all" ON page_layouts FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

-- Page Layout Sections
CREATE TABLE IF NOT EXISTS page_layout_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_layout_id uuid NOT NULL REFERENCES page_layouts(id) ON DELETE CASCADE,
  name text NOT NULL,
  columns integer DEFAULT 2,
  order_number integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE page_layout_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_layout_sections_select" ON page_layout_sections FOR SELECT TO authenticated
  USING (page_layout_id IN (SELECT id FROM page_layouts WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY "page_layout_sections_all" ON page_layout_sections FOR ALL TO authenticated
  USING (page_layout_id IN (SELECT id FROM page_layouts WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())))
  WITH CHECK (page_layout_id IN (SELECT id FROM page_layouts WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

-- Page Layout Fields
CREATE TABLE IF NOT EXISTS page_layout_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES page_layout_sections(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  is_required boolean DEFAULT false,
  is_readonly boolean DEFAULT false,
  order_number integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE page_layout_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_layout_fields_select" ON page_layout_fields FOR SELECT TO authenticated
  USING (section_id IN (SELECT pls.id FROM page_layout_sections pls JOIN page_layouts pl ON pls.page_layout_id = pl.id WHERE pl.organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY "page_layout_fields_all" ON page_layout_fields FOR ALL TO authenticated
  USING (section_id IN (SELECT pls.id FROM page_layout_sections pls JOIN page_layouts pl ON pls.page_layout_id = pl.id WHERE pl.organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())))
  WITH CHECK (section_id IN (SELECT pls.id FROM page_layout_sections pls JOIN page_layouts pl ON pls.page_layout_id = pl.id WHERE pl.organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

-- Documents
CREATE TABLE IF NOT EXISTS crm_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  relation_type text,
  relation_id uuid,
  uploaded_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_documents_select" ON crm_documents FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "crm_documents_all" ON crm_documents FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_crm_documents_relation ON crm_documents(relation_type, relation_id);

-- Email Messages
CREATE TABLE IF NOT EXISTS crm_email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_address text NOT NULL,
  to_addresses text[] NOT NULL,
  cc_addresses text[],
  bcc_addresses text[],
  subject text NOT NULL,
  body_html text,
  body_text text,
  relation_type text,
  relation_id uuid,
  status text DEFAULT 'draft',
  sent_at timestamptz,
  sent_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_email_messages_select" ON crm_email_messages FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "crm_email_messages_all" ON crm_email_messages FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_crm_email_messages_relation ON crm_email_messages(relation_type, relation_id);

-- Email Tracking
CREATE TABLE IF NOT EXISTS crm_email_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_message_id uuid NOT NULL REFERENCES crm_email_messages(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  opened_at timestamptz,
  open_count integer DEFAULT 0,
  clicked_at timestamptz,
  click_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_email_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_email_tracking_select" ON crm_email_tracking FOR SELECT TO authenticated
  USING (email_message_id IN (SELECT id FROM crm_email_messages WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

-- Field History
CREATE TABLE IF NOT EXISTS crm_field_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  record_id uuid NOT NULL,
  object_type text NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid NOT NULL REFERENCES user_profiles(id),
  changed_at timestamptz DEFAULT now()
);

ALTER TABLE crm_field_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_field_history_select" ON crm_field_history FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_crm_field_history_record ON crm_field_history(record_id, object_type);
CREATE INDEX IF NOT EXISTS idx_crm_field_history_field ON crm_field_history(field_name);

-- Audit Log
CREATE TABLE IF NOT EXISTS crm_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id),
  action text NOT NULL,
  object_type text,
  object_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_audit_log_select" ON crm_audit_log FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_crm_audit_log_user ON crm_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_log_object ON crm_audit_log(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_log_created ON crm_audit_log(created_at);

-- Login History
CREATE TABLE IF NOT EXISTS crm_login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id),
  login_time timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  status text DEFAULT 'success',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_login_history_select" ON crm_login_history FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_crm_login_history_user ON crm_login_history(user_id, login_time);

-- Sharing Rules
CREATE TABLE IF NOT EXISTS crm_sharing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  object_type text NOT NULL,
  criteria_formula text,
  access_level text DEFAULT 'read',
  shared_with_type text NOT NULL,
  shared_with_id uuid,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_sharing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_sharing_rules_select" ON crm_sharing_rules FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "crm_sharing_rules_all" ON crm_sharing_rules FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

-- Field Permissions
CREATE TABLE IF NOT EXISTS crm_field_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  object_type text NOT NULL,
  field_name text NOT NULL,
  role_id uuid,
  can_read boolean DEFAULT true,
  can_edit boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_field_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_field_permissions_select" ON crm_field_permissions FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "crm_field_permissions_all" ON crm_field_permissions FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

-- Import Jobs
CREATE TABLE IF NOT EXISTS crm_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  object_type text NOT NULL,
  file_path text,
  field_mapping jsonb NOT NULL,
  status text DEFAULT 'pending',
  total_records integer DEFAULT 0,
  success_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE crm_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_import_jobs_select" ON crm_import_jobs FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "crm_import_jobs_all" ON crm_import_jobs FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

-- Import Records
CREATE TABLE IF NOT EXISTS crm_import_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid NOT NULL REFERENCES crm_import_jobs(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  data jsonb NOT NULL,
  status text DEFAULT 'pending',
  error_message text,
  created_record_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_import_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_import_records_select" ON crm_import_records FOR SELECT TO authenticated
  USING (import_job_id IN (SELECT id FROM crm_import_jobs WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

-- API Keys
CREATE TABLE IF NOT EXISTS crm_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  permissions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_api_keys_select" ON crm_api_keys FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "crm_api_keys_all" ON crm_api_keys FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

-- Webhook Subscriptions
CREATE TABLE IF NOT EXISTS crm_webhook_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  events text[] NOT NULL,
  secret text,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_webhook_subscriptions_select" ON crm_webhook_subscriptions FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "crm_webhook_subscriptions_all" ON crm_webhook_subscriptions FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

-- Webhook Deliveries
CREATE TABLE IF NOT EXISTS crm_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_subscription_id uuid NOT NULL REFERENCES crm_webhook_subscriptions(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  delivered_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_webhook_deliveries_select" ON crm_webhook_deliveries FOR SELECT TO authenticated
  USING (webhook_subscription_id IN (SELECT id FROM crm_webhook_subscriptions WHERE organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE INDEX IF NOT EXISTS idx_crm_webhook_deliveries_sub ON crm_webhook_deliveries(webhook_subscription_id);

-- Add record_type_id to leads table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'record_type_id') THEN
    ALTER TABLE leads ADD COLUMN record_type_id uuid REFERENCES record_types(id);
  END IF;
END $$;
