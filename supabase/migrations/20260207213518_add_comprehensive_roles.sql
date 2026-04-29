/*
  # Add Comprehensive Role System

  1. New Roles
    - Partner Portal User (for channel partners)
    - Finance Manager (for accounting/finance)
    - Engineering (for technical staff)
    - Marketing (for marketing team)
    - Executive (for C-level/VP)
    - Installation Tech (for field installers)
    - Warehouse (for inventory management)

  2. Enhanced Permissions
    - Each role has specific, granular permissions
    - Permissions map to actual system features
*/

-- Add comprehensive roles
INSERT INTO user_roles (name, display_name, permissions) VALUES
  (
    'partner',
    'Partner Portal User',
    '{
      "view_own_leads": true,
      "create_leads": true,
      "view_own_deals": true,
      "submit_projects": true,
      "view_partner_reports": true,
      "access_partner_portal": true
    }'::jsonb
  ),
  (
    'finance_manager',
    'Finance Manager',
    '{
      "view_all_financials": true,
      "manage_invoices": true,
      "manage_payments": true,
      "view_reports": true,
      "export_financial_data": true,
      "manage_budgets": true
    }'::jsonb
  ),
  (
    'engineering',
    'Engineering',
    '{
      "view_technical_docs": true,
      "manage_projects": true,
      "access_aurora_solar": true,
      "create_designs": true,
      "approve_installations": true,
      "view_reports": true
    }'::jsonb
  ),
  (
    'marketing',
    'Marketing',
    '{
      "view_campaigns": true,
      "manage_campaigns": true,
      "view_lead_sources": true,
      "manage_web_forms": true,
      "view_analytics": true,
      "manage_content": true
    }'::jsonb
  ),
  (
    'executive',
    'Executive',
    '{
      "view_all_data": true,
      "view_executive_dashboard": true,
      "view_all_reports": true,
      "view_financials": true,
      "view_analytics": true,
      "approve_large_deals": true
    }'::jsonb
  ),
  (
    'installation_tech',
    'Installation Technician',
    '{
      "view_assigned_projects": true,
      "update_project_status": true,
      "upload_photos": true,
      "complete_checklists": true,
      "view_equipment": true,
      "mobile_access": true
    }'::jsonb
  ),
  (
    'warehouse',
    'Warehouse Manager',
    '{
      "view_inventory": true,
      "manage_inventory": true,
      "manage_equipment": true,
      "view_orders": true,
      "process_shipments": true,
      "view_reports": true
    }'::jsonb
  ),
  (
    'customer_success',
    'Customer Success',
    '{
      "view_customers": true,
      "manage_customer_relationships": true,
      "view_cases": true,
      "manage_cases": true,
      "view_satisfaction_scores": true,
      "send_communications": true
    }'::jsonb
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  permissions = EXCLUDED.permissions,
  updated_at = now();

-- Update existing roles with more detailed permissions
UPDATE user_roles
SET permissions = '{
  "all": true,
  "manage_users": true,
  "manage_settings": true,
  "view_analytics": true,
  "manage_salesforce": true,
  "manage_integrations": true,
  "manage_roles": true,
  "manage_automation": true,
  "system_admin": true
}'::jsonb
WHERE name = 'admin';

UPDATE user_roles
SET permissions = '{
  "view_all_deals": true,
  "manage_team_deals": true,
  "view_analytics": true,
  "manage_leads": true,
  "reassign_leads": true,
  "view_team_performance": true,
  "approve_discounts": true,
  "manage_territory": true,
  "view_forecasts": true
}'::jsonb
WHERE name = 'sales_manager';

UPDATE user_roles
SET permissions = '{
  "view_own_deals": true,
  "manage_own_deals": true,
  "create_leads": true,
  "view_leads": true,
  "create_quotes": true,
  "manage_opportunities": true,
  "schedule_meetings": true,
  "log_calls": true,
  "view_own_performance": true
}'::jsonb
WHERE name = 'sales_rep';

UPDATE user_roles
SET permissions = '{
  "view_cases": true,
  "manage_cases": true,
  "view_kb": true,
  "manage_kb": true,
  "view_customers": true,
  "send_emails": true,
  "escalate_cases": true,
  "view_sla": true
}'::jsonb
WHERE name = 'support';

UPDATE user_roles
SET permissions = '{
  "view_hr_records": true,
  "manage_hr_records": true,
  "view_employees": true,
  "manage_employees": true,
  "view_compensation": true,
  "manage_time_off": true,
  "view_hr_analytics": true,
  "manage_onboarding": true
}'::jsonb
WHERE name = 'hr_manager';

UPDATE user_roles
SET permissions = '{
  "view_reports": true,
  "manage_equipment": true,
  "view_inventory": true,
  "manage_workflows": true,
  "view_schedules": true,
  "manage_schedules": true,
  "view_logistics": true,
  "coordinate_installations": true
}'::jsonb
WHERE name = 'operations';
