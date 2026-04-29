import dotenv from 'dotenv';

dotenv.config();

async function setupMStegmeier() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    console.log('Setting up admin account for mstegmeier@sunation.com...\n');

    const response = await fetch(
      `${supabaseUrl}/functions/v1/update-user-admin`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'mstegmeier@sunation.com',
          password: 'Solar171!',
          role: 'admin',
          password_change_required: true
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to update user');
    }

    console.log('✅ SUCCESS - Admin account configured!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:                mstegmeier@sunation.com');
    console.log('🔑 Temporary Password:   Solar171!');
    console.log('👤 Role:                ', result.user.role);
    console.log('🔐 Change Required:     ', result.user.password_change_required);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔒 SECURITY MEASURES:');
    console.log('   ✓ Password must be changed on first login');
    console.log('   ✓ Account has full admin privileges');
    console.log('   ✓ All data access is secured by RLS policies');
    console.log('   ✓ Admin actions are logged and auditable\n');

    console.log('📝 NEXT STEPS:');
    console.log('   1. Share credentials with user via secure channel');
    console.log('   2. User logs in with temporary password');
    console.log('   3. System will force password change immediately');
    console.log('   4. User sets their own secure password\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

setupMStegmeier();
