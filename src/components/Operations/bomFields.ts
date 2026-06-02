/**
 * Bill of materials field map for the warehouse Pull Sheet.
 *
 * Every column referenced here has been verified to exist on the live
 * `opportunities` table in Supabase project husbupeealwuxyopfwwb
 * (probed 2026-04-29 via scripts/list-bom-columns.mjs).
 *
 * Gap note for the Data Analytics conversation:
 *   The Excel pull sheet (PULL SHEET 5-21-26.xlsm) pulls a 100-column
 *   Salesforce report that includes detailed rack hardware (168"/172"
 *   rails, mid/end clamps, skirts, U-Anchor variants), Q-cables, Tesla
 *   Stack Kits, individual Powerwall 3 / Expansion Pack quantities,
 *   Breakers, Transfer Switches, Bollards, Speed Seal Foot, Powergrips,
 *   etc. Those fields exist in Salesforce but **are not yet mirrored into
 *   Supabase** — the SF→Supabase sync only carries the ~25 core BOM
 *   fields below. Expand the sync (or surface these fields from a new
 *   `opportunity_bom_items` table) and they'll light up here automatically.
 *
 * Categories with no populated fields for a given job are suppressed from
 * the printout, so empty sections don't waste warehouse paper.
 */

export type BomKind = 'qty' | 'text' | 'bool';

export interface BomField {
  column: string;
  label:  string;
  kind:   BomKind;
}

export interface BomCategory {
  key:    string;
  title:  string;
  fields: BomField[];
}

export const BOM_CATEGORIES: BomCategory[] = [
  {
    key: 'modules',
    title: 'Modules',
    fields: [
      { column: 'Module_Amount_Sold__c',   label: 'Module Qty',          kind: 'qty'  },
      { column: 'Manufacturer_Sold__c',    label: 'Manufacturer',        kind: 'text' },
      { column: 'Model_Sold__c',           label: 'Model',               kind: 'text' },
      { column: 'Module_Amount_Sold_B__c', label: 'Module Qty (B)',      kind: 'qty'  },
      { column: 'Manufacturer_Sold_B__c',  label: 'Manufacturer (B)',    kind: 'text' },
      { column: 'Model_Sold_B__c',         label: 'Model (B)',           kind: 'text' },
      { column: 'Total_Modules__c',        label: 'Total Modules',       kind: 'qty'  },
      { column: 'Domestic_Package__c',     label: 'Domestic Package',    kind: 'bool' },
      { column: 'SQ_Footage__c',           label: 'Array sq. ft.',       kind: 'qty'  },
    ],
  },
  {
    key: 'inverters',
    title: 'Inverters & Optimizers',
    fields: [
      { column: 'Inverter_1_Sold__c',     label: 'Inverter 1',         kind: 'text' },
      { column: 'Inverter_1_Sold_Qty__c', label: 'Inverter 1 Qty',     kind: 'qty'  },
      { column: 'Inverter_2_Sold__c',     label: 'Inverter 2',         kind: 'text' },
      { column: 'Inverter_2_Sold_Qty__c', label: 'Inverter 2 Qty',     kind: 'qty'  },
      { column: 'Inverter_Rating__c',     label: 'Inverter Rating',    kind: 'text' },
      { column: 'Optimizer_Type__c',      label: 'Optimizer Type',     kind: 'text' },
      { column: 'Optimizer_Qty__c',       label: 'Optimizer Qty',      kind: 'qty'  },
      { column: 'Enphase_ID__c',          label: 'Enphase System ID',  kind: 'text' },
    ],
  },
  {
    key: 'racking',
    title: 'Racking & Attachment',
    fields: [
      { column: 'S_5_Clamps__c',         label: 'S-5 Clamps',          kind: 'qty'  },
      { column: 'U_Anchor_Qty__c',       label: 'U-Anchor Qty',        kind: 'qty'  },
      { column: 'U_Anchor_Type__c',      label: 'U-Anchor Type',       kind: 'text' },
      { column: 'Pitch_Pocket_Qty__c',   label: 'Pitch Pocket',        kind: 'qty'  },
      { column: 'Snap_n_Rack_Skirt__c',  label: 'Snap\'N\'Rack Skirt', kind: 'bool' },
    ],
  },
  {
    key: 'battery',
    title: 'Battery Storage',
    fields: [
      { column: 'Battery_Storage__c',       label: 'Battery Storage',         kind: 'text' },
      { column: 'Qty_Battery_Storage__c',   label: 'Battery Qty',             kind: 'qty'  },
      { column: 'Battery_Storage_Adder__c', label: 'Battery Adder ($)',       kind: 'text' },
    ],
  },
  {
    key: 'ev',
    title: 'EV Charger',
    fields: [
      { column: 'EV_Charger_Model__c', label: 'EV Charger Model', kind: 'text' },
      { column: 'Qty_EV_Chargers__c',  label: 'EV Charger Qty',   kind: 'qty'  },
    ],
  },
  {
    key: 'safety',
    title: 'Panels, Switches & Specialty',
    fields: [
      { column: 'SMART_Panel_Type__c',           label: 'Smart Panel Type',          kind: 'text' },
      { column: 'SMART_Panel_QTY__c',            label: 'Smart Panel Qty',           kind: 'qty'  },
      { column: 'Gen_Interlock__c',              label: 'Gen Interlock',             kind: 'bool' },
      { column: 'Gen_Interlock_Description__c',  label: 'Gen Interlock Description', kind: 'text' },
      { column: 'Consumption_Monitoring_Model__c', label: 'Consumption Monitoring',  kind: 'text' },
      { column: 'Pest_Pkg__c',                   label: 'Pest Package',              kind: 'bool' },
      { column: 'Pest_Wrap_of_Panels__c',        label: 'Pest Wrap (# panels)',      kind: 'qty'  },
    ],
  },
];

// Flat list of every column we read — used to build the SELECT clause.
export const ALL_BOM_COLUMNS: string[] = [
  // Header / identity
  'Id', 'Name', 'Job_Number__c', 'AccountId',
  'Install_Address__c',
  'Install_Scheduled_Date__c', 'Estimated_Installation_Date__c',
  'Job_Status__c', 'Job_Notes__c',
  // All BOM fields, flattened
  ...BOM_CATEGORIES.flatMap((c) => c.fields.map((f) => f.column)),
];

export const SELECT_CLAUSE = Array.from(new Set(ALL_BOM_COLUMNS)).join(',');

// ----------------------------------------------------------------------------
// Display helpers
// ----------------------------------------------------------------------------
export function hasValue(kind: BomKind, v: unknown): boolean {
  if (v === null || v === undefined || v === '') return false;
  if (kind === 'qty') {
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) && n !== 0;
  }
  if (kind === 'bool') {
    if (typeof v === 'boolean') return v;
    const s = String(v).toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  }
  if (kind === 'text') {
    const s = String(v).toLowerCase().trim();
    return s !== '' && s !== 'false' && s !== '0' && s !== 'null' && s !== 'none';
  }
  return false;
}

export function formatValue(kind: BomKind, v: unknown): string {
  if (kind === 'qty') {
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n)
      ? (n % 1 === 0 ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 2 }))
      : '—';
  }
  if (kind === 'bool') return '✓';
  return String(v);
}
