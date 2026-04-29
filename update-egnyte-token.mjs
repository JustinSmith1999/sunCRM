import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// PASTE YOUR NEW TOKEN HERE:
const NEW_TOKEN = "PASTE_YOUR_TOKEN_HERE";

async function updateToken() {
  try {
    console.log('🔄 Updating Egnyte token...');

    const { data, error } = await supabase
      .from('api_credentials')
      .update({
        access_token: NEW_TOKEN,
        credentials: {
          domain: 'sunation.egnyte.com',
          api_key: NEW_TOKEN
        },
        is_active: true
      })
      .eq('service_name', 'egnyte')
      .select();

    if (error) throw error;

    console.log('✅ Token updated successfully!');
    console.log('Now run: node test-egnyte-direct.mjs');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateToken();
