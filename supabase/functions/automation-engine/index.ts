import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WorkflowAction {
  type: string;
  config: Record<string, unknown>;
}

interface Workflow {
  id: string;
  name: string;
  trigger_type: string;
  trigger_conditions: Record<string, unknown>;
  actions: WorkflowAction[];
  priority: number;
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

    const { trigger_type, trigger_data } = await req.json();

    // Find matching workflows
    const { data: workflows, error: workflowError } = await supabase
      .from("automation_workflows")
      .select("*")
      .eq("trigger_type", trigger_type)
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (workflowError) throw workflowError;

    const results = [];

    for (const workflow of (workflows as Workflow[])) {
      // Check if conditions match
      if (!evaluateConditions(workflow.trigger_conditions, trigger_data)) {
        continue;
      }

      // Create execution record
      const { data: execution, error: execError } = await supabase
        .from("automation_executions")
        .insert({
          workflow_id: workflow.id,
          trigger_data,
          status: "running",
        })
        .select()
        .single();

      if (execError) throw execError;

      try {
        // Execute actions
        const actionsCompleted = [];
        for (const action of workflow.actions) {
          const result = await executeAction(action, trigger_data, supabase);
          actionsCompleted.push({ action: action.type, result, success: true });
        }

        // Update execution as completed
        await supabase
          .from("automation_executions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            actions_completed: actionsCompleted,
          })
          .eq("id", execution.id);

        results.push({
          workflow_id: workflow.id,
          workflow_name: workflow.name,
          execution_id: execution.id,
          status: "completed",
        });
      } catch (error) {
        // Update execution as failed
        await supabase
          .from("automation_executions")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: error.message,
          })
          .eq("id", execution.id);

        results.push({
          workflow_id: workflow.id,
          workflow_name: workflow.name,
          execution_id: execution.id,
          status: "failed",
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        trigger_type,
        workflows_executed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function evaluateConditions(conditions: Record<string, unknown>, data: Record<string, unknown>): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true;
  }

  for (const [key, value] of Object.entries(conditions)) {
    if (typeof value === "object" && value !== null) {
      const condition = value as Record<string, unknown>;
      const dataValue = data[key];

      if (condition.equals !== undefined && dataValue !== condition.equals) {
        return false;
      }
      if (condition.contains !== undefined && !String(dataValue).includes(String(condition.contains))) {
        return false;
      }
      if (condition.greaterThan !== undefined && Number(dataValue) <= Number(condition.greaterThan)) {
        return false;
      }
      if (condition.lessThan !== undefined && Number(dataValue) >= Number(condition.lessThan)) {
        return false;
      }
    } else if (data[key] !== value) {
      return false;
    }
  }

  return true;
}

