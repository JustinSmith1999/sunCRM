import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('Testing individual table queries with full error details...\n');

async function testTable(tableName) {
  console.log(`\n=== Testing ${tableName} ===`);

  try {
    const result = await supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true });

    console.log('Count:', result.count);
    console.log('Error:', result.error);
    console.log('Status:', result.status);
    console.log('StatusText:', result.statusText);

    if (result.error) {
      console.log('Error Details:', JSON.stringify(result.error, null, 2));
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

await testTable('accounts');
await testTable('opportunities');
await testTable('cases');
await testTable('tasks');
