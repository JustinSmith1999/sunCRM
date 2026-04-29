/*
  # Add System Reports Fields and Data

  1. Changes
    - Add is_system, source_object, and folder columns
    - Make organization_id and created_by nullable for system reports
    
  2. Insert System Reports
    - Pre-populate 16 standard Salesforce-style reports
*/

-- Add missing columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'is_system'
  ) THEN
    ALTER TABLE reports ADD COLUMN is_system boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'source_object'
  ) THEN
    ALTER TABLE reports ADD COLUMN source_object text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'folder'
  ) THEN
    ALTER TABLE reports ADD COLUMN folder text;
  END IF;
END $$;

-- Make fields nullable for system reports
ALTER TABLE reports ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE reports ALTER COLUMN created_by DROP NOT NULL;

-- Sync source_object with entity_type
UPDATE reports SET source_object = entity_type WHERE source_object IS NULL;

-- Delete any existing system reports (for clean re-insert)
DELETE FROM reports WHERE is_system = true;

-- Insert system reports
INSERT INTO reports (name, description, report_type, entity_type, source_object, columns, filters, grouping, is_system, is_public, folder)
VALUES
  ('All Leads', 'Complete list of all leads in the system', 'tabular', 'leads', 'leads',
   '["FirstName", "LastName", "Company", "Email", "Phone", "Status", "LeadSource", "created_at"]'::jsonb,
   '[]'::jsonb, '{}'::jsonb, true, true, 'Lead Reports'),
  
  ('Leads by Source', 'Lead count and conversion by source', 'summary', 'leads', 'leads',
   '["LeadSource", "count"]'::jsonb, '[]'::jsonb,
   '{"groupBy": ["LeadSource"], "aggregations": [{"field": "id", "function": "count"}]}'::jsonb,
   true, true, 'Lead Reports'),
  
  ('Leads by Status', 'Lead distribution by status', 'summary', 'leads', 'leads',
   '["Status", "count"]'::jsonb, '[]'::jsonb,
   '{"groupBy": ["Status"], "aggregations": [{"field": "id", "function": "count"}]}'::jsonb,
   true, true, 'Lead Reports'),
  
  ('New Leads This Month', 'Leads created in the current month', 'tabular', 'leads', 'leads',
   '["FirstName", "LastName", "Company", "Email", "Status", "LeadSource", "created_at"]'::jsonb,
   '[{"field": "created_at", "operator": ">=", "value": "THIS_MONTH"}]'::jsonb, '{}'::jsonb,
   true, true, 'Lead Reports'),
  
  ('All Opportunities', 'Complete list of all opportunities', 'tabular', 'opportunities', 'opportunities',
   '["Name", "AccountName", "StageName", "Amount", "CloseDate", "Probability", "LeadSource", "CreatedDate"]'::jsonb,
   '[]'::jsonb, '{}'::jsonb, true, true, 'Opportunity Reports'),
  
  ('Open Pipeline', 'All open opportunities grouped by stage', 'summary', 'opportunities', 'opportunities',
   '["StageName", "count", "total_amount"]'::jsonb,
   '[{"field": "IsClosed", "operator": "=", "value": false}]'::jsonb,
   '{"groupBy": ["StageName"], "aggregations": [{"field": "id", "function": "count"}, {"field": "Amount", "function": "sum"}]}'::jsonb,
   true, true, 'Opportunity Reports'),
  
  ('Closed Won Opportunities', 'Opportunities that have been won', 'tabular', 'opportunities', 'opportunities',
   '["Name", "AccountName", "Amount", "CloseDate", "Contract_Date__c", "Job_Number__c"]'::jsonb,
   '[{"field": "StageName", "operator": "=", "value": "Closed Won"}]'::jsonb, '{}'::jsonb,
   true, true, 'Opportunity Reports'),
  
  ('Pipeline by Lead Source', 'Pipeline value grouped by lead source', 'summary', 'opportunities', 'opportunities',
   '["LeadSource", "count", "total_amount"]'::jsonb,
   '[{"field": "IsClosed", "operator": "=", "value": false}]'::jsonb,
   '{"groupBy": ["LeadSource"], "aggregations": [{"field": "id", "function": "count"}, {"field": "Amount", "function": "sum"}]}'::jsonb,
   true, true, 'Opportunity Reports'),
  
  ('Opportunities Closing This Month', 'Opportunities with close date in current month', 'tabular', 'opportunities', 'opportunities',
   '["Name", "AccountName", "StageName", "Amount", "CloseDate", "Probability"]'::jsonb,
   '[{"field": "CloseDate", "operator": "BETWEEN", "value": "THIS_MONTH"}]'::jsonb, '{}'::jsonb,
   true, true, 'Opportunity Reports'),
  
  ('All Accounts', 'Complete list of all accounts', 'tabular', 'accounts', 'accounts',
   '["Name", "Type", "Industry", "BillingCity", "BillingState", "Phone", "CreatedDate"]'::jsonb,
   '[]'::jsonb, '{}'::jsonb, true, true, 'Account Reports'),
  
  ('Accounts by Type', 'Account count grouped by type', 'summary', 'accounts', 'accounts',
   '["Type", "count"]'::jsonb, '[]'::jsonb,
   '{"groupBy": ["Type"], "aggregations": [{"field": "Id", "function": "count"}]}'::jsonb,
   true, true, 'Account Reports'),
  
  ('All Contacts', 'Complete list of all contacts', 'tabular', 'salesforce_contacts', 'salesforce_contacts',
   '["FirstName", "LastName", "AccountName", "Title", "Email", "Phone", "CreatedDate"]'::jsonb,
   '[]'::jsonb, '{}'::jsonb, true, true, 'Contact Reports'),
  
  ('All Cases', 'Complete list of all cases', 'tabular', 'salesforce_cases', 'salesforce_cases',
   '["CaseNumber", "Subject", "Status", "Priority", "AccountName", "ContactName", "CreatedDate"]'::jsonb,
   '[]'::jsonb, '{}'::jsonb, true, true, 'Case Reports'),
  
  ('Open Cases', 'All cases that are not closed', 'tabular', 'salesforce_cases', 'salesforce_cases',
   '["CaseNumber", "Subject", "Status", "Priority", "AccountName", "CreatedDate"]'::jsonb,
   '[{"field": "Status", "operator": "!=", "value": "Closed"}]'::jsonb, '{}'::jsonb,
   true, true, 'Case Reports'),
  
  ('Cases by Status', 'Case count grouped by status', 'summary', 'salesforce_cases', 'salesforce_cases',
   '["Status", "count"]'::jsonb, '[]'::jsonb,
   '{"groupBy": ["Status"], "aggregations": [{"field": "Id", "function": "count"}]}'::jsonb,
   true, true, 'Case Reports'),
  
  ('Revenue by Month', 'Closed won opportunities by close date month', 'summary', 'opportunities', 'opportunities',
   '["close_month", "count", "total_revenue"]'::jsonb,
   '[{"field": "StageName", "operator": "=", "value": "Closed Won"}]'::jsonb,
   '{"groupBy": ["close_month"], "aggregations": [{"field": "id", "function": "count"}, {"field": "Amount", "function": "sum"}]}'::jsonb,
   true, true, 'Sales Performance'),
  
  ('Win/Loss Analysis', 'Opportunities grouped by closed won vs closed lost', 'summary', 'opportunities', 'opportunities',
   '["StageName", "count", "total_amount"]'::jsonb,
   '[{"field": "IsClosed", "operator": "=", "value": true}]'::jsonb,
   '{"groupBy": ["StageName"], "aggregations": [{"field": "id", "function": "count"}, {"field": "Amount", "function": "sum"}]}'::jsonb,
   true, true, 'Sales Performance');