async function executeAction(
  action: WorkflowAction,
  triggerData: Record<string, unknown>,
  supabase: any
): Promise<unknown> {
  switch (action.type) {
    case "create_task":
      return await createTask(action.config, triggerData, supabase);

    case "assign_lead":
      return await assignLead(action.config, triggerData, supabase);

    case "schedule_call":
      return await scheduleCall(action.config, triggerData, supabase);

    case "send_notification":
      return await sendNotification(action.config, triggerData, supabase);

    case "create_permit_workflow":
      return await createPermitWorkflow(action.config, triggerData, supabase);

    case "create_design_workflow":
      return await createDesignWorkflow(action.config, triggerData, supabase);

    case "create_egnyte_folder":
      return await createEgnyteFolder(action.config, triggerData, supabase);

    case "calculate_lead_score":
      return await calculateLeadScore(action.config, triggerData, supabase);

    case "update_opportunity_stage":
      return await updateOpportunityStage(action.config, triggerData, supabase);

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

async function createTask(config: Record<string, unknown>, triggerData: Record<string, unknown>, supabase: any) {
  const task = {
    task_type: config.task_type || "general",
    assigned_to: config.assigned_to || triggerData.owner_id,
    related_record_type: triggerData.record_type,
    related_record_id: triggerData.record_id,
    title: replaceVariables(config.title as string, triggerData),
    description: replaceVariables(config.description as string, triggerData),
    due_date: calculateDueDate(config.due_in_hours as number),
    priority: config.priority || "medium",
    status: "pending",
    metadata: { trigger_data: triggerData },
  };

  const { data, error } = await supabase
    .from("automation_tasks")
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function assignLead(config: Record<string, unknown>, triggerData: Record<string, unknown>, supabase: any) {
  const leadId = triggerData.lead_id as string;

  // Get assignment rules
  const { data: rules, error: rulesError } = await supabase
    .from("lead_automation_rules")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (rulesError) throw rulesError;

  for (const rule of rules) {
    if (evaluateConditions(rule.conditions, triggerData)) {
      const assignedUser = await getNextAssignedUser(rule, supabase);

      const { error: updateError } = await supabase
        .from("leads")
        .update({ owner_id: assignedUser })
        .eq("id", leadId);

      if (updateError) throw updateError;

      return { assigned_to: assignedUser, rule: rule.name };
    }
  }

  return { assigned_to: null, message: "No matching rule found" };
}

async function scheduleCall(config: Record<string, unknown>, triggerData: Record<string, unknown>, supabase: any) {
  const task = {
    task_type: "call",
    assigned_to: config.assigned_to || triggerData.owner_id,
    related_record_type: triggerData.record_type,
    related_record_id: triggerData.record_id,
    title: `Call ${triggerData.name || "Lead"}`,
    description: `Follow up call scheduled via automation`,
    due_date: calculateDueDate(config.due_in_hours as number || 2),
    priority: config.priority || "high",
    status: "pending",
    metadata: {
      phone: triggerData.phone,
      lead_source: triggerData.lead_source,
      auto_scheduled: true,
    },
  };

  const { data, error } = await supabase
    .from("automation_tasks")
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function sendNotification(config: Record<string, unknown>, triggerData: Record<string, unknown>, supabase: any) {
  const notification = {
    notification_type: config.notification_type || "email",
    recipient_type: config.recipient_type || "user",
    recipient_id: config.recipient_id || triggerData.owner_id,
    recipient_contact: config.recipient_contact || triggerData.email,
    subject: replaceVariables(config.subject as string, triggerData),
    message: replaceVariables(config.message as string, triggerData),
    status: "pending",
    metadata: { trigger_data: triggerData },
  };

  const { data, error } = await supabase
    .from("automation_notifications")
    .insert(notification)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createPermitWorkflow(config: Record<string, unknown>, triggerData: Record<string, unknown>, supabase: any) {
  const permit = {
    opportunity_sf_id: triggerData.opportunity_id,
    permit_status: "not_started",
    jurisdiction: triggerData.jurisdiction || config.jurisdiction,
    required_documents: config.required_documents || [
      { name: "Site Plan", required: true, collected: false },
      { name: "Electrical Diagram", required: true, collected: false },
      { name: "Structural Calculations", required: true, collected: false },
      { name: "Property Survey", required: true, collected: false },
    ],
    collected_documents: [],
    notes: "Automatically created by workflow",
  };

  const { data, error } = await supabase
    .from("permit_workflows")
    .insert(permit)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createDesignWorkflow(config: Record<string, unknown>, triggerData: Record<string, unknown>, supabase: any) {
  const design = {
    opportunity_sf_id: triggerData.opportunity_id,
    design_status: "not_started",
    revision_count: 0,
    notes: "Automatically created by workflow",
  };

  const { data, error } = await supabase
    .from("design_workflows")
    .insert(design)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createEgnyteFolder(config: Record<string, unknown>, triggerData: Record<string, unknown>, supabase: any) {
  const folderPath = replaceVariables(config.folder_path as string, triggerData);

  // Create document automation record
  const doc = {
    record_type: triggerData.record_type,
    record_id: triggerData.record_id,
    document_type: "folder",
    document_name: folderPath,
    egnyte_path: folderPath,
    auto_created: true,
    status: "draft",
    metadata: { trigger_data: triggerData },
  };

  const { data, error } = await supabase
    .from("document_automation")
    .insert(doc)
    .select()
    .single();

  if (error) throw error;

  // TODO: Make actual Egnyte API call to create folder

  return data;
}

async function calculateLeadScore(config: Record<string, unknown>, triggerData: Record<string, unknown>, supabase: any) {
  const leadId = triggerData.lead_id as string;

  // Get lead data
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadError) throw leadError;

  let propertyScore = 0;
  let engagementScore = 0;
  let demographicScore = 0;

  // Property scoring
  if (lead.Annual_KWh_Usage_NEW__c) {
    propertyScore += 10;
    if (Number(lead.Annual_KWh_Usage_NEW__c) > 10000) propertyScore += 10;
  }
  if (lead.Roof_Style_Composition__c) propertyScore += 10;
  if (lead.Own_Residence__c === "Yes") propertyScore += 10;

  // Engagement scoring
  if (lead.Email) engagementScore += 10;
  if (lead.Phone || lead.MobilePhone) engagementScore += 10;
  if (lead.LeadSource === "Website" || lead.LeadSource === "Referral") engagementScore += 10;

  // Demographic scoring
  if (lead.Status === "New") demographicScore += 15;
  else if (lead.Status === "Working") demographicScore += 10;
  if (lead.City && lead.State) demographicScore += 5;
  if (lead.Rating === "Hot") demographicScore += 10;
  else if (lead.Rating === "Warm") demographicScore += 5;

  const totalScore = propertyScore + engagementScore + demographicScore;
  const category = totalScore >= 80 ? "hot" : totalScore >= 50 ? "warm" : "cold";

  const { data, error } = await supabase
    .from("lead_scoring")
    .upsert({
      lead_id: leadId,
      total_score: totalScore,
      property_score: propertyScore,
      engagement_score: engagementScore,
      demographic_score: demographicScore,
      score_category: category,
      scoring_factors: { property: propertyScore, engagement: engagementScore, demographic: demographicScore },
      last_calculated_at: new Date().toISOString(),
    }, { onConflict: "lead_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateOpportunityStage(config: Record<string, unknown>, triggerData: Record<string, unknown>, supabase: any) {
  const opportunityId = triggerData.opportunity_id as string;
  const newStage = config.new_stage as string;

  const { error } = await supabase
    .from("opportunities")
    .update({ StageName: newStage })
    .eq("Id", opportunityId);

  if (error) throw error;
  return { opportunity_id: opportunityId, new_stage: newStage };
}

async function getNextAssignedUser(rule: any, supabase: any): Promise<string> {
  const assignedUsers = rule.assigned_users as string[];

  if (rule.assignment_type === "round_robin") {
    // Get the last assigned user and rotate
    const lastIndex = rule.last_assigned_index || 0;
    const nextIndex = (lastIndex + 1) % assignedUsers.length;

    await supabase
      .from("lead_automation_rules")
      .update({ last_assigned_index: nextIndex })
      .eq("id", rule.id);

    return assignedUsers[nextIndex];
  } else if (rule.assignment_type === "load_balanced") {
    // Count current leads per user and assign to user with least leads
    const counts = await Promise.all(
      assignedUsers.map(async (userId) => {
        const { count } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", userId)
          .eq("Status", "Working");
        return { userId, count: count || 0 };
      })
    );

    counts.sort((a, b) => a.count - b.count);
    return counts[0].userId;
  }

  // Default: return first user
  return assignedUsers[0];
}

function replaceVariables(template: string, data: Record<string, unknown>): string {
  if (!template) return "";

  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value || ""));
  }
  return result;
}

function calculateDueDate(hoursFromNow: number): string {
  const date = new Date();
  date.setHours(date.getHours() + (hoursFromNow || 24));
  return date.toISOString();
}
