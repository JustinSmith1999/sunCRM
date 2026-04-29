/*
  Procurement module — replaces the Excel-based PO Template + Pull Sheet workflow
  that previously pulled from Salesforce. All data lives in Supabase, and Power
  BI / Excel can consume the same tables read-only.

  Tables added:
    - vendors
    - parts                 (master catalog; sku = warehouse_inventory.product_code)
    - bom_items             (per-opportunity bill of materials, derived from SF fields)
    - procurement_runs      (a weekly/ad-hoc batch of jobs to procure for)
    - procurement_run_jobs  (which opportunities are in a run)
    - purchase_orders       (one per vendor per run)
    - po_lines              (line items on a PO)
    - po_status_history     (audit trail of PO state transitions)

  Views added:
    - v_net_procurement_demand  (gross BOM - on-hand inventory, grouped by vendor)

  All tables have RLS on; SELECT is allowed for any authenticated user, and INSERT/UPDATE
  is gated behind the existing `user_profiles` membership pattern used elsewhere in the
  schema (see warehouse_inventory).
*/

-- =====================================================================
-- VENDORS
-- =====================================================================
create table if not exists vendors (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  short_code      text unique,                    -- e.g. 'IRONRIDGE', 'ENPHASE'
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  payment_terms   text,                            -- 'Net 30', etc.
  tax_id          text,
  address_line1   text,
  address_line2   text,
  city            text,
  state           text,
  postal_code     text,
  notes           text,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists vendors_active_idx on vendors(active) where active = true;
alter table vendors enable row level security;

-- =====================================================================
-- PARTS (master catalog)
-- =====================================================================
create table if not exists parts (
  id              uuid primary key default gen_random_uuid(),
  sku             text not null unique,            -- joins to warehouse_inventory.product_code
  description     text not null,
  category        text not null,                    -- 'module' | 'inverter' | 'micro' | 'rack' | 'bos' | 'battery' | 'special' | 'other'
  vendor_id       uuid references vendors(id) on delete set null,
  unit_cost       numeric(12,2),
  uom             text not null default 'each',
  is_special_order boolean not null default false,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists parts_vendor_idx   on parts(vendor_id);
create index if not exists parts_category_idx on parts(category);
create index if not exists parts_active_idx   on parts(active) where active = true;
alter table parts enable row level security;

-- =====================================================================
-- BOM ITEMS (per opportunity)
-- One row per (opportunity, part). Replaces the 91 hard-coded SF columns.
-- =====================================================================
create table if not exists bom_items (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null,                   -- soft FK: opportunities are SF-mirrored, may not have FK
  part_id         uuid not null references parts(id) on delete restrict,
  qty             numeric(12,2) not null check (qty >= 0),
  source          text not null default 'sf-import', -- 'sf-import' | 'manual' | 'override'
  source_ref      text,                             -- which SF column this came from, for audit
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (opportunity_id, part_id)
);
create index if not exists bom_items_opp_idx  on bom_items(opportunity_id);
create index if not exists bom_items_part_idx on bom_items(part_id);
alter table bom_items enable row level security;

-- =====================================================================
-- PROCUREMENT RUNS
-- A run = "what should we buy this week?" Ties together a set of jobs, then
-- materializes into one PO per vendor.
-- =====================================================================
create table if not exists procurement_runs (
  id              uuid primary key default gen_random_uuid(),
  run_date        date not null default (now()::date),
  title           text not null default 'Procurement Run',
  notes           text,
  status          text not null default 'draft'    -- 'draft' | 'finalized' | 'sent' | 'closed'
                  check (status in ('draft','finalized','sent','closed')),
  created_by      uuid,                             -- references auth.users(id)
  finalized_at    timestamptz,
  closed_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists procurement_runs_status_idx on procurement_runs(status);
create index if not exists procurement_runs_date_idx   on procurement_runs(run_date desc);
alter table procurement_runs enable row level security;

create table if not exists procurement_run_jobs (
  run_id          uuid not null references procurement_runs(id) on delete cascade,
  opportunity_id  uuid not null,
  notes           text,
  added_at        timestamptz not null default now(),
  primary key (run_id, opportunity_id)
);
alter table procurement_run_jobs enable row level security;

-- =====================================================================
-- PURCHASE ORDERS
-- One per vendor per run. Lines reference parts and quantities.
-- =====================================================================
create table if not exists purchase_orders (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid references procurement_runs(id) on delete set null,
  vendor_id       uuid not null references vendors(id) on delete restrict,
  po_number       text unique,
  status          text not null default 'draft'
                  check (status in ('draft','sent','acknowledged','partial','received','closed','cancelled')),
  total           numeric(14,2) not null default 0,
  expected_delivery date,
  ship_to_name    text,
  ship_to_address text,
  notes           text,
  sent_at         timestamptz,
  acknowledged_at timestamptz,
  received_at     timestamptz,
  closed_at       timestamptz,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists purchase_orders_run_idx    on purchase_orders(run_id);
create index if not exists purchase_orders_vendor_idx on purchase_orders(vendor_id);
create index if not exists purchase_orders_status_idx on purchase_orders(status);
alter table purchase_orders enable row level security;

create table if not exists po_lines (
  id              uuid primary key default gen_random_uuid(),
  po_id           uuid not null references purchase_orders(id) on delete cascade,
  part_id         uuid not null references parts(id) on delete restrict,
  qty_ordered     numeric(12,2) not null check (qty_ordered >= 0),
  qty_received    numeric(12,2) not null default 0 check (qty_received >= 0),
  unit_cost       numeric(12,2) not null default 0,
  line_total      numeric(14,2) generated always as (qty_ordered * unit_cost) stored,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists po_lines_po_idx   on po_lines(po_id);
create index if not exists po_lines_part_idx on po_lines(part_id);
alter table po_lines enable row level security;

-- Audit trail
create table if not exists po_status_history (
  id              uuid primary key default gen_random_uuid(),
  po_id           uuid not null references purchase_orders(id) on delete cascade,
  from_status     text,
  to_status       text not null,
  changed_by      uuid,
  changed_at      timestamptz not null default now(),
  note            text
);
create index if not exists po_status_history_po_idx on po_status_history(po_id, changed_at desc);
alter table po_status_history enable row level security;

-- =====================================================================
-- VIEW: net procurement demand
-- For a given run, what's the gross BOM, what's on hand, and what's net?
-- =====================================================================
create or replace view v_net_procurement_demand as
select
  pr.id                               as run_id,
  pr.run_date,
  p.id                                as part_id,
  p.sku,
  p.description,
  p.category,
  p.vendor_id,
  v.name                              as vendor_name,
  p.unit_cost,
  sum(b.qty)                          as gross_demand,
  coalesce(wi.quantity_on_hand, 0)    as on_hand,
  greatest(sum(b.qty) - coalesce(wi.quantity_on_hand, 0), 0)               as net_demand,
  greatest(sum(b.qty) - coalesce(wi.quantity_on_hand, 0), 0) * coalesce(p.unit_cost, 0) as estimated_cost
from procurement_runs pr
join procurement_run_jobs prj on prj.run_id = pr.id
join bom_items b              on b.opportunity_id = prj.opportunity_id
join parts p                  on p.id = b.part_id
left join vendors v           on v.id = p.vendor_id
left join warehouse_inventory wi on wi.product_code = p.sku
group by pr.id, pr.run_date, p.id, p.sku, p.description, p.category, p.vendor_id, v.name, p.unit_cost, wi.quantity_on_hand;

comment on view v_net_procurement_demand is
  'Gross BOM rolled up across all jobs in a procurement run, net of on-hand inventory, grouped by vendor. Power BI / sunCRM both consume this.';

-- =====================================================================
-- RLS POLICIES — mirror the warehouse_inventory pattern.
-- Authenticated users with a row in user_profiles can SELECT all procurement
-- data; INSERT/UPDATE/DELETE require the same membership. Tighten later by role.
-- =====================================================================
do $$
declare
  tbl text;
  tables text[] := array['vendors','parts','bom_items','procurement_runs','procurement_run_jobs','purchase_orders','po_lines','po_status_history'];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists "auth read %s" on %I', tbl, tbl);
    execute format('drop policy if exists "auth write %s" on %I', tbl, tbl);
    execute format('create policy "auth read %s" on %I for select to authenticated using (exists (select 1 from user_profiles up where up.id = auth.uid()))', tbl, tbl);
    execute format('create policy "auth write %s" on %I for all    to authenticated using (exists (select 1 from user_profiles up where up.id = auth.uid())) with check (exists (select 1 from user_profiles up where up.id = auth.uid()))', tbl, tbl);
  end loop;
end $$;

-- =====================================================================
-- TRIGGERS — keep updated_at fresh; log PO status changes.
-- =====================================================================
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

do $$
declare
  tbl text;
  tables text[] := array['vendors','parts','bom_items','procurement_runs','purchase_orders','po_lines'];
begin
  foreach tbl in array tables loop
    execute format('drop trigger if exists trg_%s_updated_at on %I', tbl, tbl);
    execute format('create trigger trg_%s_updated_at before update on %I for each row execute function set_updated_at()', tbl, tbl);
  end loop;
end $$;

create or replace function log_po_status_change() returns trigger as $$
begin
  if (tg_op = 'INSERT') or (old.status is distinct from new.status) then
    insert into po_status_history (po_id, from_status, to_status, changed_at)
    values (new.id, case when tg_op = 'INSERT' then null else old.status end, new.status, now());
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_po_status_history on purchase_orders;
create trigger trg_po_status_history
  after insert or update of status on purchase_orders
  for each row execute function log_po_status_change();

-- Auto-generate PO number when a PO is finalized (status leaves 'draft').
create or replace function gen_po_number() returns trigger as $$
declare
  next_seq int;
begin
  if new.po_number is null and new.status <> 'draft' then
    select coalesce(max(substring(po_number from 'PO-([0-9]+)$')::int), 0) + 1
      into next_seq from purchase_orders;
    new.po_number := 'PO-' || lpad(next_seq::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_po_number on purchase_orders;
create trigger trg_po_number
  before update of status on purchase_orders
  for each row execute function gen_po_number();
