// Probe — does the user_roles table exist and what role names are in it?
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const { data, error } = await sb.from('user_roles').select('id, name').order('name');
if (error) {
  console.log('user_roles ERROR:', error.message);
  console.log('Anon may not be allowed to read; that\'s fine — service_role bulk script will still work.');
} else {
  console.log(`user_roles rows visible to anon: ${data.length}`);
  for (const r of data) console.log(`  ${r.name.padEnd(20)} ${r.id}`);
}
