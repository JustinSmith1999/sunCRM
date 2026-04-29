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

    const { ticketId } = await req.json();

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

    // Sync ticket to Atera
    await syncTicketToAtera(supabase, config, ticketId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in atera-sync-worker:', error);
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
      console.log('Ticket already synced to Atera');
      return;
    }

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

    console.log(`Successfully synced ticket ${ticketId} to Atera`);
  } catch (error) {
    console.error(`Error syncing ticket ${ticketId}:`, error);

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
