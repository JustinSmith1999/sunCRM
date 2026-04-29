import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) acc[m[1].trim()] = m[2].trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// Try to get column info by attempting an insert with no data
const { error } = await supabase.from('leads').insert({});

if (error) {
  console.log('Error details:', error);
  if (error.details) console.log('Details:', error.details);
  if (error.hint) console.log('Hint:', error.hint);
}

// Try selecting from empty table to see columns
const { data, error: selectError } = await supabase
  .from('leads')
  .select('*')
  .limit(0);

if (!selectError) {
  console.log('\n✓ Leads table exists and is readable');
  console.log('Sample query works - table structure is OK\n');
}

// Check migrations
console.log('📁 Checking migration files...');
