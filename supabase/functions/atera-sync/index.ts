import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AteraTicket {
  Title: string;
  TicketType: string;
  TicketStatus: string;
  TicketPriority: string;
  TicketImpact: string;
  Description: string;
  EndUserFirstName?: string;
  EndUserLastName?: string;
  EndUserEmail: string;
  EndUserPhone?: string;
  TechnicianEmail?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ticketId } = await req.json();

    // Get Atera configuration
    const { data: config } = await supabase
      .from('atera_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!config) {
      return new Response(
        JSON.stringify({ error: 'Atera integration not configured' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    switch (action) {
      case 'sync_ticket':
        return await syncTicketToAtera(supabase, config, ticketId);
      case 'sync_comment':
        return await syncCommentToAtera(supabase, config, ticketId);
      case 'sync_status':
        return await syncStatusToAtera(supabase, config, ticketId);
      case 'get_status':
        return await getTicketSyncStatus(supabase, ticketId);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    console.error('Error in atera-sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function syncTicketToAtera(supabase: any, config: any, ticketId: string) {
  try {
    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('it_support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error('Ticket not found');
    }

    // Check if already synced
    const { data: existingMapping } = await supabase
      .from('atera_ticket_mappings')
      .select('*')
      .eq('it_ticket_id', ticketId)
      .single();

    if (existingMapping) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Ticket already synced',
          atera_ticket_id: existingMapping.atera_ticket_id
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update ticket status
    await supabase
      .from('it_support_tickets')
      .update({ atera_sync_status: 'syncing' })
      .eq('id', ticketId);

    // Parse name from created_by_name
    const nameParts = ticket.created_by_name?.split(' ') || ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Map priority
    const priorityMap: { [key: string]: string } = {
      urgent: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    };

    // Map status
    const statusMap: { [key: string]: string } = {
      open: 'Open',
      in_progress: 'In Progress',
      waiting_on_user: 'Pending',
      resolved: 'Resolved',
      closed: 'Closed',
    };

    // Create Atera ticket
    const ateraTicket: AteraTicket = {
      Title: ticket.subject,
      TicketType: 'Problem',
      TicketStatus: statusMap[ticket.status] || 'Open',
      TicketPriority: priorityMap[ticket.priority] || 'Medium',
      TicketImpact: priorityMap[ticket.priority] || 'Medium',
      Description: `${ticket.description}\n\nCategory: ${ticket.category}\nTicket Number: ${ticket.ticket_number}`,
      EndUserFirstName: firstName,
      EndUserLastName: lastName,
      EndUserEmail: ticket.created_by_email,
      TechnicianEmail: 'tech@sunation.com',
    };

    // Send to Atera API
    const ateraResponse = await fetch(`${config.api_url}/tickets`, {
      method: 'POST',
      headers: {
        'X-API-KEY': config.api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ateraTicket),
    });

    if (!ateraResponse.ok) {
      const errorText = await ateraResponse.text();
      throw new Error(`Atera API error: ${errorText}`);
    }

    const ateraResult = await ateraResponse.json();

    // Create mapping
    await supabase
      .from('atera_ticket_mappings')
      .insert({
        it_ticket_id: ticketId,
        atera_ticket_id: ateraResult.TicketID || ateraResult.ticketID,
        atera_ticket_number: ateraResult.TicketNumber || ateraResult.ticketNumber,
        sync_status: 'synced',
      });

    // Update ticket
    await supabase
      .from('it_support_tickets')
      .update({
        synced_to_atera: true,
        atera_sync_status: 'synced',
        last_atera_sync: new Date().toISOString(),
      })
      .eq('id', ticketId);

    // Log sync
    await supabase
      .from('atera_sync_log')
      .insert({
        ticket_id: ticketId,
        action: 'create',
        direction: 'to_atera',
        status: 'success',
        request_data: ateraTicket,
        response_data: ateraResult,
      });

    return new Response(
      JSON.stringify({
        success: true,
        atera_ticket_id: ateraResult.TicketID || ateraResult.ticketID,
        atera_ticket_number: ateraResult.TicketNumber || ateraResult.ticketNumber,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Log error
    await supabase
      .from('atera_sync_log')
      .insert({
        ticket_id: ticketId,
        action: 'create',
        direction: 'to_atera',
        status: 'error',
        error_message: error.message,
      });

    // Update ticket status
    await supabase
      .from('it_support_tickets')
      .update({ atera_sync_status: 'error' })
      .eq('id', ticketId);

    throw error;
  }
}

async function syncCommentToAtera(supabase: any, config: any, ticketId: string) {
  try {
    // Get mapping
    const { data: mapping } = await supabase
      .from('atera_ticket_mappings')
      .select('*')
      .eq('it_ticket_id', ticketId)
      .single();

    if (!mapping) {
      throw new Error('Ticket not synced to Atera');
    }

    // Get latest comment
    const { data: comments } = await supabase
      .from('it_ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('is_internal', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!comments || comments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No comments to sync' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const comment = comments[0];

    // Add comment to Atera ticket
    const ateraResponse = await fetch(
      `${config.api_url}/tickets/${mapping.atera_ticket_id}/comments`,
      {
        method: 'POST',
        headers: {
          'X-API-KEY': config.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Comment: comment.comment,
          IsInternal: false,
        }),
      }
    );

    if (!ateraResponse.ok) {
      throw new Error(`Atera API error: ${await ateraResponse.text()}`);
    }

    // Log sync
    await supabase
      .from('atera_sync_log')
      .insert({
        ticket_id: ticketId,
        action: 'comment',
        direction: 'to_atera',
        status: 'success',
        request_data: { comment: comment.comment },
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Comment synced to Atera' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    await supabase
      .from('atera_sync_log')
      .insert({
        ticket_id: ticketId,
        action: 'comment',
        direction: 'to_atera',
        status: 'error',
        error_message: error.message,
      });

    throw error;
  }
}

async function syncStatusToAtera(supabase: any, config: any, ticketId: string) {
  try {
    // Get ticket and mapping
    const { data: ticket } = await supabase
      .from('it_support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    const { data: mapping } = await supabase
      .from('atera_ticket_mappings')
      .select('*')
      .eq('it_ticket_id', ticketId)
      .single();

    if (!mapping) {
      throw new Error('Ticket not synced to Atera');
    }

    // Map status
    const statusMap: { [key: string]: string } = {
      open: 'Open',
      in_progress: 'In Progress',
      waiting_on_user: 'Pending',
      resolved: 'Resolved',
      closed: 'Closed',
    };

    // Update Atera ticket status
    const ateraResponse = await fetch(
      `${config.api_url}/tickets/${mapping.atera_ticket_id}`,
      {
        method: 'PUT',
        headers: {
          'X-API-KEY': config.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          TicketStatus: statusMap[ticket.status] || 'Open',
        }),
      }
    );

    if (!ateraResponse.ok) {
      throw new Error(`Atera API error: ${await ateraResponse.text()}`);
    }

    // Log sync
    await supabase
      .from('atera_sync_log')
      .insert({
        ticket_id: ticketId,
        action: 'update',
        direction: 'to_atera',
        status: 'success',
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Status synced to Atera' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    await supabase
      .from('atera_sync_log')
      .insert({
        ticket_id: ticketId,
        action: 'update',
        direction: 'to_atera',
        status: 'error',
        error_message: error.message,
      });

    throw error;
  }
}

async function getTicketSyncStatus(supabase: any, ticketId: string) {
  const { data: mapping } = await supabase
    .from('atera_ticket_mappings')
    .select('*')
    .eq('it_ticket_id', ticketId)
    .single();

  const { data: logs } = await supabase
    .from('atera_sync_log')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
    .limit(10);

  return new Response(
    JSON.stringify({
      mapping,
      logs,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
