import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { opportunity_id, action } = await req.json();

    const { data: opportunity, error: oppError } = await supabase
      .from("opportunities")
      .select("*")
      .eq("Id", opportunity_id)
      .single();

    if (oppError) throw oppError;
    if (!opportunity) throw new Error("Opportunity not found");

    if (action === "initialize") {
      return await initializeDesignWorkflow(opportunity, supabase);
    } else if (action === "assign_designer") {
      return await assignDesigner(opportunity_id, req, supabase);
    } else if (action === "mark_complete") {
      return await markDesignComplete(opportunity_id, req, supabase);
    } else if (action === "request_revision") {
      return await requestRevision(opportunity_id, req, supabase);
    } else if (action === "approve_design") {
      return await approveDesign(opportunity_id, supabase);
    } else {
      throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("Design automation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function initializeDesignWorkflow(opportunity: any, supabase: any) {
  // Check if design workflow already exists
  const { data: existing } = await supabase
    .from("design_workflows")
    .select("*")
    .eq("opportunity_sf_id", opportunity.Id)
    .single();

  if (existing) {
    return new Response(
      JSON.stringify({
        success: true,
        message: "Design workflow already exists",
        design_workflow: existing,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Extract Aurora Solar project ID if exists
  const auroraProjectId = opportunity.Primary_Design_ID__c || opportunity.Aurora_Design__c;

  // Find available designer with lowest workload
  const { data: designers } = await supabase
    .from("user_profiles")
    .select("id, full_name")
    .eq("department", "Engineering")
    .eq("is_active", true);

  let assignedDesigner = null;
  if (designers && designers.length > 0) {
    // Count active designs per designer
    const designerWorkloads = await Promise.all(
      designers.map(async (designer) => {
        const { count } = await supabase
          .from("design_workflows")
          .select("*", { count: "exact", head: true })
          .eq("assigned_designer", designer.id)
          .in("design_status", ["not_started", "in_progress", "pending_review"]);
        return { designer_id: designer.id, workload: count || 0 };
      })
    );

    designerWorkloads.sort((a, b) => a.workload - b.workload);
    assignedDesigner = designerWorkloads[0].designer_id;
  }

  // Create design workflow
  const { data: designWorkflow, error: designError } = await supabase
    .from("design_workflows")
    .insert({
      opportunity_sf_id: opportunity.Id,
      design_status: "not_started",
      aurora_project_id: auroraProjectId,
      assigned_designer: assignedDesigner,
      revision_count: 0,
      system_size_kw: opportunity.System_Size_kW__c,
      notes: `Design workflow initialized for ${opportunity.Name}`,
    })
    .select()
    .single();

  if (designError) throw designError;

  // Create Egnyte folder structure for design files
  const egnyteBasePath = `/Shared/Solar Projects/${opportunity.Name}/Designs`;

  await supabase
    .from("document_automation")
    .insert([
      {
        record_type: "opportunity",
        record_id: opportunity.Id,
        document_type: "folder",
        document_name: "Design Files",
        egnyte_path: egnyteBasePath,
        auto_created: true,
        status: "active",
      },
    ]);

  // Create task for designer
  if (assignedDesigner) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 days to complete design

    await supabase
      .from("automation_tasks")
      .insert({
        task_type: "design_creation",
        assigned_to: assignedDesigner,
        related_record_type: "opportunity",
        related_record_id: opportunity.Id,
        title: `Create solar design for ${opportunity.Name}`,
        description: `Design a ${opportunity.System_Size_kW__c || "TBD"} kW solar system for property at ${opportunity.Street}, ${opportunity.City}, ${opportunity.State}.\n\nAurora Project: ${auroraProjectId || "Create new project"}`,
        due_date: dueDate.toISOString(),
        priority: "high",
        status: "pending",
        metadata: {
          design_workflow_id: designWorkflow.id,
          aurora_project_id: auroraProjectId,
          system_size: opportunity.System_Size_kW__c,
          address: `${opportunity.Street}, ${opportunity.City}, ${opportunity.State}`,
        },
      });

    // Send notification to designer
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("id", assignedDesigner)
      .single();

    if (userProfile?.email) {
      await supabase
        .from("automation_notifications")
        .insert({
          notification_type: "email",
          recipient_type: "user",
          recipient_id: assignedDesigner,
          recipient_contact: userProfile.email,
          subject: `New Design Assignment: ${opportunity.Name}`,
          message: `You have been assigned a new solar design project.\n\nProject: ${opportunity.Name}\nSystem Size: ${opportunity.System_Size_kW__c || "TBD"} kW\nAddress: ${opportunity.Street}, ${opportunity.City}, ${opportunity.State}\nDue Date: ${dueDate.toLocaleDateString()}\n\n${auroraProjectId ? `Aurora Project ID: ${auroraProjectId}` : "Please create a new Aurora Solar project"}`,
          status: "pending",
          metadata: {
            opportunity_id: opportunity.Id,
            design_workflow_id: designWorkflow.id,
          },
        });
    }
  }

  // Update opportunity status
  await supabase
    .from("opportunities")
    .update({
      Job_Status__c: "Design In Progress",
      Sent_to_Engineering__c: new Date().toISOString().split('T')[0],
    })
    .eq("Id", opportunity.Id);

  return new Response(
    JSON.stringify({
      success: true,
      message: "Design workflow initialized",
      design_workflow: designWorkflow,
      assigned_designer: assignedDesigner,
      aurora_project_id: auroraProjectId,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function assignDesigner(opportunityId: string, req: Request, supabase: any) {
  const { designer_id } = await req.json();

  const { error } = await supabase
    .from("design_workflows")
    .update({
      assigned_designer: designer_id,
      design_status: "not_started",
    })
    .eq("opportunity_sf_id", opportunityId);

  if (error) throw error;

  return new Response(
    JSON.stringify({
      success: true,
      message: "Designer assigned",
      designer_id,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function markDesignComplete(opportunityId: string, req: Request, supabase: any) {
  const { aurora_project_id, system_size_kw, panel_count, design_files } = await req.json();

  const { data: designWorkflow, error: fetchError } = await supabase
    .from("design_workflows")
    .select("*")
    .eq("opportunity_sf_id", opportunityId)
    .single();

  if (fetchError) throw fetchError;

  // Update design workflow
  const { error: updateError } = await supabase
    .from("design_workflows")
    .update({
      design_status: "pending_review",
      aurora_project_id,
      system_size_kw,
      panel_count,
      design_files: design_files || [],
      design_completed_at: new Date().toISOString(),
    })
    .eq("id", designWorkflow.id);

  if (updateError) throw updateError;

  // Update opportunity
  await supabase
    .from("opportunities")
    .update({
      Drawings_Complete__c: new Date().toISOString().split('T')[0],
      Job_Status__c: "Design Complete - Pending Review",
      System_Size_kW__c: system_size_kw,
      Primary_Design_ID__c: aurora_project_id,
    })
    .eq("Id", opportunityId);

  // Get opportunity owner for notification
  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("OwnerId, Name")
    .eq("Id", opportunityId)
    .single();

  // Create task for sales rep to review design
  await supabase
    .from("automation_tasks")
    .insert({
      task_type: "design_review",
      assigned_to: opportunity?.OwnerId,
      related_record_type: "opportunity",
      related_record_id: opportunityId,
      title: `Review design for ${opportunity?.Name}`,
      description: `Solar design is complete and ready for review.\n\nSystem: ${system_size_kw} kW, ${panel_count} panels\nAurora Project: ${aurora_project_id}\n\nPlease review and either approve or request revisions.`,
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
      priority: "high",
      status: "pending",
    });

  // Send notification to sales rep
  if (opportunity?.OwnerId) {
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("id", opportunity.OwnerId)
      .single();

    if (userProfile?.email) {
      await supabase
        .from("automation_notifications")
        .insert({
          notification_type: "email",
          recipient_type: "user",
          recipient_id: opportunity.OwnerId,
          recipient_contact: userProfile.email,
          subject: `Design Complete: ${opportunity.Name}`,
          message: `The solar design for ${opportunity.Name} is complete and ready for your review.\n\nSystem Size: ${system_size_kw} kW\nPanel Count: ${panel_count}\nAurora Project: ${aurora_project_id}\n\nPlease review the design and either approve it or request revisions.`,
          status: "pending",
        });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: "Design marked as complete and pending review",
      design_workflow_id: designWorkflow.id,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function requestRevision(opportunityId: string, req: Request, supabase: any) {
  const { revision_notes } = await req.json();

  const { data: designWorkflow, error: fetchError } = await supabase
    .from("design_workflows")
    .select("*")
    .eq("opportunity_sf_id", opportunityId)
    .single();

  if (fetchError) throw fetchError;

  // Update design workflow
  const { error: updateError } = await supabase
    .from("design_workflows")
    .update({
      design_status: "revision_needed",
      revision_count: (designWorkflow.revision_count || 0) + 1,
      notes: `${designWorkflow.notes || ""}\n\nRevision ${(designWorkflow.revision_count || 0) + 1}: ${revision_notes}`,
    })
    .eq("id", designWorkflow.id);

  if (updateError) throw updateError;

  // Create task for designer
  await supabase
    .from("automation_tasks")
    .insert({
      task_type: "design_revision",
      assigned_to: designWorkflow.assigned_designer,
      related_record_type: "opportunity",
      related_record_id: opportunityId,
      title: `Design revision needed for ${opportunityId}`,
      description: `Revision #${(designWorkflow.revision_count || 0) + 1}:\n\n${revision_notes}`,
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
      priority: "high",
      status: "pending",
    });

  return new Response(
    JSON.stringify({
      success: true,
      message: "Revision requested",
      revision_count: (designWorkflow.revision_count || 0) + 1,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function approveDesign(opportunityId: string, supabase: any) {
  const { data: designWorkflow, error: fetchError } = await supabase
    .from("design_workflows")
    .select("*")
    .eq("opportunity_sf_id", opportunityId)
    .single();

  if (fetchError) throw fetchError;

  // Update design workflow
  const { error: updateError } = await supabase
    .from("design_workflows")
    .update({
      design_status: "approved",
      customer_approved_at: new Date().toISOString(),
    })
    .eq("id", designWorkflow.id);

  if (updateError) throw updateError;

  // Update opportunity
  await supabase
    .from("opportunities")
    .update({
      Job_Status__c: "Design Approved",
      Production_Calc_Complete__c: new Date().toISOString().split('T')[0],
    })
    .eq("Id", opportunityId);

  // Automatically trigger permit workflow
  await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/permit-automation`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      opportunity_id: opportunityId,
      action: "initialize",
    }),
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: "Design approved and permit workflow initiated",
      design_workflow_id: designWorkflow.id,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
