/*
  ====================================================================
  COMPLETE SALESFORCE TO CRM DATA MIGRATION
  ====================================================================

  Run this SQL script in your Supabase SQL Editor to migrate all
  Salesforce data to your CRM replacement tables.

  This will:
  1. Add salesforce_id columns to CRM tables
  2. Migrate Cases from salesforce_cases → cases
  3. Migrate Events from salesforce_events → activities
  4. Migrate Tasks from salesforce_tasks → activities
  5. Migrate Campaigns from salesforce_campaigns → campaigns
  6. Migrate Products from salesforce_products → products

  Total records to migrate: ~100,000+
  ====================================================================
*/

-- ============================================================
-- STEP 1: Add salesforce_id columns to CRM tables
-- ============================================================

ALTER TABLE activities ADD COLUMN IF NOT EXISTS salesforce_id text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_activities_salesforce_id ON activities(salesforce_id);

ALTER TABLE cases ADD COLUMN IF NOT EXISTS salesforce_id text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_cases_salesforce_id ON cases(salesforce_id);

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS salesforce_id text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_campaigns_salesforce_id ON campaigns(salesforce_id);

ALTER TABLE products ADD COLUMN IF NOT EXISTS salesforce_id text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_products_salesforce_id ON products(salesforce_id);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS salesforce_id text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_documents_salesforce_id ON documents(salesforce_id);

-- ============================================================
-- STEP 2: Migrate Cases (5,498 records)
-- ============================================================

INSERT INTO cases (
  salesforce_id,
  account_id,
  contact_id,
  subject,
  description,
  status,
  priority,
  origin,
  type,
  reason,
  closed_date,
  owner_id,
  created_at,
  updated_at
)
SELECT
  id as salesforce_id,
  account_id,
  contact_id,
  subject,
  description,
  COALESCE(status, 'New') as status,
  COALESCE(priority, 'Medium') as priority,
  origin,
  type,
  reason,
  closed_date,
  owner_id,
  COALESCE(created_date, NOW()) as created_at,
  COALESCE(last_modified_date, NOW()) as updated_at
FROM salesforce_cases
ON CONFLICT (salesforce_id) DO UPDATE SET
  account_id = EXCLUDED.account_id,
  contact_id = EXCLUDED.contact_id,
  subject = EXCLUDED.subject,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  origin = EXCLUDED.origin,
  type = EXCLUDED.type,
  reason = EXCLUDED.reason,
  closed_date = EXCLUDED.closed_date,
  owner_id = EXCLUDED.owner_id,
  updated_at = EXCLUDED.updated_at;

-- ============================================================
-- STEP 3: Migrate Events to Activities (8,744 records)
-- ============================================================

INSERT INTO activities (
  salesforce_id,
  subject,
  type,
  status,
  priority,
  due_date,
  description,
  related_to_id,
  related_to_type,
  assigned_to_id,
  account_id,
  contact_id,
  location,
  start_datetime,
  end_datetime,
  created_at,
  updated_at
)
SELECT
  id as salesforce_id,
  COALESCE(subject, 'Event') as subject,
  'Event' as type,
  COALESCE(event_subtype, 'Scheduled') as status,
  'Normal' as priority,
  activity_date as due_date,
  description,
  what_id as related_to_id,
  what_type as related_to_type,
  owner_id as assigned_to_id,
  account_id,
  who_id as contact_id,
  location,
  start_date_time as start_datetime,
  end_date_time as end_datetime,
  COALESCE(created_date, NOW()) as created_at,
  COALESCE(last_modified_date, NOW()) as updated_at
FROM salesforce_events
ON CONFLICT (salesforce_id) DO UPDATE SET
  subject = EXCLUDED.subject,
  status = EXCLUDED.status,
  due_date = EXCLUDED.due_date,
  description = EXCLUDED.description,
  related_to_id = EXCLUDED.related_to_id,
  related_to_type = EXCLUDED.related_to_type,
  assigned_to_id = EXCLUDED.assigned_to_id,
  account_id = EXCLUDED.account_id,
  contact_id = EXCLUDED.contact_id,
  location = EXCLUDED.location,
  start_datetime = EXCLUDED.start_datetime,
  end_datetime = EXCLUDED.end_datetime,
  updated_at = EXCLUDED.updated_at;

