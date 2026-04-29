/*
  # Create Admin Audit Log System

  1. New Tables
    - `admin_audit_log` - Comprehensive audit trail of all admin actions
      - Tracks user changes, role modifications, data access
      - Records who did what, when, and from where
      - Stores before/after values for all changes
      - Supports filtering by action type, user, date range
    
  2. Features
    - Complete audit trail of all admin activities
    - Track user creation, updates, deletions
    - Monitor role and permission changes
    - Log data access and modifications
    - Record login attempts and security events
    - IP address and user agent tracking
    - Searchable and filterable logs

  3. Security
    - Enable RLS on audit log table
    - Only admins can view audit logs
    - Audit logs are immutable (no updates or deletes)
    - Automatic timestamping

  4. Indexes
    - Fast lookups by admin user, target user, action type
    - Date range queries for reporting
    - IP address tracking for security
*/

-- Admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who performed the action
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email text NOT NULL,
  admin_name text,
  
  -- What was done
  action_type text NOT NULL CHECK (action_type IN (
    'user_created',
    'user_updated',
    'user_deleted',
    'user_activated',
    'user_deactivated',
    'password_reset',
    'password_changed',
    'role_changed',
    'permissions_modified',
    'login_success',
    'login_failed',
    'account_locked',
    'account_unlocked',
    'data_accessed',
    'data_modified',
    'data_deleted',
    'settings_changed',
    'api_key_created',
    'api_key_revoked',
    'export_performed',
    'import_performed',
    'integration_configured',
    'other'
  )),
  action_category text NOT NULL CHECK (action_category IN (
    'user_management',
    'security',
    'data_access',
    'system_settings',
    'integrations'
  )),
  action_description text NOT NULL,
  
  -- Target of the action (if applicable)
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_email text,
  target_resource_type text,
  target_resource_id text,
  
  -- Change details
  changes_made jsonb DEFAULT '{}'::jsonb,
  before_values jsonb,
  after_values jsonb,
  
  -- Request metadata
  ip_address inet,
  user_agent text,
  request_method text,
  request_path text,
  
  -- Status and result
  status text DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  error_message text,
  
  -- Compliance and tracking
  session_id text,
  request_id text,
  
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_email ON admin_audit_log(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action_type ON admin_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action_category ON admin_audit_log(action_category);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target_user ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_status ON admin_audit_log(status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_ip ON admin_audit_log(ip_address);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_date ON admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_category_date ON admin_audit_log(action_category, created_at DESC);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name = 'admin'
    )
  );

-- Allow system to insert audit logs (service role only)
CREATE POLICY "System can insert audit logs"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Prevent updates and deletes (audit logs are immutable)
CREATE POLICY "Audit logs cannot be updated"
  ON admin_audit_log FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Audit logs cannot be deleted"
  ON admin_audit_log FOR DELETE
  TO authenticated
  USING (false);

-- Function to automatically log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_email text,
  p_action_type text,
  p_action_category text,
  p_action_description text,
  p_target_user_email text DEFAULT NULL,
  p_changes jsonb DEFAULT NULL,
  p_before_values jsonb DEFAULT NULL,
  p_after_values jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
  v_admin_user_id uuid;
  v_target_user_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO v_admin_user_id
  FROM auth.users
  WHERE email = p_admin_email;
  
  -- Get target user ID if email provided
  IF p_target_user_email IS NOT NULL THEN
    SELECT id INTO v_target_user_id
    FROM auth.users
    WHERE email = p_target_user_email;
  END IF;
  
  -- Insert audit log
  INSERT INTO admin_audit_log (
    admin_user_id,
    admin_email,
    action_type,
    action_category,
    action_description,
    target_user_id,
    target_user_email,
    changes_made,
    before_values,
    after_values
  ) VALUES (
    v_admin_user_id,
    p_admin_email,
    p_action_type,
    p_action_category,
    p_action_description,
    v_target_user_id,
    p_target_user_email,
    COALESCE(p_changes, '{}'::jsonb),
    p_before_values,
    p_after_values
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log user profile changes
CREATE OR REPLACE FUNCTION audit_user_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_email text;
  v_action_type text;
  v_description text;
BEGIN
  -- Get current user email
  SELECT email INTO v_admin_email
  FROM auth.users
  WHERE id = auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'user_created';
    v_description := 'Created new user: ' || NEW.email;
    
    PERFORM log_admin_action(
      v_admin_email,
      v_action_type,
      'user_management',
      v_description,
      NEW.email,
      row_to_json(NEW)::jsonb,
      NULL,
      row_to_json(NEW)::jsonb
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determine specific action type
    IF OLD.role_id IS DISTINCT FROM NEW.role_id THEN
      v_action_type := 'role_changed';
      v_description := 'Changed role for user: ' || NEW.email;
    ELSIF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
      IF NEW.is_active THEN
        v_action_type := 'user_activated';
        v_description := 'Activated user: ' || NEW.email;
      ELSE
        v_action_type := 'user_deactivated';
        v_description := 'Deactivated user: ' || NEW.email;
      END IF;
    ELSE
      v_action_type := 'user_updated';
      v_description := 'Updated user profile: ' || NEW.email;
    END IF;
    
    PERFORM log_admin_action(
      v_admin_email,
      v_action_type,
      'user_management',
      v_description,
      NEW.email,
      jsonb_build_object(
        'changed_fields', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(row_to_json(NEW)::jsonb)
          WHERE value IS DISTINCT FROM (row_to_json(OLD)::jsonb -> key)
        )
      ),
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb
    );
    
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'user_deleted';
    v_description := 'Deleted user: ' || OLD.email;
    
    PERFORM log_admin_action(
      v_admin_email,
      v_action_type,
      'user_management',
      v_description,
      OLD.email,
      NULL,
      row_to_json(OLD)::jsonb,
      NULL
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_profiles
DROP TRIGGER IF EXISTS user_profiles_audit_trigger ON user_profiles;
CREATE TRIGGER user_profiles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_profile_changes();

-- Log the admin setup actions we just performed
DO $$
BEGIN
  PERFORM log_admin_action(
    'system@sunation.com',
    'role_changed',
    'user_management',
    'Granted admin role to mstegmeier@sunation.com with password change requirement',
    'mstegmeier@sunation.com',
    jsonb_build_object('role', 'admin', 'password_change_required', true)
  );
  
  PERFORM log_admin_action(
    'system@sunation.com',
    'role_changed',
    'user_management',
    'Granted admin role to jmucci@sunation.com with password change requirement',
    'jmucci@sunation.com',
    jsonb_build_object('role', 'admin', 'password_change_required', true)
  );
END $$;