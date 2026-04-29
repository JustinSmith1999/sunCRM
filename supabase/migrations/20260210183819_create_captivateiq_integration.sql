/*
  # CaptivateIQ Commission Software Integration

  1. New Tables
    - `captivateiq_config`
      - Stores API credentials and configuration
      - Fields: api_key, base_url, webhook_secret, last_sync_at
    - `captivateiq_metrics`
      - Stores synced commission and sales metrics
      - Fields: metric_type, value, period_type, period_start, period_end, rep_id, rep_name, metadata
    - `captivateiq_commissions`
      - Stores individual commission records
      - Fields: rep_name, rep_email, period, amount, status, plan_name, metadata

  2. Security
    - Enable RLS on all tables
    - Admin-only access for config
    - Role-based access for metrics and commissions

  3. Indexes
    - Add indexes for common queries on period dates and rep IDs
*/

-- CaptivateIQ Configuration
CREATE TABLE IF NOT EXISTS captivateiq_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text,
  base_url text DEFAULT 'https://api.captivateiq.com',
  webhook_secret text,
  last_sync_at timestamptz,
  sync_enabled boolean DEFAULT false,
  sync_frequency_hours integer DEFAULT 24,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE captivateiq_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to CaptivateIQ config"
  ON captivateiq_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin')
    )
  );

-- CaptivateIQ Metrics (aggregated data)
CREATE TABLE IF NOT EXISTS captivateiq_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL, -- 'revenue', 'pipeline', 'commission', 'quota_attainment'
  value numeric NOT NULL DEFAULT 0,
  period_type text NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all_time'
  period_start date NOT NULL,
  period_end date NOT NULL,
  rep_id text, -- NULL for company-wide metrics
  rep_name text,
  rep_email text,
  team_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE captivateiq_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all CaptivateIQ metrics"
  ON captivateiq_metrics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Sales managers can view all metrics"
  ON captivateiq_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'sales_manager')
    )
  );

CREATE POLICY "Sales reps can view their own metrics"
  ON captivateiq_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('sales_rep', 'sales_manager')
      AND (
        captivateiq_metrics.rep_email = up.email
        OR captivateiq_metrics.rep_id IS NULL -- Company-wide metrics
      )
    )
  );

-- CaptivateIQ Commissions (individual commission records)
CREATE TABLE IF NOT EXISTS captivateiq_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  captivateiq_id text UNIQUE, -- External ID from CaptivateIQ
  rep_name text NOT NULL,
  rep_email text NOT NULL,
  rep_id text,
  period_name text NOT NULL, -- e.g., "Q1 2024", "January 2024"
  period_start date NOT NULL,
  period_end date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'disputed'
  plan_name text,
  quota_amount numeric DEFAULT 0,
  quota_attainment numeric DEFAULT 0, -- Percentage
  total_revenue numeric DEFAULT 0,
  deals_closed integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE captivateiq_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all commissions"
  ON captivateiq_commissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Sales managers can view all commissions"
  ON captivateiq_commissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'sales_manager')
    )
  );

CREATE POLICY "Sales reps can view their own commissions"
  ON captivateiq_commissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('sales_rep', 'sales_manager')
      AND captivateiq_commissions.rep_email = up.email
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_captivateiq_metrics_period ON captivateiq_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_captivateiq_metrics_rep ON captivateiq_metrics(rep_id, rep_email);
CREATE INDEX IF NOT EXISTS idx_captivateiq_metrics_type ON captivateiq_metrics(metric_type, period_type);
CREATE INDEX IF NOT EXISTS idx_captivateiq_commissions_period ON captivateiq_commissions(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_captivateiq_commissions_rep ON captivateiq_commissions(rep_email);
CREATE INDEX IF NOT EXISTS idx_captivateiq_commissions_status ON captivateiq_commissions(status);

-- Insert default config row
INSERT INTO captivateiq_config (id, sync_enabled)
VALUES ('00000000-0000-0000-0000-000000000001', false)
ON CONFLICT (id) DO NOTHING;
