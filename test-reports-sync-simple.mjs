#!/usr/bin/env node

import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Found' : 'Missing');
  process.exit(1);
}

async function testSync() {
  console.log('\n=== Testing Salesforce Reports Sync ===\n');
  console.log(`Supabase URL: ${supabaseUrl}\n`);

  try {
    const functionUrl = `${supabaseUrl}/functions/v1/salesforce-reports-sync`;

    console.log(`Calling: ${functionUrl}\n`);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    console.log(`Response status: ${response.status}`);

    const responseText = await response.text();
    console.log(`\nResponse:\n${responseText}\n`);

    if (!response.ok) {
      console.error('Sync failed!');
      try {
        const errorData = JSON.parse(responseText);
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Could not parse error response');
      }
      process.exit(1);
    }

    const result = JSON.parse(responseText);

    if (result.success) {
      console.log('\n✅ Sync successful!');
      console.log(`   Imported: ${result.imported}`);
      console.log(`   Failed: ${result.failed}`);
      console.log(`   Total: ${result.total}`);

      if (result.errors && result.errors.length > 0) {
        console.log('\n⚠️  Some reports had errors:');
        result.errors.slice(0, 10).forEach((err, idx) => {
          console.log(`   ${idx + 1}. ${err.report}: ${err.error}`);
        });
        if (result.errors.length > 10) {
          console.log(`   ... and ${result.errors.length - 10} more errors`);
        }
      }
    } else {
      console.error('\n❌ Sync failed:', result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

testSync();
