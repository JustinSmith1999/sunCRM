import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('Testing FIXED metrics queries...\n');

async function loadMetrics() {
  try {
    console.log('Running queries with correct column names...');

    const [leadsCount, accountsCount, opportunitiesCount, casesCount, tasksCount] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('accounts').select('Id', { count: 'exact', head: true }),
      supabase.from('opportunities').select('Id', { count: 'exact', head: true }),
      supabase.from('salesforce_cases').select('"Id"', { count: 'exact', head: true }),
      supabase.from('salesforce_tasks').select('"Id"', { count: 'exact', head: true })
    ]);

    console.log('\n✓ Query Results:');
    console.log('  Leads:', leadsCount.count, leadsCount.error ? `❌ ${leadsCount.error.message}` : '✅');
    console.log('  Accounts:', accountsCount.count, accountsCount.error ? `❌ ${accountsCount.error.message}` : '✅');
    console.log('  Opportunities:', opportunitiesCount.count, opportunitiesCount.error ? `❌ ${opportunitiesCount.error.message}` : '✅');
    console.log('  Cases:', casesCount.count, casesCount.error ? `❌ ${casesCount.error.message}` : '✅');
    console.log('  Tasks:', tasksCount.count, tasksCount.error ? `❌ ${tasksCount.error.message}` : '✅');

    const metrics = {
      leads: leadsCount.count || 0,
      accounts: accountsCount.count || 0,
      opportunities: opportunitiesCount.count || 0,
      cases: casesCount.count || 0,
      tasks: tasksCount.count || 0
    };

    console.log('\n✓ Final Metrics:');
    console.log(metrics);
    console.log('\n✅ All queries successful!');
  } catch (error) {
    console.error('❌ Error loading metrics:', error);
  }
}

loadMetrics();
