import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🚀 Testing Salesforce User Sync...\n');

try {
  const apiUrl = `${SUPABASE_URL}/functions/v1/sync-salesforce-users`;

  console.log('📡 Calling edge function...');
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    }
  });

  const result = await response.json();

  if (result.success) {
    console.log('\n✅ Sync Successful!\n');
    console.log('📊 Summary:');
    console.log(`   Total Salesforce Users: ${result.summary.total}`);
    console.log(`   ✨ Created: ${result.summary.created}`);
    console.log(`   🔄 Updated: ${result.summary.updated}`);
    console.log(`   ⏭️  Skipped: ${result.summary.skipped}`);
    console.log(`   ❌ Errors: ${result.summary.errors}`);

    if (result.details.created.length > 0) {
      console.log('\n👥 Sample Created Users:');
      result.details.created.slice(0, 5).forEach(user => {
        console.log(`   • ${user.name} (${user.email})`);
        console.log(`     Role: ${user.role} | SF Profile: ${user.sfProfile}`);
        console.log(`     Password: ${user.tempPassword}`);
      });
    }

    if (result.details.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.details.errors.forEach(err => {
        console.log(`   • ${err.name} (${err.email}): ${err.error}`);
      });
    }
  } else {
    console.log('\n❌ Sync Failed:', result.error);
  }
} catch (error) {
  console.error('\n❌ Error:', error.message);
}
