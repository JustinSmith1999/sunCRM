// Verify every column referenced by Operations/bomFields.ts exists on
// `opportunities`. Returns the bad ones so we can fix the map without
// breaking the live query.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Snag one row to learn the full column set on the table.
const { data: sample, error: sErr } = await sb.from('opportunities').select('*').limit(1);
if (sErr) { console.error(sErr.message); process.exit(1); }
const real = new Set(Object.keys(sample[0] ?? {}));
console.log(`opportunities total columns: ${real.size}`);

// Pull the requested columns out of the TS file.
const bomTs = fs.readFileSync(path.resolve('src/components/Operations/bomFields.ts'), 'utf8');
const requested = new Set(
  Array.from(bomTs.matchAll(/column:\s*'([^']+)'/g)).map((m) => m[1])
    .concat(Array.from(bomTs.matchAll(/'([A-Z][A-Za-z0-9_]+__c|Id|Name|AccountId)'/g)).map((m) => m[1]))
);
console.log(`bomFields.ts requested:    ${requested.size}`);

const missing = [...requested].filter((c) => !real.has(c));
const present = [...requested].filter((c) => real.has(c));
console.log(`Present:                   ${present.length}`);
console.log(`MISSING:                   ${missing.length}`);
if (missing.length) {
  console.log('\nMissing columns (will need to be removed or renamed):');
  for (const c of missing.sort()) console.log(`  ${c}`);
  // For each missing, suggest the closest real match (case-insensitive substring of underscores)
  console.log('\nLikely real-column matches for each missing one:');
  for (const m of missing.sort()) {
    const tokens = m.replace(/__c$/, '').split('_').filter((t) => t.length > 1).map((t) => t.toLowerCase());
    const candidates = [...real]
      .filter((r) => tokens.every((t) => r.toLowerCase().includes(t)))
      .slice(0, 4);
    console.log(`  ${m.padEnd(45)} ${candidates.join(' | ') || '(no close match)'}`);
  }
}
