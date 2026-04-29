import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupAdminAccount() {
  try {
    const email = 'mstegmeier@sunation.com';
    const userId = '0ba1031c-3c94-4c84-b74e-c897a7a1ab2f';

    console.log('Setting up admin account for:', email);
    console.log('User ID:', userId);

    // Check if user_profiles exists and update/create profile
    const { data: profile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileCheckError);
      throw profileCheckError;
    }

    if (profile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: 'admin',
          password_change_required: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }
      console.log('✓ Updated user profile with admin role');
    } else {
      // Create new profile
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: email,
          full_name: 'Michael Stegmeier',
          role: 'admin',
          department: 'Executive',
          password_change_required: true,
          is_active: true
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
        throw insertError;
      }
      console.log('✓ Created user profile with admin role');
    }

    // Verify password change required flag
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('role, password_change_required, email')
      .eq('id', userId)
      .single();

    if (verifyError) {
      console.error('Error verifying profile:', verifyError);
      throw verifyError;
    }

    console.log('\n✅ Admin profile updated!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', verifyProfile?.email);
    console.log('Role:', verifyProfile?.role);
    console.log('Password Change Required:', verifyProfile?.password_change_required);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  NOTE:');
    console.log('To update the password, use the Supabase dashboard:');
    console.log('1. Go to Authentication > Users');
    console.log('2. Find mstegmeier@sunation.com');
    console.log('3. Click the three dots and select "Reset Password"');
    console.log('4. Set temporary password to: Solar171!');
    console.log('\nOr use the create-admin edge function which has service role access.');

  } catch (error) {
    console.error('Error setting up admin account:', error);
  }
}

setupAdminAccount();
