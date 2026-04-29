import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Use direct database connection
const { Client } = pg;
const dbUrl = process.env.VITE_SUPABASE_URL.replace('https://', '').split('.')[0];
const dbPassword = process.env.SUPABASE_DB_PASSWORD || '';

const client = new Client({
  host: `db.${dbUrl}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Add missing column
    console.log('\nAdding sort_direction column...');
    await client.query(`
      ALTER TABLE reports
      ADD COLUMN IF NOT EXISTS sort_direction text DEFAULT 'asc';
    `);
    console.log('✓ Added sort_direction column');

    // Find columns with _c
    console.log('\nFinding columns with _c in name...');
    const { rows } = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE column_name LIKE '%_c%'
      AND table_schema = 'public'
      ORDER BY table_name, column_name;
    `);

    if (rows.length === 0) {
      console.log('No columns found with _c in the name');
    } else {
      console.log(`\nFound ${rows.length} columns with _c:`);
      rows.forEach(row => {
        console.log(`  ${row.table_name}.${row.column_name}`);
      });
    }

    await client.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
