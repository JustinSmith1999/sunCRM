# Process Automation System - Complete Guide

## Overview

The Process Automation System provides end-to-end automation for your solar business processes, from initial lead contact through installation completion. It eliminates manual work, reduces errors, and ensures no opportunities fall through the cracks.

## Key Features

### 1. Lead-to-Call Automation
**What it does:**
- Automatically calculates lead scores based on property characteristics, engagement, and demographics
- Assigns leads to sales reps using configurable rules (round-robin, load-balanced, or territory-based)
- Creates prioritized call tasks based on lead quality and source
- Sends automated notifications to both sales reps and customers
- Tracks all activities and outcomes

**How to use:**
1. When a new lead enters the system (web form, partner referral, etc.), the automation triggers automatically
2. The system scores the lead (Hot: 80+, Warm: 50-79, Cold: <50)
3. Based on the score and source, it assigns the lead and creates a call task:
   - Hot leads: High priority, call within 1 hour
   - Warm leads: Medium priority, call within 4 hours
   - Cold leads: Low priority, call within 24 hours
4. Sales rep receives email notification with lead details
5. Customer receives confirmation SMS and email

**Manual trigger:**
```javascript
POST /functions/v1/lead-to-call-automation
{
  "lead_id": "uuid-of-lead"
}
```

### 2. Permitting Process Automation
**What it does:**
- Creates permit workflows when opportunities are won
- Defines required documents based on jurisdiction
- Tracks document collection progress
- Automatically creates Egnyte folders for permit files
- Assigns permit coordinators
- Manages permit submission and approval tracking
- Creates follow-up tasks for status checks

**Workflow stages:**
1. **not_started** - Initial state
2. **documents_collecting** - Gathering required docs
3. **ready_to_submit** - All documents collected
4. **submitted** - Application filed with authority
5. **under_review** - Awaiting approval
6. **approved** - Permit granted
7. **rejected** - Permit denied (requires resubmission)

**How to use:**
```javascript
// Initialize permit workflow for a won opportunity
POST /functions/v1/permit-automation
{
  "opportunity_id": "salesforce-opp-id",
  "action": "initialize"
}

// Check permit status
POST /functions/v1/permit-automation
{
  "opportunity_id": "salesforce-opp-id",
  "action": "check_status"
}

// Mark document as collected
POST /functions/v1/permit-automation
{
  "opportunity_id": "salesforce-opp-id",
  "action": "document_collected",
  "document_name": "Site Plan",
  "egnyte_path": "/path/to/document"
}

// Submit permit application
POST /functions/v1/permit-automation
{
  "opportunity_id": "salesforce-opp-id",
  "action": "submit_application"
}
```

### 3. Design Workflow Automation
**What it does:**
- Creates design workflows for new solar projects
- Auto-assigns designers based on current workload (load balancing)
- Integrates with Aurora Solar projects
- Tracks design revisions and approvals
- Manages customer review and approval process
- Automatically triggers permit workflow when design is approved
- Creates Egnyte folders for design files

**Workflow stages:**
1. **not_started** - Assigned but not started
2. **in_progress** - Designer actively working
3. **pending_review** - Awaiting sales rep review
4. **revision_needed** - Changes requested
5. **approved** - Design finalized and approved

**How to use:**
```javascript
// Initialize design workflow
POST /functions/v1/design-automation
{
  "opportunity_id": "salesforce-opp-id",
  "action": "initialize"
}

// Mark design complete
POST /functions/v1/design-automation
{
  "opportunity_id": "salesforce-opp-id",
  "action": "mark_complete",
  "aurora_project_id": "aurora-id",
  "system_size_kw": 8.5,
  "panel_count": 25,
  "design_files": [...]
}

// Request revision
POST /functions/v1/design-automation
{
  "opportunity_id": "salesforce-opp-id",
  "action": "request_revision",
  "revision_notes": "Please adjust panel placement on south roof"
}

// Approve design (triggers permit workflow)
POST /functions/v1/design-automation
{
  "opportunity_id": "salesforce-opp-id",
  "action": "approve_design"
}
```

