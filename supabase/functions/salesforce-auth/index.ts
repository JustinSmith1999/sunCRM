import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SalesforceTokenResponse {
  access_token: string;
  instance_url: string;
  token_type: string;
  issued_at?: string;
}

async function getSalesforceToken(
  username: string,
  password: string,
  securityToken: string,
  clientId: string,
  clientSecret: string,
  isSandbox: boolean
): Promise<SalesforceTokenResponse> {
  const tokenEndpoint = isSandbox
    ? "https://test.salesforce.com/services/oauth2/token"
    : "https://login.salesforce.com/services/oauth2/token";

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: clientId,
      client_secret: clientSecret,
      username: username,
      password: password + securityToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Salesforce token: ${errorText}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get Salesforce credentials from environment
    const clientId = Deno.env.get("SALESFORCE_CLIENT_ID");
    const clientSecret = Deno.env.get("SALESFORCE_CLIENT_SECRET");
    const username = Deno.env.get("SALESFORCE_USERNAME");
    const password = Deno.env.get("SALESFORCE_PASSWORD");
    // Security token is optional - not needed for most Salesforce orgs
    // const securityToken = Deno.env.get("SALESFORCE_SECURITY_TOKEN") || "";
    const securityToken = "";
    const isSandbox = Deno.env.get("SALESFORCE_SANDBOX") === "true";

    if (!clientId || !clientSecret || !username || !password) {
      throw new Error("Salesforce credentials not configured. Set SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET, SALESFORCE_USERNAME, and SALESFORCE_PASSWORD in Supabase environment variables.");
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Auto-connect - no user interaction needed
    if (action === "connect") {
      const { organizationId } = await req.json();

      if (!organizationId) {
        throw new Error("Missing organizationId");
      }

      // Get token using username/password flow
      const tokenData = await getSalesforceToken(
        username,
        password,
        securityToken,
        clientId,
        clientSecret,
        isSandbox
      );

      // Store or update Salesforce config
      const { data: existingConfig } = await supabase
        .from("salesforce_sync_config")
        .select("id")
        .eq("organization_id", organizationId)
        .maybeSingle();

      const configData = {
        organization_id: organizationId,
        salesforce_instance_url: tokenData.instance_url,
        client_id: clientId,
        client_secret: clientSecret,
        access_token: tokenData.access_token,
        refresh_token: null,
        token_expires_at: new Date(Date.now() + 7200000).toISOString(),
        is_sandbox: isSandbox,
        sync_enabled: true,
        updated_at: new Date().toISOString(),
      };

      if (existingConfig) {
        await supabase
          .from("salesforce_sync_config")
          .update(configData)
          .eq("id", existingConfig.id);
      } else {
        await supabase
          .from("salesforce_sync_config")
          .insert(configData);
      }

      // Create default object mappings
      const defaultMappings = [
        { salesforce_object: 'Lead', supabase_table: 'leads' },
        { salesforce_object: 'Account', supabase_table: 'accounts' },
        { salesforce_object: 'Contact', supabase_table: 'salesforce_contacts' },
        { salesforce_object: 'Opportunity', supabase_table: 'opportunities' },
        { salesforce_object: 'User', supabase_table: 'users' },
      ];

      for (const mapping of defaultMappings) {
        await supabase
          .from("salesforce_object_mappings")
          .upsert({
            organization_id: organizationId,
            salesforce_object: mapping.salesforce_object,
            supabase_table: mapping.supabase_table,
            sync_enabled: true,
            sync_mode: 'incremental',
            order_by: 'SystemModstamp ASC',
            batch_size: 200,
          }, {
            onConflict: 'organization_id,salesforce_object',
            ignoreDuplicates: false,
          });
      }

      return new Response(
        JSON.stringify({
          success: true,
          connected: true,
          instanceUrl: tokenData.instance_url,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get connection status
    if (action === "status") {
      const organizationId = url.searchParams.get("organizationId");

      if (!organizationId) {
        throw new Error("Missing organizationId");
      }

      const { data: config } = await supabase
        .from("salesforce_sync_config")
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          success: true,
          connected: !!config,
          instanceUrl: config?.salesforce_instance_url,
          lastSync: config?.last_sync_at,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Test connection
    if (action === "test") {
      const { organizationId } = await req.json();

      const { data: config, error: configError } = await supabase
        .from("salesforce_sync_config")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      if (configError || !config) {
        throw new Error("Salesforce configuration not found");
      }

      // Test API call to Salesforce
      const testResponse = await fetch(
        `${config.salesforce_instance_url}/services/data/${config.salesforce_api_version}/sobjects`,
        {
          headers: {
            Authorization: `Bearer ${config.access_token}`,
          },
        }
      );

      if (!testResponse.ok) {
        throw new Error("Connection test failed");
      }

      const sobjects = await testResponse.json();

      return new Response(
        JSON.stringify({
          success: true,
          connected: true,
          instanceUrl: config.salesforce_instance_url,
          availableObjects: sobjects.sobjects.length,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw new Error("Invalid action parameter");
  } catch (error) {
    console.error("Auth error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
