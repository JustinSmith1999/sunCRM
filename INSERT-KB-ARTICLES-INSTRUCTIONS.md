# How to Insert Knowledge Base Articles

Since the migrations can't be applied automatically, follow these simple steps to add the knowledge base articles:

## Step 1: Log into the CRM

1. Open your CRM in the browser
2. Log in with your credentials

## Step 2: Open the Browser Console

1. Press **F12** on your keyboard (or right-click anywhere and select "Inspect")
2. Click on the **"Console"** tab at the top

## Step 3: Copy and Paste This Code

Copy this ENTIRE code block and paste it into the console, then press Enter:

```javascript
// Function to insert knowledge base articles
async function insertKnowledgeBaseArticles() {
  console.log('📚 Starting knowledge base setup...\n');

  // Get current user
  const { data: { user } } = await window.supabase.auth.getUser();

  if (!user) {
    console.error('❌ Not logged in!');
    return;
  }

  // Get user profile and org
  const { data: profile } = await window.supabase
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  const { data: orgRole } = await window.supabase
    .from('user_organization_roles')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  const orgId = orgRole.organization_id;
  const userId = profile.id;

  console.log('✓ User:', user.email);
  console.log('✓ Org ID:', orgId);

  // Create web form
  console.log('\nCreating web form...');
  const { data: existingForm } = await window.supabase
    .from('web_forms')
    .select('id')
    .eq('form_key', 'sunation-contact-form')
    .maybeSingle();

  if (!existingForm) {
    await window.supabase.from('web_forms').insert({
      organization_id: orgId,
      form_name: 'Sunation Contact Form',
      form_key: 'sunation-contact-form',
      description: 'Main contact form from sunation.com website',
      is_active: true,
      default_lead_source: '3 Sons Energy',
      default_owner_id: userId,
      success_message: 'Thank you for your submission!',
      redirect_url: 'https://www.sunation.com/cp-thankyou/',
      capture_ip: true,
      created_by: userId,
      submissions_count: 0,
    });
    console.log('✓ Web form created');
  } else {
    console.log('✓ Web form exists');
  }

  // Knowledge base articles
  const articles = [
    {
      title: 'Complete Beginner Guide: How to Create a New Lead',
      category: 'Getting Started',
      summary: 'Ultra-detailed step-by-step guide for creating leads. Perfect for absolute beginners.',
      tags: ['leads', 'getting-started', 'beginner'],
      content: `# Complete Beginner Guide: How to Create a New Lead

## What is a Lead?
A "lead" is a person who might want to buy your products. This guide shows you how to add them to the CRM.

## Step 1: Open the Leads Section
1. Look at the LEFT side of your screen
2. Find and CLICK on "Leads"

## Step 2: Click "Add Lead"
1. Look at the TOP RIGHT corner
2. Find the button that says "Add Lead" or has a plus sign (+)
3. CLICK it

## Step 3: Fill in Information
**Required fields (must fill in):**
- First Name: Type person's first name
- Last Name: Type person's last name
- Email: Type full email (like john@example.com)
- Phone: Type phone number

**Optional fields:**
- Street, City, State, Zip Code
- Lead Source (where they came from)
- Company name
- Notes

## Step 4: Review and Save
1. Check all information is correct
2. Look for "Save" button at bottom
3. CLICK "Save"
4. Done! Your lead is now saved.

## Tips
- Fill in as much information as possible
- Double-check email and phone
- Use the Notes field for extra details
- Ask for help if you get stuck!`
    },
    {
      title: 'Complete Beginner Guide: Managing Web Forms',
      category: 'Admin',
      summary: 'Learn how to set up forms on your website that automatically create leads in the CRM.',
      tags: ['web-forms', 'admin', 'beginner', 'website'],
      content: `# Complete Beginner Guide: Managing Web Forms

## What is a Web Form?
A web form is a contact form on your website. When someone fills it out, their information automatically becomes a lead in your CRM!

## Viewing Web Forms
1. Click "Home" in the left sidebar
2. Find and click the "Web Forms" tile

## Creating a New Web Form
1. Click "Create Web Form" button
2. Fill in:
   - **Form Name**: A name for YOU to remember (like "Contact Form")
   - **Form Key**: A special code (use lowercase and dashes, like "contact-form")
   - **Default Owner**: Who should get these leads?
3. Optional:
   - Description
   - Success Message
   - Lead Source
4. Click "Save"

## Connecting to Your Website
After creating the form, give your web developer:
- The form key you created
- The endpoint URL shown in the form

They'll connect your website form to the CRM.

## Testing
1. Go to your website
2. Fill out the form with test information
3. Check the Leads section - you should see a new lead!

## Tips
- Use clear form names
- Test every new form
- Keep form keys unique`
    },
    {
      title: 'Beginner Guide: Using Your My Day Dashboard',
      category: 'Getting Started',
      summary: 'Your daily dashboard showing everything you need to do today.',
      tags: ['my-day', 'dashboard', 'beginner'],
      content: `# Beginner Guide: Using Your My Day Dashboard

## What is My Day?
Your personal homepage showing everything you need to do TODAY.

## How to Use It
1. Click "My Day" in the left sidebar
2. You'll see:
   - Today's tasks
   - Overdue items (do these first!)
   - Today's appointments
   - Recent leads

## Start Every Day Here
1. Open My Day first thing in the morning
2. Look at overdue items (in red) - do these first
3. Review today's tasks
4. Check your appointments

## Tips
- Keep this page open all day
- Mark tasks complete as you finish them
- Check it every few hours
- Use the quick action buttons`
    },
    {
      title: 'Beginner Guide: Managing Your Tasks',
      category: 'Productivity',
      summary: 'Learn how to create and manage your to-do list.',
      tags: ['tasks', 'productivity', 'beginner'],
      content: `# Beginner Guide: Managing Your Tasks

