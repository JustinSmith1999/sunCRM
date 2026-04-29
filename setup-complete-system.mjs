import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const howToArticles = [
  {
    title: "How to Create a New Lead",
    category: "Leads Management",
    summary: "Step-by-step guide to adding new leads into the CRM system",
    content: `# How to Create a New Lead

## Overview
Leads are potential customers who have shown interest in your products or services. This guide will walk you through creating a new lead in the CRM.

## Steps

### 1. Navigate to Leads
- Click on **Leads** in the left sidebar
- You'll see a list of all existing leads

### 2. Click "Add Lead" Button
- Look for the **Add Lead** button (usually at the top right)
- Click it to open the lead creation form

### 3. Fill in Required Information

**Basic Information:**
- **First Name** (required)
- **Last Name** (required)
- **Email** (required)
- **Phone** (required)

**Address Information:**
- Street Address
- City
- State
- Zip Code
- County (if applicable)

**Additional Details:**
- **Lead Source**: Where did this lead come from? (Website, Referral, Partner, etc.)
- **Status**: Usually starts as "New"
- **Rating**: Cold, Warm, or Hot
- **Company**: Business name if applicable
- **Title**: Job title

### 4. Add Custom Fields (if applicable)
Depending on your industry, you may have custom fields like:
- Utility provider
- Utility account number
- Type of installation
- Sales notes
- Partner information

### 5. Save the Lead
- Review all information for accuracy
- Click **Save** or **Create Lead**
- The lead will now appear in your leads list

## Tips
- Always fill in as much information as possible
- Use consistent lead sources to track where leads come from
- Add notes or sales information in the designated fields
- Assign leads to appropriate team members

## What Happens Next?
- The lead will be visible in the Leads section
- You can convert it to an opportunity later
- Team members can add activities, notes, and tasks
- You can track the lead through your sales pipeline`,
    tags: ["leads", "getting-started", "data-entry"]
  },
  {
    title: "How to Manage Web Forms",
    category: "Admin",
    summary: "Learn how to create and manage web forms that capture leads from your website",
    content: `# How to Manage Web Forms

## Overview
Web forms allow you to capture leads directly from your website into the CRM automatically. No manual data entry required!

## Creating a New Web Form

### 1. Access Web Forms Console
- Click **Home** in the sidebar
- Click the **Web Forms** tile (purple with Users icon)

### 2. Click "Create Web Form"

### 3. Fill in Form Details

**Required Fields:**
- **Form Name**: Descriptive name for internal use (e.g., "Contact Us Form", "Quote Request")
- **Form Key**: Unique identifier that must be in your HTML form (e.g., "contact-form")
  - ⚠️ This must match exactly in your website's form code
- **Default Owner**: Who should receive these leads?

**Optional Fields:**
- **Description**: Notes about what this form is for
- **Default Lead Source**: Automatically set lead source (e.g., "Website", "Landing Page")
- **Success Message**: What users see after submitting
- **Redirect URL**: Where to send users after submission
- **Capture IP**: Track submitter IP addresses (Yes/No)
- **Active**: Turn form on/off without deleting it

### 4. Save the Form

## Using Your Web Form

### In Your Website HTML:
\`\`\`html
<form action="YOUR_SUPABASE_URL/functions/v1/web-to-lead" method="POST">
  <!-- Add the form key as a hidden field -->
  <input type="hidden" name="form_key" value="your-form-key">

  <!-- Your form fields -->
  <input name="first_name" required>
  <input name="last_name" required>
  <input name="email" type="email" required>
  <input name="phone" required>

  <button type="submit">Submit</button>
</form>
\`\`\`

## Managing Existing Forms

### View Submissions Count
- See how many leads each form has generated
- Track which forms are most effective

### Edit Form Settings
- Click the edit icon next to any form
- Update settings as needed
- Changes take effect immediately

### Deactivate a Form
- Uncheck "Active" to temporarily disable
- Form won't accept submissions but stays configured
- Reactivate anytime without losing settings

### Delete a Form
- Use with caution - this is permanent
- Existing leads from the form are not affected
- Only the form configuration is removed

## Field Mapping

These standard fields are automatically captured:
- first_name, last_name
- email, phone, mobile
- company, title
- street, city, state, zip, country
- And many custom fields specific to your industry

## Troubleshooting

**Leads not appearing?**
- Verify the form_key in your HTML matches exactly
- Check that the form is marked "Active"
- Ensure the form action URL is correct

**Missing data?**
- Check that field names in your HTML match expected names
- Review the lead to see which fields were captured

## Tips
- Use descriptive form names to stay organized
- Test each form after creation
- Monitor submission counts to track performance
- Set appropriate default owners for different form types`,
    tags: ["web-forms", "admin", "leads", "automation"]
  },
  {
    title: "How to Track Opportunities and Deals",
    category: "Sales",
    summary: "Manage your sales pipeline with the deals/opportunities kanban board",
    content: `# How to Track Opportunities and Deals

## Overview
The Deals section (also called Opportunities) helps you visualize and manage your sales pipeline using a kanban board view.

## Understanding Deal Stages

Typical stages include:
1. **Prospecting** - Initial contact made
2. **Qualification** - Determining if they're a good fit
3. **Proposal** - Sending quotes or proposals
4. **Negotiation** - Working out terms
5. **Closed Won** - Deal successfully closed! 🎉
6. **Closed Lost** - Deal didn't work out

## Creating a New Deal

### Option 1: Convert a Lead
- Go to the Leads section
- Find a qualified lead
- Click **Convert to Opportunity**
- Lead information automatically transfers

### Option 2: Create Directly
- Click **Deals** in the sidebar
- Click **Add Deal** button
- Fill in deal information:
  - Deal name
  - Account/Company
  - Amount (expected revenue)
  - Close date (expected)
  - Stage
  - Probability
  - Owner

## Using the Kanban Board

### Moving Deals
- **Drag and drop** cards between columns
- Stage updates automatically
- Probability adjusts based on stage

### Viewing Deal Details
- Click on any deal card
- See full information
- View activity history
- Add notes or tasks

### Filtering and Sorting
- Filter by owner
- Filter by amount range
- Filter by close date
- Sort by various criteria

## Managing Deal Information

### Updating Deal Amount
- Click on the deal
- Edit the amount field
- Save changes
- Total pipeline value updates automatically

### Adjusting Close Date
- Click on the deal
- Update expected close date
- Set reminders as needed

### Adding Activities
- Log calls, meetings, emails
- Track all interactions
- Keep team informed

## Best Practices

### 1. Keep Deals Moving
- Update stages regularly
- Don't let deals sit too long
- Add tasks for next steps

### 2. Accurate Forecasting
- Be realistic with close dates
- Update amounts as negotiations progress
- Adjust probability based on reality

### 3. Activity Tracking
- Log every significant interaction
- Add notes after calls/meetings
- Keep history complete

### 4. Team Collaboration
- Assign appropriate owners
- Tag team members in notes
- Share important updates

## Deal Metrics to Watch

- **Pipeline Value**: Total of all open deals
- **Win Rate**: Closed Won / Total Closed
- **Average Deal Size**: Total revenue / Number of deals
- **Sales Cycle**: Average time from created to closed

## Tips
- Review pipeline weekly
- Clean up stale opportunities
- Celebrate wins! 🎉
- Learn from losses
- Keep data current and accurate`,
    tags: ["deals", "opportunities", "sales", "pipeline"]
  },
  {
    title: "How to Manage Your Daily Tasks",
    category: "Productivity",
    summary: "Stay organized with the task management system",
    content: `# How to Manage Your Daily Tasks

## Overview
The Tasks section helps you stay organized and ensures nothing falls through the cracks. Track to-dos, follow-ups, and deadlines all in one place.

## Creating a New Task

### 1. Navigate to Tasks
- Click **Tasks** in the sidebar
- View all your existing tasks

### 2. Click "Add Task"

### 3. Fill in Task Details

**Required:**
- **Subject/Title**: What needs to be done?
- **Due Date**: When is it due?

**Optional but Recommended:**
- **Priority**: High, Medium, or Low
- **Status**: Not Started, In Progress, Completed
- **Assigned To**: Who's responsible?
- **Related To**: Link to a Lead, Account, Deal, or Case
- **Description**: Additional details

### 4. Save the Task

## Managing Tasks

### Task Views
- **My Tasks**: Only tasks assigned to you
- **Team Tasks**: All team tasks
- **Overdue**: Tasks past due date
- **Completed**: Recently completed tasks
- **Today**: Due today
- **This Week**: Due within 7 days

### Marking Tasks Complete
- Click the checkbox next to the task
- Or open task and change status to "Completed"
- Completed tasks move to completed view

### Editing Tasks
- Click on task to open details
- Update any field
- Save changes

## Task Best Practices

### 1. Use Clear Titles
❌ "Follow up"
✅ "Follow up with John Smith about solar quote"

### 2. Set Realistic Due Dates
- Don't over-commit
- Build in buffer time
- Update if circumstances change

### 3. Link to Related Records
- Connect tasks to leads, accounts, or deals
- Provides context
- Keeps everything organized

### 4. Use Priorities Wisely
- **High**: Urgent and important
- **Medium**: Important but not urgent
- **Low**: Nice to have

### 5. Review Daily
- Check tasks every morning
- Adjust priorities as needed
- Mark completed items

## Task Automation

Some tasks are created automatically:
- Follow-up reminders from calls
- Next steps from deal stages
- Case resolution deadlines
- Campaign activities

## Tips for Productivity

### Morning Routine
1. Review tasks for the day
2. Prioritize top 3 must-dos
3. Schedule time blocks

### Throughout Day
- Mark tasks complete as you go
- Add new tasks immediately
- Update status on long-running tasks

### End of Day
- Review what got done
- Reschedule incomplete tasks
- Plan tomorrow's priorities

## Task Reminders
- Set reminders for important tasks
- Get notifications before due date
- Never miss a deadline

## Collaboration
- Assign tasks to team members
- Add comments for updates
- Tag colleagues for visibility`,
    tags: ["tasks", "productivity", "time-management"]
  },
  {
    title: "How to Use My Day Dashboard",
    category: "Getting Started",
    summary: "Your personalized daily overview and productivity center",
    content: `# How to Use My Day Dashboard

## Overview
The "My Day" dashboard is your personal command center. It shows everything you need to focus on today in one convenient view.

## What You'll See

### 1. Today's Overview
- Current date and time
- Quick stats for the day
- Weather (if configured)

### 2. Priority Tasks
- Tasks due today
- Overdue tasks (red alert!)
- High priority items

### 3. Today's Meetings & Calls
- Scheduled appointments
- Conference call links
- Meeting preparation notes

### 4. Recent Activity
- Latest leads assigned to you
- Updated deals
- New cases
- Team mentions

### 5. Quick Actions
Common shortcuts like:
- Create new lead
- Log a call
- Add task
- Create deal

## Using Quick Actions

### Log a Call
1. Click "Log Call" quick action
2. Select who you called (lead, contact, account)
3. Add call notes
4. Set follow-up task if needed
5. Save

### Create Task
1. Click "New Task"
2. Fill in details
3. Set due date
4. Save
- Task appears in your list immediately

### New Lead
1. Click "New Lead"
2. Enter lead information
3. Save
- Lead is automatically assigned to you

## Customizing Your View

### Widget Arrangement
- Drag and drop widgets
- Resize sections
- Show/hide widgets you don't use

### Filters
- Show only high priority
- Hide completed items
- Filter by type

## Best Practices

### Start Every Day Here
1. Open "My Day" first thing
2. Review overdue items
3. Check today's tasks
4. Review appointments

### Throughout the Day
- Check periodically for updates
- Use quick actions for common tasks
- Mark items complete as you go

### End of Day
- Review what got done
- Reschedule incomplete items
- Plan tomorrow

## Tips
- Keep this tab open all day
- Refresh to see latest updates
- Use keyboard shortcuts (if available)
- Customize to your workflow

## Benefits
- **Stay Focused**: See only what matters today
- **Save Time**: Everything in one place
- **Never Miss**: Alerts for overdue items
- **Quick Actions**: Common tasks one click away`,
    tags: ["my-day", "dashboard", "getting-started", "productivity"]
  },
  {
    title: "How to Manage Accounts and Companies",
    category: "Accounts",
    summary: "Track and manage customer accounts and company relationships",
    content: `# How to Manage Accounts and Companies

## Overview
Accounts represent companies or organizations you do business with. They're separate from contacts (people) and help you manage B2B relationships.

## Creating a New Account

### 1. Navigate to Accounts
- Click **Accounts** in the sidebar

### 2. Click "Add Account"

### 3. Fill in Account Information

**Basic Details:**
- **Account Name** (required) - Company name
- **Type**: Customer, Prospect, Partner, Competitor
- **Industry**: What sector are they in?
- **Website**: Company website URL
- **Phone**: Main company phone

**Address:**
- Billing address
- Shipping address (if different)

**Additional Information:**
- Number of employees
- Annual revenue
- Account owner (who manages this account)
- Parent account (if subsidiary)

### 4. Save the Account

## Managing Contacts Under Accounts

### Adding Contacts
- Open an account
- Click "New Contact"
- Fill in person's details
- They're now linked to this account

### Primary Contact
- Designate one contact as primary
- This is main point of contact
- Shows first in lists

## Tracking Account Activity

### View All Related Records
In an account, you'll see:
- All contacts at this company
- All opportunities/deals
- All cases
- All tasks
- Activity history

### Adding Notes
- Keep running notes about the account
- Log important conversations
- Track relationship status

## Account Hierarchies

### Parent-Child Relationships
- Large companies often have divisions
- Set parent account for subsidiaries
- See rolled-up view of entire organization

Example:
- Parent: ABC Corporation
  - Child: ABC - East Coast
  - Child: ABC - West Coast

## Best Practices

### 1. Keep Information Current
- Update when companies move
- Note changes in key contacts
- Track growth (employees, revenue)

### 2. Regular Account Reviews
- Set recurring tasks to review accounts
- Check in with key accounts quarterly
- Update opportunities and status

### 3. Document Everything
- Log all significant interactions
- Keep notes about preferences
- Track decision-makers

### 4. Use Account Teams
- Assign multiple team members
- Define roles (Account Manager, Sales Rep, Support)
- Everyone stays informed

## Account Views

### My Accounts
- Accounts you own
- Your primary responsibility

### All Accounts
- Complete account list
- Team-wide view

### Custom Views
- Filter by industry
- Filter by revenue
- Filter by last activity

## Tips
- Link every contact to an account
- Use consistent naming conventions
- Keep account owner updated
- Review inactive accounts regularly
- Celebrate account milestones`,
    tags: ["accounts", "companies", "b2b", "relationship-management"]
  },
  {
    title: "How to Handle Customer Cases",
    category: "Support",
    summary: "Manage customer support requests and service issues effectively",
    content: `# How to Handle Customer Cases

## Overview
Cases are customer support requests or issues that need resolution. Track problems, assign to team members, and ensure every customer gets help.

## Creating a New Case

### 1. Navigate to Cases
- Click **Cases** in the sidebar

### 2. Click "New Case"

### 3. Fill in Case Details

**Required:**
- **Subject**: Brief description of the issue
- **Account/Contact**: Who is this for?
- **Status**: New, In Progress, Waiting, Resolved
- **Priority**: Low, Medium, High, Critical

**Optional:**
- **Description**: Full details of the issue
- **Type**: Question, Problem, Feature Request
- **Origin**: Phone, Email, Web, Chat
- **Product**: Which product/service
- **Assigned To**: Who will handle this

### 4. Save the Case

## Case Lifecycle

### 1. New
- Case just created
- Needs initial review
- Assign to appropriate person

### 2. In Progress
- Someone is actively working on it
- Add updates as you go
- Keep customer informed

### 3. Waiting
- Waiting for customer response
- Or waiting for internal resources
- Set reminder to follow up

### 4. Resolved
- Issue is fixed
- Customer confirmed
- Close the case

## Managing Cases

### Adding Updates
- Click into case
- Add comments in activity feed
- Updates visible to team
- Optionally email customer

### Escalating Cases
- Change priority to High or Critical
- Reassign to senior team member
- Add management to notifications

### Merging Duplicate Cases
- If customer submits multiple times
- Merge into single case
- Maintains all history

## Response Time Goals

Set targets based on priority:
- **Critical**: 1 hour
- **High**: 4 hours
- **Medium**: 1 business day
- **Low**: 3 business days

## Best Practices

### 1. Quick First Response
- Acknowledge receipt immediately
- Even if you don't have solution yet
- Sets expectations

### 2. Keep Customer Updated
- Don't go dark
- Update every 24-48 hours
- Even if just "still working on it"

### 3. Document Everything
- Log all communications
- Note troubleshooting steps
- Include resolution details

### 4. Follow Up After Resolution
- Check in 24-48 hours later
- Confirm issue is truly resolved
- Ask for feedback

## Case Views

### My Open Cases
- Cases assigned to you
- Focus on these first

### Team Cases
- All team's cases
- Help if someone's overloaded

### Unassigned
- New cases needing assignment
- Check frequently

### Recently Closed
- For reference
- Quality assurance
- Training examples

## Tips
- Set up case email routing
- Use templates for common issues
- Create knowledge base articles from frequent cases
- Track metrics (resolution time, customer satisfaction)
- Celebrate resolved cases

## Automation Opportunities
- Auto-assign based on type
- Send automatic updates
- Escalate if not resolved in X days
- Request feedback on resolution`,
    tags: ["cases", "support", "customer-service"]
  },
  {
    title: "How to Use Reports and Analytics",
    category: "Reports",
    summary: "Generate insights and track performance with built-in reports",
    content: `# How to Use Reports and Analytics

## Overview
The Reports section provides insights into your sales, marketing, and support performance. Make data-driven decisions with real-time analytics.

## Accessing Reports

### 1. Navigate to Reports
- Click **Reports** in the sidebar

### 2. Choose Report Type
Available reports include:
- Sales reports
- Lead reports
- Activity reports
- Pipeline reports
- Support metrics
- Team performance

## Common Reports

### Sales Pipeline Report
**What it shows:**
- All open opportunities
- Grouped by stage
- Total value per stage
- Forecast for closing

**How to use it:**
- Weekly sales meetings
- Forecast revenue
- Identify bottlenecks
- Coach team members

### Lead Source Report
**What it shows:**
- Where leads come from
- Conversion rates by source
- Cost per lead (if tracked)
- ROI by channel

**How to use it:**
- Allocate marketing budget
- Double down on what works
- Stop ineffective channels

### Activity Report
**What it shows:**
- Calls made
- Emails sent
- Meetings held
- Tasks completed

**How to use it:**
- Track productivity
- Identify top performers
- Coach low performers

### Case Resolution Report
**What it shows:**
- Cases opened vs closed
- Average resolution time
- Cases by priority
- Customer satisfaction scores

**How to use it:**
- Support team performance
- Identify training needs
- Improve processes

## Creating Custom Reports

### 1. Click "New Report"

### 2. Choose Data Source
- Leads
- Accounts
- Opportunities
- Cases
- Tasks
- Custom objects

### 3. Select Fields
- Choose which columns to show
- Add calculated fields
- Group and summarize data

### 4. Add Filters
- Date ranges
- Owner
- Status
- Custom criteria

### 5. Choose Visualization
- Table
- Bar chart
- Line graph
- Pie chart
- Funnel

### 6. Save and Share
- Name your report
- Save for reuse
- Share with team
- Schedule email delivery

## Dashboard Overview

### Key Metrics Dashboard
See at-a-glance:
- This month's revenue
- Open opportunities
- New leads
- Cases to resolve
- Team activity

### Sales Dashboard
- Win rate
- Average deal size
- Sales by rep
- Pipeline by stage
- Forecast vs actual

### Marketing Dashboard
- Lead generation
- Conversion rates
- Campaign performance
- ROI

## Using Filters

### Date Filters
- Today
- This week
- This month
- This quarter
- Last 30/60/90 days
- Custom date range

### Owner Filters
- My records
- My team
- Specific user
- All users

### Status Filters
- Open
- Closed
- Specific statuses

## Best Practices

### 1. Review Reports Regularly
- Daily: Pipeline, tasks
- Weekly: Sales performance
- Monthly: Trends and forecasts
- Quarterly: Strategic metrics

### 2. Share with Team
- Transparency builds trust
- Everyone sees same data
- Aligned on goals

### 3. Track Trends
- Don't just look at snapshots
- Watch how metrics change
- Identify patterns early

### 4. Take Action
- Reports without action are useless
- Set goals based on data
- Adjust tactics based on results

## Tips
- Start with pre-built reports
- Customize as you learn what you need
- Export to Excel if needed
- Schedule automated email delivery
- Use dashboards for TV displays`,
    tags: ["reports", "analytics", "metrics", "dashboards"]
  },
  {
    title: "How to Manage Email Templates",
    category: "Admin",
    summary: "Create and use email templates for consistent communication",
    content: `# How to Manage Email Templates

## Overview
Email templates save time and ensure consistent messaging. Create templates for common scenarios and personalize them when sending.

## Creating a Template

### 1. Access Templates
- Go to Home
- Click Email Templates tile (or in settings)

### 2. Click "New Template"

### 3. Fill in Template Details

**Basic Info:**
- **Template Name**: Internal name for finding it
- **Subject Line**: Email subject (can use merge fields)
- **Category**: Group related templates

**Email Body:**
- Write your message
- Use formatting (bold, lists, links)
- Add merge fields for personalization

### 4. Use Merge Fields

Common merge fields:
- First name: {first_name}
- Last name: {last_name}
- Company: {company}
- Email: {email}
- Phone: {phone}
- Custom fields from your records

Example:
Hi {first_name},

Thank you for your interest in our services. Based on our conversation about {company}, I wanted to follow up with...

Best regards,
Your Name

### 5. Save Template

## Using Templates

### When Composing Email:
1. Click "Use Template"
2. Select template from list
3. Merge fields auto-populate
4. Edit as needed
5. Send

### For Auto-Responses:
- Web form submissions
- Case auto-acknowledgments
- Welcome emails
- Follow-up sequences

## Template Categories

### Sales Templates
- Initial outreach
- Follow-up after meeting
- Proposal sent
- Contract sent
- Thank you after purchase

### Support Templates
- Case confirmation
- Issue resolved
- Follow-up check
- Feedback request

### Marketing Templates
- Newsletter
- Event invitation
- Product announcement
- Educational content

## Best Practices

### 1. Keep It Personal
- Use merge fields
- Don't sound robotic
- Leave room for customization

### 2. Clear Subject Lines
- Specific and relevant
- Include merge fields if helpful
- Test for spam triggers

### 3. Mobile-Friendly
- Short paragraphs
- Plenty of white space
- Links easy to tap

### 4. Call to Action
- What do you want them to do?
- Make it clear
- One primary CTA

### 5. Test Before Using
- Send test to yourself
- Check merge fields work
- Review on mobile

## Managing Templates

### Edit Existing Template
- Click on template name
- Make changes
- Save
- Affects future uses only

### Clone Template
- Duplicate existing template
- Modify for new purpose
- Faster than creating from scratch

### Deactivate Template
- No longer relevant
- Keep for reference
- Hide from active list

## Tips
- Build library over time
- Share best templates with team
- A/B test different versions
- Track which templates get responses
- Update templates based on feedback
- Include your email signature`,
    tags: ["email", "templates", "communication", "automation"]
  },
  {
    title: "How to Set Up and Use Automation Flows",
    category: "Admin",
    summary: "Automate repetitive tasks and create smart workflows",
    content: `# How to Set Up and Use Automation Flows

## Overview
Automation flows (also called workflows) automatically perform actions based on triggers. Save time and ensure consistency.

## Common Automation Examples

### Lead Assignment
**Trigger:** New lead created from web form
**Actions:**
- Assign to appropriate sales rep based on territory
- Send welcome email to lead
- Create follow-up task for rep

### Deal Stage Changes
**Trigger:** Deal moved to "Proposal" stage
**Actions:**
- Create task to send proposal
- Update expected close date
- Notify sales manager

### Case Escalation
**Trigger:** High priority case not resolved in 4 hours
**Actions:**
- Escalate to manager
- Send notification
- Update case status

## Creating an Automation Flow

### 1. Access Automation Console
- Go to Home
- Click Automation Flows tile

### 2. Click "Create Flow"

### 3. Choose Trigger

**Record Triggers:**
- Record created
- Record updated
- Field value changes
- Record deleted

**Time Triggers:**
- Scheduled (daily, weekly)
- Time-based (X days after field date)
- Deadline approaching

### 4. Set Conditions (Optional)
Only run if certain conditions met:
- Field equals value
- Record type is...
- Owner is...
- Multiple conditions (AND/OR logic)

### 5. Add Actions

**Immediate Actions:**
- Update field values
- Create related record (task, case, etc.)
- Send email
- Post to activity feed
- Call webhook

**Scheduled Actions:**
- Wait X hours/days
- Then perform action

### 6. Test the Flow
- Use test mode
- Verify it works as expected
- Check all conditions

### 7. Activate

## Flow Builder Interface

### Visual Builder
- Drag and drop components
- See flow visually
- Easy to understand logic

### Conditions and Branches
- IF/THEN logic
- Multiple paths
- Complex workflows

## Example Flows

### New Lead Nurture
1. **Trigger:** Lead created
2. **Action:** Send welcome email
3. **Wait:** 3 days
4. **Condition:** If not contacted
5. **Action:** Send follow-up email
6. **Action:** Create task for sales rep

### Opportunity Won
1. **Trigger:** Deal stage = Closed Won
2. **Action:** Create account (if new customer)
3. **Action:** Send thank you email
4. **Action:** Create onboarding case
5. **Action:** Notify account manager
6. **Action:** Update sales dashboard

### Case Auto-Response
1. **Trigger:** Case created
2. **Action:** Send acknowledgment email
3. **Action:** Assign based on type
4. **Wait:** 24 hours
5. **Condition:** If still New status
6. **Action:** Escalate to manager

## Best Practices

### 1. Start Simple
- Begin with one action flows
- Add complexity gradually
- Test thoroughly

### 2. Document Your Flows
- Add descriptions
- Note why flow exists
- Include examples

### 3. Monitor Performance
- Check flow execution logs
- Look for failures
- Optimize as needed

### 4. Don't Over-Automate
- Some things need human touch
- Balance automation with personal interaction
- Know when to use automation

### 5. Version Control
- Clone before major changes
- Keep old versions
- Can rollback if needed

## Managing Flows

### View All Flows
- See active flows
- See inactive flows
- Filter by object type

### Flow Analytics
- Times executed
- Success rate
- Average execution time
- Error logs

### Deactivate Flow
- Turn off without deleting
- Useful for seasonal flows
- Can reactivate anytime

## Tips
- Use descriptive names
- Group related flows
- Test with real data
- Start flows inactive
- Review monthly
- Delete unused flows
- Share successful flows with team`,
    tags: ["automation", "workflows", "admin", "efficiency"]
  }
];

