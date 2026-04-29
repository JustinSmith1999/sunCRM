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

async function createAdminAccount() {
  console.log('Creating admin@company.com account...');

  try {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@company.com',
      password: 'sunation9454',
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator',
        role: 'admin'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('✓ Auth user created:', authUser.user.id);

    const { error: roleError } = await supabase
      .from('user_organization_roles')
      .insert({
        user_id: authUser.user.id,
        role: 'admin',
        permissions: ['all']
      });

    if (roleError) {
      console.error('Error creating role:', roleError);
      return;
    }

    console.log('✓ Admin role assigned');

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authUser.user.id,
        full_name: 'System Administrator',
        role: 'admin',
        department: 'IT',
        temporary_password: 'sunation9454',
        password_change_required: true
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return;
    }

    console.log('✓ User profile created');
    console.log('\n✅ admin@company.com is ready!');
    console.log('   Email: admin@company.com');
    console.log('   Password: sunation9454');
    console.log('   Role: admin');

  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminAccount();
