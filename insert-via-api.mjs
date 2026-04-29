import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) acc[m[1].trim()] = m[2].trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// Get user and org
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  console.error('❌ Not authenticated. You need to log in to the app first.');
  console.log('\n📝 Steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Open browser and log in');
  console.log('3. Then run this script again\n');
  process.exit(1);
}

const { data: profile } = await supabase.from('user_profiles').select('id').eq('id', user.id).maybeSingle();
const { data: orgRole } = await supabase.from('user_organization_roles').select('organization_id').eq('user_id', user.id).maybeSingle();

if (!profile || !orgRole) {
  console.error('❌ No profile or organization found');
  process.exit(1);
}

console.log(`✓ Logged in as: ${user.email}`);
console.log(`✓ User ID: ${profile.id.substring(0,8)}...`);
console.log(`✓ Org ID: ${orgRole.organization_id.substring(0,8)}...\n`);

const leads = [
  { first_name: 'Paul', last_name: 'Fodor', email: 'lead+827090@msg.energysage.com', lead_source: 'EnergySage', street: '22 Bobcat Lane', city: 'Setauket', state: 'NY', postal_code: '11733' },
  { first_name: 'Bruce', last_name: 'Wayne', email: 'batman@gmail.com', phone: '(696) 532-9876', lead_source: 'Three Ships', street: '5321 S. Bat St', city: 'Gotham', state: 'NY', postal_code: '26325' }
];

let inserted = 0;
for (const lead of leads) {
  const { error } = await supabase.from('leads').insert({
    organization_id: orgRole.organization_id,
    owner_id: profile.id,
    ...lead,
    status: 'New'
  });
  if (!error) {
    console.log(`✅ ${lead.first_name} ${lead.last_name}`);
    inserted++;
  } else {
    console.error(`❌ ${lead.first_name} ${lead.last_name}: ${error.message}`);
  }
}

console.log(`\n✅ Inserted ${inserted} leads`);
