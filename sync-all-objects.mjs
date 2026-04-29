const syncUrl = 'https://husbupeealwuxyopfwwb.supabase.co/functions/v1/salesforce-sync';

const objects = [
  'Lead',
  'Account',
  'Contact',
  'Opportunity',
  'Campaign',
  'CampaignMember',
  'Case',
  'Task',
  'Event',
  'Product2',
  'OpportunityLineItem'
];

console.log('🔄 Starting Full Salesforce Sync (one object at a time)');
console.log(`Syncing ${objects.length} objects\n`);

for (const obj of objects) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] Syncing ${obj}...`);

  try {
    const response = await fetch(`${syncUrl}?object=${obj}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success && result.objects[obj]) {
      const data = result.objects[obj];
      if (data.error) {
        console.log(`  ✗ ${obj}: ${data.error}`);
      } else {
        console.log(`  ✓ ${obj}: ${data.imported} imported, ${data.updated} updated (${data.total} total)`);
      }
    } else {
      console.log(`  ✗ ${obj}: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`  ✗ ${obj}: ${error.message}`);
  }

  console.log('');
}

console.log('=== ALL OBJECTS SYNCED ===');
