/*
  # Add All Salesforce Lead Custom Fields

  1. Changes
    - Add all custom fields from Salesforce Lead object to support complete Web-to-Lead functionality
    - Fields include residential solar-specific fields, marketing attribution, utility info, and more
    - All fields are nullable to support gradual data collection

  2. Field Categories
    - Basic Information: additional_information, profession, language_preference
    - Property Details: age_of_roof, age_of_structure, sq_ft, floors, layers, roof_pitch, roof_style
    - Solar Specific: orientation_of_roofs, shading_issues, ps_score, ps_rating, offset_discussion
    - Utility Information: utility, utility_account_1-4, name_on_utility_account, annual_kwh_usage, avg_monthly_elec_bill
    - Financial: taxable_income, credit_score, bankruptcy, financing, annual_sales
    - Marketing: utm fields, trustedform_cert_url, unbounce fields, lead_channel, lead_cost
    - Process Tracking: lead_sub_status, lead_rating, lead_type, reason, call_type
    - Contact Details: secondary_email, vts_phone, facilities_manager, owner_of_property
*/

-- Add custom text fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'additional_information') THEN
    ALTER TABLE leads ADD COLUMN additional_information text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'age_of_roof') THEN
    ALTER TABLE leads ADD COLUMN age_of_roof text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'age_of_structure') THEN
    ALTER TABLE leads ADD COLUMN age_of_structure text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'anticipated_closing') THEN
    ALTER TABLE leads ADD COLUMN anticipated_closing text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'bankruptcy') THEN
    ALTER TABLE leads ADD COLUMN bankruptcy text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'call_center_rep') THEN
    ALTER TABLE leads ADD COLUMN call_center_rep text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'call_type') THEN
    ALTER TABLE leads ADD COLUMN call_type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'canvasser') THEN
    ALTER TABLE leads ADD COLUMN canvasser text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'closed_lost_description') THEN
    ALTER TABLE leads ADD COLUMN closed_lost_description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'company_website') THEN
    ALTER TABLE leads ADD COLUMN company_website text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'county') THEN
    ALTER TABLE leads ADD COLUMN county text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'credit_score') THEN
    ALTER TABLE leads ADD COLUMN credit_score text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'customer_expectations') THEN
    ALTER TABLE leads ADD COLUMN customer_expectations text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'customer_notes') THEN
    ALTER TABLE leads ADD COLUMN customer_notes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'electric_voltage') THEN
    ALTER TABLE leads ADD COLUMN electric_voltage text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'external_lead_id') THEN
    ALTER TABLE leads ADD COLUMN external_lead_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'facilities_manager') THEN
    ALTER TABLE leads ADD COLUMN facilities_manager text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'financing') THEN
    ALTER TABLE leads ADD COLUMN financing text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'floors') THEN
    ALTER TABLE leads ADD COLUMN floors text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'language_preference') THEN
    ALTER TABLE leads ADD COLUMN language_preference text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'layers') THEN
    ALTER TABLE leads ADD COLUMN layers text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_channel') THEN
    ALTER TABLE leads ADD COLUMN lead_channel text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_rating') THEN
    ALTER TABLE leads ADD COLUMN lead_rating text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_sub_status') THEN
    ALTER TABLE leads ADD COLUMN lead_sub_status text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_type') THEN
    ALTER TABLE leads ADD COLUMN lead_type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'meter_1') THEN
    ALTER TABLE leads ADD COLUMN meter_1 text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'meter_2') THEN
    ALTER TABLE leads ADD COLUMN meter_2 text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'meter_3') THEN
    ALTER TABLE leads ADD COLUMN meter_3 text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'meter_4') THEN
    ALTER TABLE leads ADD COLUMN meter_4 text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'name_on_utility_account') THEN
    ALTER TABLE leads ADD COLUMN name_on_utility_account text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'offset_discussion') THEN
    ALTER TABLE leads ADD COLUMN offset_discussion text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'orientation_of_roofs') THEN
    ALTER TABLE leads ADD COLUMN orientation_of_roofs text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'other_estimates') THEN
    ALTER TABLE leads ADD COLUMN other_estimates text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'other_source') THEN
    ALTER TABLE leads ADD COLUMN other_source text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'owner_of_property') THEN
    ALTER TABLE leads ADD COLUMN owner_of_property text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'own_residence') THEN
    ALTER TABLE leads ADD COLUMN own_residence text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'partner') THEN
    ALTER TABLE leads ADD COLUMN partner text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'possible_permit_issues') THEN
    ALTER TABLE leads ADD COLUMN possible_permit_issues text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'profession') THEN
    ALTER TABLE leads ADD COLUMN profession text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'program_name') THEN
    ALTER TABLE leads ADD COLUMN program_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'pseg_rate_code') THEN
    ALTER TABLE leads ADD COLUMN pseg_rate_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'ps_rating') THEN
    ALTER TABLE leads ADD COLUMN ps_rating text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'reason') THEN
    ALTER TABLE leads ADD COLUMN reason text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'reason_for_deleting') THEN
    ALTER TABLE leads ADD COLUMN reason_for_deleting text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'reference') THEN
    ALTER TABLE leads ADD COLUMN reference text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'referral_subtype') THEN
    ALTER TABLE leads ADD COLUMN referral_subtype text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'referred_by') THEN
    ALTER TABLE leads ADD COLUMN referred_by text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'requested_sales_rep') THEN
    ALTER TABLE leads ADD COLUMN requested_sales_rep text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'roof_pitch') THEN
    ALTER TABLE leads ADD COLUMN roof_pitch text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'roof_style') THEN
    ALTER TABLE leads ADD COLUMN roof_style text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'sales_notes') THEN
    ALTER TABLE leads ADD COLUMN sales_notes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'salesperson') THEN
    ALTER TABLE leads ADD COLUMN salesperson text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'satellite_image') THEN
    ALTER TABLE leads ADD COLUMN satellite_image text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'secondary_email') THEN
    ALTER TABLE leads ADD COLUMN secondary_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'shading_issues') THEN
    ALTER TABLE leads ADD COLUMN shading_issues text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'size_of_system_quoted') THEN
    ALTER TABLE leads ADD COLUMN size_of_system_quoted text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'source') THEN
    ALTER TABLE leads ADD COLUMN source text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'submitter_ip') THEN
    ALTER TABLE leads ADD COLUMN submitter_ip text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'taxable_income') THEN
    ALTER TABLE leads ADD COLUMN taxable_income text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'title_of_contact_person') THEN
    ALTER TABLE leads ADD COLUMN title_of_contact_person text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'title_of_property_owner') THEN
    ALTER TABLE leads ADD COLUMN title_of_property_owner text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'tod_plan') THEN
    ALTER TABLE leads ADD COLUMN tod_plan text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'town_for_permit') THEN
    ALTER TABLE leads ADD COLUMN town_for_permit text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'transformer_location') THEN
    ALTER TABLE leads ADD COLUMN transformer_location text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'trustedform_cert_url') THEN
    ALTER TABLE leads ADD COLUMN trustedform_cert_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'type_of_installation') THEN
    ALTER TABLE leads ADD COLUMN type_of_installation text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'type_of_purchase') THEN
    ALTER TABLE leads ADD COLUMN type_of_purchase text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'type_of_sale') THEN
    ALTER TABLE leads ADD COLUMN type_of_sale text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'type_of_structure') THEN
    ALTER TABLE leads ADD COLUMN type_of_structure text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'unbounce_page_id') THEN
    ALTER TABLE leads ADD COLUMN unbounce_page_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'unbounce_page_variant') THEN
    ALTER TABLE leads ADD COLUMN unbounce_page_variant text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utility') THEN
    ALTER TABLE leads ADD COLUMN utility text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utility_account_1') THEN
    ALTER TABLE leads ADD COLUMN utility_account_1 text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utility_account_2') THEN
    ALTER TABLE leads ADD COLUMN utility_account_2 text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utility_account_3') THEN
    ALTER TABLE leads ADD COLUMN utility_account_3 text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utility_account_4') THEN
    ALTER TABLE leads ADD COLUMN utility_account_4 text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utm_campaign') THEN
    ALTER TABLE leads ADD COLUMN utm_campaign text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utm_content') THEN
    ALTER TABLE leads ADD COLUMN utm_content text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utm_medium') THEN
    ALTER TABLE leads ADD COLUMN utm_medium text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utm_source') THEN
    ALTER TABLE leads ADD COLUMN utm_source text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utm_term') THEN
    ALTER TABLE leads ADD COLUMN utm_term text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'vts_phone') THEN
    ALTER TABLE leads ADD COLUMN vts_phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'years_in_residence') THEN
    ALTER TABLE leads ADD COLUMN years_in_residence text;
  END IF;
