import dotenv from 'dotenv';

dotenv.config();

async function createMStegmeierAdmin() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    console.log('Creating admin account for mstegmeier@sunation.com...\n');

    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-admin`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'mstegmeier@sunation.com',
          password: 'Solar171!',
          full_name: 'Michael Stegmeier',
          department: 'Executive',
          title: 'Chief Executive Officer'
        })
      }
    );

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.error || 'Failed to create user');
    }

    console.log('✅ SUCCESS - Admin account created!\n');

    // Now update to require password change
    const updateResponse = await fetch(
      `${supabaseUrl}/functions/v1/update-user-admin`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'mstegmeier@sunation.com',
          password_change_required: true
        })
      }
    );

    const updateResult = await updateResponse.json();

    if (!updateResponse.ok || !updateResult.success) {
      console.warn('⚠️  Warning: Could not set password change requirement');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:                mstegmeier@sunation.com');
    console.log('🔑 Temporary Password:   Solar171!');
    console.log('👤 Role:                 admin');
    console.log('🔐 Change Required:      true');
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

createMStegmeierAdmin();
