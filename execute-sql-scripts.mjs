#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const { Client } = pg;

async function executeSQLFile(filePath, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 ${description}`);
  console.log('='.repeat(60));

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = readFileSync(filePath, 'utf-8');

    await client.query(sql);

    console.log(`✅ ${description} completed successfully`);

  } catch (error) {
    console.error(`❌ Error:`, error.message);
    if (error.detail) console.error(`   Detail: ${error.detail}`);
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Executing SQL Scripts\n');

  // 1. Channel Partners System
  await executeSQLFile(
    './APPLY-CHANNEL-PARTNERS.sql',
    'Setting up Channel Partners System'
  );

  // 2. Web Forms Setup
  await executeSQLFile(
    './fix-web-forms.sql',
    'Setting up Web Forms'
  );

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 All scripts executed!');
  console.log('='.repeat(60));
  console.log('');
}

main();
