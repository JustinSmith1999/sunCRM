import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function testAdminLogin() {
  console.log('Testing admin login and reports access...\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Try to login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@company.com',
    password: 'sunation9454'
  });

  if (authError) {
    console.log(`❌ Login failed: ${authError.message}`);
    return;
  }

  console.log(`✓ Logged in successfully`);
  console.log(`  User ID: ${authData.user.id}`);
  console.log(`  Email: ${authData.user.email}`);
  console.log(`  Session valid: ${!!authData.session}`);

  // Get session
  const { data: { session } } = await supabase.auth.getSession();
  console.log(`\n✓ Session retrieved: ${!!session}`);
  if (session) {
    console.log(`  Access token present: ${!!session.access_token}`);
  }

  // Try to get reports
  console.log('\nTrying to fetch reports...');
  const { data: reports, error: reportsError, count } = await supabase
    .from('reports')
    .select('*', { count: 'exact' })
    .limit(5);

  if (reportsError) {
    console.log(`❌ Reports query failed:`);
    console.log(`   Error: ${reportsError.message}`);
    console.log(`   Code: ${reportsError.code}`);
    console.log(`   Details: ${reportsError.details}`);
    console.log(`   Hint: ${reportsError.hint}`);
  } else {
    console.log(`✓ Query succeeded!`);
    console.log(`  Total count available: ${count}`);
    console.log(`  Sample reports retrieved: ${reports.length}`);
    if (reports.length > 0) {
      console.log('\nFirst 3 reports:');
      reports.slice(0, 3).forEach((r, idx) => {
        console.log(`  ${idx + 1}. ${r.name}`);
        console.log(`     Folder: ${r.folder || 'None'}`);
        console.log(`     Public: ${r.is_public}, System: ${r.is_system}`);
        console.log(`     Type: ${r.report_type}`);
      });
    }
  }

  // Check profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle();

  console.log('\nUser Profile:');
  if (profileError) {
    console.log(`  Error: ${profileError.message}`);
  } else if (profile) {
    console.log(`  Name: ${profile.full_name}`);
    console.log(`  Email: ${profile.email}`);
    console.log(`  Active: ${profile.is_active}`);
    console.log(`  Role ID: ${profile.role_id}`);
  }

  await supabase.auth.signOut();
  console.log('\n✓ Signed out');
}

testAdminLogin().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
