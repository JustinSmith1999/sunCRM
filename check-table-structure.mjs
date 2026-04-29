import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('Checking table structures...\n');

async function checkTable(tableName) {
  console.log(`\n=== ${tableName} ===`);

  // Try to get one record to see what columns exist
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error:', error.message);
    console.log('Error Code:', error.code);
    console.log('Error Details:', error.details);
  } else if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]).join(', '));
  } else {
    console.log('No data in table');
  }
}

await checkTable('accounts');
await checkTable('opportunities');
await checkTable('cases');
await checkTable('tasks');
