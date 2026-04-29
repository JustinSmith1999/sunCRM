import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CaptivateIQConfig {
  api_key: string;
  base_url: string;
}

interface SyncRequest {
  action: 'sync_metrics' | 'sync_commissions' | 'sync_all';
  period_start?: string;
  period_end?: string;
  rep_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get CaptivateIQ config
    const { data: config, error: configError } = await supabase
      .from('captivateiq_config')
      .select('*')
      .single();

    if (configError || !config || !config.api_key) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'CaptivateIQ not configured. Please add your API key in the API Integrations Console.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { action, period_start, period_end, rep_id }: SyncRequest = await req.json();

    // Sync based on action
    let syncResult;
    if (action === 'sync_metrics' || action === 'sync_all') {
      syncResult = await syncMetrics(supabase, config, period_start, period_end, rep_id);
    }

    if (action === 'sync_commissions' || action === 'sync_all') {
      const commissionsResult = await syncCommissions(supabase, config, period_start, period_end, rep_id);
      syncResult = { ...syncResult, ...commissionsResult };
    }

    // Update last sync time
    await supabase
      .from('captivateiq_config')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', config.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'CaptivateIQ sync completed successfully',
        ...syncResult
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('CaptivateIQ sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function syncMetrics(
  supabase: any,
  config: CaptivateIQConfig,
  period_start?: string,
  period_end?: string,
  rep_id?: string
) {
  try {
    // CaptivateIQ API endpoint for metrics
    // Note: This is a placeholder - actual endpoint depends on CaptivateIQ API documentation
    const url = `${config.base_url}/v1/analytics/metrics`;

    const params = new URLSearchParams();
    if (period_start) params.append('start_date', period_start);
    if (period_end) params.append('end_date', period_end);
    if (rep_id) params.append('rep_id', rep_id);

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CaptivateIQ API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform and insert metrics
    // Note: This transformation depends on actual CaptivateIQ API response structure
    const metrics = data.metrics?.map((metric: any) => ({
      metric_type: metric.type,
      value: metric.value,
      period_type: metric.period_type || 'monthly',
      period_start: metric.period_start || period_start,
      period_end: metric.period_end || period_end,
      rep_id: metric.rep_id,
      rep_name: metric.rep_name,
      rep_email: metric.rep_email,
      team_name: metric.team_name,
      metadata: metric.metadata || {},
    })) || [];

    if (metrics.length > 0) {
      const { error } = await supabase
        .from('captivateiq_metrics')
        .upsert(metrics, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error inserting metrics:', error);
        throw error;
      }
    }

    return {
      metrics_synced: metrics.length
    };

  } catch (error) {
    console.error('Error syncing metrics:', error);
    throw error;
  }
}

async function syncCommissions(
  supabase: any,
  config: CaptivateIQConfig,
  period_start?: string,
  period_end?: string,
  rep_id?: string
) {
  try {
    // CaptivateIQ API endpoint for commissions
    // Note: This is a placeholder - actual endpoint depends on CaptivateIQ API documentation
    const url = `${config.base_url}/v1/commissions`;

    const params = new URLSearchParams();
    if (period_start) params.append('start_date', period_start);
    if (period_end) params.append('end_date', period_end);
    if (rep_id) params.append('rep_id', rep_id);

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CaptivateIQ API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform and insert commissions
    // Note: This transformation depends on actual CaptivateIQ API response structure
    const commissions = data.commissions?.map((commission: any) => ({
      captivateiq_id: commission.id,
      rep_name: commission.rep_name,
      rep_email: commission.rep_email,
      rep_id: commission.rep_id,
      period_name: commission.period_name,
      period_start: commission.period_start || period_start,
      period_end: commission.period_end || period_end,
      amount: commission.amount || 0,
      currency: commission.currency || 'USD',
      status: commission.status || 'pending',
      plan_name: commission.plan_name,
      quota_amount: commission.quota_amount || 0,
      quota_attainment: commission.quota_attainment || 0,
      total_revenue: commission.total_revenue || 0,
      deals_closed: commission.deals_closed || 0,
      metadata: commission.metadata || {},
    })) || [];

    if (commissions.length > 0) {
      const { error } = await supabase
        .from('captivateiq_commissions')
        .upsert(commissions, {
          onConflict: 'captivateiq_id'
        });

      if (error) {
        console.error('Error inserting commissions:', error);
        throw error;
      }
    }

    return {
      commissions_synced: commissions.length
    };

  } catch (error) {
    console.error('Error syncing commissions:', error);
    throw error;
  }
}
