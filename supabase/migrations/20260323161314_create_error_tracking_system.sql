/*
  # Error Tracking and System Health Monitoring

  1. New Tables
    - `application_errors`
      - Tracks all frontend and backend errors
      - Includes user context, error details, and stack traces

    - `system_health_checks`
      - Monitors component health status
      - Tracks uptime and response times

    - `query_performance_log`
      - Logs slow queries and performance issues
      - Helps identify bottlenecks

  2. Security
    - Enable RLS on all tables
    - Admin-only access to error data
    - Automated cleanup of old records
*/

-- Application errors tracking
CREATE TABLE IF NOT EXISTS application_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL,
  error_message text NOT NULL,
  error_stack text,
  component_name text,
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  url text,
  http_status integer,
  request_method text,
  request_body jsonb,
  response_body text,
  browser_info jsonb,
  severity text DEFAULT 'error',
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  notes text,
  occurrence_count integer DEFAULT 1,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- System health checks
CREATE TABLE IF NOT EXISTS system_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name text NOT NULL,
  check_type text NOT NULL,
  status text NOT NULL,
  response_time_ms integer,
  error_message text,
  details jsonb,
  checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Query performance logging
CREATE TABLE IF NOT EXISTS query_performance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  query_type text NOT NULL,
  execution_time_ms integer NOT NULL,
  query_text text,
  user_id uuid REFERENCES auth.users(id),
  is_slow boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE application_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_performance_log ENABLE ROW LEVEL SECURITY;

-- Policies for application_errors
CREATE POLICY "Admins can view all errors"
  ON application_errors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE POLICY "System can insert errors"
  ON application_errors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update errors"
  ON application_errors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name = 'admin'
    )
  );

-- Policies for system_health_checks
CREATE POLICY "Admins can view health checks"
  ON system_health_checks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE POLICY "System can insert health checks"
  ON system_health_checks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for query_performance_log
CREATE POLICY "Admins can view query performance"
  ON query_performance_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name = 'admin'
    )
  );

CREATE POLICY "System can log query performance"
  ON query_performance_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_application_errors_created_at ON application_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_errors_component ON application_errors(component_name);
CREATE INDEX IF NOT EXISTS idx_application_errors_severity ON application_errors(severity);
CREATE INDEX IF NOT EXISTS idx_application_errors_resolved ON application_errors(resolved);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_checked_at ON system_health_checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_component ON system_health_checks(component_name);
CREATE INDEX IF NOT EXISTS idx_query_performance_log_created_at ON query_performance_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_log_is_slow ON query_performance_log(is_slow) WHERE is_slow = true;

-- Function to aggregate duplicate errors
CREATE OR REPLACE FUNCTION log_application_error(
  p_error_type text,
  p_error_message text,
  p_error_stack text DEFAULT NULL,
  p_component_name text DEFAULT NULL,
  p_url text DEFAULT NULL,
  p_http_status integer DEFAULT NULL,
  p_severity text DEFAULT 'error'
) RETURNS uuid AS $$
DECLARE
  v_error_id uuid;
  v_existing_error application_errors;
BEGIN
  SELECT * INTO v_existing_error
  FROM application_errors
  WHERE error_type = p_error_type
    AND error_message = p_error_message
    AND component_name = p_component_name
    AND resolved = false
    AND created_at > now() - interval '24 hours'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE application_errors
    SET occurrence_count = occurrence_count + 1,
        last_seen_at = now()
    WHERE id = v_existing_error.id
    RETURNING id INTO v_error_id;
  ELSE
    INSERT INTO application_errors (
      error_type,
      error_message,
      error_stack,
      component_name,
      url,
      http_status,
      severity,
      user_id,
      user_email
    ) VALUES (
      p_error_type,
      p_error_message,
      p_error_stack,
      p_component_name,
      p_url,
      p_http_status,
      p_severity,
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    RETURNING id INTO v_error_id;
  END IF;

  RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old errors (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_errors()
RETURNS void AS $$
BEGIN
  DELETE FROM application_errors
  WHERE created_at < now() - interval '30 days'
    AND resolved = true;

  DELETE FROM system_health_checks
  WHERE created_at < now() - interval '7 days';

  DELETE FROM query_performance_log
  WHERE created_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql;
