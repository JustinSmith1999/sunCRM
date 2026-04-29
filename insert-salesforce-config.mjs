import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertConfig() {
  console.log('Inserting Salesforce connection config...');

  // Check if config already exists
  const { data: existing } = await supabase
    .from('salesforce_sync_config')
    .select('id')
    .eq('organization_id', '00000000-0000-0000-0000-000000000000')
    .maybeSingle();

  const configData = {
    organization_id: '00000000-0000-0000-0000-000000000000',
    salesforce_instance_url: process.env.SALESFORCE_INSTANCE_URL || 'https://sunation.my.salesforce.com',
    client_id: process.env.SALESFORCE_CLIENT_ID,
    client_secret: process.env.SALESFORCE_CLIENT_SECRET,
    access_token: 'synced',
    refresh_token: null,
    token_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    is_sandbox: false,
    sync_enabled: true,
    salesforce_api_version: 'v60.0',
    last_sync_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from('salesforce_sync_config')
      .update(configData)
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating config:', error);
    } else {
      console.log('✓ Updated Salesforce config');
    }
  } else {
    const { error } = await supabase
      .from('salesforce_sync_config')
      .insert(configData);

    if (error) {
      console.error('Error inserting config:', error);
    } else {
      console.log('✓ Inserted Salesforce config');
    }
  }

  // Insert object mappings
  const mappings = [
    { salesforce_object: 'Lead', supabase_table: 'leads' },
    { salesforce_object: 'Account', supabase_table: 'accounts' },
    { salesforce_object: 'Contact', supabase_table: 'salesforce_contacts' },
    { salesforce_object: 'Opportunity', supabase_table: 'opportunities' },
    { salesforce_object: 'User', supabase_table: 'salesforce_users' },
    { salesforce_object: 'Case', supabase_table: 'cases' },
    { salesforce_object: 'Campaign', supabase_table: 'campaigns' },
    { salesforce_object: 'Quote', supabase_table: 'salesforce_quotes' },
    { salesforce_object: 'Document', supabase_table: 'salesforce_documents' },
  ];

  for (const mapping of mappings) {
    const { error } = await supabase
      .from('salesforce_object_mappings')
      .upsert({
        organization_id: '00000000-0000-0000-0000-000000000000',
        salesforce_object: mapping.salesforce_object,
        supabase_table: mapping.supabase_table,
        sync_enabled: true,
        sync_mode: 'incremental',
        order_by: 'SystemModstamp ASC',
        batch_size: 200,
      }, {
        onConflict: 'organization_id,salesforce_object',
      });

    if (error) {
      console.error(`Error upserting mapping for ${mapping.salesforce_object}:`, error);
    } else {
      console.log(`✓ Upserted mapping for ${mapping.salesforce_object}`);
    }
  }

  console.log('\n✅ Salesforce config inserted! Your UI should now show as connected.');
}

insertConfig().catch(console.error);
