-- Insert Knowledge Base Articles
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  v_author_id uuid;
  v_org_id uuid;
BEGIN
  -- Get first user as author
  SELECT up.id, uor.organization_id
  INTO v_author_id, v_org_id
  FROM user_profiles up
  JOIN user_organization_roles uor ON up.id = uor.user_id
  LIMIT 1;

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please create a user account first.';
  END IF;

  RAISE NOTICE 'Using user: % in org: %', v_author_id, v_org_id;

  -- Article 1: Creating Leads
  INSERT INTO knowledge_base (
    organization_id, title, content, summary, article_type, category, tags, is_published, author_id, view_count, helpful_count, not_helpful_count
  )
  SELECT
    v_org_id,
    'Complete Beginner Guide: How to Create a New Lead',
    '# Complete Beginner Guide: How to Create a New Lead

## What is a Lead?
A "lead" is a person or business that might want to buy your products or services. Think of it like a potential customer who has shown interest. In this CRM, we keep track of these leads so we don''t forget about them.

## Before You Start
Make sure you:
1. Are logged into the CRM (you should see your name in the top corner)
2. Have your mouse or trackpad ready
3. Have the lead''s information ready (name, email, phone number, etc.)

## Step-by-Step Instructions

### STEP 1: Open the Leads Section
1. Look at the LEFT SIDE of your screen - you''ll see a vertical menu
2. Find the word **"Leads"** in this menu
3. **CLICK** on "Leads" with your mouse

**What you''ll see:** The screen will change to show a list of existing leads

### STEP 2: Click the "Add Lead" Button
1. Look at the TOP RIGHT corner of the screen
2. Find a button that says **"Add Lead"** or has a plus sign (+)
3. **CLICK** the button once

**What you''ll see:** A form will appear where you can type information

### STEP 3: Fill in Basic Information

**REQUIRED FIELDS (must fill these in):**

**First Name:**
- Type the person''s first name (like "John" or "Mary")

**Last Name:**
- Type the person''s last name (like "Smith" or "Johnson")

**Email Address:**
- Type their full email (like john@example.com)
- IMPORTANT: Include the @ symbol and .com

**Phone Number:**
- Type their phone number
- Example: 555-123-4567

### STEP 4: Fill in Address (optional but helpful)
- Street Address
- City
- State
- Zip Code

### STEP 5: Additional Details
- **Lead Source**: Where they came from (Website, Phone Call, etc.)
- **Company**: Business name (if applicable)
- **Notes**: Any extra information

### STEP 6: Save
1. Scroll to the bottom
2. Click the **"Save"** button
3. Done! Your lead is now saved.

## Tips for Success
- Fill in as much information as possible
- Double-check email and phone number
- Use the Notes field for important details
- Ask for help if you get stuck!',
    'Ultra-detailed step-by-step guide for creating leads. Perfect for absolute beginners.',
    'howto',
    'Getting Started',
    ARRAY['leads', 'getting-started', 'beginner', 'step-by-step'],
    true,
    v_author_id,
    0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM knowledge_base WHERE title = 'Complete Beginner Guide: How to Create a New Lead' AND organization_id = v_org_id
  );

  -- Article 2: Web Forms
  INSERT INTO knowledge_base (
    organization_id, title, content, summary, article_type, category, tags, is_published, author_id, view_count, helpful_count, not_helpful_count
  )
  SELECT
    v_org_id,
    'Beginner Guide: Managing Web Forms',
    '# Beginner Guide: Managing Web Forms

## What is a Web Form?
A web form is a contact form on your website. When someone fills it out, their information automatically becomes a lead in your CRM!

## Viewing Web Forms
1. Click **"Home"** in the left sidebar
2. Find and click the **"Web Forms"** tile
3. You''ll see a list of all forms

## Creating a New Web Form
1. Click **"Create Web Form"** button
2. Fill in:
   - **Form Name**: A name to remember it by (like "Contact Form")
   - **Form Key**: A code name (use lowercase and dashes, like "contact-form")
   - **Default Owner**: Who should receive these leads?
3. Click **"Save"**

## Connecting to Your Website
After creating the form, you need to give information to your web developer:
- The form key you created
- The endpoint URL

Your web developer will connect your website form to the CRM.

## Testing Your Form
1. Go to your website
2. Fill out the form with test information
3. Check the Leads section in CRM
4. You should see a new lead!

## Tips
- Use clear, descriptive form names
- Test every new form
- Keep form keys unique and simple',
    'Learn how to set up website forms that automatically create leads in the CRM.',
    'howto',
    'Admin',
    ARRAY['web-forms', 'admin', 'website', 'automation'],
    true,
    v_author_id,
    0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM knowledge_base WHERE title = 'Beginner Guide: Managing Web Forms' AND organization_id = v_org_id
  );

  -- Article 3: My Day Dashboard
  INSERT INTO knowledge_base (
    organization_id, title, content, summary, article_type, category, tags, is_published, author_id, view_count, helpful_count, not_helpful_count
  )
  SELECT
    v_org_id,
    'Beginner Guide: Using Your My Day Dashboard',
    '# Beginner Guide: Using Your My Day Dashboard

