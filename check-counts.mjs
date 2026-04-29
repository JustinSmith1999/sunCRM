import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://husbupeealwuxyopfwwb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1c2J1cGVlYWx3dXh5b3Bmd3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTE3ODMsImV4cCI6MjA3NDUyNzc4M30.ERC3k2pHFZ0MOmrbcSAgS1FwTIMpMh0fKbgzLuMXP6s'
);

const tables = [
  'leads',
  'accounts',
  'salesforce_contacts',
  'opportunities',
  'salesforce_campaigns',
  'salesforce_campaign_members',
  'salesforce_cases',
  'salesforce_tasks',
  'salesforce_events',
  'salesforce_products',
  'salesforce_opportunity_line_items'
];

console.log('Current record counts:\n');
for (const table of tables) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log(`  ${table}: Error - ${error.message}`);
  } else {
    console.log(`  ${table}: ${count} records`);
  }
}

const { data: syncLog } = await supabase
  .from('salesforce_sync_log')
  .select('*')
  .order('last_sync_time', { ascending: false })
  .limit(3);

console.log('\nRecent sync log:');
if (syncLog && syncLog.length > 0) {
  syncLog.forEach(log => {
    console.log(`  ${log.last_sync_time}: ${log.status} - ${log.records_synced} records`);
  });
}
