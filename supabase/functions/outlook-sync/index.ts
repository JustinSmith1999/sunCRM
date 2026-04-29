import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

async function refreshTokenIfNeeded(supabase: any, connection: any, credentials: any) {
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();

  // Refresh if token expires in less than 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!refreshResponse.ok) {
      throw new Error('Failed to refresh token');
    }

    const newTokens = await refreshResponse.json();
    const newExpiresAt = new Date(Date.now() + (newTokens.expires_in * 1000));

    await supabase
      .from('outlook_connections')
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || connection.refresh_token,
        token_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', connection.user_id);

    return newTokens.access_token;
  }

  return connection.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'sync';

    // Get Outlook connection
    const { data: connection, error: connError } = await supabase
      .from('outlook_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'Outlook not connected. Please connect your calendar first.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get Microsoft credentials
    const { data: msCredentials, error: credsError } = await supabase
      .from('api_credentials')
      .select('credentials')
      .eq('service_name', 'microsoft_graph')
      .eq('is_active', true)
      .maybeSingle();

    if (credsError || !msCredentials) {
      throw new Error('Microsoft Graph not configured');
    }

    const credentials = msCredentials.credentials as any;
    const accessToken = await refreshTokenIfNeeded(supabase, connection, credentials);

    // Action: Create event directly from event data (for service tickets, etc.)
    if (action === 'create_event') {
      const { event } = await req.json();

      if (!event) {
        throw new Error('Event data is required');
      }

      const createResponse = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create Outlook event: ${errorText}`);
      }

      const outlookEvent = await createResponse.json();

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Event created in Outlook',
          outlookEventId: outlookEvent.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Create event in Outlook from appointment
    if (action === 'create') {
      const { appointmentId } = await req.json();

      // Get appointment details
      const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .select('*, appointment_attendees(*)')
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (apptError || !appointment) {
        throw new Error('Appointment not found');
      }

      // Create event in Outlook
      const eventData = {
        subject: appointment.subject,
        body: {
          contentType: 'Text',
          content: appointment.description || ''
        },
        start: {
          dateTime: appointment.start_time,
          timeZone: 'UTC'
        },
        end: {
          dateTime: appointment.end_time,
          timeZone: 'UTC'
        },
        location: {
          displayName: appointment.location || ''
        },
        isAllDay: appointment.is_all_day,
        reminderMinutesBeforeStart: appointment.reminder_minutes,
        attendees: appointment.appointment_attendees.map((a: any) => ({
          emailAddress: {
            address: a.email,
            name: a.name || a.email
          },
          type: a.is_organizer ? 'required' : 'optional'
        }))
      };

      const createResponse = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create Outlook event: ${errorText}`);
      }

      const outlookEvent = await createResponse.json();

      // Update appointment with Outlook event ID
      await supabase
        .from('appointments')
        .update({
          outlook_event_id: outlookEvent.id,
          synced_to_outlook: true,
          sync_error: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Appointment synced to Outlook',
          outlookEventId: outlookEvent.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Update event in Outlook
    if (action === 'update') {
      const { appointmentId } = await req.json();

      const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .select('*, appointment_attendees(*)')
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (apptError || !appointment || !appointment.outlook_event_id) {
        throw new Error('Appointment not found or not synced');
      }

      const eventData = {
        subject: appointment.subject,
        body: {
          contentType: 'Text',
          content: appointment.description || ''
        },
        start: {
          dateTime: appointment.start_time,
          timeZone: 'UTC'
        },
        end: {
          dateTime: appointment.end_time,
          timeZone: 'UTC'
        },
        location: {
          displayName: appointment.location || ''
        },
        isAllDay: appointment.is_all_day,
        reminderMinutesBeforeStart: appointment.reminder_minutes,
        attendees: appointment.appointment_attendees.map((a: any) => ({
          emailAddress: {
            address: a.email,
            name: a.name || a.email
          },
          type: a.is_organizer ? 'required' : 'optional'
        }))
      };

      const updateResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/events/${appointment.outlook_event_id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Failed to update Outlook event: ${errorText}`);
      }

      await supabase
        .from('appointments')
        .update({
          synced_to_outlook: true,
          sync_error: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      return new Response(
        JSON.stringify({ success: true, message: 'Appointment updated in Outlook' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Delete event from Outlook
    if (action === 'delete') {
      const { appointmentId } = await req.json();

      const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (apptError || !appointment || !appointment.outlook_event_id) {
        throw new Error('Appointment not found or not synced');
      }

      const deleteResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/events/${appointment.outlook_event_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        const errorText = await deleteResponse.text();
        throw new Error(`Failed to delete Outlook event: ${errorText}`);
      }

      await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      return new Response(
        JSON.stringify({ success: true, message: 'Appointment deleted from Outlook' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Sync from Outlook (pull events)
    if (action === 'sync') {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const eventsUrl = `https://graph.microsoft.com/v1.0/me/calendarview` +
        `?startDateTime=${startDate.toISOString()}` +
        `&endDateTime=${endDate.toISOString()}` +
        `&$select=id,subject,body,start,end,location,isAllDay,attendees` +
        `&$top=100`;

      const eventsResponse = await fetch(eventsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!eventsResponse.ok) {
        const errorText = await eventsResponse.text();
        throw new Error(`Failed to fetch Outlook events: ${errorText}`);
      }

      const eventsData = await eventsResponse.json();
      const events = eventsData.value || [];

      let synced = 0;
      for (const event of events) {
        // Check if event already exists
        const { data: existing } = await supabase
          .from('appointments')
          .select('id')
          .eq('outlook_event_id', event.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!existing) {
          await supabase
            .from('appointments')
            .insert({
              user_id: user.id,
              outlook_event_id: event.id,
              subject: event.subject,
              description: event.body?.content || null,
              location: event.location?.displayName || null,
              start_time: event.start.dateTime,
              end_time: event.end.dateTime,
              is_all_day: event.isAllDay,
              synced_to_outlook: true,
              status: 'scheduled'
            });
          synced++;
        }
      }

      // Update last sync time
      await supabase
        .from('outlook_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', user.id);

      // Log sync
      await supabase
        .from('calendar_sync_log')
        .insert({
          user_id: user.id,
          sync_type: 'pull',
          status: 'success',
          events_synced: synced
        });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Synced ${synced} new events from Outlook`,
          total: events.length,
          new: synced
        }),
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