### 4. Automation Engine
**What it does:**
- Central workflow execution engine
- Evaluates trigger conditions
- Executes multiple actions in sequence
- Tracks execution history
- Handles errors and retries

**Supported trigger types:**
- `lead_created` - New lead enters system
- `opportunity_won` - Deal is closed
- `permit_approved` - Permit granted
- `design_completed` - Design finalized
- `contract_signed` - Contract executed
- `installation_scheduled` - Install date set

**Supported actions:**
- `create_task` - Generate automated task
- `assign_lead` - Assign lead to user
- `schedule_call` - Create call task
- `send_notification` - Email/SMS alert
- `create_permit_workflow` - Start permit process
- `create_design_workflow` - Start design process
- `create_egnyte_folder` - Make document folder
- `calculate_lead_score` - Score lead
- `update_opportunity_stage` - Move deal stage

**How to use:**
```javascript
POST /functions/v1/automation-engine
{
  "trigger_type": "opportunity_won",
  "trigger_data": {
    "opportunity_id": "opp-id",
    "owner_id": "user-id",
    "amount": 45000,
    "stage": "Closed Won"
  }
}
```

## Database Tables

### automation_workflows
Stores workflow definitions with trigger types and actions.

**Key fields:**
- `name` - Workflow name
- `trigger_type` - What event triggers this
- `trigger_conditions` - JSON conditions to match
- `actions` - Array of actions to execute
- `is_active` - Enable/disable workflow
- `priority` - Execution order (higher first)

### automation_executions
Tracks every workflow execution for monitoring and debugging.

**Key fields:**
- `workflow_id` - Which workflow ran
- `status` - pending, running, completed, failed
- `trigger_data` - Data that triggered workflow
- `actions_completed` - Which actions finished
- `error_message` - If failed, why

### lead_automation_rules
Defines how leads are automatically assigned to sales reps.

**Key fields:**
- `name` - Rule name
- `conditions` - When this rule applies
- `assignment_type` - round_robin, load_balanced, territory
- `assigned_users` - Array of user IDs to assign to
- `call_scheduling` - Call timing preferences
- `priority` - Rule order (higher first)

### permit_workflows
Tracks permitting process for each solar installation project.

**Key fields:**
- `opportunity_sf_id` - Related opportunity
- `permit_status` - Current stage
- `jurisdiction` - Permitting authority
- `application_number` - Permit app number
- `required_documents` - Docs needed (JSON array)
- `collected_documents` - Docs received (JSON array)
- `assigned_to` - Permit coordinator

### design_workflows
Tracks design process with Aurora Solar integration.

**Key fields:**
- `opportunity_sf_id` - Related opportunity
- `design_status` - Current stage
- `aurora_project_id` - Aurora Solar project ID
- `assigned_designer` - Designer working on it
- `revision_count` - Number of revisions
- `system_size_kw` - System size
- `panel_count` - Number of panels

### automation_tasks
Tasks automatically created by workflows.

**Key fields:**
- `task_type` - call, email, document, approval, etc.
- `assigned_to` - User assigned
- `related_record_type` - lead, opportunity, etc.
- `related_record_id` - ID of related record
- `title` - Task title
- `due_date` - When it's due
- `priority` - high, medium, low
- `status` - pending, in_progress, completed

### lead_scoring
Automatic lead scoring for prioritization.

**Key fields:**
- `lead_id` - Related lead
- `total_score` - Overall score (0-100)
- `property_score` - Property characteristics
- `engagement_score` - Contact info & interactions
- `demographic_score` - Location & demographics
- `score_category` - hot, warm, cold

### automation_notifications
Tracks all automated emails and SMS messages.

**Key fields:**
- `notification_type` - email, sms, in_app
- `recipient_type` - user, customer, partner
- `recipient_contact` - Email or phone
- `subject` - Message subject
- `message` - Message body
- `status` - pending, sent, delivered, failed

### document_automation
Tracks automated document management with Egnyte.

**Key fields:**
- `record_type` - lead, opportunity, account
- `record_id` - ID of related record
- `document_type` - contract, permit, design, etc.
- `egnyte_path` - Path in Egnyte
- `auto_created` - Was this auto-generated?
- `status` - draft, pending_approval, approved

