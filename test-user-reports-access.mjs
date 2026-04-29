import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function testUserAccess() {
  // Test multiple users
  const testUsers = [
    { email: 'admin@company.com', password: 'Admin123!' },
    { email: 'mdanziger@sunation.com', password: 'Sunation123!' },
    { email: 'dwoods@sunation.com', password: 'Sunation123!' }
  ];

  for (const testUser of testUsers) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing user: ${testUser.email}`);
    console.log('='.repeat(60));

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Try to login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });

    if (authError) {
      console.log(`❌ Login failed: ${authError.message}`);
      continue;
    }

    console.log(`✓ Logged in successfully`);
    console.log(`  User ID: ${authData.user.id}`);

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name, is_active, role_id')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.log(`  Profile error: ${profileError.message}`);
    } else if (profile) {
      console.log(`  Name: ${profile.full_name}`);
      console.log(`  Active: ${profile.is_active}`);
      console.log(`  Role ID: ${profile.role_id}`);
    } else {
      console.log(`  ⚠️  No profile found`);
    }

    // Try to get reports count
    const { count, error: countError } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`  ❌ Reports query error: ${countError.message}`);
      console.log(`     Code: ${countError.code}`);
      console.log(`     Details: ${countError.details}`);
    } else {
      console.log(`  ✓ Can access ${count} reports`);
    }

    // Get a sample of reports
    const { data: sampleReports, error: sampleError } = await supabase
      .from('reports')
      .select('id, name, folder, is_public, is_system, created_by')
      .limit(3);

    if (sampleError) {
      console.log(`  Sample query error: ${sampleError.message}`);
    } else if (sampleReports && sampleReports.length > 0) {
      console.log(`  Sample reports:`);
      sampleReports.forEach((r, idx) => {
        console.log(`    ${idx + 1}. ${r.name}`);
        console.log(`       Folder: ${r.folder || 'None'}`);
        console.log(`       Public: ${r.is_public}, System: ${r.is_system}`);
        console.log(`       Created by: ${r.created_by === authData.user.id ? 'Me' : r.created_by || 'System'}`);
      });
    }

    // Sign out
    await supabase.auth.signOut();
  }
}

testUserAccess().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