END $$;

-- Add numeric fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'annual_kwh_usage') THEN
    ALTER TABLE leads ADD COLUMN annual_kwh_usage numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'avg_monthly_elec_bill') THEN
    ALTER TABLE leads ADD COLUMN avg_monthly_elec_bill numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_cost') THEN
    ALTER TABLE leads ADD COLUMN lead_cost numeric(16, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'ps_estimated_production') THEN
    ALTER TABLE leads ADD COLUMN ps_estimated_production numeric(16, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'ps_lifetime_savings') THEN
    ALTER TABLE leads ADD COLUMN ps_lifetime_savings numeric(16, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'ps_module_amount') THEN
    ALTER TABLE leads ADD COLUMN ps_module_amount integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'ps_roof_sq_footage') THEN
    ALTER TABLE leads ADD COLUMN ps_roof_sq_footage numeric(16, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'ps_score') THEN
    ALTER TABLE leads ADD COLUMN ps_score integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'ps_sunlight_hours') THEN
    ALTER TABLE leads ADD COLUMN ps_sunlight_hours integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'sq_ft') THEN
    ALTER TABLE leads ADD COLUMN sq_ft integer;
  END IF;
END $$;

-- Add boolean/checkbox fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'community_solar') THEN
    ALTER TABLE leads ADD COLUMN community_solar boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'data_import') THEN
    ALTER TABLE leads ADD COLUMN data_import boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'do_not_call') THEN
    ALTER TABLE leads ADD COLUMN do_not_call boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'email_opt_out') THEN
    ALTER TABLE leads ADD COLUMN email_opt_out boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'historical_district') THEN
    ALTER TABLE leads ADD COLUMN historical_district boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_from_customer_portal') THEN
    ALTER TABLE leads ADD COLUMN lead_from_customer_portal boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'new_construction') THEN
    ALTER TABLE leads ADD COLUMN new_construction boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'partner_opp_created') THEN
    ALTER TABLE leads ADD COLUMN partner_opp_created boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'recharge_ny_discount') THEN
    ALTER TABLE leads ADD COLUMN recharge_ny_discount boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utility_obtained') THEN
    ALTER TABLE leads ADD COLUMN utility_obtained boolean DEFAULT false;
  END IF;
END $$;

-- Add date fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'appointment_confirmation_required') THEN
    ALTER TABLE leads ADD COLUMN appointment_confirmation_required date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'first_sit_date') THEN
    ALTER TABLE leads ADD COLUMN first_sit_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'future_contact_follow_up_date') THEN
    ALTER TABLE leads ADD COLUMN future_contact_follow_up_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_assigned_date') THEN
    ALTER TABLE leads ADD COLUMN lead_assigned_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_resurrection_date') THEN
    ALTER TABLE leads ADD COLUMN lead_resurrection_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_source_date') THEN
    ALTER TABLE leads ADD COLUMN lead_source_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'pto_date') THEN
    ALTER TABLE leads ADD COLUMN pto_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'unbounce_submission_date') THEN
    ALTER TABLE leads ADD COLUMN unbounce_submission_date date;
  END IF;
END $$;
