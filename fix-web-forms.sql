-- ================================================================
-- FIX WEB FORMS AND INSERT SAMPLE FORMS
-- ================================================================
-- Run this in Supabase SQL Editor to fix and populate web forms
-- ================================================================

DO $$
DECLARE
  v_admin_id uuid;
  v_org_id uuid;
BEGIN
  -- Get first admin user with organization
  SELECT up.id, uor.organization_id
  INTO v_admin_id, v_org_id
  FROM user_profiles up
  JOIN user_organization_roles uor ON up.id = uor.user_id
  WHERE uor.role = 'admin'
  LIMIT 1;

  -- Only proceed if we have a user
  IF v_admin_id IS NOT NULL AND v_org_id IS NOT NULL THEN

    -- Add capture_utm and capture_ip columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_forms' AND column_name = 'capture_utm') THEN
      ALTER TABLE web_forms ADD COLUMN capture_utm boolean DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_forms' AND column_name = 'capture_ip') THEN
      ALTER TABLE web_forms ADD COLUMN capture_ip boolean DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_forms' AND column_name = 'auto_response_enabled') THEN
      ALTER TABLE web_forms ADD COLUMN auto_response_enabled boolean DEFAULT false;
    END IF;

    -- Insert Sunation Contact Form
    INSERT INTO web_forms (
      organization_id,
      name,
      description,
      is_active,
      default_lead_source,
      default_owner_id,
      success_message,
      redirect_url,
      capture_ip,
      capture_utm,
      selected_fields,
      created_by,
      submissions_count
    )
    SELECT
      v_org_id,
      'Sunation Contact Form',
      'Main contact form from sunation.com website',
      true,
      'Website',
      v_admin_id,
      'Thank you for contacting Sunation Solar! We will be in touch soon.',
      'https://www.sunation.com/cp-thankyou/',
      true,
      true,
      '["first_name", "last_name", "email", "phone", "street", "city", "state", "zip", "utility", "utility_account_1", "avg_monthly_elec_bill", "description"]'::jsonb,
      v_admin_id,
      0
    WHERE NOT EXISTS (
      SELECT 1 FROM web_forms WHERE name = 'Sunation Contact Form'
    );

    -- Insert Demo Request Form
    INSERT INTO web_forms (
      organization_id,
      name,
      description,
      is_active,
      default_lead_source,
      default_owner_id,
      success_message,
      capture_ip,
      capture_utm,
      selected_fields,
      created_by,
      submissions_count
    )
    SELECT
      v_org_id,
      'Solar Consultation Request',
      'Form for requesting a free solar consultation',
      true,
      'Website - Consultation',
      v_admin_id,
      'Thank you! A solar expert will contact you within 24 hours.',
      true,
      true,
      '["first_name", "last_name", "email", "phone", "street", "city", "state", "zip", "avg_monthly_elec_bill", "description"]'::jsonb,
      v_admin_id,
      0
    WHERE NOT EXISTS (
      SELECT 1 FROM web_forms WHERE name = 'Solar Consultation Request'
    );

    -- Insert Quick Quote Form
    INSERT INTO web_forms (
      organization_id,
      name,
      description,
      is_active,
      default_lead_source,
      default_owner_id,
      success_message,
      capture_ip,
      capture_utm,
      selected_fields,
      created_by,
      submissions_count
    )
    SELECT
      v_org_id,
      'Quick Quote Request',
      'Simple form for getting a quick solar quote',
      true,
      'Website - Quote',
      v_admin_id,
      'Your quote request has been received. Expect a response shortly!',
      true,
      true,
      '["first_name", "last_name", "email", "phone", "zip", "avg_monthly_elec_bill"]'::jsonb,
      v_admin_id,
      0
    WHERE NOT EXISTS (
      SELECT 1 FROM web_forms WHERE name = 'Quick Quote Request'
    );

    RAISE NOTICE 'Web forms created successfully for organization %', v_org_id;
  ELSE
    RAISE NOTICE 'No admin user found with organization. Please create a user first.';
  END IF;
END $$;

-- ================================================================
-- VERIFY - Check what forms were created
-- ================================================================
SELECT
  id,
  name,
  form_key,
  default_lead_source,
  is_active,
  created_at
FROM web_forms
ORDER BY created_at DESC;
