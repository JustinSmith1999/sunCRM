/*
  Scale-out indexes for 100+ concurrent users on the high-traffic
  Salesforce-mirrored tables. Driven by observed query patterns from
  sunCRM/web/src/components/* (see scale audit at docs/SCALE-AUDIT.md).

  All indexes are CREATE INDEX IF NOT EXISTS so this is idempotent and safe
  to apply against the live project.

  IMPORTANT: For tables that already have millions of rows, prefer running
  this with the Supabase CLI in "concurrent" mode so it doesn't lock writes:
      supabase db push --include-all
  or, in the SQL editor, transform each `create index` to
  `create index concurrently if not exists ...` and run them one at a time
  outside a transaction. The non-concurrent form below is fine for tables
  under ~1M rows but will block writes briefly on the hottest tables.
*/

-- ============================================================
-- OPPORTUNITIES — pipeline reads, dashboard KPIs, deal list
-- ============================================================
-- Home dashboard: pipeline = StageName ∉ {Closed Won, Closed Lost}
-- DealsKanban   : groups by StageName, orders by CloseDate / CreatedDate
-- "My deals"    : OwnerId + StageName
-- Account view  : AccountId
-- Search        : trigram on Name (ilike '%foo%')
create index if not exists idx_opps_stagename_close      on opportunities ("StageName", "CloseDate" desc);
create index if not exists idx_opps_stagename_created    on opportunities ("StageName", "CreatedDate" desc);
create index if not exists idx_opps_owner_stage          on opportunities ("OwnerId", "StageName");
create index if not exists idx_opps_account              on opportunities ("AccountId");
create index if not exists idx_opps_lastmod              on opportunities ("LastModifiedDate" desc);
create index if not exists idx_opps_created              on opportunities ("CreatedDate" desc);
-- Trigram index for ilike '%name%' search. Requires pg_trgm.
create extension if not exists pg_trgm;
create index if not exists idx_opps_name_trgm            on opportunities using gin ("Name" gin_trgm_ops);

-- ============================================================
-- LEADS — list, partner portal, "my leads"
-- ============================================================
-- Existing in older migration: idx_leads_status, idx_leads_source, idx_leads_email,
-- idx_leads_created, idx_leads_org.  We add the relational predicates the app uses.
create index if not exists idx_leads_assigned            on leads (assigned_to, lead_status);
create index if not exists idx_leads_partner             on leads (partner_id, created_at desc);
create index if not exists idx_leads_status_created      on leads (lead_status, created_at desc);
-- Trigram on email + last name for typeahead search
create index if not exists idx_leads_lastname_trgm       on leads using gin (last_name gin_trgm_ops);
create index if not exists idx_leads_email_trgm          on leads using gin (email gin_trgm_ops);

-- ============================================================
-- CASES — service queue, urgent case filter, dashboard count
-- ============================================================
create index if not exists idx_cases_status_created      on cases ("Status", "CreatedDate" desc);
create index if not exists idx_cases_priority_status     on cases ("Priority", "Status");
create index if not exists idx_cases_account             on cases ("AccountId");
create index if not exists idx_cases_owner_status        on cases ("OwnerId", "Status");
create index if not exists idx_cases_lastmod             on cases ("LastModifiedDate" desc);

-- ============================================================
-- ACCOUNTS — list, search, account detail
-- ============================================================
create index if not exists idx_accounts_created          on accounts ("CreatedDate" desc);
create index if not exists idx_accounts_lastmod          on accounts ("LastModifiedDate" desc);
create index if not exists idx_accounts_owner            on accounts ("OwnerId");
create index if not exists idx_accounts_type             on accounts ("Type");
create index if not exists idx_accounts_name_trgm        on accounts using gin ("Name" gin_trgm_ops);

-- ============================================================
-- TASKS — "my day", dashboards
-- ============================================================
-- Note: tasks.id is the key; sunCRM's TaskDashboard filters by status, due_date,
-- assigned-to. The Salesforce-mirrored field names use mixed case.
create index if not exists idx_tasks_owner_status_due    on tasks ("OwnerId", "Status", "ActivityDate");
create index if not exists idx_tasks_status_due          on tasks ("Status", "ActivityDate");
create index if not exists idx_tasks_what                on tasks ("WhatId");
create index if not exists idx_tasks_who                 on tasks ("WhoId");

-- ============================================================
-- USER_PROFILES — referenced by every RLS policy ("exists in user_profiles")
-- ============================================================
-- Already has PK on id; we add an index to speed the RLS membership check
-- when other policies join through it. PK lookup is O(log n) but we want
-- to ensure it's a btree, not a hash (Supabase default is btree on PK).
-- This is a no-op if it already exists, but documented for clarity.

-- ============================================================
-- ANALYZE — let the planner pick these up on next query
-- ============================================================
analyze opportunities;
analyze leads;
analyze cases;
analyze accounts;
analyze tasks;