## What is My Day?
"My Day" is your personal homepage. It shows everything you need to do TODAY in one easy place.

## How to Use It
1. Click **"My Day"** in the left sidebar
2. You''ll see:
   - **Today''s Tasks** - Things you need to do
   - **Overdue Items** (in red) - Do these first!
   - **Today''s Appointments** - Meetings or calls
   - **Recent Leads** - New potential customers

## Start Every Day Here
Every morning when you log in:
1. Open My Day first thing
2. Look at overdue items (in red) - do these first!
3. Review today''s tasks
4. Check your appointments
5. Look at new leads assigned to you

## Tips for Success
- Keep this page open all day
- Refresh occasionally (press F5) to see updates
- Mark tasks complete as you finish them
- Check it every few hours throughout the day',
    'Your personal daily dashboard showing everything you need to do today.',
    'howto',
    'Getting Started',
    ARRAY['my-day', 'dashboard', 'daily-tasks', 'beginner'],
    true,
    v_author_id,
    0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM knowledge_base WHERE title = 'Beginner Guide: Using Your My Day Dashboard' AND organization_id = v_org_id
  );

  -- Article 4: Tasks
  INSERT INTO knowledge_base (
    organization_id, title, content, summary, article_type, category, tags, is_published, author_id, view_count, helpful_count, not_helpful_count
  )
  SELECT
    v_org_id,
    'Beginner Guide: Managing Your Tasks',
    '# Beginner Guide: Managing Your Tasks

## What is a Task?
A task is a reminder to do something. Like a sticky note that won''t get lost!

Examples:
- "Call John Smith"
- "Send quote to ABC Company"
- "Follow up with new lead"

## Creating a Task
1. Click **"Tasks"** in the left sidebar
2. Click **"Add Task"** button
3. Fill in:
   - **Task Name**: What you need to do (be specific!)
   - **Due Date**: When it should be done
   - **Priority**: High, Medium, or Low
4. Click **"Save"**

## Completing a Task
1. Find the task in your list
2. Click the checkbox next to it
3. Done! It moves to completed.

## Best Practices
- Check your tasks every morning
- Use specific task names (not just "Call someone")
- Set realistic due dates
- Mark complete immediately when done
- Don''t let overdue tasks pile up

## Tips
- High priority = urgent and important
- Medium priority = important but not urgent
- Low priority = nice to do eventually',
    'Learn how to create and manage your daily to-do list.',
    'howto',
    'Productivity',
    ARRAY['tasks', 'to-do', 'productivity', 'beginner'],
    true,
    v_author_id,
    0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM knowledge_base WHERE title = 'Beginner Guide: Managing Your Tasks' AND organization_id = v_org_id
  );

  -- Article 5: Deals
  INSERT INTO knowledge_base (
    organization_id, title, content, summary, article_type, category, tags, is_published, author_id, view_count, helpful_count, not_helpful_count
  )
  SELECT
    v_org_id,
    'Beginner Guide: Tracking Deals and Opportunities',
    '# Beginner Guide: Tracking Deals and Opportunities

## What is a Deal?
A deal (also called an "opportunity") is a potential sale. When a lead gets serious about buying, they become a deal!

## Creating a Deal

**Method 1: Convert from a Lead**
1. Go to **Leads** section
2. Click on a lead
3. Click **"Convert to Opportunity"**
4. Fill in amount and expected close date
5. Save

**Method 2: Create Directly**
1. Click **"Deals"** in sidebar
2. Click **"New Deal"**
3. Fill in all information
4. Save

## Understanding the Deal Board
The Deals page shows columns for different stages:
- **Prospecting**: Initial contact made
- **Qualification**: Understanding their needs
- **Proposal**: Quote/proposal sent
- **Negotiation**: Working out details
- **Closed Won**: They bought!
- **Closed Lost**: They didn''t buy

## Moving Deals
To move a deal to a new stage:
1. Click and HOLD on the deal card
2. Drag it to the new column
3. Release your mouse

## Tips for Success
- Review your deals weekly
- Add notes after every conversation
- Update amounts if they change
- Be realistic about close dates
- Celebrate when you close a deal!',
    'Manage your sales pipeline and track potential customers through the buying process.',
    'howto',
    'Sales',
    ARRAY['deals', 'opportunities', 'sales', 'pipeline', 'beginner'],
    true,
    v_author_id,
    0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM knowledge_base WHERE title = 'Beginner Guide: Tracking Deals and Opportunities' AND organization_id = v_org_id
  );

  -- Article 6: Accounts
  INSERT INTO knowledge_base (
    organization_id, title, content, summary, article_type, category, tags, is_published, author_id, view_count, helpful_count, not_helpful_count
  )
  SELECT
    v_org_id,
    'Beginner Guide: Managing Accounts',
    '# Beginner Guide: Managing Accounts

