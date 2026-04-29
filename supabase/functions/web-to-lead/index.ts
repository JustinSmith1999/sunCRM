import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let leadData: any = {};
    let form_key: string | null = null;

    if (contentType.includes("application/json")) {
      const jsonData = await req.json();
      form_key = jsonData.form_key;
      leadData = jsonData;
      delete leadData.form_key;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);

      form_key = params.get("form_key");

      for (const [key, value] of params.entries()) {
        if (key !== "form_key") {
          leadData[key] = value;
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported content type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!form_key) {
      return new Response(
        JSON.stringify({ error: "Form key is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: webForm, error: formError } = await supabase
      .from("web_forms")
      .select("*, auto_response_template:email_templates!web_forms_auto_response_template_id_fkey(subject, body_html, body_text)")
      .eq("form_key", form_key)
      .eq("is_active", true)
      .maybeSingle();

    if (formError || !webForm) {
      return new Response(
        JSON.stringify({ error: "Invalid or inactive form" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const parseNumber = (val: any) => {
      if (val === null || val === undefined || val === '') return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    const parseInt = (val: any) => {
      if (val === null || val === undefined || val === '') return null;
      const num = Number.parseInt(val);
      return isNaN(num) ? null : num;
    };

    const parseBool = (val: any) => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === '1' || val === 1;
    };

    if (webForm.capture_ip) {
      const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                       req.headers.get('x-real-ip') ||
                       'unknown';
      leadData.submitter_ip = clientIP;
    }

    const county = leadData.county || leadData['00N4X00000BUSdK'] || null;
    const utility = leadData.utility || leadData['00N0h000006k8NV'] || null;
    const utilityAccount = leadData.utility_account_1 || leadData['00NC0000005oM2i'] || null;
    const ownResidence = leadData.own_residence || leadData['00N4X00000Bpycp'] || null;
    const typeOfInstallation = leadData.type_of_installation || leadData['00NC0000005DS8g'] || null;
    const newConstruction = leadData.new_construction || leadData['00NUX000001QfdF'] || false;
    const salesNotes = leadData.sales_notes || leadData['00N0h000006fXkj'] || null;
    const partner = leadData.partner || leadData['00N4X00000BmeYh'] || null;

    const leadRecord: any = {
      organization_id: webForm.organization_id,
      first_name: leadData.first_name || "",
      last_name: leadData.last_name || "",
      email: leadData.email || null,
      phone: leadData.phone || null,
      mobile: leadData.mobile || null,
      company: leadData.company || null,
      title: leadData.title || null,
      industry: leadData.industry || null,
      website: leadData.website || null,
      description: leadData.description || null,
      lead_source: leadData.lead_source || webForm.default_lead_source || "Website",
      status: "new",
      rating: leadData.rating || "cold",
      annual_revenue: parseNumber(leadData.annual_revenue),
      employee_count: parseInt(leadData.employee_count),
      owner_id: webForm.default_owner_id,
      created_by: webForm.default_owner_id,
      campaign_id: leadData.campaign_id || webForm.default_campaign_id || null,
      county: county,
      utility: utility,
      utility_account_1: utilityAccount,
      own_residence: ownResidence,
      type_of_installation: typeOfInstallation,
      new_construction: parseBool(newConstruction),
      sales_notes: salesNotes,
      partner: partner,
    };

    if (leadData.address || leadData.street || leadData.city || leadData.state || leadData.zip || leadData.country) {
      leadRecord.address = {
        street: leadData.street || leadData.address || null,
        city: leadData.city || null,
        state: leadData.state || null,
        zip: leadData.zip || null,
        country: leadData.country || null,
      };
    }

    const customFields = [
      'additional_information', 'age_of_roof', 'age_of_structure', 'anticipated_closing',
      'bankruptcy', 'call_center_rep', 'call_type', 'canvasser', 'closed_lost_description',
      'company_website', 'county', 'credit_score', 'customer_expectations', 'customer_notes',
      'electric_voltage', 'external_lead_id', 'facilities_manager', 'financing', 'floors',
      'language_preference', 'layers', 'lead_channel', 'lead_rating', 'lead_sub_status',
      'lead_type', 'meter_1', 'meter_2', 'meter_3', 'meter_4', 'name_on_utility_account',
      'offset_discussion', 'orientation_of_roofs', 'other_estimates', 'other_source',
      'owner_of_property', 'own_residence', 'partner', 'possible_permit_issues', 'profession',
      'program_name', 'pseg_rate_code', 'ps_rating', 'reason', 'reason_for_deleting',
      'reference', 'referral_subtype', 'referred_by', 'requested_sales_rep', 'roof_pitch',
      'roof_style', 'sales_notes', 'salesperson', 'satellite_image', 'secondary_email',
      'shading_issues', 'size_of_system_quoted', 'source', 'submitter_ip', 'taxable_income',
      'title_of_contact_person', 'title_of_property_owner', 'tod_plan', 'town_for_permit',
      'transformer_location', 'trustedform_cert_url', 'type_of_installation', 'type_of_purchase',
      'type_of_sale', 'type_of_structure', 'unbounce_page_id', 'unbounce_page_variant',
      'utility', 'utility_account_1', 'utility_account_2', 'utility_account_3', 'utility_account_4',
      'utm_campaign', 'utm_content', 'utm_medium', 'utm_source', 'utm_term', 'vts_phone',
      'years_in_residence'
    ];

    customFields.forEach(field => {
      if (leadData[field] !== undefined) {
        leadRecord[field] = leadData[field] || null;
      }
    });

    const numericFields = [
      'annual_kwh_usage', 'avg_monthly_elec_bill', 'lead_cost', 'ps_estimated_production',
      'ps_lifetime_savings', 'ps_roof_sq_footage'
    ];
    numericFields.forEach(field => {
      if (leadData[field] !== undefined) {
        leadRecord[field] = parseNumber(leadData[field]);
      }
    });

    const integerFields = ['ps_module_amount', 'ps_score', 'ps_sunlight_hours', 'sq_ft'];
    integerFields.forEach(field => {
      if (leadData[field] !== undefined) {
        leadRecord[field] = parseInt(leadData[field]);
      }
    });

    const booleanFields = [
      'community_solar', 'data_import', 'do_not_call', 'email_opt_out', 'historical_district',
      'lead_from_customer_portal', 'new_construction', 'partner_opp_created', 'recharge_ny_discount',
      'utility_obtained'
    ];
    booleanFields.forEach(field => {
      if (leadData[field] !== undefined) {
        leadRecord[field] = parseBool(leadData[field]);
      }
    });

    const dateFields = [
      'appointment_confirmation_required', 'first_sit_date', 'future_contact_follow_up_date',
      'lead_assigned_date', 'lead_resurrection_date', 'lead_source_date', 'pto_date',
      'unbounce_submission_date'
    ];
    dateFields.forEach(field => {
      if (leadData[field]) {
        leadRecord[field] = leadData[field];
      }
    });

    const { data: newLead, error: leadError } = await supabase
      .from("leads")
      .insert(leadRecord)
      .select()
      .single();

    if (leadError) {
      console.error("Lead creation error:", leadError);
      return new Response(
        JSON.stringify({ error: "Failed to create lead", details: leadError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (webForm.auto_response_enabled && webForm.auto_response_template && leadData.email) {
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const template = webForm.auto_response_template;
          let emailBody = template.body_html || template.body_text;

          emailBody = emailBody.replace(/\{first_name\}/g, leadData.first_name || '');
          emailBody = emailBody.replace(/\{last_name\}/g, leadData.last_name || '');
          emailBody = emailBody.replace(/\{company\}/g, leadData.company || '');

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "noreply@yourdomain.com",
              to: leadData.email,
              subject: template.subject,
              html: emailBody,
            }),
          });
        }
      } catch (emailError) {
        console.error("Auto-response email error:", emailError);
      }
    }

    await supabase
      .from("web_forms")
      .update({
        submissions_count: (webForm.submissions_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", webForm.id);

    const redirectUrl = leadData.retURL || webForm.redirect_url;

    if (redirectUrl && contentType.includes("application/x-www-form-urlencoded")) {
      return new Response(null, {
        status: 303,
        headers: {
          ...corsHeaders,
          "Location": redirectUrl,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: webForm.success_message || "Thank you for your submission!",
        redirect_url: redirectUrl || null,
        lead_id: newLead.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});