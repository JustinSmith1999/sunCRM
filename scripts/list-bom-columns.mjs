// Dump every column on opportunities that LOOKS like a BOM/inventory field
// (qty, model, rail, clamp, tesla, battery, etc.) so we can build an accurate field map.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const { data, error } = await sb.from('opportunities').select('*').limit(1);
if (error) { console.error(error.message); process.exit(1); }
const cols = Object.keys(data[0]).sort();

const KEY = /qty|module|inverter|optimizer|micro|envoy|combiner|cellmodem|tesla|powerwall|pw3|battery|rail|clamp|skirt|splice|lug|hex|bolt|lag|washer|seal|foot|powergrip|anchor|snap|unirac|smart|breaker|switch|smoke|heat|sure_start|stack|bollard|mci|rcd|nest|gen_interlock|pest|domestic|expansion|materials|energy_meter|grip|conn|enphase|q_term|q_seal|q_ba|q_12|q_conn|rt_mini|cell_mode|mid_clamp|ev_charger|ev_kit|ult|172|168|30mm|3p|6p|panel_board|remote_enclosure|consumption_monitor|monitoring/i;

const bom = cols.filter(c => KEY.test(c));
console.log(`Found ${bom.length} BOM-looking columns:`);
for (const c of bom) console.log(`  ${c}`);
