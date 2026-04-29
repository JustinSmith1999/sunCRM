-- ================================================================
-- GRANT JESSICA GRADY AND GARY ROFFMAN ACCESS TO ALL PARTNERS
-- ================================================================
-- This gives them admin-level access to view/manage all 22 channel partners
-- ================================================================

-- First, let's find their user IDs
DO $$
DECLARE
  jessica_user_id uuid;
  gary_user_id uuid;
  partner_record RECORD;
BEGIN
  -- Get Jessica Grady's user ID
  SELECT id INTO jessica_user_id
  FROM auth.users
  WHERE email = 'jgrady@sunation.com';

  -- Get Gary Roffman's user ID
  SELECT id INTO gary_user_id
  FROM auth.users
  WHERE email = 'groffman@sunation.com';

  -- If Jessica's account exists, link her to all partners
  IF jessica_user_id IS NOT NULL THEN
    RAISE NOTICE 'Found Jessica Grady: %', jessica_user_id;

    -- Link Jessica to all 22 partners
    FOR partner_record IN SELECT id, name FROM channel_partners LOOP
      -- Remove any existing link first
      DELETE FROM partner_contacts
      WHERE partner_id = partner_record.id
        AND user_id = jessica_user_id;

      -- Create new link with admin access
      INSERT INTO partner_contacts (partner_id, user_id, role, can_view_leads, can_manage_commissions)
      VALUES (partner_record.id, jessica_user_id, 'admin', true, true);

      RAISE NOTICE 'Linked Jessica to: %', partner_record.name;
    END LOOP;
  ELSE
    RAISE NOTICE 'Jessica Grady not found in auth.users';
  END IF;

  -- If Gary's account exists, link him to all partners
  IF gary_user_id IS NOT NULL THEN
    RAISE NOTICE 'Found Gary Roffman: %', gary_user_id;

    -- Link Gary to all 22 partners
    FOR partner_record IN SELECT id, name FROM channel_partners LOOP
      -- Remove any existing link first
      DELETE FROM partner_contacts
      WHERE partner_id = partner_record.id
        AND user_id = gary_user_id;

      -- Create new link with admin access
      INSERT INTO partner_contacts (partner_id, user_id, role, can_view_leads, can_manage_commissions)
      VALUES (partner_record.id, gary_user_id, 'admin', true, true);

      RAISE NOTICE 'Linked Gary to: %', partner_record.name;
    END LOOP;
  ELSE
    RAISE NOTICE 'Gary Roffman not found in auth.users - need to create account first';
  END IF;
END $$;

-- Verify Jessica's access
SELECT
  u.email,
  cp.name as partner_name,
  pc.role,
  pc.can_view_leads,
  pc.can_manage_commissions
FROM partner_contacts pc
JOIN auth.users u ON u.id = pc.user_id
JOIN channel_partners cp ON cp.id = pc.partner_id
WHERE u.email = 'jgrady@sunation.com'
ORDER BY cp.name;

-- Verify Gary's access
SELECT
  u.email,
  cp.name as partner_name,
  pc.role,
  pc.can_view_leads,
  pc.can_manage_commissions
FROM partner_contacts pc
JOIN auth.users u ON u.id = pc.user_id
JOIN channel_partners cp ON cp.id = pc.partner_id
WHERE u.email = 'groffman@sunation.com'
ORDER BY cp.name;

-- Show summary
SELECT
  u.email,
  u.raw_user_meta_data->>'full_name' as name,
  COUNT(pc.id) as partner_count,
  array_agg(DISTINCT pc.role) as roles
FROM auth.users u
LEFT JOIN partner_contacts pc ON pc.user_id = u.id
WHERE u.email IN ('jgrady@sunation.com', 'groffman@sunation.com')
GROUP BY u.id, u.email, u.raw_user_meta_data
ORDER BY u.email;
