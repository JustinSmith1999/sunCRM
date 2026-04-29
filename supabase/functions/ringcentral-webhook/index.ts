import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, validation-token',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const payload = await req.json();

      const validationToken = req.headers.get('validation-token');
      if (validationToken) {
        return new Response(
          JSON.stringify({ validationToken }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'validation-token': validationToken },
            status: 200
          }
        );
      }

      if (payload.event === '/restapi/v1.0/account/~/extension/~/telephony/sessions') {
        await handleTelephonyEvent(supabaseClient, payload);
      } else if (payload.event === '/restapi/v1.0/account/~/extension/~/presence') {
        await handlePresenceEvent(supabaseClient, payload);
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function handleTelephonyEvent(supabase: any, payload: any) {
  try {
    const { body } = payload;

    if (body.telephonyStatus !== 'CallConnected' && body.telephonyStatus !== 'Disconnected') {
      return;
    }

    const extensionId = body.extensionId || payload.ownerId;
    const { data: userCreds } = await supabase
      .from('ringcentral_user_credentials')
      .select('user_id, organization_id')
      .eq('extension_id', extensionId)
      .eq('is_active', true)
      .maybeSingle();

    if (!userCreds) {
      console.log('No user credentials found for extension:', extensionId);
      return;
    }

    const phoneNumber = body.direction === 'Inbound'
      ? body.from?.phoneNumber
      : body.to?.phoneNumber;

    const { data: contact } = await supabase
      .from('contacts')
      .select('id, account_id')
      .eq('organization_id', userCreds.organization_id)
      .or(`phone.eq."${phoneNumber}",mobile.eq."${phoneNumber}"`)
      .maybeSingle();

    const { error } = await supabase
      .from('ringcentral_events')
      .insert({
        organization_id: userCreds.organization_id,
        user_id: userCreds.user_id,
        event_type: 'telephony',
        session_id: body.telephonySessionId,
        direction: body.direction,
        from_number: body.from?.phoneNumber,
        to_number: body.to?.phoneNumber,
        status: body.telephonyStatus,
        start_time: body.startTime,
        duration: body.duration,
        contact_id: contact?.id || null,
        account_id: contact?.account_id || null,
        raw_data: body,
        processed: false
      });

    if (error) {
      console.error('Error storing telephony event:', error);
    }
  } catch (error) {
    console.error('Error handling telephony event:', error);
  }
}

async function handlePresenceEvent(supabase: any, payload: any) {
  try {
    const { body } = payload;
    const extensionId = body.extensionId;

    const { data: userCreds } = await supabase
      .from('ringcentral_user_credentials')
      .select('user_id')
      .eq('extension_id', extensionId)
      .eq('is_active', true)
      .maybeSingle();

    if (!userCreds) return;

    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: userCreds.user_id,
        extension_id: body.extensionId,
        presence_status: body.presenceStatus,
        telephony_status: body.telephonyStatus,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating presence:', error);
    }
  } catch (error) {
    console.error('Error handling presence event:', error);
  }
}