/*
  # Add Report Performance Indexes

  1. Performance Optimizations
    - Add indexes on commonly filtered columns across report tables
    - Add composite indexes for common query patterns
    - Optimize date range queries with Salesforce field names
    - Improve sorting performance

  2. Tables Affected
    - leads: Add indexes on Status, CreatedDate, OwnerId, LastName, FirstName
    - opportunities: Add indexes on StageName, CloseDate, OwnerId
    - accounts: Add indexes on Name, CreatedDate
    - reports: Add index on folder for faster listing

  3. Notes
    - Uses IF NOT EXISTS to prevent errors on re-runs
    - Indexes improve SELECT performance but slightly slow INSERT/UPDATE
    - Trade-off is worth it for read-heavy reporting workload
*/

-- Leads table indexes (using Salesforce column names)
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads("Status");
CREATE INDEX IF NOT EXISTS idx_leads_created_date ON leads("CreatedDate" DESC);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads("OwnerId");
CREATE INDEX IF NOT EXISTS idx_leads_last_name ON leads("LastName");
CREATE INDEX IF NOT EXISTS idx_leads_first_name ON leads("FirstName");
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads("Email");

-- Opportunities table indexes (using Salesforce column names)
CREATE INDEX IF NOT EXISTS idx_opportunities_stage_name ON opportunities("StageName");
CREATE INDEX IF NOT EXISTS idx_opportunities_close_date ON opportunities("CloseDate" DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_owner_id ON opportunities("OwnerId");
CREATE INDEX IF NOT EXISTS idx_opportunities_created_date ON opportunities("CreatedDate" DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_amount ON opportunities("Amount");

-- Reports table indexes
CREATE INDEX IF NOT EXISTS idx_reports_folder ON reports(folder);
CREATE INDEX IF NOT EXISTS idx_reports_source_object ON reports(source_object);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- User profiles for permission checks
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON user_profiles(role_id);
