import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : '';
};

const dbUrl = getEnv('SUPABASE_DB_URL');

if (!dbUrl) {
  console.error('SUPABASE_DB_URL not found in .env file');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl
});

try {
  console.log('Connecting to database...');
  await client.connect();

  console.log('Reading migration file...');
  const migration = readFileSync('supabase/migrations/20251021000000_rebuild_leads_table_with_data.sql', 'utf-8');

  console.log('Executing migration...');
  await client.query(migration);

  console.log('\nMigration completed successfully!');
  console.log('Verifying data...');

  const result = await client.query('SELECT COUNT(*) FROM leads');
  console.log(`\nSuccessfully loaded ${result.rows[0].count} leads into the database!`);

} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} finally {
  await client.end();
}
