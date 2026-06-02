-- ============================================================================
-- Scale-out indexes for 100+ concurrent users on the high-traffic tables.
-- Verified against the live schema in Supabase project husbupeealwuxyopfwwb
-- on 2026-04-29 via scripts/list-bom-columns.mjs and column probes.
--
-- All CREATE INDEX IF NOT EXISTS — safe to re-run any number of times.
-- For >1M-row tables, swap `create index` for `create index concurrently`
-- and run each statement individually outside a transaction.
-- ============================================================================


-- ============================================================================
-- pg_trgm — required for the trigram / ilike search indexes below.
-- ============================================================================

create extension if not exists pg_trgm;


-- ============================================================================
-- OPPORTUNITIES — pipeline, dashboards, Pull Sheet warehouse view.
-- Live row count ~54k. Mixed-case Salesforce-mirrored columns (quoted).
-- ============================================================================

create index if not exists idx_opps_stagename_close      on opportunities ("StageName", "CloseDate" desc);
create index if not exists idx_opps_stagename_created    on opportunities ("StageName", "CreatedDate" desc);
create index if not exists idx_opps_owner_stage          on opportunities ("OwnerId", "StageName");
create index if not exists idx_opps_account              on opportunities ("AccountId");
create index if not exists idx_opps_lastmod              on opportunities ("LastModifiedDate" desc);
create index if not exists idx_opps_created              on opportunities ("CreatedDate" desc);
create index if not exists idx_opps_name_trgm            on opportunities using gin ("Name" gin_trgm_ops);

-- Pull Sheets / warehouse picks. Without these, anon-role queries time out.
create index if not exists idx_opps_install_sched        on opportunities ("Install_Scheduled_Date__c");
create index if not exists idx_opps_install_sched_status on opportunities ("Install_Scheduled_Date__c", "Job_Status__c");
create index if not exists idx_opps_job_number           on opportunities ("Job_Number__c");


-- ============================================================================
-- LEADS — list, partner portal, "my leads".
-- Mixed schema: lowercase app-native columns (owner_id, status, partner_id,
-- email, last_name) live alongside Salesforce-mirrored ones (OwnerId, Status).
-- The app primarily queries the lowercase columns, so we index those.
-- ============================================================================

create index if not exists idx_leads_owner              on leads (owner_id, status);
create index if not exists idx_leads_partner            on leads (partner_id, created_at desc);
create index if not exists idx_leads_status_created     on leads (status, created_at desc);
create index if not exists idx_leads_lastname_trgm      on leads using gin (last_name gin_trgm_ops);
create index if not exists idx_leads_email_trgm         on leads using gin (email gin_trgm_ops);


-- ============================================================================
-- CASES — service queue, urgent case filter, dashboard count.
-- Mixed-case Salesforce-mirrored columns (quoted).
-- ============================================================================

create index if not exists idx_cases_status_created     on cases ("Status", "CreatedDate" desc);
create index if not exists idx_cases_priority_status    on cases ("Priority", "Status");
create index if not exists idx_cases_account            on cases ("AccountId");
create index if not exists idx_cases_owner_status       on cases ("OwnerId", "Status");
create index if not exists idx_cases_lastmod            on cases ("LastModifiedDate" desc);


-- ============================================================================
-- ACCOUNTS — list, search, account detail.
-- Salesforce-mirrored mixed-case columns (quoted).
-- ============================================================================

create index if not exists idx_accounts_created         on accounts ("CreatedDate" desc);
create index if not exists idx_accounts_lastmod         on accounts ("LastModifiedDate" desc);
create index if not exists idx_accounts_owner           on accounts ("OwnerId");
create index if not exists idx_accounts_type            on accounts ("Type");
create index if not exists idx_accounts_name_trgm       on accounts using gin ("Name" gin_trgm_ops);


-- ============================================================================
-- ACTIVITIES — replaces the original "tasks" indexes.
-- The sunCRM activities table holds tasks/events with lowercase app-native
-- columns (assigned_to, status, due_date, opportunity_id, account_id).
-- ============================================================================

create index if not exists idx_activities_assigned_due  on activities (assigned_to, status, due_date);
create index if not exists idx_activities_status_due    on activities (status, due_date);
create index if not exists idx_activities_opportunity   on activities (opportunity_id);
create index if not exists idx_activities_account       on activities (account_id);


-- ============================================================================
-- ANALYZE — let the planner pick up the new indexes on the very next query.
-- ============================================================================

analyze opportunities;
analyze leads;
analyze cases;
analyze accounts;
analyze activities;
