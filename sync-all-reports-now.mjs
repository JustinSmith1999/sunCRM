import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function syncAllReports() {
  console.log('🔄 Starting Salesforce Reports Sync...\n');

  try {
    // Use a test user ID (the admin user that created the reports)
    const userId = 'cf00fecb-78d2-436d-8a4a-13d91b187b25';

    const functionUrl = `${SUPABASE_URL}/functions/v1/salesforce-reports-sync`;

    console.log('Calling sync function...');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Sync failed: ${errorText}`);
    }

    const result = await response.json();
    console.log('\n✅ Sync Complete!\n');
    console.log('Results:');
    console.log(`  - Total Reports: ${result.total}`);
    console.log(`  - Imported: ${result.imported}`);
    console.log(`  - Failed: ${result.failed}`);

    if (result.errors && result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err.name}: ${err.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

syncAllReports();
