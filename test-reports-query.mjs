import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testReportsQuery() {
  console.log('Testing reports query...\n');

  // Test as an unauthenticated user first
  console.log('1. Querying as unauthenticated user:');
  const { data: unauthData, error: unauthError } = await supabase
    .from('reports')
    .select('id, name, folder, is_public, is_system, salesforce_id')
    .limit(5);

  if (unauthError) {
    console.error('   Error:', unauthError.message);
  } else {
    console.log(`   Found ${unauthData?.length || 0} reports`);
  }

  // Now try to login
  console.log('\n2. Logging in as admin@sunation.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@sunation.com',
    password: 'Admin123!'
  });

  if (authError) {
    console.error('   Login error:', authError.message);
    return;
  }

  console.log('   ✓ Logged in successfully');
  console.log('   User ID:', authData.user.id);

  // Test as authenticated user
  console.log('\n3. Querying as authenticated user:');
  const { data: authReports, error: authReportsError } = await supabase
    .from('reports')
    .select('id, name, folder, is_public, is_system, salesforce_id')
    .limit(5);

  if (authReportsError) {
    console.error('   Error:', authReportsError.message);
  } else {
    console.log(`   Found ${authReports?.length || 0} reports`);
    if (authReports && authReports.length > 0) {
      console.log('\n   Sample reports:');
      authReports.forEach((r, idx) => {
        console.log(`   ${idx + 1}. ${r.name}`);
        console.log(`      Folder: ${r.folder || 'None'}`);
        console.log(`      Public: ${r.is_public}, System: ${r.is_system}, SF: ${r.salesforce_id ? 'Yes' : 'No'}`);
      });
    }
  }

  // Get total count
  console.log('\n4. Getting total count:');
  const { count, error: countError } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('   Error:', countError.message);
  } else {
    console.log(`   Total accessible reports: ${count}`);
  }
}

testReportsQuery().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
