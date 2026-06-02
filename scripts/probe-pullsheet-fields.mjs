// One-off probe: which BOM-related columns exist on the opportunities table,
// and which have data for at least one job with a future install date?
// Read-only, anon key is sufficient since we just want column names.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Look for any opportunity that has BOM data (preferring future installs)
const today = new Date().toISOString().slice(0, 10);
const { data, error } = await sb
  .from('opportunities')
  .select('*')
  .or(`Install_Scheduled_Date__c.gte.${today},Module_Amount_Sold__c.gt.0`)
  .limit(5);

if (error) { console.error(error.message); process.exit(1); }

const PATTERNS = [
  /Module/i, /Manufacturer/i, /Model_Sold/i,
  /Inverter/i, /Optimizer/i, /Micro/i,
  /Battery/i, /Tesla/i, /Powerwall/i, /PW3/i,
  /Rail/i, /Clamp/i, /Skirt/i, /Splice/i, /End_Clamp/i,
  /Bolt/i, /Lug/i, /Foot/i, /Hex/i, /Lag/i,
  /EV/i, /Charger/i,
  /Pest/i, /U_?Anchor/i, /S_5/i, /Powergrip/i, /Speed_Seal/i, /Pitch_Pocket/i,
  /Smart_Panel/i, /Combiner/i, /Envoy/i, /Cellmodem/i, /Q_BA/i, /Q_12/i, /Q_CONN/i, /Q_SEAL/i, /Q_Term/i,
  /Gen_?Interlock/i, /Transfer_Switch/i, /Breaker/i, /Bollard/i, /MCI/i,
  /Smoke/i, /Heat_Detector/i, /Sure_Start/i, /Stack_Kit/i, /Panel_Board/i, /Remote_Enclosure/i,
  /Domestic_Racking/i, /Expansion/i, /Materials/i, /Energy_Meter/i, /Solar_Grip/i, /Solar_Seal/i,
  /RT_MINI/i, /Total_Washer/i, /Snap_n_Rack/i, /Unirac/i, /Nest_Smoke/i,
  /Pull/i, /Install.*Address/i, /Install.*Date/i, /Job/i,
];

// Show columns that match the patterns and have at least one non-null value
const allCols = data.length ? Object.keys(data[0]) : [];
const matches = allCols.filter(c => PATTERNS.some(p => p.test(c)));

const populated = matches.filter(c => data.some(r => r[c] !== null && r[c] !== ''));

console.log(`Sampled ${data.length} opportunities.`);
console.log(`BOM-pattern columns total:  ${matches.length}`);
console.log(`...with non-null values:    ${populated.length}`);
console.log('');
console.log('--- POPULATED BOM COLUMNS ---');
for (const c of populated.sort()) {
  const sample = data.map(r => r[c]).filter(v => v !== null && v !== '')[0];
  console.log(`  ${c.padEnd(50)} (e.g. ${JSON.stringify(sample).slice(0, 50)})`);
}
