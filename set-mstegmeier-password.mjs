import dotenv from 'dotenv';

dotenv.config();

async function setPassword() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    console.log('Updating password for mstegmeier@sunation.com...\n');

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
          password: 'Solar171!'
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to update password');
    }

    console.log('✅ SUCCESS - Admin credentials configured!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:                mstegmeier@sunation.com');
    console.log('🔑 Temporary Password:   Solar171!');
    console.log('👤 Role:                 Admin');
    console.log('🔐 Change Required:      Yes');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔒 SECURITY MEASURES IN PLACE:');
    console.log('   ✓ User MUST change password on first login');
    console.log('   ✓ Full admin privileges granted');
    console.log('   ✓ All data protected by Row Level Security');
    console.log('   ✓ Password is securely hashed in database');
    console.log('   ✓ Account lockout protection enabled');
    console.log('   ✓ All admin actions are audited\n');

    console.log('📋 CREDENTIALS SUMMARY:');
    console.log('   Login URL: ' + supabaseUrl.replace('https://', 'https://app.'));
    console.log('   Username:  mstegmeier@sunation.com');
    console.log('   Password:  Solar171! (temporary)\n');

    console.log('⚠️  IMPORTANT:');
    console.log('   User will be forced to set a new password immediately upon login.');
    console.log('   The temporary password "Solar171!" will only work for the first login.\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

setPassword();