## Admin Console

Access the automation console at: **Admin Dashboard > Process Automation**

### Overview Tab
- View automation statistics
- Test lead automation
- Quick actions for common tasks
- System health monitoring

### Workflows Tab
- View all automation workflows
- Enable/disable workflows
- Create new workflows
- Configure trigger conditions and actions

### Lead Rules Tab
- Manage lead assignment rules
- Configure round-robin rotation
- Set up territory-based assignment
- Define load-balancing rules

### Executions Tab
- Monitor workflow executions
- View success/failure rates
- Debug failed executions
- Track performance metrics

### Tasks Tab
- View all automated tasks
- Filter by priority and status
- See task assignments
- Track completion rates

## Creating Custom Workflows

### Example: Welcome Email for Hot Leads

```sql
INSERT INTO automation_workflows (
  name,
  description,
  trigger_type,
  trigger_conditions,
  actions,
  is_active,
  priority
) VALUES (
  'Hot Lead Welcome Email',
  'Send personalized email to hot leads within 5 minutes',
  'lead_created',
  '{"score_category": {"equals": "hot"}}',
  '[
    {
      "type": "send_notification",
      "config": {
        "notification_type": "email",
        "recipient_type": "customer",
        "recipient_contact": "{{email}}",
        "subject": "Welcome to Sunation Energy - Let''s Get Started!",
        "message": "Hi {{FirstName}},\n\nThank you for your interest in solar! Based on your property details, you''re an excellent candidate for solar energy.\n\nA solar specialist will contact you within the next hour to discuss your project.\n\nBest regards,\nThe Sunation Team"
      }
    }
  ]',
  true,
  10
);
```

### Example: Auto-Create Design When Opportunity Wins

```sql
INSERT INTO automation_workflows (
  name,
  description,
  trigger_type,
  trigger_conditions,
  actions,
  is_active,
  priority
) VALUES (
  'Auto-Start Design on Win',
  'Automatically create design workflow when deal is won',
  'opportunity_won',
  '{}',
  '[
    {
      "type": "create_design_workflow",
      "config": {}
    },
    {
      "type": "create_egnyte_folder",
      "config": {
        "folder_path": "/Shared/Solar Projects/{{Name}}/Designs"
      }
    }
  ]',
  true,
  10
);
```

## Best Practices

### 1. Lead Scoring
- Review scoring factors monthly and adjust weights
- Monitor conversion rates by score category
- Use scores to prioritize follow-up timing

### 2. Assignment Rules
- Use load-balanced assignment during busy periods
- Use round-robin for even distribution
- Configure territory rules based on zip codes

### 3. Permit Management
- Keep jurisdiction-specific document lists updated
- Train staff on automatic folder creation
- Monitor permit approval timelines

### 4. Design Workflow
- Review designer workload balancing weekly
- Track revision counts to identify training needs
- Ensure Aurora Solar IDs are properly linked

### 5. Notifications
- Keep message templates professional and concise
- Include all necessary contact information
- Set realistic timeline expectations

## Monitoring and Troubleshooting

### Check Workflow Execution Status
```sql
SELECT
  w.name,
  e.status,
  e.started_at,
  e.error_message
FROM automation_executions e
JOIN automation_workflows w ON w.id = e.workflow_id
WHERE e.created_at >= CURRENT_DATE
ORDER BY e.created_at DESC;
```

### View Pending Tasks by Priority
```sql
SELECT
  task_type,
  priority,
  COUNT(*) as count,
  MIN(due_date) as earliest_due
FROM automation_tasks
WHERE status = 'pending'
GROUP BY task_type, priority
ORDER BY priority DESC;
```

### Monitor Lead Scoring Distribution
```sql
SELECT
  score_category,
  COUNT(*) as count,
  AVG(total_score) as avg_score
FROM lead_scoring
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY score_category;
```

## Support and Customization

For custom workflow creation, integration setup, or troubleshooting:
1. Access the Admin Console
2. Navigate to Process Automation
3. Use the built-in testing tools
4. Review execution history for debugging

The automation system is designed to be extensible. New trigger types and actions can be added by creating additional edge functions that follow the same patterns as the existing automation functions.
