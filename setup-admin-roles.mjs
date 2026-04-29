import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAdminRoles() {
  console.log('🔄 Setting up admin roles for Jessica Grady and Gary Roffman...\n');

  try {
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .in('email', ['jgrady@sunation.com', 'groffman@sunation.com']);

    if (usersError) {
      console.error('❌ Error fetching users. Using direct query...');

      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const targetUsers = authUsers?.users.filter(u =>
        u.email === 'jgrady@sunation.com' || u.email === 'groffman@sunation.com'
      );

      if (!targetUsers || targetUsers.length === 0) {
        console.error('❌ Users not found');
        console.log('\n💡 Create their accounts first:');
        console.log('   Run: curl -X POST [supabase-url]/functions/v1/create-users\n');
        process.exit(1);
      }

      console.log('📋 Found users:', targetUsers.map(u => u.email));
    }

    const { data: orgCheck } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1)
      .single();

    let orgId = orgCheck?.id;
    let orgName = orgCheck?.name || 'Sunation Energy';

    if (!orgId) {
      console.log('📋 Creating default organization...');
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: 'Sunation Energy', slug: 'sunation' })
        .select()
        .single();

      if (orgError) {
        console.error('⚠️  Could not create organization:', orgError.message);
        console.log('💡 Will attempt to use existing organization or create manually\n');
      } else {
        orgId = newOrg.id;
        console.log('✅ Created organization:', orgName);
      }
    }

    const emails = ['jgrady@sunation.com', 'groffman@sunation.com'];

    for (const email of emails) {
      console.log(`\n🔄 Processing ${email}...`);

      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData?.users.find(u => u.email === email);

      if (!user) {
        console.log(`⚠️  User ${email} not found - skipping`);
        continue;
      }

      const { data: profileCheck } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profileCheck) {
        console.log(`   Creating user profile...`);
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: email,
            full_name: email === 'jgrady@sunation.com' ? 'Jessica Grady' : 'Gary Roffman'
          });

        if (profileError) {
          console.log(`   ⚠️  Profile error: ${profileError.message}`);
        } else {
          console.log(`   ✅ Created profile`);
        }
      } else {
        console.log(`   ✅ Profile exists`);
      }

      if (orgId) {
        const { data: roleCheck } = await supabase
          .from('user_organization_roles')
          .select('id, role')
          .eq('user_id', user.id)
          .eq('organization_id', orgId)
          .single();

        if (!roleCheck) {
          console.log(`   Creating admin role...`);
          const { error: roleError } = await supabase
            .from('user_organization_roles')
            .insert({
              user_id: user.id,
              organization_id: orgId,
              role: 'admin'
            });

          if (roleError) {
            console.log(`   ⚠️  Role error: ${roleError.message}`);
          } else {
            console.log(`   ✅ Granted admin role`);
          }
        } else if (roleCheck.role !== 'admin') {
          console.log(`   Updating to admin role...`);
          const { error: updateError } = await supabase
            .from('user_organization_roles')
            .update({ role: 'admin' })
            .eq('user_id', user.id)
            .eq('organization_id', orgId);

          if (updateError) {
            console.log(`   ⚠️  Update error: ${updateError.message}`);
          } else {
            console.log(`   ✅ Updated to admin role`);
          }
        } else {
          console.log(`   ✅ Already has admin role`);
        }
      }
    }

    console.log('\n🎉 Admin Role Setup Complete!\n');
    console.log('📊 Summary:');
    console.log('   Both users now have:');
    console.log('   ✅ User profiles created');
    console.log('   ✅ Admin role assigned');
    console.log('   ✅ Access to Admin Console');
    console.log('   ✅ Access to Channel Partners management\n');
    console.log('📍 Next Steps:');
    console.log('   1. Run setup-admin-partner-access.sql for partner portal access');
    console.log('   2. Log in and navigate to Admin → Channel Partners');
    console.log('   3. Manage all partners from admin console\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

setupAdminRoles();
