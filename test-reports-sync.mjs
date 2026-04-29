#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSync() {
  console.log('\n=== Testing Salesforce Reports Sync ===\n');

  try {
    // Get a user
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (userError) {
      console.error('Error finding user:', userError);
      process.exit(1);
    }

    if (!users) {
      console.error('No users found. Creating test user...');

      // Try to get from auth.users
      const { data: authUsers } = await supabase.auth.admin.listUsers();

      if (authUsers && authUsers.users && authUsers.users.length > 0) {
        console.log(`Using auth user: ${authUsers.users[0].id}`);
        const userId = authUsers.users[0].id;

        console.log(`\nTesting with user ID: ${userId}\n`);

        const functionUrl = `${supabaseUrl}/functions/v1/salesforce-reports-sync`;

        console.log(`Calling: ${functionUrl}\n`);

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId })
        });

        console.log(`Response status: ${response.status}`);

        const responseText = await response.text();
        console.log(`Response body: ${responseText}\n`);

        if (!response.ok) {
          console.error('Sync failed!');
          process.exit(1);
        }

        const result = JSON.parse(responseText);
        console.log('Sync successful!');
        console.log(`Imported: ${result.imported}`);
        console.log(`Failed: ${result.failed}`);
        console.log(`Total: ${result.total}`);

        if (result.errors && result.errors.length > 0) {
          console.log('\nErrors:');
          result.errors.slice(0, 5).forEach((err, idx) => {
            console.log(`  ${idx + 1}. ${err.report}: ${err.error}`);
          });
        }
      } else {
        console.error('No auth users found');
        process.exit(1);
      }
    } else {
      const userId = users.id;
      console.log(`Testing with user ID: ${userId}\n`);

      const functionUrl = `${supabaseUrl}/functions/v1/salesforce-reports-sync`;

      console.log(`Calling: ${functionUrl}\n`);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      console.log(`Response status: ${response.status}`);

      const responseText = await response.text();
      console.log(`Response body: ${responseText}\n`);

      if (!response.ok) {
        console.error('Sync failed!');
        process.exit(1);
      }

      const result = JSON.parse(responseText);
      console.log('Sync successful!');
      console.log(`Imported: ${result.imported}`);
      console.log(`Failed: ${result.failed}`);
      console.log(`Total: ${result.total}`);

      if (result.errors && result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.slice(0, 5).forEach((err, idx) => {
          console.log(`  ${idx + 1}. ${err.report}: ${err.error}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testSync();
