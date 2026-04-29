-- =====================================================
-- COMPLETE ADMIN ACCESS SETUP
-- Grant Jessica Grady and Gary Roffman FULL access:
-- 1. Admin role for Admin Console access
-- 2. Partner portal access to all 22 partners
-- =====================================================

-- =====================================================
-- PART 1: Create Required Tables (if they don't exist)
-- =====================================================

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User organization roles table
CREATE TABLE IF NOT EXISTS user_organization_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'rep', 'support', 'readonly')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Enable RLS on tables
DO $$
BEGIN
  ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_organization_roles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Tables might already have RLS enabled
END $$;

-- Create policies (if they don't exist)
DO $$
BEGIN
  -- Organizations policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Users can view their organization') THEN
    CREATE POLICY "Users can view their organization"
      ON organizations FOR SELECT TO authenticated
      USING (id IN (SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Admins can manage organizations') THEN
    CREATE POLICY "Admins can manage organizations"
      ON organizations FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;

  -- User profiles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT TO authenticated USING (id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Admins can view all profiles') THEN
    CREATE POLICY "Admins can view all profiles"
      ON user_profiles FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM user_organization_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;

  -- User organization roles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_organization_roles' AND policyname = 'Users can view own roles') THEN
    CREATE POLICY "Users can view own roles" ON user_organization_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_organization_roles' AND policyname = 'Admins can view all roles') THEN
    CREATE POLICY "Admins can view all roles"
      ON user_organization_roles FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM user_organization_roles uor WHERE uor.user_id = auth.uid() AND uor.role = 'admin' AND uor.organization_id = organization_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_organization_roles' AND policyname = 'Admins can manage roles') THEN
    CREATE POLICY "Admins can manage roles"
      ON user_organization_roles FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM user_organization_roles uor WHERE uor.user_id = auth.uid() AND uor.role = 'admin' AND uor.organization_id = organization_id))
      WITH CHECK (EXISTS (SELECT 1 FROM user_organization_roles uor WHERE uor.user_id = auth.uid() AND uor.role = 'admin' AND uor.organization_id = organization_id));
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_user ON user_organization_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_org ON user_organization_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_role ON user_organization_roles(role);

-- =====================================================
-- PART 2: Setup Admin Access
-- =====================================================

DO $$
DECLARE
  v_jessica_id uuid;
  v_gary_id uuid;
  v_org_id uuid;
  v_org_name text := 'Sunation Energy';
  v_partner record;
  v_jessica_count int := 0;
  v_gary_count int := 0;
BEGIN
  RAISE NOTICE '🔄 Setting up complete admin access...';
  RAISE NOTICE '';

  -- ==================================================
  -- STEP 1: Find user IDs
  -- ==================================================
  SELECT id INTO v_jessica_id FROM auth.users WHERE email = 'jgrady@sunation.com';
  SELECT id INTO v_gary_id FROM auth.users WHERE email = 'groffman@sunation.com';

  IF v_jessica_id IS NULL AND v_gary_id IS NULL THEN
    RAISE EXCEPTION '❌ Neither user found. Create accounts first.';
  END IF;

  IF v_jessica_id IS NOT NULL THEN
    RAISE NOTICE '✅ Found Jessica Grady: %', v_jessica_id;
  ELSE
    RAISE NOTICE '⚠️  Jessica Grady not found - skipping';
  END IF;

  IF v_gary_id IS NOT NULL THEN
    RAISE NOTICE '✅ Found Gary Roffman: %', v_gary_id;
  ELSE
    RAISE NOTICE '⚠️  Gary Roffman not found - skipping';
  END IF;

  RAISE NOTICE '';

  -- ==================================================
  -- STEP 2: Setup Organization
  -- ==================================================
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE '📋 Creating organization: %', v_org_name;
    INSERT INTO organizations (name, slug)
    VALUES (v_org_name, 'sunation')
    RETURNING id INTO v_org_id;
    RAISE NOTICE '✅ Created organization: %', v_org_id;
  ELSE
    SELECT name INTO v_org_name FROM organizations WHERE id = v_org_id;
    RAISE NOTICE '✅ Using existing organization: % (%)', v_org_name, v_org_id;
  END IF;

  RAISE NOTICE '';

  -- ==================================================
  -- STEP 3: Create User Profiles & Admin Roles
  -- ==================================================
  RAISE NOTICE '🔄 Setting up user profiles and admin roles...';
  RAISE NOTICE '';

  -- Jessica's Profile and Admin Role
  IF v_jessica_id IS NOT NULL THEN
    -- Create or update profile
    INSERT INTO user_profiles (id, email, full_name)
    VALUES (v_jessica_id, 'jgrady@sunation.com', 'Jessica Grady')
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    -- Grant admin role
    INSERT INTO user_organization_roles (user_id, organization_id, role)
    VALUES (v_jessica_id, v_org_id, 'admin')
    ON CONFLICT (user_id, organization_id) DO UPDATE
    SET role = 'admin';

    RAISE NOTICE '✅ Jessica: Profile created, Admin role granted';
  END IF;

  -- Gary's Profile and Admin Role
  IF v_gary_id IS NOT NULL THEN
    -- Create or update profile
    INSERT INTO user_profiles (id, email, full_name)
    VALUES (v_gary_id, 'groffman@sunation.com', 'Gary Roffman')
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    -- Grant admin role
    INSERT INTO user_organization_roles (user_id, organization_id, role)
    VALUES (v_gary_id, v_org_id, 'admin')
    ON CONFLICT (user_id, organization_id) DO UPDATE
    SET role = 'admin';

    RAISE NOTICE '✅ Gary: Profile created, Admin role granted';
  END IF;

  RAISE NOTICE '';

  -- ==================================================
  -- STEP 4: Link to ALL Channel Partners
  -- ==================================================
  RAISE NOTICE '🔄 Linking to all channel partners...';
  RAISE NOTICE '';

  FOR v_partner IN
    SELECT id, name FROM channel_partners ORDER BY name
  LOOP
    -- Link Jessica
    IF v_jessica_id IS NOT NULL THEN
      DELETE FROM partner_contacts
      WHERE partner_id = v_partner.id AND user_id = v_jessica_id;

      INSERT INTO partner_contacts (
        partner_id,
        user_id,
        role,
        can_view_leads,
        can_manage_commissions
      ) VALUES (
        v_partner.id,
        v_jessica_id,
        'admin',
        true,
        true
      );

      v_jessica_count := v_jessica_count + 1;
      RAISE NOTICE '   ✅ Jessica → %', v_partner.name;
    END IF;

    -- Link Gary
    IF v_gary_id IS NOT NULL THEN
      DELETE FROM partner_contacts
      WHERE partner_id = v_partner.id AND user_id = v_gary_id;

      INSERT INTO partner_contacts (
        partner_id,
        user_id,
        role,
        can_view_leads,
        can_manage_commissions
      ) VALUES (
        v_partner.id,
        v_gary_id,
        'admin',
        true,
        true
      );

      v_gary_count := v_gary_count + 1;
      RAISE NOTICE '   ✅ Gary → %', v_partner.name;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '🎉 SETUP COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  IF v_jessica_id IS NOT NULL THEN
    RAISE NOTICE '   Jessica Grady:';
    RAISE NOTICE '      ✅ Admin role granted';
    RAISE NOTICE '      ✅ Linked to % partners', v_jessica_count;
  END IF;
  IF v_gary_id IS NOT NULL THEN
    RAISE NOTICE '   Gary Roffman:';
    RAISE NOTICE '      ✅ Admin role granted';
    RAISE NOTICE '      ✅ Linked to % partners', v_gary_count;
  END IF;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Both users now have:';
  RAISE NOTICE '   • Admin Console access';
  RAISE NOTICE '   • Channel Partners management';
  RAISE NOTICE '   • Partner Portal with dropdown selector';
  RAISE NOTICE '   • Full lead and commission visibility';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check admin roles
SELECT
  u.email,
  up.full_name,
  uor.role,
  o.name as organization
FROM auth.users u
LEFT JOIN user_profiles up ON up.id = u.id
LEFT JOIN user_organization_roles uor ON uor.user_id = u.id
LEFT JOIN organizations o ON o.id = uor.organization_id
WHERE u.email IN ('jgrady@sunation.com', 'groffman@sunation.com');

-- Check partner access
SELECT
  u.email,
  COUNT(pc.id) as partner_count,
  BOOL_AND(pc.can_view_leads) as can_view_all_leads,
  BOOL_AND(pc.can_manage_commissions) as can_manage_all_commissions
FROM auth.users u
JOIN partner_contacts pc ON pc.user_id = u.id
WHERE u.email IN ('jgrady@sunation.com', 'groffman@sunation.com')
GROUP BY u.email;

-- List all partner links
SELECT
  u.email,
  cp.name as partner_name,
  pc.role,
  pc.can_view_leads,
  pc.can_manage_commissions
FROM auth.users u
JOIN partner_contacts pc ON pc.user_id = u.id
JOIN channel_partners cp ON cp.id = pc.partner_id
WHERE u.email IN ('jgrady@sunation.com', 'groffman@sunation.com')
ORDER BY u.email, cp.name;
