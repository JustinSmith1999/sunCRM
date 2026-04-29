import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PartnerLeadData {
  partner_slug: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
  utility?: string;
  utility_account?: string;
  own_residence?: string;
  installation_type?: string;
  new_construction?: boolean;
  sales_notes?: string;
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

    const leadData: PartnerLeadData = await req.json();

    console.log("Received partner lead:", leadData);

    // Find the partner by slug
    const { data: partner, error: partnerError } = await supabase
      .from("channel_partners")
      .select("*")
      .eq("slug", leadData.partner_slug)
      .eq("status", "active")
      .single();

    if (partnerError || !partner) {
      console.error("Partner not found:", partnerError);
      return new Response(
        JSON.stringify({ error: "Partner not found or inactive" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Found partner:", partner.name);

    // Create the lead
    const leadPayload = {
      FirstName: leadData.first_name,
      LastName: leadData.last_name,
      Name: `${leadData.first_name} ${leadData.last_name}`,
      Email: leadData.email,
      Phone: leadData.phone,
      Street: leadData.street,
      City: leadData.city,
      State: leadData.state,
      PostalCode: leadData.zip,
      County__c: leadData.county || null,
      Utility__c: leadData.utility || null,
      Utility_Account__c: leadData.utility_account || null,
      Own_Residence__c: leadData.own_residence || null,
      Type_of_Installation__c: leadData.installation_type || null,
      New_Construction__c: leadData.new_construction || false,
      Sales_Notes__c: leadData.sales_notes || null,
      LeadSource: partner.name,
      Partner__c: partner.name,
      partner_id: partner.id,
      partner_lead_source: partner.name,
      Status: "New",
      Company: "Residential",
    };

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert([leadPayload])
      .select()
      .single();

    if (leadError) {
      console.error("Error creating lead:", leadError);
      return new Response(
        JSON.stringify({ error: "Failed to create lead", details: leadError }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Lead created:", lead.id);

    // Send email notification
    try {
      const emailBody = `
Lead: ${leadData.first_name} ${leadData.last_name} has been created
Created By: ${partner.name} / ${new Date().toLocaleDateString()}

${leadData.first_name} ${leadData.last_name}
Address: ${leadData.street}, ${leadData.city}, ${leadData.state} ${leadData.zip}
${leadData.utility_account ? `Utility Account: ${leadData.utility_account}` : ''}
${leadData.utility ? `Utility: ${leadData.utility}` : ''}

Phone: ${leadData.phone}
Email: ${leadData.email}
Lead Source: ${partner.name}

*** PARTNER: ${partner.name}
${leadData.sales_notes ? `Sales Notes: ${leadData.sales_notes}` : ''}

Link to Lead: ${supabaseUrl.replace('.supabase.co', '')}/leads/${lead.id}
      `.trim();

      console.log("Email notification would be sent:");
      console.log(emailBody);

      // TODO: Integrate with your email service (SendGrid, Mailgun, etc.)
      // For now, just log it
    } catch (emailError) {
      console.error("Email notification error:", emailError);
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: lead.id,
        message: "Lead created successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
