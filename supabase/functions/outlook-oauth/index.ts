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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // If we have code and state, it's a Microsoft OAuth callback (no action param)
    const isCallback = code && state && !action;

    // Get Microsoft credentials from api_credentials table
    const { data: msCredentials, error: credsError } = await supabase
      .from('api_credentials')
      .select('credentials')
      .eq('service_name', 'microsoft_graph')
      .eq('is_active', true)
      .maybeSingle();

    if (credsError || !msCredentials) {
      return new Response(
        JSON.stringify({
          error: 'Microsoft Graph not configured. Please add credentials in Admin → API Integrations.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const credentials = msCredentials.credentials as any;
    const { client_id, client_secret, redirect_uri } = credentials;

    // Action: Get authorization URL
    if (action === 'authorize') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        throw new Error('Invalid user token');
      }

      const scopes = [
        'offline_access',
        'Calendars.ReadWrite',
        'User.Read'
      ].join(' ');

      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${client_id}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&state=${user.id}` +
        `&response_mode=query`;

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Exchange code for tokens (handles both direct callback and action=callback)
    if (isCallback || action === 'callback') {
      if (!code || !state) {
        // Get the base URL
        const baseUrl = redirect_uri.includes('localhost')
          ? 'http://localhost:5173'
          : redirect_uri.replace('/functions/v1/outlook-oauth', '');

        // Redirect back to app with error
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': `${baseUrl}/calendar?error=missing_params`
          }
        });
      }

      const userId = state;

      // Exchange code for tokens
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id,
          client_secret,
          code,
          redirect_uri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      const tokens = await tokenResponse.json();

      // Get user info from Microsoft Graph
      const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      const userInfo = await userInfoResponse.json();

      // Calculate token expiry
      const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

      // Store connection
      const { error: insertError } = await supabase
        .from('outlook_connections')
        .upsert({
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          email: userInfo.mail || userInfo.userPrincipalName,
          display_name: userInfo.displayName,
          is_active: true,
          last_sync_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (insertError) {
        throw insertError;
      }

      // Get the base URL from the redirect_uri or construct it
      const baseUrl = redirect_uri.includes('localhost')
        ? 'http://localhost:5173'
        : redirect_uri.replace('/functions/v1/outlook-oauth', '');

      // Redirect back to calendar page with success
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${baseUrl}/calendar?connected=true&email=${encodeURIComponent(userInfo.mail || userInfo.userPrincipalName)}`
        }
      });
    }

    // Action: Disconnect
    if (action === 'disconnect') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        throw new Error('Invalid user token');
      }

      const { error: deleteError } = await supabase
        .from('outlook_connections')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Outlook calendar disconnected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Refresh token
    if (action === 'refresh') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        throw new Error('Invalid user token');
      }

      // Get current connection
      const { data: connection, error: connError } = await supabase
        .from('outlook_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (connError || !connection) {
        throw new Error('No Outlook connection found');
      }

      // Refresh the token
      const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id,
          client_secret,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        throw new Error(`Token refresh failed: ${errorText}`);
      }

      const newTokens = await refreshResponse.json();
      const expiresAt = new Date(Date.now() + (newTokens.expires_in * 1000));

      // Update connection
      const { error: updateError } = await supabase
        .from('outlook_connections')
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token || connection.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Token refreshed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
