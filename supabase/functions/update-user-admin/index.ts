import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, password, role, password_change_required } = body;

    if (!email) {
      throw new Error('email is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const user = users.users.find(u => u.email === email);
    if (!user) {
      throw new Error('User not found');
    }

    // Update password if provided
    if (password) {
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password }
      );
      if (passwordError) throw passwordError;
    }

    // Update user profile
    const updateData: any = {};
    if (role) updateData.role = role;
    if (password_change_required !== undefined) {
      updateData.password_change_required = password_change_required;
    }
    updateData.updated_at = new Date().toISOString();

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;
    } else {
      // Create profile
      const { error: insertError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || email.split('@')[0],
          role: role || 'user',
          password_change_required: password_change_required !== undefined ? password_change_required : false,
          is_active: true
        });

      if (insertError) throw insertError;
    }

    // Get updated profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User updated successfully',
        user: {
          id: user.id,
          email: user.email,
          role: profile?.role,
          password_change_required: profile?.password_change_required,
          password_updated: !!password
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
