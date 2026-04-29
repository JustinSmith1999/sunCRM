import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const objects = ['Quote', 'Document'];

console.log('Syncing Quotes and Documents from Salesforce...\n');

for (const object of objects) {
  console.log(`\n=== Syncing ${object} ===`);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/salesforce-sync?object=${object}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed: ${error}`);
      continue;
    }

    const result = await response.json();
    const stats = result.objects[object];

    if (stats) {
      if (stats.error) {
        console.log(`❌ ${object}: ${stats.error}`);
      } else {
        console.log(`✓ ${object}: ${stats.imported} imported, ${stats.updated} updated (${stats.total} total records)`);
        if (stats.errors && stats.errors.length > 0) {
          console.log(`  Errors: ${stats.errors.length}`);
          stats.errors.forEach(e => console.log(`    - Batch ${e.batch}: ${e.error}`));
        }
      }
    }
  } catch (error) {
    console.error(`❌ ${object} failed:`, error.message);
  }
}

console.log('\n=== Sync Complete ===');
