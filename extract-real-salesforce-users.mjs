import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function extractUsers() {
  try {
    // Get all unique user IDs from leads table (OwnerId, CreatedById, LastModifiedById)
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('OwnerId, CreatedById, LastModifiedById')
      .not('OwnerId', 'is', null);

    if (leadsError) throw leadsError;

    // Collect unique user IDs
    const userIds = new Set();
    leads.forEach(lead => {
      if (lead.OwnerId) userIds.add(lead.OwnerId);
      if (lead.CreatedById) userIds.add(lead.CreatedById);
      if (lead.LastModifiedById) userIds.add(lead.LastModifiedById);
    });

    console.log(`Found ${userIds.size} unique Salesforce user IDs from leads table`);
    console.log('\nSample User IDs:');
    Array.from(userIds).slice(0, 20).forEach(id => console.log(`  ${id}`));

  } catch (error) {
    console.error('Error:', error);
  }
}

extractUsers();
