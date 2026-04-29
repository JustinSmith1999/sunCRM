/*
  # Add All Salesforce Lead Columns to Leads Table

  1. Overview
    This migration adds all 242 Salesforce Lead fields to the existing leads table to ensure complete compatibility with Salesforce data structure.

  2. Column Categories
    - Standard Salesforce Fields (Id, IsDeleted, MasterRecordId, etc.)
    - Contact Information (Name fields, Phone, Email, Address)
    - Geographic Data (Latitude, Longitude, GeocodeAccuracy)
    - Lead Management (Status, Source, Rating, Owner)
    - Conversion Tracking (IsConverted, ConvertedDate, ConvertedAccountId, etc.)
    - Marketing & Campaign Data (pi__ prefixed Pardot fields, utm_ fields)
    - Custom Business Fields (PSEG accounts, Solar-specific fields)
    - Communication Preferences (HasOptedOutOfEmail, DoNotCall, SMS preferences)
    - Audit Fields (CreatedDate, LastModifiedDate, SystemModstamp)
    - Integration Fields (dupcheck__, tdc_tsw__, et4ae5__ prefixed fields)

  3. Implementation Notes
    - All columns are nullable to accommodate partial data imports
    - Text fields used for flexibility (can be constrained later if needed)
    - Boolean fields for yes/no values
    - Numeric fields for revenue, employees, scores
    - Timestamp fields for all date/time values
    - Preserved existing data and structure
    - Column names use snake_case following PostgreSQL conventions where Salesforce uses PascalCase

  4. Security
    - No changes to existing RLS policies
    - All existing policies continue to apply to new columns
*/

-- Add Standard Salesforce Fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS salesforce_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS master_record_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS salutation text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fax text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS description text;

-- Geographic Data
ALTER TABLE leads ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS geocode_accuracy text;

-- Lead Management Fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rating text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS annual_revenue numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS number_of_employees integer;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_id text;

-- Communication Preferences
ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_opted_out_of_email boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS do_not_call boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_opted_out_of_fax boolean DEFAULT false;

-- Conversion Tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_converted boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_date timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_account_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_contact_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_opportunity_id text;

-- Audit Fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_modified_date timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_modified_by_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS system_modstamp timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_date date;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_transfer_date timestamptz;

-- External Integration Fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS partner_account_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS jigsaw text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS jigsaw_contact_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS connection_received_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS connection_sent_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_bounced_reason text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_bounced_date timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS individual_id text;

-- Identity Fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pronouns text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gender_identity text;

-- Activity Metrics
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_call_date_time timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_email_date_time timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS activity_metric_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_priority_record boolean DEFAULT false;

-- Custom Business Fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS partner_opp_created boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sales_notes text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_opportunity text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS own_residence boolean;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS salesperson text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referred_by text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS type_of_sale text;

-- Phone Verification (tdc_tsw__ prefix)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_verification_status text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS verified_phone text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_opt_out boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_verify_result_msg text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS verification_result text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS verification_type text;

-- PSEG Utility Fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pseg_account_1 text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name_on_pseg_account text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pseg_account_2 text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pseg_account_3 text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pseg_account_4 text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meter_1 text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meter_2 text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meter_3 text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meter_4 text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pseg_rate_code text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pseg_obtained boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utility text;

-- Property Information
ALTER TABLE leads ADD COLUMN IF NOT EXISTS type_of_structure text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS age_of_structure text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS floors text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sq_ft text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS roof_style_composition text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS layers text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS age_of_roof text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS roof_pitch text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS orientation_of_solar_friendly_roofs text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS shading_issues text;

-- Customer Financial Info
ALTER TABLE leads ADD COLUMN IF NOT EXISTS credit_score text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS taxable_income text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS financing text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bankruptcy boolean DEFAULT false;

-- Additional Contact Info
ALTER TABLE leads ADD COLUMN IF NOT EXISTS secondary_email text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vts_phone text;

-- Energy Usage
ALTER TABLE leads ADD COLUMN IF NOT EXISTS avg_monthly_elec_bill_new numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS annual_kwh_usage_new numeric;

-- Lead Management Extended
ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_expectations text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_notes text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS additional_information text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS possible_permit_issues text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS canvasser text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS anticipated_closing date;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_resurrection boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_resurrection_date date;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_assigned_date date;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS years_in_residence text;

