import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

console.log('🔍 Checking leads table...\n');

const { data: leads, error } = await supabase
  .from('leads')
  .select('id, first_name, last_name, email, lead_source')
  .limit(10);

if (error) {
  console.error('❌ Error:', error.message);
} else {
  console.log(`Found ${leads.length} leads in table:`);
  leads.forEach((l, i) => {
    console.log(`  ${i+1}. ${l.first_name} ${l.last_name} - ${l.email || 'no email'} (${l.lead_source || 'no source'})`);
  });
}

const { count } = await supabase
  .from('leads')
  .select('*', { count: 'exact', head: true });

console.log(`\nTotal leads in database: ${count}`);

if (count === 0) {
  console.log('\n⚠️  Table is EMPTY! Run INSERT-ALL-LEADS.sql in Supabase SQL Editor to insert the 150 leads.');
}
