/*
  # Salesforce Sync System

  1. New Tables
    - `salesforce_sync_config`
      - Configuration for Salesforce connection and sync settings
      - Stores credentials, API endpoints, sync frequency
    - `salesforce_sync_jobs`
      - Tracks each sync job execution
      - Records start time, end time, status, records synced
    - `salesforce_object_mappings`
      - Maps Salesforce objects to Supabase tables
      - Defines field mappings and transformation rules
    - `salesforce_sync_logs`
      - Detailed logs for sync operations
      - Error tracking and debugging information

  2. Security
    - Enable RLS on all sync tables
    - Only admins can view/modify sync configuration
*/

-- Salesforce sync configuration table
CREATE TABLE IF NOT EXISTS salesforce_sync_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  salesforce_instance_url text NOT NULL,
  salesforce_api_version text DEFAULT 'v59.0',
  client_id text,
  client_secret text,
  username text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_sandbox boolean DEFAULT false,
  sync_enabled boolean DEFAULT true,
  sync_frequency_minutes integer DEFAULT 60,
  last_full_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Salesforce object to Supabase table mappings
CREATE TABLE IF NOT EXISTS salesforce_object_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  salesforce_object text NOT NULL,
  supabase_table text NOT NULL,
  sync_enabled boolean DEFAULT true,
  sync_mode text DEFAULT 'incremental' CHECK (sync_mode IN ('full', 'incremental')),
  last_sync_at timestamptz,
  last_sync_id text,
  field_mappings jsonb DEFAULT '{}',
  where_clause text,
  order_by text DEFAULT 'SystemModstamp ASC',
  batch_size integer DEFAULT 200,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, salesforce_object)
);

-- Sync job tracking
CREATE TABLE IF NOT EXISTS salesforce_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  job_type text DEFAULT 'incremental' CHECK (job_type IN ('full', 'incremental', 'manual')),
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  total_objects integer DEFAULT 0,
  completed_objects integer DEFAULT 0,
  total_records_synced integer DEFAULT 0,
  total_errors integer DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Detailed sync logs
CREATE TABLE IF NOT EXISTS salesforce_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_job_id uuid REFERENCES salesforce_sync_jobs(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id),
  salesforce_object text NOT NULL,
  log_level text DEFAULT 'info' CHECK (log_level IN ('debug', 'info', 'warning', 'error')),
  message text NOT NULL,
  records_processed integer DEFAULT 0,
  records_inserted integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE salesforce_sync_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_object_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin only for security)
CREATE POLICY "Admins can manage sync config"
  ON salesforce_sync_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_id = auth.uid()
      AND organization_id = salesforce_sync_config.organization_id
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage object mappings"
  ON salesforce_object_mappings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_id = auth.uid()
      AND organization_id = salesforce_object_mappings.organization_id
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view sync jobs"
  ON salesforce_sync_jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_id = auth.uid()
      AND organization_id = salesforce_sync_jobs.organization_id
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can view sync logs"
  ON salesforce_sync_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_id = auth.uid()
      AND organization_id = salesforce_sync_logs.organization_id
      AND role IN ('admin', 'manager')
    )
  );

-- Insert default object mappings for common Salesforce objects
INSERT INTO salesforce_object_mappings (organization_id, salesforce_object, supabase_table, sync_mode)
VALUES
  (NULL, 'Lead', 'leads', 'incremental'),
  (NULL, 'Account', 'accounts', 'incremental'),
  (NULL, 'Contact', 'salesforce_contacts', 'incremental'),
  (NULL, 'Opportunity', 'opportunities', 'incremental'),
  (NULL, 'User', 'users', 'incremental')
ON CONFLICT DO NOTHING;
