import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Get database columns
const { data: sample } = await supabase
  .from('opportunities')
  .select('*')
  .limit(1);

if (!sample || sample.length === 0) {
  console.log('No sample data found');
  process.exit(1);
}

const dbColumns = Object.keys(sample[0]).map(col => col.toLowerCase());

console.log(`Found ${dbColumns.length} columns in opportunities table\n`);

// Map database columns to Salesforce field names
const sfFields = dbColumns.map(col => {
  // Convert lowercase back to proper Salesforce field names
  // Handle special cases
  if (col === 'id') return 'Id';
  if (col === 'system_size_kw__c') return 'System_Size_kW__c';
  if (col === 'annual_production_kwhr__c') return 'Annual_Production_kWhr__c';

  // For standard fields, capitalize first letter
  if (!col.includes('__c')) {
    return col.charAt(0).toUpperCase() + col.slice(1);
  }

  // For custom fields, capitalize each word before __c
  const parts = col.split('__c')[0].split('_');
  const sfName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('_') + '__c';
  return sfName;
});

console.log('Salesforce fields to sync:');
console.log(JSON.stringify(sfFields, null, 2));

console.log('\n\nFor salesforce-sync/index.ts:');
console.log('fields: [');
const chunked = [];
for (let i = 0; i < sfFields.length; i += 5) {
  const chunk = sfFields.slice(i, i + 5);
  chunked.push(`  '${chunk.join("', '")}'`);
}
console.log(chunked.join(',\n'));
console.log(']');

console.log(`\n\nTotal: ${sfFields.length} fields`);
