import 'dotenv/config';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const functionContent = readFileSync('supabase/functions/salesforce-sync/index.ts', 'utf-8');

console.log('🚀 Deploying salesforce-sync edge function...\n');

try {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/deploy_edge_function`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      name: 'salesforce-sync',
      content: functionContent
    })
  });

  console.log('Deploy status:', response.status);
  console.log('Response:', await response.text());

} catch (error) {
  console.error('Deployment error:', error.message);
}

console.log('\n✨ Please wait 30 seconds for deployment to complete, then run sync again');
