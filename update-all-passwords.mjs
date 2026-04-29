import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const DEFAULT_PASSWORD = 'sunation9454';

console.log('Fetching all Sunation users...');

const { data: users, error: fetchError } = await supabase
  .from('user_profiles')
  .select('id, email, full_name')
  .like('email', '%@sunation.com');

if (fetchError) {
  console.error('Error fetching users:', fetchError);
  process.exit(1);
}

console.log(`Found ${users.length} users to update`);

let updated = 0;
let errors = 0;

for (const user of users) {
  try {
    const { error: authError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: DEFAULT_PASSWORD }
    );

    if (authError) throw authError;

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ temporary_password: DEFAULT_PASSWORD })
      .eq('id', user.id);

    if (profileError) throw profileError;

    updated++;
    console.log(`✓ Updated ${user.email}`);
  } catch (error) {
    errors++;
    console.error(`✗ Failed to update ${user.email}:`, error.message);
  }
}

console.log(`\nComplete!`);
console.log(`Updated: ${updated}`);
console.log(`Errors: ${errors}`);
console.log(`\nAll users can now login with password: ${DEFAULT_PASSWORD}`);
