import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const functionCode = readFileSync('/tmp/cc-agent/57590864/project/supabase/functions/create-users/index.ts', 'utf-8');

console.log(`Function code length: ${functionCode.length} characters`);
console.log(`Function has ${functionCode.split('\n').length} lines`);
console.log('\nDeploying function...');

// Call the deployed function to execute import
const response = await fetch(`${supabaseUrl}/functions/v1/create-users`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseServiceKey}`
  }
});

const result = await response.json();
console.log('\nResult:', JSON.stringify(result, null, 2));