-- ============================================================
-- STEP 4: Migrate Tasks to Activities (85,731 records)
-- ============================================================

INSERT INTO activities (
  salesforce_id,
  subject,
  type,
  status,
  priority,
  due_date,
  description,
  related_to_id,
  related_to_type,
  assigned_to_id,
  account_id,
  contact_id,
  created_at,
  updated_at
)
SELECT
  id as salesforce_id,
  COALESCE(subject, 'Task') as subject,
  'Task' as type,
  COALESCE(status, 'Not Started') as status,
  COALESCE(priority, 'Normal') as priority,
  activity_date as due_date,
  description,
  what_id as related_to_id,
  what_type as related_to_type,
  owner_id as assigned_to_id,
  account_id,
  who_id as contact_id,
  COALESCE(created_date, NOW()) as created_at,
  COALESCE(last_modified_date, NOW()) as updated_at
FROM salesforce_tasks
ON CONFLICT (salesforce_id) DO UPDATE SET
  subject = EXCLUDED.subject,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  due_date = EXCLUDED.due_date,
  description = EXCLUDED.description,
  related_to_id = EXCLUDED.related_to_id,
  related_to_type = EXCLUDED.related_to_type,
  assigned_to_id = EXCLUDED.assigned_to_id,
  account_id = EXCLUDED.account_id,
  contact_id = EXCLUDED.contact_id,
  updated_at = EXCLUDED.updated_at;

-- ============================================================
-- STEP 5: Migrate Campaigns (2 records)
-- ============================================================

INSERT INTO campaigns (
  salesforce_id,
  name,
  type,
  status,
  start_date,
  end_date,
  budget,
  actual_cost,
  expected_revenue,
  expected_response,
  num_sent,
  description,
  parent_id,
  owner_id,
  created_at,
  updated_at
)
SELECT
  id as salesforce_id,
  name,
  type,
  COALESCE(status, 'Planned') as status,
  start_date,
  end_date,
  budgeted_cost as budget,
  actual_cost,
  expected_revenue,
  expected_response,
  number_sent as num_sent,
  description,
  parent_id,
  owner_id,
  COALESCE(created_date, NOW()) as created_at,
  COALESCE(last_modified_date, NOW()) as updated_at
FROM salesforce_campaigns
ON CONFLICT (salesforce_id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  budget = EXCLUDED.budget,
  actual_cost = EXCLUDED.actual_cost,
  expected_revenue = EXCLUDED.expected_revenue,
  expected_response = EXCLUDED.expected_response,
  num_sent = EXCLUDED.num_sent,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  owner_id = EXCLUDED.owner_id,
  updated_at = EXCLUDED.updated_at;

-- ============================================================
-- STEP 6: Migrate Products
-- ============================================================

INSERT INTO products (
  salesforce_id,
  name,
  code,
  description,
  category,
  price,
  cost,
  is_active,
  created_at,
  updated_at
)
SELECT
  id as salesforce_id,
  name,
  product_code as code,
  description,
  family as category,
  COALESCE(unit_price, 0) as price,
  0 as cost,
  COALESCE(is_active, true) as is_active,
  COALESCE(created_date, NOW()) as created_at,
  COALESCE(last_modified_date, NOW()) as updated_at
FROM salesforce_products
WHERE salesforce_products.id IS NOT NULL
ON CONFLICT (salesforce_id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- ============================================================
-- VERIFICATION: Check record counts
-- ============================================================

SELECT 'activities' as table_name, COUNT(*) as record_count FROM activities
UNION ALL
SELECT 'cases' as table_name, COUNT(*) as record_count FROM cases
UNION ALL
SELECT 'campaigns' as table_name, COUNT(*) as record_count FROM campaigns
UNION ALL
SELECT 'products' as table_name, COUNT(*) as record_count FROM products
ORDER BY table_name;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration Complete!';
  RAISE NOTICE 'Activities (Events + Tasks): Check count above';
  RAISE NOTICE 'Cases: Check count above';
  RAISE NOTICE 'Campaigns: Check count above';
  RAISE NOTICE 'Products: Check count above';
END $$;
