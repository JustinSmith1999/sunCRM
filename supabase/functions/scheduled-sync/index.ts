import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYNC_OBJECTS = [
  'Lead',
  'Account',
  'Contact',
  'Opportunity',
  'Campaign',
  'CampaignMember',
  'Case',
  'Task',
  'Event',
  'Product2',
  'OpportunityLineItem',
  'User',
  'Quote',
  'Document'
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    console.log('Starting scheduled Salesforce sync...');

    const results: Record<string, any> = {};
    let totalImported = 0;
    let totalFailed = 0;

    for (const object of SYNC_OBJECTS) {
      console.log(`\nSyncing ${object}...`);

      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/salesforce-sync?object=${object}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          const error = await response.text();
          console.error(`Failed to sync ${object}:`, error);
          results[object] = { error };
          totalFailed++;
          continue;
        }

        const result = await response.json();
        results[object] = result.objects[object];

        if (result.objects[object]) {
          totalImported += result.objects[object].imported || 0;
          console.log(`✓ ${object}: ${result.objects[object].imported} imported`);
        }
      } catch (error: any) {
        console.error(`Error syncing ${object}:`, error.message);
        results[object] = { error: error.message };
        totalFailed++;
      }
    }

    console.log(`\nSync complete: ${totalImported} total records imported, ${totalFailed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        totalImported,
        totalFailed,
        results
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error: any) {
    console.error('Scheduled sync error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
});