## What is an Account?
An account is a company or organization you do business with. It''s different from a contact (which is a person).

## Creating an Account
1. Click **"Accounts"** in the left sidebar
2. Click **"Add Account"** button
3. Fill in:
   - **Account Name**: Company name
   - **Type**: Customer, Prospect, or Partner
   - **Industry**: What kind of business
   - **Phone**: Main phone number
   - **Website**: Company website
   - **Address**: Company address
4. Click **"Save"**

## Adding Contacts to an Account
1. Open an account
2. Click **"New Contact"** button
3. Fill in the person''s information
4. Save

Now you can see all people who work at that company!

## Tips
- Link every contact to an account
- Keep company information up to date
- Add notes about the company
- Track all interactions in one place',
    'Track companies and organizations you do business with.',
    'howto',
    'Accounts',
    ARRAY['accounts', 'companies', 'organizations', 'beginner'],
    true,
    v_author_id,
    0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM knowledge_base WHERE title = 'Beginner Guide: Managing Accounts' AND organization_id = v_org_id
  );

  -- Article 7: Cases
  INSERT INTO knowledge_base (
    organization_id, title, content, summary, article_type, category, tags, is_published, author_id, view_count, helpful_count, not_helpful_count
  )
  SELECT
    v_org_id,
    'Beginner Guide: Handling Customer Cases',
    '# Beginner Guide: Handling Customer Cases

## What is a Case?
A case is a customer support request or problem that needs to be solved.

## Creating a Case
1. Click **"Cases"** in the left sidebar
2. Click **"New Case"** button
3. Fill in:
   - **Subject**: What''s the problem?
   - **Account/Contact**: Who is this for?
   - **Priority**: Low, Medium, High, or Critical
   - **Description**: Details about the issue
4. Click **"Save"**

## Case Status Options
- **New**: Just created, not started yet
- **In Progress**: Currently working on it
- **Waiting**: Waiting for customer response
- **Resolved**: Problem is fixed!

## How to Work a Case
1. Open the case
2. Read the description carefully
3. Add notes as you work on it
4. Update the status as it progresses
5. When fixed, mark as "Resolved"

## Tips for Great Support
- Respond quickly (especially high priority)
- Keep the customer updated
- Document everything you do
- Follow up after resolving
- Learn from common issues',
    'Manage customer support requests and resolve issues effectively.',
    'howto',
    'Support',
    ARRAY['cases', 'support', 'customer-service', 'tickets', 'beginner'],
    true,
    v_author_id,
    0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM knowledge_base WHERE title = 'Beginner Guide: Handling Customer Cases' AND organization_id = v_org_id
  );

  -- Article 8: Reports
  INSERT INTO knowledge_base (
    organization_id, title, content, summary, article_type, category, tags, is_published, author_id, view_count, helpful_count, not_helpful_count
  )
  SELECT
    v_org_id,
    'Beginner Guide: Using Reports',
    '# Beginner Guide: Using Reports

## What are Reports?
Reports show you charts and numbers about how your business is doing.

## Viewing Reports
1. Click **"Reports"** in the left sidebar
2. Choose a report type from the list

## Common Reports
- **Sales Pipeline**: All your open deals and their value
- **Lead Sources**: Where your leads come from
- **Activity Report**: Your calls, emails, and meetings
- **Cases Report**: Support ticket statistics

## Reading a Report
- Look at totals and trends
- Compare this month to last month
- Identify what''s working well
- Find areas you can improve

## Tips
- Check reports weekly
- Share important numbers with your team
- Track your personal goals
- Celebrate when numbers improve!

## What to Look For
- Are leads increasing or decreasing?
- Which lead sources work best?
- How many deals are closing?
- What''s your win rate?
- Are customers happy? (check case resolution time)',
    'View statistics and insights about your sales and business performance.',
    'howto',
    'Reports',
    ARRAY['reports', 'analytics', 'metrics', 'statistics', 'beginner'],
    true,
    v_author_id,
    0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM knowledge_base WHERE title = 'Beginner Guide: Using Reports' AND organization_id = v_org_id
  );

  -- Create Sunation web form
  INSERT INTO web_forms (
    organization_id,
    form_name,
    form_key,
    description,
    is_active,
    default_lead_source,
    default_owner_id,
    success_message,
    redirect_url,
    capture_ip,
    created_by,
    submissions_count
  )
  SELECT
    v_org_id,
    'Sunation Contact Form',
    'sunation-contact-form',
    'Main contact form from sunation.com website',
    true,
    '3 Sons Energy',
    v_author_id,
    'Thank you for your submission!',
    'https://www.sunation.com/cp-thankyou/',
    true,
    v_author_id,
    0
  WHERE NOT EXISTS (
    SELECT 1 FROM web_forms WHERE form_key = 'sunation-contact-form'
  );

  RAISE NOTICE 'Knowledge base articles created successfully!';
END $$;
