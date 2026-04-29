import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('Testing metrics queries (simulating Home component)...\n');

async function loadMetrics() {
  try {
    console.log('Running parallel queries...');

    const [leadsCount, accountsCount, opportunitiesCount, casesCount, tasksCount] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('accounts').select('id', { count: 'exact', head: true }),
      supabase.from('opportunities').select('id', { count: 'exact', head: true }),
      supabase.from('cases').select('id', { count: 'exact', head: true }),
      supabase.from('tasks').select('id', { count: 'exact', head: true })
    ]);

    console.log('\nQuery Results:');
    console.log('Leads:', leadsCount.count, leadsCount.error ? `(Error: ${leadsCount.error.message})` : '');
    console.log('Accounts:', accountsCount.count, accountsCount.error ? `(Error: ${accountsCount.error.message})` : '');
    console.log('Opportunities:', opportunitiesCount.count, opportunitiesCount.error ? `(Error: ${opportunitiesCount.error.message})` : '');
    console.log('Cases:', casesCount.count, casesCount.error ? `(Error: ${casesCount.error.message})` : '');
    console.log('Tasks:', tasksCount.count, tasksCount.error ? `(Error: ${tasksCount.error.message})` : '');

    const metrics = {
      leads: leadsCount.count || 0,
      accounts: accountsCount.count || 0,
      opportunities: opportunitiesCount.count || 0,
      cases: casesCount.count || 0,
      tasks: tasksCount.count || 0
    };

    console.log('\nFinal Metrics Object:');
    console.log(metrics);
  } catch (error) {
    console.error('Error loading metrics:', error);
  }
}

loadMetrics();
