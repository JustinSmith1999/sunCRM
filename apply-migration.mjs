import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://husbupeealwuxyopfwwb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1c2J1cGVlYWx3dXh5b3Bmd3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTE3ODMsImV4cCI6MjA3NDUyNzc4M30.ERC3k2pHFZ0MOmrbcSAgS1FwTIMpMh0fKbgzLuMXP6s';

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = readFileSync('./supabase/migrations/20251020185300_recreate_leads_table.sql', 'utf8');

console.log('SQL to execute:');
console.log(sql);
console.log('\n---\n');

// Since we can't execute raw DDL through the Supabase client directly,
// let's just verify the table structure
const { data, error } = await supabase
  .from('leads')
  .select('*')
  .limit(0);

if (error) {
  console.log('Current error:', error.message);
  console.log('\nYou need to run this SQL manually in the Supabase Dashboard:');
  console.log('1. Go to https://husbupeealwuxyopfwwb.supabase.co');
  console.log('2. Click on SQL Editor');
  console.log('3. Paste the SQL from: supabase/migrations/20251020185300_recreate_leads_table.sql');
  console.log('4. Click Run');
} else {
  console.log('✓ Table exists and is accessible');
}
