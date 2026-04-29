#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function runSQLFile(filePath, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${description}`);
  console.log('='.repeat(60));

  try {
    const sql = readFileSync(filePath, 'utf-8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).maybeSingle();

    if (error) {
      console.error(`❌ Error:`, error.message);
      return false;
    }

    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error reading or executing file:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting SQL execution...\n');

  // Run Channel Partners SQL
  await runSQLFile(
    './APPLY-CHANNEL-PARTNERS.sql',
    'Channel Partners System Setup'
  );

  // Run Web Forms SQL
  await runSQLFile(
    './fix-web-forms.sql',
    'Web Forms Setup'
  );

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 All SQL files executed!');
  console.log('='.repeat(60));
}

main();
