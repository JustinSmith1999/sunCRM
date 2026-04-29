# Database Table Sync Guide

This guide explains which tables sync from Salesforce and which are internal CRM features.

## Tables That Sync From Salesforce ✓

These tables are automatically populated by the Salesforce sync:

| Table | Salesforce Object | Status | Records |
|-------|------------------|--------|---------|
| leads | Lead | ✓ Syncing | 40,832 |
| accounts | Account | ✓ Syncing | 8,383 |
| opportunities | Opportunity | ✓ Syncing | 21,743 |
| salesforce_contacts | Contact | ✓ Syncing | 6,370 |
| salesforce_campaigns | Campaign | ✓ Syncing | 28 |
| salesforce_campaign_members | CampaignMember | ✓ Syncing | 737 |
| salesforce_cases | Case | ✓ Syncing | 5,334 |
| salesforce_tasks | Task | ✓ Syncing | 85,060 |
| salesforce_events | Event | ✓ Syncing | 8,324 |
| salesforce_products | Product2 | ✓ Syncing | 15 |
| salesforce_opportunity_line_items | OpportunityLineItem | ✓ Syncing | 0 |
| salesforce_users | User | ⚠️ New | 0 |
| quotes | Quote | ⚠️ New | 0 |
| documents | Document | ⚠️ New | 0 |

## Tables That Need Data Mapping

These tables need to be populated by copying/transforming data from salesforce_* tables:

| Destination | Source | Action Required |
|------------|--------|-----------------|
| campaigns | salesforce_campaigns | Run copy script |
| cases | salesforce_cases | Run copy script |
| products | salesforce_products | Run copy script |
| activities | salesforce_tasks + salesforce_events | Run combine script |

**To populate these tables, run:**
```bash
node copy-salesforce-data.mjs
```

## Internal CRM Tables (Not From Salesforce)

These tables are for internal CRM features and are NOT synced from Salesforce. They start empty and are populated by users creating data within your CRM:

### Workflow & Automation
- `flows` - Custom automation flows
- `flow_actions` - Actions within flows
- `flow_conditions` - Flow conditions
- `flow_triggers` - Flow triggers
- `flow_executions` - Flow execution history
- `flow_schedules` - Scheduled flows
- `flow_versions` - Flow version control
- `flow_email_templates` - Email templates for flows
- `workflows` - Workflow definitions
- `workflow_rules` - Workflow rules
- `workflow_actions` - Workflow actions
- `workflow_action_history` - Workflow execution history

### Dashboards & Reports
- `custom_dashboards` - User-created dashboards
- `dashboards` - Dashboard definitions
- `dashboard_widgets` - Dashboard components
- `dashboard_data_sources` - Dashboard data sources
- `reports` - Saved reports

### Customization
- `custom_fields` - Custom field definitions
- `custom_field_values` - Custom field data
- `page_layouts` - Page layout configurations
- `page_layout_fields` - Fields on layouts
- `page_layout_sections` - Layout sections
- `record_types` - Record type definitions

### Approvals & Rules
- `approval_processes` - Approval process definitions
- `approval_requests` - Active approval requests
- `validation_rules` - Data validation rules
- `assignment_rules` - Assignment rule definitions
- `assignment_rule_entries` - Rule entries
- `assignment_queues` - Assignment queues

### System Features
- `web_forms` - Web-to-lead forms
- `email_templates` - Email templates
- `notifications` - System notifications
- `crm_audit_log` - Activity tracking
- `crm_field_history` - Field change history
- `crm_email_messages` - Email communications
- `crm_documents` - Document storage
- `crm_import_jobs` - Data import jobs
- `crm_sharing_rules` - Sharing rules
- `crm_webhook_subscriptions` - Webhook configs

### User Management
- `user_profiles` - User profile data
- `user_preferences` - User settings
- `user_presence` - Online status
- `crm_login_history` - Login tracking

### Sales Management
- `sales_targets` - Sales quotas/targets
- `forecasts` - Sales forecasts
- `territories` - Sales territories
- `territory_assignments` - Territory assignments
- `quote_line_items` - Quote items (populated when quotes are created)

### Other
- `tags` - Tagging system
- `company_equipment` - Company assets
- `hr_records` - HR data
- `knowledge_base` - Knowledge articles
- `monthly_revenue` - Revenue tracking
- `software/subscriptions` - Software licenses

## How To Sync Everything

### Step 1: Run Salesforce Sync
This pulls fresh data from Salesforce:

```bash
# Via the UI: Go to Admin Console → Salesforce Sync → Click "Sync All Objects"
# Or call the edge function directly:
curl -X POST "https://your-project.supabase.co/functions/v1/salesforce-sync"
```

### Step 2: Copy Data to CRM Tables
This maps salesforce_* tables to simpler table names:

```bash
node copy-salesforce-data.mjs
```

### Step 3: Create Internal Data
Use the CRM UI to create:
- Workflows and automation flows
- Custom dashboards
- Reports
- Web forms
- Email templates
- etc.

## Why Two Sets of Tables?

- **salesforce_*** tables: Direct mirror of Salesforce, with all Salesforce field names
- **Simple tables** (campaigns, cases, etc.): Cleaned up for easier CRM use

This allows you to:
1. Keep raw Salesforce data intact
2. Have a cleaner schema for your CRM
3. Add CRM-specific features not in Salesforce
