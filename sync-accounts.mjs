import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔄 Syncing Accounts from Salesforce...\n');

try {
  const syncUrl = `${SUPABASE_URL}/functions/v1/salesforce-sync?object=Account`;

  console.log('📡 Calling Salesforce sync function for Accounts...');

  const response = await fetch(syncUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sync failed with status ${response.status}: ${errorText}`);
  }

  const result = await response.json();

  console.log('\n✅ Sync Complete!\n');
  console.log('Results:', JSON.stringify(result, null, 2));

  if (result.objects?.Account) {
    const acc = result.objects.Account;
    console.log('\n📊 Accounts Summary:');
    console.log(`   Total Records: ${acc.total || 0}`);
    console.log(`   Imported: ${acc.imported || 0}`);
    console.log(`   Updated: ${acc.updated || 0}`);
    console.log(`   Errors: ${acc.errors?.length || 0}`);

    if (acc.errors && acc.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      acc.errors.forEach(err => {
        console.log(`   Batch ${err.batch}: ${err.error}`);
      });
    }
  }

  console.log('\n🎉 All Accounts have been synced from Salesforce!');
  console.log('Account names will now display properly in Opportunities.');

} catch (error) {
  console.error('\n❌ Error during sync:', error.message);
  process.exit(1);
}
