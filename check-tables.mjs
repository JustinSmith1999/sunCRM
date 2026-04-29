import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('Checking for CRM tables...\n');

const tables = ['accounts', 'opportunities', 'cases', 'tasks'];

for (const table of tables) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${table}: Does not exist or has permissions issue`);
      console.log(`   Error: ${error.message}`);
    } else {
      console.log(`✅ ${table}: Exists (${count} records)`);
    }
  } catch (err) {
    console.log(`❌ ${table}: Error - ${err.message}`);
  }
}

console.log('\n---\n');
console.log('If tables are missing, run the SQL from create-crm-tables.mjs in your Supabase SQL Editor.');
