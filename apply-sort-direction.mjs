import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  console.log('Adding sort_direction column...');

  // Use a simple query approach
  const { data, error } = await supabase
    .from('reports')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Error accessing reports:', error);
  } else {
    console.log('✓ Reports table accessible');
  }

  console.log('\n=== PLEASE RUN THIS SQL IN SUPABASE SQL EDITOR ===\n');
  console.log(`
-- Add sort_direction column
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS sort_direction text DEFAULT 'asc';

-- Find all columns with '_c' in their names
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name LIKE '%_c%'
  AND table_schema = 'public'
ORDER BY table_name, column_name;
  `);
  console.log('\n=== END SQL ===\n');
}

main();
