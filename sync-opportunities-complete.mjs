import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔄 Starting complete Opportunities sync from Salesforce...\n');

try {
  // Trigger the sync for Opportunities only
  const syncUrl = `${SUPABASE_URL}/functions/v1/salesforce-sync?object=Opportunity`;

  console.log('📡 Calling Salesforce sync function...');
  console.log('URL:', syncUrl);

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

  if (result.objects?.Opportunity) {
    const opp = result.objects.Opportunity;
    console.log('\n📊 Opportunities Summary:');
    console.log(`   Total Records: ${opp.total || 0}`);
    console.log(`   Imported: ${opp.imported || 0}`);
    console.log(`   Updated: ${opp.updated || 0}`);
    console.log(`   Errors: ${opp.errors?.length || 0}`);

    if (opp.errors && opp.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      opp.errors.forEach(err => {
        console.log(`   Batch ${err.batch}: ${err.error}`);
      });
    }
  }

  console.log('\n🎉 All Opportunities data has been synced from Salesforce!');

} catch (error) {
  console.error('\n❌ Error during sync:', error.message);
  process.exit(1);
}
