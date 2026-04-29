import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Map titles to roles
const titleToRole = {
  'System Administrator': 'admin',
  'Sales Manager': 'sales_manager',
  'Sales Representative': 'sales_rep',
  'Support Specialist': 'support',
  'HR Manager': 'hr_manager',
  'Operations Manager': 'operations'
};

async function importUsers() {
  try {
    console.log('🔄 Starting user import process...\n');

    // Get Salesforce users with emails
    const { data: sfUsers, error: sfError } = await supabase
      .from('users')
      .select('Id, Name, Email, FirstName, LastName, Title, Department')
      .not('Email', 'is', null);

    if (sfError) {
      throw sfError;
    }

    console.log(`📋 Found ${sfUsers.length} Salesforce users with email addresses\n`);

    // Get all roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('id, name, display_name');

    if (rolesError) {
      throw rolesError;
    }

    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name] = role.id;
    });

    console.log('📝 Available roles:', roles.map(r => r.name).join(', '), '\n');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const sfUser of sfUsers) {
      const email = sfUser.Email.toLowerCase();
      const defaultPassword = 'Welcome123!'; // Users should change this on first login

      console.log(`\n👤 Processing: ${sfUser.Name} (${email})`);

      // Check if user already exists in auth
      const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingAuthUsers.users.find(u => u.email === email);

      let userId;

      if (existingUser) {
        console.log(`   ⚠️  Auth user already exists, updating profile...`);
        userId = existingUser.id;
        skipCount++;
      } else {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: defaultPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: sfUser.Name,
            first_name: sfUser.FirstName,
            last_name: sfUser.LastName
          }
        });

        if (authError) {
          console.error(`   ❌ Error creating auth user:`, authError.message);
          errorCount++;
          continue;
        }

        userId = authData.user.id;
        console.log(`   ✅ Created auth user (ID: ${userId})`);
        successCount++;
      }

      // Determine role based on title
      const roleName = titleToRole[sfUser.Title] || 'sales_rep'; // Default to sales_rep
      const roleId = roleMap[roleName];

      // Create or update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          salesforce_user_id: sfUser.Id,
          role_id: roleId,
          full_name: sfUser.Name,
          title: sfUser.Title,
          department: sfUser.Department,
          email: email,
          is_active: true
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error(`   ❌ Error creating profile:`, profileError.message);
        errorCount++;
      } else {
        console.log(`   ✅ Created/updated profile with role: ${roleName}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Import Summary:');
    console.log(`   ✅ Successfully created: ${successCount} users`);
    console.log(`   ⚠️  Already existed: ${skipCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    console.log('='.repeat(60));

    console.log('\n🔑 Default password for all new users: Welcome123!');
    console.log('   Users should change this on first login.\n');

    console.log('📝 Test credentials:');
    sfUsers.forEach(user => {
      const roleName = titleToRole[user.Title] || 'sales_rep';
      console.log(`   ${user.Email} / Welcome123! (${roleName})`);
    });

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

importUsers();
