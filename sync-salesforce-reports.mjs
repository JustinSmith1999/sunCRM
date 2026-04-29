#!/usr/bin/env node

import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env');
  process.exit(1);
}

async function syncReports() {
  console.log('\n=== SALESFORCE REPORTS SYNC ===\n');
  console.log('Connecting to Salesforce...\n');

  try {
    const functionUrl = `${supabaseUrl}/functions/v1/salesforce-reports-sync`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Sync failed:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          console.error('Error:', errorData.error);
        }
        if (errorData.details) {
          console.error('Details:', errorData.details);
        }
      } catch (e) {
        // Text response, not JSON
      }
      process.exit(1);
    }

    const result = await response.json();

    console.log('\n=== SYNC COMPLETE ===\n');
    console.log(`✅ Imported: ${result.imported} reports`);
    console.log(`❌ Failed: ${result.failed} reports`);
    console.log(`📊 Total: ${result.total} reports`);

    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.errors.slice(0, 10).forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.report}: ${err.error}`);
      });
      if (result.errors.length > 10) {
        console.log(`   ... and ${result.errors.length - 10} more errors`);
      }
    }

    console.log('\n✅ Reports have been synced to your database!');
    console.log('🔍 View them in the Reports section of your application.\n');

  } catch (error) {
    console.error('❌ Sync error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

syncReports();
