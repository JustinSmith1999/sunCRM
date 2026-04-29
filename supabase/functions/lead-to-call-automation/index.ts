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

    const { lead_id } = await req.json();

    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError) throw leadError;
    if (!lead) throw new Error("Lead not found");

    // Calculate lead score first
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/automation-engine`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trigger_type: "calculate_lead_score",
        trigger_data: {
          lead_id,
          record_type: "lead",
          record_id: lead_id,
        },
      }),
    });

    // Get lead score
    const { data: leadScore } = await supabase
      .from("lead_scoring")
      .select("*")
      .eq("lead_id", lead_id)
      .single();

    // Determine call priority and timing based on lead score and source
    let callPriority = "medium";
    let callDueInHours = 24;

    if (leadScore?.score_category === "hot") {
      callPriority = "high";
      callDueInHours = 1; // Call within 1 hour
    } else if (leadScore?.score_category === "warm") {
      callPriority = "medium";
      callDueInHours = 4; // Call within 4 hours
    } else {
      callPriority = "low";
      callDueInHours = 24; // Call within 24 hours
    }

    // Priority boost for certain lead sources
    const highPriorityLeadSources = ["Website", "Referral", "Partner"];
    if (highPriorityLeadSources.includes(lead.LeadSource)) {
      callPriority = "high";
      callDueInHours = Math.min(callDueInHours, 2);
    }

    // Apply lead automation rules
    const { data: rules, error: rulesError } = await supabase
      .from("lead_automation_rules")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (rulesError) throw rulesError;

    let assignedUser = lead.owner_id;
    let assignmentRule = null;

    for (const rule of rules) {
      if (evaluateConditions(rule.conditions, lead)) {
        // Assign lead based on rule
        assignedUser = await getNextAssignedUser(rule, supabase);
        assignmentRule = rule.name;

        // Update lead owner
        await supabase
          .from("leads")
          .update({ owner_id: assignedUser })
          .eq("id", lead_id);

        break;
      }
    }

    // Create call task
    const callDueDate = new Date();
    callDueDate.setHours(callDueDate.getHours() + callDueInHours);

    const { data: callTask, error: taskError } = await supabase
      .from("automation_tasks")
      .insert({
        task_type: "call",
        assigned_to: assignedUser,
        related_record_type: "lead",
        related_record_id: lead_id,
        title: `Call ${lead.FirstName || ""} ${lead.LastName || "Lead"}`,
        description: `Follow-up call for ${lead.LeadSource || "unknown"} lead. Score: ${leadScore?.score_category || "not calculated"}. Contact: ${lead.Phone || lead.MobilePhone || "No phone"}`,
        due_date: callDueDate.toISOString(),
        priority: callPriority,
        status: "pending",
        metadata: {
          lead_id,
          phone: lead.Phone || lead.MobilePhone,
          email: lead.Email,
          lead_source: lead.LeadSource,
          lead_score: leadScore?.total_score,
          score_category: leadScore?.score_category,
          auto_scheduled: true,
          call_due_in_hours: callDueInHours,
        },
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Send notification to assigned user
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("email, full_name")
      .eq("id", assignedUser)
      .single();

    if (userProfile?.email) {
      await supabase
        .from("automation_notifications")
        .insert({
          notification_type: "email",
          recipient_type: "user",
          recipient_id: assignedUser,
          recipient_contact: userProfile.email,
          subject: `New ${callPriority.toUpperCase()} priority lead assigned to you`,
          message: `You have been assigned a new ${leadScore?.score_category || "cold"} lead: ${lead.FirstName || ""} ${lead.LastName || "Unknown"}.\n\nLead Source: ${lead.LeadSource || "Unknown"}\nPhone: ${lead.Phone || lead.MobilePhone || "Not provided"}\nEmail: ${lead.Email || "Not provided"}\n\nPlease call within ${callDueInHours} hour(s).`,
          status: "pending",
          metadata: {
            lead_id,
            task_id: callTask.id,
            priority: callPriority,
          },
        });
    }

    // Send SMS notification to lead (if configured)
    if (lead.Phone || lead.MobilePhone) {
      await supabase
        .from("automation_notifications")
        .insert({
          notification_type: "sms",
          recipient_type: "customer",
          recipient_id: lead_id,
          recipient_contact: lead.Phone || lead.MobilePhone,
          subject: "Thank you for your interest",
          message: `Thank you for your interest in solar! A member of our team will contact you within ${callDueInHours} hour(s) to discuss your project. - Sunation Energy`,
          status: "pending",
          metadata: {
            lead_id,
            auto_response: true,
          },
        });
    }

    // Send confirmation email to lead
    if (lead.Email) {
      await supabase
        .from("automation_notifications")
        .insert({
          notification_type: "email",
          recipient_type: "customer",
          recipient_id: lead_id,
          recipient_contact: lead.Email,
          subject: "Thank You for Your Interest in Solar Energy",
          message: `Dear ${lead.FirstName || "Valued Customer"},\n\nThank you for reaching out to Sunation Energy! We're excited to help you explore solar energy solutions.\n\nA solar specialist will contact you within ${callDueInHours} hour(s) to discuss:\n- Your energy goals\n- Property assessment\n- Available incentives and financing options\n- Next steps in the process\n\nIn the meantime, feel free to visit our website for more information.\n\nBest regards,\nThe Sunation Energy Team`,
          status: "pending",
          metadata: {
            lead_id,
            auto_response: true,
          },
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id,
        assigned_to: assignedUser,
        assignment_rule: assignmentRule,
        call_task_id: callTask.id,
        call_priority: callPriority,
        call_due_in_hours: callDueInHours,
        lead_score: leadScore?.total_score,
        score_category: leadScore?.score_category,
        notifications_created: 3,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Lead-to-call automation error:", error);
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
      if (condition.in !== undefined) {
        const validValues = condition.in as unknown[];
        if (!validValues.includes(dataValue)) {
          return false;
        }
      }
    } else if (data[key] !== value) {
      return false;
    }
  }

  return true;
}

async function getNextAssignedUser(rule: any, supabase: any): Promise<string> {
  const assignedUsers = rule.assigned_users as string[];

  if (!assignedUsers || assignedUsers.length === 0) {
    throw new Error("No users assigned to rule");
  }

  if (rule.assignment_type === "round_robin") {
    const lastIndex = rule.last_assigned_index || 0;
    const nextIndex = (lastIndex + 1) % assignedUsers.length;

    await supabase
      .from("lead_automation_rules")
      .update({ last_assigned_index: nextIndex })
      .eq("id", rule.id);

    return assignedUsers[nextIndex];
  } else if (rule.assignment_type === "load_balanced") {
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

  return assignedUsers[0];
}