## What is a Task?
A reminder to do something. Like: "Call John Smith" or "Send quote to ABC Company"

## Creating a Task
1. Click "Tasks" in sidebar
2. Click "Add Task"
3. Fill in:
   - What you need to do
   - When it's due
   - Priority (High, Medium, Low)
4. Click "Save"

## Completing a Task
1. Find it in the task list
2. Click the checkbox next to it
3. Done!

## Tips
- Check tasks every morning
- Use specific task names
- Set realistic due dates
- Mark complete immediately when done
- Don't let overdue tasks pile up`
    },
    {
      title: 'Beginner Guide: Tracking Deals and Opportunities',
      category: 'Sales',
      summary: 'Manage your sales pipeline and track potential customers.',
      tags: ['deals', 'sales', 'beginner'],
      content: `# Beginner Guide: Tracking Deals and Opportunities

## What is a Deal?
A potential sale. When a lead gets serious about buying, they become a deal!

## Creating a Deal
**From a Lead:**
1. Go to Leads
2. Click on a lead
3. Click "Convert to Opportunity"
4. Fill in amount and close date
5. Save

**From Scratch:**
1. Click "Deals" in sidebar
2. Click "New Deal"
3. Fill in all information
4. Save

## Moving Deals
The Deals page shows columns for different stages:
- Prospecting
- Qualification
- Proposal
- Negotiation
- Closed Won (they bought!)
- Closed Lost (they didn't buy)

To move a deal: Click and drag it to a new column!

## Tips
- Review deals weekly
- Add notes about every conversation
- Update amounts if they change
- Be realistic about close dates
- Celebrate wins!`
    },
    {
      title: 'Beginner Guide: Managing Accounts',
      category: 'Accounts',
      summary: 'Track companies and organizations you do business with.',
      tags: ['accounts', 'companies', 'beginner'],
      content: `# Beginner Guide: Managing Accounts

## What is an Account?
A company or organization you do business with. Different from contacts (people).

## Creating an Account
1. Click "Accounts" in sidebar
2. Click "Add Account"
3. Fill in:
   - Account Name (company name)
   - Type (Customer, Prospect, Partner)
   - Industry
   - Phone and website
   - Address
4. Save

## Adding Contacts to Accounts
1. Open an account
2. Click "New Contact"
3. Fill in person's information
4. Save

Now you can see all people at that company!

## Tips
- Link every contact to an account
- Keep company information up to date
- Add notes about the company
- Track all interactions`
    },
    {
      title: 'Beginner Guide: Handling Customer Cases',
      category: 'Support',
      summary: 'Manage customer support requests and issues.',
      tags: ['cases', 'support', 'customer-service', 'beginner'],
      content: `# Beginner Guide: Handling Customer Cases

## What is a Case?
A customer support request or problem that needs to be solved.

## Creating a Case
1. Click "Cases" in sidebar
2. Click "New Case"
3. Fill in:
   - Subject (what's the problem?)
   - Account/Contact (who is this for?)
   - Priority (Low, Medium, High, Critical)
   - Description (details about the issue)
4. Save

## Case Status
- **New**: Just created
- **In Progress**: Working on it
- **Waiting**: Waiting for customer response
- **Resolved**: Fixed!

## Tips
- Respond quickly (especially for high priority)
- Keep customer updated
- Document everything you do
- Follow up after resolving
- Learn from common issues`
    },
    {
      title: 'Beginner Guide: Using Reports',
      category: 'Reports',
      summary: 'View statistics and insights about your business.',
      tags: ['reports', 'analytics', 'beginner'],
      content: `# Beginner Guide: Using Reports

## What are Reports?
Charts and numbers showing how your business is doing.

## Viewing Reports
1. Click "Reports" in sidebar
2. Choose a report type

## Common Reports
- **Sales Pipeline**: All open deals
- **Lead Sources**: Where leads come from
- **Activity Report**: Calls, emails, meetings
- **Cases**: Support ticket statistics

## Reading Reports
- Look at totals and trends
- Compare this month to last month
- Identify what's working well
- Find areas to improve

## Tips
- Check reports weekly
- Share important numbers with team
- Track your personal goals
- Celebrate improvements!`
    }
  ];

  // Insert articles
  console.log('\nCreating articles...\n');
  let created = 0;
  let skipped = 0;

  for (const article of articles) {
    const { data: existing } = await window.supabase
      .from('knowledge_base')
      .select('id')
      .eq('organization_id', orgId)
      .eq('title', article.title)
      .maybeSingle();

    if (!existing) {
      const { error } = await window.supabase.from('knowledge_base').insert({
        organization_id: orgId,
        title: article.title,
        content: article.content,
        summary: article.summary,
        article_type: 'howto',
        category: article.category,
        tags: article.tags,
        is_published: true,
        author_id: userId,
        view_count: 0,
        helpful_count: 0,
        not_helpful_count: 0,
      });

      if (error) {
        console.error('❌', article.title, error.message);
      } else {
        created++;
        console.log('✓', article.title);
      }
    } else {
      skipped++;
      console.log('- Skipped:', article.title);
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`Created: ${created} articles`);
  console.log(`Skipped: ${skipped} articles`);
  console.log('\n🎉 Go to Knowledge Base and refresh to see your articles!');
}

// Run it
insertKnowledgeBaseArticles();
```

## Step 4: Wait for Completion

You'll see messages in the console showing progress. When you see "Done!", you're finished!

## Step 5: Refresh Your Knowledge Base

1. Go to the Knowledge tab
2. Press F5 or click the refresh button
3. You should now see 8 new articles!

---

**Having trouble?** Make sure you're logged in to the CRM first!
