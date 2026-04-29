import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function syncAllOpportunities() {
  console.log('Starting full opportunity sync...');

  try {
    const { count: currentCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true });

    console.log(`Current opportunities in database: ${currentCount}`);

    const sfResponse = await fetch(
      `${process.env.VITE_SUPABASE_URL}/functions/v1/salesforce-sync`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync',
          object: 'Opportunity',
          fullSync: true
        })
      }
    );

    const result = await sfResponse.json();
    console.log('Sync result:', result);

    const { count: newCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true });

    console.log(`New opportunities count: ${newCount}`);
    console.log(`Synced ${newCount - currentCount} new opportunities`);

  } catch (error) {
    console.error('Sync error:', error);
  }
}

syncAllOpportunities();
