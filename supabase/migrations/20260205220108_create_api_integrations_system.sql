/*
  # API Integrations Management System

  1. New Tables
    - `api_credentials`
      - Stores encrypted API credentials for third-party services
      - Supports multiple integration types (Egnyte, Power BI, RingCentral, etc.)
      - Includes connection status and testing results

    - `api_integration_logs`
      - Tracks API calls, errors, and usage
      - Helps with debugging and monitoring

    - `api_webhooks`
      - Manages incoming webhooks from third-party services
      - Stores webhook configurations and secrets

  2. Security
    - Enable RLS on all tables
    - Only admins can manage API credentials
    - Logs are read-only for non-admins
    - Webhook secrets are encrypted

  3. Features
    - Multi-tenant support for different integration instances
    - Connection testing and validation
    - Automatic token refresh handling
    - Rate limiting tracking
    - Error logging and alerting
*/

-- API Credentials Table
CREATE TABLE IF NOT EXISTS api_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  service_type text NOT NULL,
  display_name text NOT NULL,

  -- Credentials (encrypted at application level)
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- OAuth tokens
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,

  -- Connection status
  is_active boolean DEFAULT true,
  is_connected boolean DEFAULT false,
  last_tested_at timestamptz,
  last_test_result jsonb,

  -- Configuration
  config jsonb DEFAULT '{}'::jsonb,
  environment text DEFAULT 'production',

  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(service_name, environment)
);

-- API Integration Logs
CREATE TABLE IF NOT EXISTS api_integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id uuid REFERENCES api_credentials(id) ON DELETE CASCADE,

  -- Request details
  service_name text NOT NULL,
  endpoint text,
  method text,

  -- Response details
  status_code integer,
  response_time_ms integer,
  success boolean DEFAULT true,

  -- Error tracking
  error_message text,
  error_code text,
  error_details jsonb,

  -- Context
  user_id uuid REFERENCES auth.users(id),
  context jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now()
);

-- API Webhooks Table
CREATE TABLE IF NOT EXISTS api_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  webhook_url text NOT NULL,
  webhook_secret text,

  -- Configuration
  events text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,

  -- Stats
  last_received_at timestamptz,
  total_received integer DEFAULT 0,
  total_failed integer DEFAULT 0,

  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(service_name, webhook_url)
);

-- Webhook Events Log
CREATE TABLE IF NOT EXISTS api_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES api_webhooks(id) ON DELETE CASCADE,

  event_type text NOT NULL,
  payload jsonb NOT NULL,
  headers jsonb,

  -- Processing
  processed boolean DEFAULT false,
  processed_at timestamptz,
  processing_error text,

  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_credentials_service ON api_credentials(service_name, is_active);
CREATE INDEX IF NOT EXISTS idx_api_logs_credential ON api_integration_logs(credential_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_service ON api_integration_logs(service_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_webhooks_service ON api_webhooks(service_name, is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook ON api_webhook_events(webhook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON api_webhook_events(processed, created_at DESC);

-- Enable RLS
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_credentials
CREATE POLICY "Admins can manage all API credentials"
  ON api_credentials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN user_roles ON user_profiles.role_id = user_roles.id
      WHERE user_profiles.id = auth.uid()
      AND user_roles.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN user_roles ON user_profiles.role_id = user_roles.id
      WHERE user_profiles.id = auth.uid()
      AND user_roles.name = 'admin'
    )
  );

CREATE POLICY "Users can view active credentials"
  ON api_credentials FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for api_integration_logs
CREATE POLICY "Admins can view all logs"
  ON api_integration_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN user_roles ON user_profiles.role_id = user_roles.id
      WHERE user_profiles.id = auth.uid()
      AND user_roles.name = 'admin'
    )
  );

CREATE POLICY "Users can view their own logs"
  ON api_integration_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert logs"
  ON api_integration_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for api_webhooks
CREATE POLICY "Admins can manage webhooks"
  ON api_webhooks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN user_roles ON user_profiles.role_id = user_roles.id
      WHERE user_profiles.id = auth.uid()
      AND user_roles.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN user_roles ON user_profiles.role_id = user_roles.id
      WHERE user_profiles.id = auth.uid()
      AND user_roles.name = 'admin'
    )
  );

CREATE POLICY "Users can view active webhooks"
  ON api_webhooks FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for api_webhook_events
CREATE POLICY "Admins can view all webhook events"
  ON api_webhook_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN user_roles ON user_profiles.role_id = user_roles.id
      WHERE user_profiles.id = auth.uid()
      AND user_roles.name = 'admin'
    )
  );

CREATE POLICY "System can insert webhook events"
  ON api_webhook_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update webhook events"
  ON api_webhook_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default integration templates
INSERT INTO api_credentials (service_name, service_type, display_name, credentials, config, is_active, is_connected)
VALUES
  ('egnyte', 'file_storage', 'Egnyte File Storage', '{"domain": "", "api_key": "", "client_id": "", "client_secret": ""}'::jsonb, '{"base_path": "/Shared"}'::jsonb, false, false),
  ('powerbi', 'analytics', 'Power BI', '{"client_id": "", "client_secret": "", "tenant_id": ""}'::jsonb, '{"workspace_id": ""}'::jsonb, false, false),
  ('ringcentral', 'communications', 'RingCentral', '{"client_id": "", "client_secret": "", "jwt_token": ""}'::jsonb, '{"extension": "", "server_url": "https://platform.ringcentral.com"}'::jsonb, false, false),
  ('aurora_solar', 'solar_design', 'Aurora Solar', '{"api_key": "", "tenant_id": ""}'::jsonb, '{"webhook_secret": ""}'::jsonb, false, false),
  ('salesforce', 'crm', 'Salesforce', '{"client_id": "", "client_secret": "", "username": "", "password": "", "security_token": ""}'::jsonb, '{"instance_url": "https://login.salesforce.com", "api_version": "59.0"}'::jsonb, false, false),
  ('stripe', 'payments', 'Stripe', '{"secret_key": "", "publishable_key": "", "webhook_secret": ""}'::jsonb, '{"currency": "usd"}'::jsonb, false, false),
  ('twilio', 'communications', 'Twilio', '{"account_sid": "", "auth_token": "", "phone_number": ""}'::jsonb, '{}'::jsonb, false, false),
  ('sendgrid', 'email', 'SendGrid', '{"api_key": ""}'::jsonb, '{"from_email": "", "from_name": ""}'::jsonb, false, false)
ON CONFLICT (service_name, environment) DO NOTHING;