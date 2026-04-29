const SUPABASE_URL = 'https://husbupeealwuxyopfwwb.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1c2J1cGVlYWx3dXh5b3Bmd3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTE3ODMsImV4cCI6MjA3NDUyNzc4M30.ERC3k2pHFZ0MOmrbcSAgS1FwTIMpMh0fKbgzLuMXP6s';

const OBJECTS = [
  'Lead',
  'Account',
  'Contact',
  'Opportunity',
  'Campaign',
  'Case',
  'Task',
  'Event',
  'Product2',
  'OpportunityLineItem',
  'User',
  'Quote',
  'Document'
];

async function syncObject(objectName) {
  console.log(`\n🔄 Syncing ${objectName}...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/salesforce-sync?object=${objectName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ ${objectName}: Error ${response.status} - ${text}`);
      return { object: objectName, success: false, error: text };
    }

    const result = await response.json();
    const objResult = result.objects?.[objectName] || {};
    console.log(`✅ ${objectName}: ${objResult.imported || 0} imported, ${objResult.updated || 0} updated`);
    return { object: objectName, success: true, ...objResult };
  } catch (error) {
    console.error(`❌ ${objectName}: ${error.message}`);
    return { object: objectName, success: false, error: error.message };
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       SYNCING ALL SALESFORCE OBJECTS ONE BY ONE         ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const results = [];
  
  for (const objectName of OBJECTS) {
    const result = await syncObject(objectName);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between syncs
  }
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                   SYNC SUMMARY                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${OBJECTS.length}`);
  console.log(`❌ Failed: ${failed.length}/${OBJECTS.length}\n`);
  
  if (successful.length > 0) {
    console.log('Successful syncs:');
    successful.forEach(r => {
      console.log(`  ✓ ${r.object}: ${r.imported || 0} imported, ${r.updated || 0} updated`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\nFailed syncs:');
    failed.forEach(r => {
      console.log(`  ✗ ${r.object}: ${r.error || 'Unknown error'}`);
    });
  }
}

main().catch(console.error);
