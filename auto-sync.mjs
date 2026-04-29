const syncUrl = 'https://husbupeealwuxyopfwwb.supabase.co/functions/v1/salesforce-sync';

let syncCount = 0;

async function runSync() {
  syncCount++;
  const timestamp = new Date().toLocaleTimeString();
  console.log(`\n[${timestamp}] Sync #${syncCount} starting...`);

  try {
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✓ Total: Imported ${result.totalImported} | Updated ${result.totalUpdated} | Errors ${result.totalErrors}`);
      console.log(`  Last sync: ${result.lastSync}`);

      console.log('\n  Object Breakdown:');
      for (const [obj, data] of Object.entries(result.objects || {})) {
        if (data.error) {
          console.log(`    ${obj}: ✗ ${data.error}`);
        } else if (data.total > 0) {
          console.log(`    ${obj}: ${data.imported} imported, ${data.updated} updated (${data.total} total)`);
        } else {
          console.log(`    ${obj}: No changes`);
        }
      }
    } else {
      console.log(`✗ Error: ${result.error}`);
    }

  } catch (error) {
    console.log(`✗ Sync failed: ${error.message}`);
  }

  console.log(`\nNext sync in 30 seconds...`);
}

console.log('🔄 Starting Salesforce Full Sync (every 30 seconds)');
console.log('Syncing: Leads, Accounts, Contacts, Opportunities, Campaigns, Cases, Tasks, Events, Products');
console.log('Press Ctrl+C to stop\n');

runSync();
setInterval(runSync, 30000);
