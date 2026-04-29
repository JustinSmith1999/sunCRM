import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PermitDocument {
  name: string;
  required: boolean;
  collected: boolean;
  egnyte_path?: string;
}

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

    // Get opportunity data
    const { data: opportunity, error: oppError } = await supabase
      .from("opportunities")
      .select("*")
      .eq("Id", opportunity_id)
      .single();

    if (oppError) throw oppError;
    if (!opportunity) throw new Error("Opportunity not found");

    if (action === "initialize") {
      return await initializePermitWorkflow(opportunity, supabase);
    } else if (action === "check_status") {
      return await checkPermitStatus(opportunity_id, supabase);
    } else if (action === "document_collected") {
      return await markDocumentCollected(opportunity_id, req, supabase);
    } else if (action === "submit_application") {
      return await submitPermitApplication(opportunity_id, supabase);
    } else {
      throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("Permit automation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function initializePermitWorkflow(opportunity: any, supabase: any) {
  // Check if permit workflow already exists
  const { data: existing } = await supabase
    .from("permit_workflows")
    .select("*")
    .eq("opportunity_sf_id", opportunity.Id)
    .single();

  if (existing) {
    return new Response(
      JSON.stringify({
        success: true,
        message: "Permit workflow already exists",
        permit_workflow: existing,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Determine jurisdiction from opportunity address
  const jurisdiction = opportunity.Town_for_Permit__c || opportunity.City || "Unknown";

  // Define required documents based on jurisdiction and project type
  const requiredDocuments: PermitDocument[] = [
    { name: "Site Plan", required: true, collected: false },
    { name: "Electrical Single Line Diagram", required: true, collected: false },
    { name: "Roof Plan", required: true, collected: false },
    { name: "Structural Calculations", required: true, collected: false },
    { name: "Equipment Specifications", required: true, collected: false },
    { name: "Installer License", required: true, collected: false },
    { name: "Proof of Property Ownership", required: true, collected: false },
    { name: "HOA Approval (if applicable)", required: false, collected: false },
  ];

  // Add NY-specific documents if in New York
  if (opportunity.State === "NY") {
    requiredDocuments.push(
      { name: "NYSERDA Application", required: true, collected: false },
      { name: "Interconnection Application", required: true, collected: false }
    );
  }

  // Create permit workflow
  const { data: permitWorkflow, error: permitError } = await supabase
    .from("permit_workflows")
    .insert({
      opportunity_sf_id: opportunity.Id,
      permit_status: "documents_collecting",
      jurisdiction,
      required_documents: requiredDocuments,
      collected_documents: [],
      notes: `Permit workflow initialized for ${opportunity.Name}`,
    })
    .select()
    .single();

  if (permitError) throw permitError;

  // Create Egnyte folder structure for permit documents
  const egnyteBasePath = `/Shared/Solar Projects/${opportunity.Name}/Permits`;

  await supabase
    .from("document_automation")
    .insert([
      {
        record_type: "opportunity",
        record_id: opportunity.Id,
        document_type: "folder",
        document_name: "Permit Documents",
        egnyte_path: egnyteBasePath,
        auto_created: true,
        status: "active",
      },
    ]);

  // Find permit coordinator
  const { data: permitCoordinators } = await supabase
    .from("user_profiles")
    .select("id, full_name")
    .eq("department", "Operations")
    .eq("is_active", true)
    .limit(1);

  const assignedTo = permitCoordinators?.[0]?.id || opportunity.OwnerId;

  // Update permit workflow with assignment
  await supabase
    .from("permit_workflows")
    .update({ assigned_to: assignedTo })
    .eq("id", permitWorkflow.id);

  // Create task for permit coordinator
  await supabase
    .from("automation_tasks")
    .insert({
      task_type: "permit_preparation",
      assigned_to: assignedTo,
      related_record_type: "opportunity",
      related_record_id: opportunity.Id,
      title: `Prepare permit application for ${opportunity.Name}`,
      description: `Collect all required permit documents for ${jurisdiction}. ${requiredDocuments.length} documents needed.`,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      priority: "high",
      status: "pending",
      metadata: {
        permit_workflow_id: permitWorkflow.id,
        jurisdiction,
        documents_required: requiredDocuments.length,
      },
    });

  // Send notification to permit coordinator
  if (permitCoordinators?.[0]) {
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("id", assignedTo)
      .single();

    if (userProfile?.email) {
      await supabase
        .from("automation_notifications")
        .insert({
          notification_type: "email",
          recipient_type: "user",
          recipient_id: assignedTo,
          recipient_contact: userProfile.email,
          subject: `New Permit Application: ${opportunity.Name}`,
          message: `A new solar installation project requires permit preparation.\n\nProject: ${opportunity.Name}\nJurisdiction: ${jurisdiction}\nAddress: ${opportunity.Street}, ${opportunity.City}, ${opportunity.State}\n\nPlease begin collecting the required ${requiredDocuments.length} documents.`,
          status: "pending",
          metadata: {
            opportunity_id: opportunity.Id,
            permit_workflow_id: permitWorkflow.id,
          },
        });
    }
  }

  // Update opportunity with permit workflow link
  await supabase
    .from("opportunities")
    .update({ Job_Status__c: "Permitting" })
    .eq("Id", opportunity.Id);

  return new Response(
    JSON.stringify({
      success: true,
      message: "Permit workflow initialized",
      permit_workflow: permitWorkflow,
      required_documents: requiredDocuments.length,
      assigned_to: assignedTo,
      jurisdiction,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function checkPermitStatus(opportunityId: string, supabase: any) {
  const { data: permitWorkflow, error } = await supabase
    .from("permit_workflows")
    .select("*")
    .eq("opportunity_sf_id", opportunityId)
    .single();

  if (error) throw error;
  if (!permitWorkflow) {
    return new Response(
      JSON.stringify({ success: false, message: "No permit workflow found" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const requiredDocs = permitWorkflow.required_documents as PermitDocument[];
  const collectedDocs = permitWorkflow.collected_documents as PermitDocument[];

  const totalRequired = requiredDocs.filter(d => d.required).length;
  const totalCollected = collectedDocs.length;
  const percentComplete = totalRequired > 0 ? (totalCollected / totalRequired) * 100 : 0;

  const missingDocs = requiredDocs.filter(
    d => d.required && !collectedDocs.some(c => c.name === d.name)
  );

  return new Response(
    JSON.stringify({
      success: true,
      permit_workflow: permitWorkflow,
      status: permitWorkflow.permit_status,
      progress: {
        total_required: totalRequired,
        total_collected: totalCollected,
        percent_complete: Math.round(percentComplete),
        missing_documents: missingDocs,
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function markDocumentCollected(opportunityId: string, req: Request, supabase: any) {
  const { document_name, egnyte_path } = await req.json();

  const { data: permitWorkflow, error: fetchError } = await supabase
    .from("permit_workflows")
    .select("*")
    .eq("opportunity_sf_id", opportunityId)
    .single();

  if (fetchError) throw fetchError;

  const collectedDocs = (permitWorkflow.collected_documents as PermitDocument[]) || [];
  collectedDocs.push({
    name: document_name,
    required: true,
    collected: true,
    egnyte_path,
  });

  const { error: updateError } = await supabase
    .from("permit_workflows")
    .update({ collected_documents: collectedDocs })
    .eq("id", permitWorkflow.id);

  if (updateError) throw updateError;

  // Check if all required documents are collected
  const requiredDocs = permitWorkflow.required_documents as PermitDocument[];
  const allCollected = requiredDocs
    .filter(d => d.required)
    .every(d => collectedDocs.some(c => c.name === d.name));

  if (allCollected && permitWorkflow.permit_status === "documents_collecting") {
    // Update status to ready for submission
    await supabase
      .from("permit_workflows")
      .update({ permit_status: "ready_to_submit" })
      .eq("id", permitWorkflow.id);

    // Create task to submit permit
    await supabase
      .from("automation_tasks")
      .insert({
        task_type: "permit_submission",
        assigned_to: permitWorkflow.assigned_to,
        related_record_type: "opportunity",
        related_record_id: opportunityId,
        title: `Submit permit application for ${opportunityId}`,
        description: `All required documents collected. Ready to submit permit application to ${permitWorkflow.jurisdiction}.`,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
        priority: "high",
        status: "pending",
      });
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: "Document marked as collected",
      all_documents_collected: allCollected,
      status: allCollected ? "ready_to_submit" : "documents_collecting",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function submitPermitApplication(opportunityId: string, supabase: any) {
  const { data: permitWorkflow, error: fetchError } = await supabase
    .from("permit_workflows")
    .select("*")
    .eq("opportunity_sf_id", opportunityId)
    .single();

  if (fetchError) throw fetchError;

  // Generate application number
  const applicationNumber = `PERMIT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Update permit workflow
  const { error: updateError } = await supabase
    .from("permit_workflows")
    .update({
      permit_status: "submitted",
      application_number: applicationNumber,
      submitted_date: new Date().toISOString().split('T')[0],
    })
    .eq("id", permitWorkflow.id);

  if (updateError) throw updateError;

  // Update opportunity
  await supabase
    .from("opportunities")
    .update({
      Permit_App_Filed__c: new Date().toISOString().split('T')[0],
      Job_Status__c: "Permit Submitted",
    })
    .eq("Id", opportunityId);

  // Create follow-up task to check permit status
  await supabase
    .from("automation_tasks")
    .insert({
      task_type: "permit_follow_up",
      assigned_to: permitWorkflow.assigned_to,
      related_record_type: "opportunity",
      related_record_id: opportunityId,
      title: `Check permit status for application ${applicationNumber}`,
      description: `Follow up on permit application status with ${permitWorkflow.jurisdiction}.`,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      priority: "medium",
      status: "pending",
      metadata: {
        application_number: applicationNumber,
        jurisdiction: permitWorkflow.jurisdiction,
      },
    });

  return new Response(
    JSON.stringify({
      success: true,
      message: "Permit application submitted",
      application_number: applicationNumber,
      submitted_date: new Date().toISOString().split('T')[0],
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
