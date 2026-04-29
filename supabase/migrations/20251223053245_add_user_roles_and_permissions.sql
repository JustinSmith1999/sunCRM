/*
  # Add User Roles and Permissions System
  
  1. New Tables
    - `user_roles` - Define available roles with permissions
      - `id` (uuid, primary key)
      - `name` (text, unique) - Role name
      - `display_name` (text) - User-friendly name
      - `permissions` (jsonb) - Permissions config
      - `created_at`, `updated_at`
  
  2. Changes to user_profiles
    - Add `role_id` - Reference to user_roles
    - Add `salesforce_user_id` - Link to Salesforce data
    - Add `title` - Job title
    - Add `department` - Department name
    - Add `is_active` - Active status
  
  3. Security
    - Enable RLS with proper policies
    - Sync role data to auth.users metadata
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view roles" ON user_roles;
  DROP POLICY IF EXISTS "Only admins can manage roles" ON user_roles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Anyone can view roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

-- Insert default roles
INSERT INTO user_roles (name, display_name, permissions) VALUES
  ('admin', 'Administrator', '{"all": true, "manage_users": true, "manage_settings": true, "view_analytics": true, "manage_salesforce": true}'::jsonb),
  ('sales_manager', 'Sales Manager', '{"view_all_deals": true, "manage_team_deals": true, "view_analytics": true, "manage_leads": true}'::jsonb),
  ('sales_rep', 'Sales Representative', '{"view_own_deals": true, "manage_own_deals": true, "create_leads": true, "view_leads": true}'::jsonb),
  ('support', 'Support User', '{"view_cases": true, "manage_cases": true, "view_kb": true, "manage_kb": true}'::jsonb),
  ('hr_manager', 'HR Manager', '{"view_hr_records": true, "manage_hr_records": true, "view_employees": true}'::jsonb),
  ('operations', 'Operations User', '{"view_reports": true, "manage_equipment": true, "view_inventory": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Add new columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' AND column_name = 'role_id') THEN
    ALTER TABLE user_profiles ADD COLUMN role_id uuid REFERENCES user_roles(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' AND column_name = 'salesforce_user_id') THEN
    ALTER TABLE user_profiles ADD COLUMN salesforce_user_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' AND column_name = 'title') THEN
    ALTER TABLE user_profiles ADD COLUMN title text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' AND column_name = 'department') THEN
    ALTER TABLE user_profiles ADD COLUMN department text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' AND column_name = 'is_active') THEN
    ALTER TABLE user_profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Drop and recreate RLS policies for user_profiles
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can view other active profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view other active profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create function to sync user metadata
CREATE OR REPLACE FUNCTION sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users raw_app_meta_data with role info
  IF NEW.role_id IS NOT NULL THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'role', (SELECT name FROM user_roles WHERE id = NEW.role_id),
        'role_id', NEW.role_id::text,
        'salesforce_user_id', NEW.salesforce_user_id,
        'title', NEW.title,
        'department', NEW.department
      )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON user_profiles;

CREATE TRIGGER sync_user_metadata_trigger
  AFTER INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_metadata();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