-- Commercial Property Fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_website text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_of_property text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS title_of_property_owner text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS title_of_contact_person text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS facilities_manager text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS electric_voltage text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS transformer_location text;

-- Competitive Information
ALTER TABLE leads ADD COLUMN IF NOT EXISTS re_charge_ny_discount_program text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS other_estimates_who text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS size_of_system_quoted text;

-- Business Classification
ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry_custom text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS niacs_sic_code text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS of_employees text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS annual_sales text;

-- Internal Management
ALTER TABLE leads ADD COLUMN IF NOT EXISTS call_center_rep text;

-- Duplicate Check Fields (dupcheck__ prefix)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS dc3_disable_duplicate_check boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS dc3_index text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS dc3_web2lead boolean DEFAULT false;

-- Lead Portal & Assignment
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_from_customer_portal boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS requested_sales_rep text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_lookup text;

-- Permit Information
ALTER TABLE leads ADD COLUMN IF NOT EXISTS town_for_permit text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS historical_district boolean DEFAULT false;

-- Pardot Integration Fields (pi__ prefix)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_needs_score_synced boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_pardot_last_scored_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_campaign text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_comments text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_conversion_date timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_conversion_object_name text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_conversion_object_type text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_created_date timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_first_activity timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_first_search_term text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_first_search_type text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_first_touch_url text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_grade text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_last_activity timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_notes text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_pardot_hard_bounced boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_score numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_url text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_utm_campaign text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_utm_content text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_utm_medium text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_utm_source text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pi_utm_term text;

-- First Sit & Appointment
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_sit_date date;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_date_time timestamptz;

-- Email Marketing (et4ae5__ prefix)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_opted_out_of_mobile boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mobile_country_code text;

-- Lead Status Extended
ALTER TABLE leads ADD COLUMN IF NOT EXISTS closed_lost_description text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_sub_status text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS future_contact_follow_up_date date;

-- Additional Lead Types
ALTER TABLE leads ADD COLUMN IF NOT EXISTS community_solar boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS language_preference text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS appointment_confirmation_required boolean DEFAULT false;

-- Project Milestones
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pto_date date;

-- Data Management
ALTER TABLE leads ADD COLUMN IF NOT EXISTS data_import text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS partner text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_channel text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_cost numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS call_type text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS event_advocate text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS satellite_image text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS reason_for_deleting text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS do_not_import_to_marketing_cloud boolean DEFAULT false;

-- Lead Type & Source Management
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source_info_confirmed boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_automation_bypassed boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source_date date;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS type_of_purchase text;

-- UTM Tracking Fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content text;

-- External Lead Tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS external_lead_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS trustedform_cert_url text;

-- PowerScout/Solar Scoring (PS_ prefix)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ps_sunlight_hours numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ps_estimated_production numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ps_lifetime_savings numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ps_module_amount integer;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ps_roof_sq_footage numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ps_score numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ps_rating text;

-- Additional Lead Attributes
ALTER TABLE leads ADD COLUMN IF NOT EXISTS program_name text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_rating text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_subtype text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS offset_discussion text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS new_construction boolean DEFAULT false;

-- Unbounce Landing Page Tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unbounce_page_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS submitter_ip text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unbounce_submission_time text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unbounce_page_variant text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unbounce_submission_date date;

-- Agent Interaction Tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by_agent boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interacted_with_agent boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_agent_interaction_date date;

-- Utility Rate Plans
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tod_plan text;

-- Create indexes for frequently queried Salesforce fields
CREATE INDEX IF NOT EXISTS idx_leads_salesforce_id ON leads(salesforce_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_is_converted ON leads(is_converted);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_rating ON leads(rating);
CREATE INDEX IF NOT EXISTS idx_leads_last_modified_date ON leads(last_modified_date DESC);
CREATE INDEX IF NOT EXISTS idx_leads_converted_date ON leads(converted_date);
CREATE INDEX IF NOT EXISTS idx_leads_external_lead_id ON leads(external_lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads(utm_source);
CREATE INDEX IF NOT EXISTS idx_leads_utm_campaign ON leads(utm_campaign);
