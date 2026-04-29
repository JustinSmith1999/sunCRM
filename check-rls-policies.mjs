import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Create client with anon key (simulating frontend)
const supabaseAnon = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('Testing table access with anon key (unauthenticated)...\n');

const tables = ['accounts', 'opportunities', 'cases', 'tasks'];

for (const table of tables) {
  try {
    const { count, error } = await supabaseAnon
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: ${count} records accessible (unauthenticated)`);
    }
  } catch (err) {
    console.log(`❌ ${table}: ${err.message}`);
  }
}

console.log('\n---\nNote: If you see 0 records or permission errors, the RLS policies may be blocking unauthenticated access.');
console.log('The dashboard queries run as an authenticated user, so we need to check if auth.uid() exists during queries.\n');
