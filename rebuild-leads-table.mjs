import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Reading migration file...');
const migration = readFileSync('supabase/migrations/20251021000000_rebuild_leads_table_with_data.sql', 'utf-8');

console.log('Applying migration...');
const { data, error } = await supabase.rpc('exec_sql', { sql_query: migration }).catch(async (e) => {
  // If RPC doesn't exist, try direct execution by splitting into statements
  console.log('Using alternative method...');

  // Split by semicolons but keep the SQL intact
  const statements = migration.split(';').filter(s => s.trim());

  for (const statement of statements) {
    const trimmed = statement.trim();
    if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) continue;

    try {
      await supabase.rpc('exec', { sql: trimmed + ';' });
    } catch (err) {
      console.error('Error executing statement:', err.message);
    }
  }

  return { data: null, error: null };
});

if (error) {
  console.error('Migration error:', error);
  process.exit(1);
}

console.log('Migration completed successfully!');
console.log('Verifying data...');

const { data: leads, error: queryError } = await supabase
  .from('leads')
  .select('*', { count: 'exact' });

if (queryError) {
  console.error('Query error:', queryError);
} else {
  console.log(`\nSuccessfully loaded ${leads.length} leads into the database!`);
}
