-- =====================================================
-- SIMPLE ADMIN ACCESS SETUP
-- Grant full admin access to:
-- - jgrady@sunation.com
-- - groffman@sunation.com
-- - Admin@Company.com
-- =====================================================

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_organization_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'rep', 'support', 'readonly')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organization_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Admins can manage organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_organization_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_organization_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_organization_roles;

-- Create policies
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT TO authenticated
  USING (id IN (SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage organizations"
  ON organizations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own roles"
  ON user_organization_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON user_organization_roles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_organization_roles uor WHERE uor.user_id = auth.uid() AND uor.role = 'admin'));

CREATE POLICY "Admins can manage roles"
  ON user_organization_roles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_organization_roles uor WHERE uor.user_id = auth.uid() AND uor.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_organization_roles uor WHERE uor.user_id = auth.uid() AND uor.role = 'admin'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_user ON user_organization_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_org ON user_organization_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_role ON user_organization_roles(role);

-- Setup admin access for all three users
DO $$
DECLARE
  v_jessica_id uuid;
  v_gary_id uuid;
  v_admin_id uuid;
  v_org_id uuid;
BEGIN
  RAISE NOTICE '🔄 Setting up admin access...';

  -- Find users
  SELECT id INTO v_jessica_id FROM auth.users WHERE email = 'jgrady@sunation.com';
  SELECT id INTO v_gary_id FROM auth.users WHERE email = 'groffman@sunation.com';
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'Admin@Company.com';

  IF v_jessica_id IS NULL AND v_gary_id IS NULL AND v_admin_id IS NULL THEN
    RAISE EXCEPTION '❌ No users found!';
  END IF;

  IF v_jessica_id IS NOT NULL THEN
    RAISE NOTICE '✅ Found: jgrady@sunation.com';
  END IF;
  IF v_gary_id IS NOT NULL THEN
    RAISE NOTICE '✅ Found: groffman@sunation.com';
  END IF;
  IF v_admin_id IS NOT NULL THEN
    RAISE NOTICE '✅ Found: Admin@Company.com';
  END IF;

  -- Create/get organization
  INSERT INTO organizations (name, slug)
  VALUES ('Sunation Energy', 'sunation')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_org_id;

  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM organizations WHERE slug = 'sunation';
  END IF;

  RAISE NOTICE '✅ Organization ID: %', v_org_id;

  -- Jessica setup
  IF v_jessica_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, full_name)
    VALUES (v_jessica_id, 'jgrady@sunation.com', 'Jessica Grady')
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

    INSERT INTO user_organization_roles (user_id, organization_id, role)
    VALUES (v_jessica_id, v_org_id, 'admin')
    ON CONFLICT (user_id, organization_id) DO UPDATE
    SET role = 'admin';

    RAISE NOTICE '✅ Jessica Grady - Admin access granted';
  END IF;

  -- Gary setup
  IF v_gary_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, full_name)
    VALUES (v_gary_id, 'groffman@sunation.com', 'Gary Roffman')
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

    INSERT INTO user_organization_roles (user_id, organization_id, role)
    VALUES (v_gary_id, v_org_id, 'admin')
    ON CONFLICT (user_id, organization_id) DO UPDATE
    SET role = 'admin';

    RAISE NOTICE '✅ Gary Roffman - Admin access granted';
  END IF;

  -- Admin@Company.com setup
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, email, full_name)
    VALUES (v_admin_id, 'Admin@Company.com', 'System Administrator')
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

    INSERT INTO user_organization_roles (user_id, organization_id, role)
    VALUES (v_admin_id, v_org_id, 'admin')
    ON CONFLICT (user_id, organization_id) DO UPDATE
    SET role = 'admin';

    RAISE NOTICE '✅ Admin@Company.com - Admin access granted';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🎉 SETUP COMPLETE!';
  RAISE NOTICE 'All users now have full admin access to the system.';
END $$;

-- Verify setup
SELECT
  u.email,
  up.full_name,
  uor.role,
  o.name as organization
FROM auth.users u
LEFT JOIN user_profiles up ON up.id = u.id
LEFT JOIN user_organization_roles uor ON uor.user_id = u.id
LEFT JOIN organizations o ON o.id = uor.organization_id
WHERE u.email IN ('jgrady@sunation.com', 'groffman@sunation.com', 'Admin@Company.com')
ORDER BY u.email;