async function setupCompleteSystem() {
  console.log('🚀 Setting up complete CRM system...\n');

  // Get admin user and org
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, role, organization_id')
    .limit(1)
    .maybeSingle();

  if (!users) {
    console.error('❌ No users found. Please sign up/login first.');
    process.exit(1);
  }

  const adminUser = users;
  console.log(`✓ Using user: ${adminUser.email}\n`);

  // 1. Create web form configuration
  console.log('📝 Setting up Sunation web form...');

  const { data: existingForm } = await supabase
    .from('web_forms')
    .select('id')
    .eq('form_key', 'sunation-contact-form')
    .maybeSingle();

  if (!existingForm) {
    const { error: formError } = await supabase
      .from('web_forms')
      .insert({
        organization_id: adminUser.organization_id,
        form_name: 'Sunation Contact Form',
        form_key: 'sunation-contact-form',
        description: 'Main contact form from sunation.com website',
        is_active: true,
        default_lead_source: '3 Sons Energy',
        default_owner_id: adminUser.id,
        success_message: 'Thank you for your submission!',
        redirect_url: 'https://www.sunation.com/cp-thankyou/',
        capture_ip: true,
        created_by: adminUser.id,
      });

    if (formError) {
      console.error('❌ Error creating web form:', formError.message);
    } else {
      console.log('✓ Web form created successfully');
    }
  } else {
    console.log('✓ Web form already exists');
  }

  // 2. Create knowledge base articles
  console.log('\n📚 Creating How-To knowledge base articles...');

  let createdCount = 0;
  let skippedCount = 0;

  for (const article of howToArticles) {
    const { data: existing } = await supabase
      .from('knowledge_base')
      .select('id')
      .eq('organization_id', adminUser.organization_id)
      .eq('title', article.title)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase
        .from('knowledge_base')
        .insert({
          organization_id: adminUser.organization_id,
          title: article.title,
          content: article.content,
          summary: article.summary,
          article_type: 'howto',
          category: article.category,
          tags: article.tags,
          is_published: true,
          author_id: adminUser.id,
          view_count: 0,
          helpful_count: 0,
          not_helpful_count: 0,
        });

      if (error) {
        console.error(`  ❌ Failed: ${article.title} - ${error.message}`);
      } else {
        createdCount++;
        console.log(`  ✓ Created: ${article.title}`);
      }
    } else {
      skippedCount++;
    }
  }

  console.log(`\n✅ Knowledge Base Setup Complete!`);
  console.log(`   Created: ${createdCount} articles`);
  console.log(`   Already existed: ${skippedCount} articles`);

  console.log('\n🎉 System setup complete!');
  console.log('\n📋 What was set up:');
  console.log('   1. ✅ Sunation web form configuration');
  console.log('   2. ✅ Comprehensive How-To guides for all CRM features');
  console.log('\n📖 View the knowledge base:');
  console.log('   - Click "Knowledge" in the sidebar');
  console.log('   - Filter by type "How To"');
  console.log('   - All articles are published and ready to use');
  console.log('\n🌐 Web form endpoint:');
  console.log(`   ${supabaseUrl}/functions/v1/web-to-lead`);
  console.log('   Form key: sunation-contact-form');
}

setupCompleteSystem().catch(console.error);
