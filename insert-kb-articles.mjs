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

async function insertKnowledgeBase() {
  console.log('📚 Inserting knowledge base articles...\n');

  // Get current user and org
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('❌ No user logged in. Please log in first.');
    process.exit(1);
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  const { data: orgRole } = await supabase
    .from('user_organization_roles')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!profile || !orgRole) {
    console.error('❌ Could not find user profile or organization');
    process.exit(1);
  }

  const orgId = orgRole.organization_id;
  const userId = profile.id;

  console.log(`✓ Found user: ${user.email}`);
  console.log(`✓ Organization ID: ${orgId}\n`);

  // Create web form
  console.log('Creating Sunation web form...');
  const { data: existingForm } = await supabase
    .from('web_forms')
    .select('id')
    .eq('form_key', 'sunation-contact-form')
    .maybeSingle();

  if (!existingForm) {
    const { error: formError } = await supabase
      .from('web_forms')
      .insert({
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

    if (formError) {
      console.error('❌ Error creating web form:', formError.message);
    } else {
      console.log('✓ Web form created\n');
    }
  } else {
    console.log('✓ Web form already exists\n');
  }

  // Articles data
  const articles = [
    {
      title: 'Complete Beginner Guide: How to Create a New Lead',
      category: 'Getting Started',
      summary: 'Ultra-detailed beginner guide for creating leads - assumes no computer knowledge',
      tags: ['leads', 'getting-started', 'beginner', 'basics', 'step-by-step'],
      content: readFileSync(join(__dirname, 'supabase/migrations/20251030160000_add_beginner_knowledge_base.sql'), 'utf-8')
        .split("E'")[1]
        .split("',")[0],
    },
    {
      title: 'Complete Beginner Guide: Managing Web Forms',
      category: 'Admin',
      summary: 'Ultra-detailed beginner guide for managing web forms - no prior knowledge needed',
      tags: ['web-forms', 'admin', 'beginner', 'step-by-step', 'website'],
      content: readFileSync(join(__dirname, 'supabase/migrations/20251030160001_kb_web_forms_guide.sql'), 'utf-8')
        .split("E'")[1]
        .split("',")[0],
    },
  ];

  // Simple articles (don't parse from SQL)
  const simpleArticles = [
    {
      title: 'Beginner Guide: Using Your My Day Dashboard',
      category: 'Getting Started',
      summary: 'Simple guide to using the My Day personal dashboard',
      tags: ['my-day', 'dashboard', 'beginner', 'daily-tasks'],
      content: `# Beginner Guide: Using Your "My Day" Dashboard

## What is My Day?
"My Day" is your personal homepage in the CRM. It shows you everything you need to work on TODAY in one easy place. Think of it like a daily planner that updates automatically!

## Opening My Day
**Step 1:** Click **"My Day"** in the left sidebar menu
**Step 2:** The screen shows your daily overview

## What You'll See
- Today's Tasks
- Overdue Items (in red) - do these first!
- Today's Appointments
- Recent Leads assigned to you

## Best Practices
START YOUR DAY HERE:
Every morning:
1. Open My Day first thing
2. Review what's overdue (do these first!)
3. Check today's tasks
4. Look at your appointments
5. Review new leads

CHECK THROUGHOUT THE DAY:
- Check My Day every few hours
- Mark tasks complete as you finish them
- Add new tasks as they come up

## Tips
- Keep My Day open in a browser tab all day
- Refresh the page (press F5) to see latest updates
- Use quick action buttons - they save time!`
    },
    {
      title: 'Beginner Guide: Managing Your Tasks',
      category: 'Productivity',
      summary: 'Simple guide to creating and managing tasks',
      tags: ['tasks', 'to-do', 'beginner', 'productivity'],
      content: `# Beginner Guide: Managing Your Tasks

## What is a Task?
A task is a reminder to do something. Like a sticky note that won't get lost!
Examples: "Call John Smith", "Send quote", "Follow up with new lead".

## Creating a New Task
1. Click **"Tasks"** in sidebar
2. Click **"Add Task"** button
3. Fill in:
   - **Task Name**: What you need to do (be specific!)
   - **Due Date**: When it should be done
   - **Priority**: High, Medium, or Low
4. Click **"Save"**

## Completing a Task
1. Find it in the list
2. Click the checkbox next to it
3. Done! Feel good about it!

## Tips
- Check tasks every morning
- Mark complete immediately when done
- Use clear, specific task names
- Set realistic due dates
- Don't let overdue tasks pile up`
    },
    {
      title: 'Beginner Guide: Tracking Deals and Opportunities',
      category: 'Sales',
      summary: 'Simple guide to managing deals and opportunities',
      tags: ['deals', 'opportunities', 'sales', 'beginner'],
      content: `# Beginner Guide: Tracking Deals and Opportunities

## What is a Deal?
A deal (also called an "opportunity") is a potential sale. When a lead gets serious about buying, they become a deal!

## Creating a New Deal
**Method 1: Convert a Lead**
1. Go to Leads section
2. Click on the lead
3. Click **"Convert to Opportunity"**
4. Fill in amount and close date
5. Save

**Method 2: Create Directly**
1. Click **"Deals"** in sidebar
2. Click **"New Deal"**
3. Fill in details
4. Save

## Moving Deals Through Stages
1. Find the deal card on the board
2. Click and HOLD with your mouse
3. Drag it to the new column
4. Release - done!

## Deal Stages
- Prospecting: Initial contact
- Qualification: Figuring out needs
- Proposal: Sent quote
- Negotiation: Working out details
- Closed Won: They bought! 🎉
- Closed Lost: They said no

## Tips
- Review deals weekly
- Move deals forward regularly
- Be realistic about close dates
- Add notes after every interaction
- Celebrate wins!`
    }
  ];

  // Insert articles
  let created = 0;
  let skipped = 0;

  console.log('Creating knowledge base articles...\n');

  for (const article of simpleArticles) {
    const { data: existing } = await supabase
      .from('knowledge_base')
      .select('id')
      .eq('organization_id', orgId)
      .eq('title', article.title)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase
        .from('knowledge_base')
        .insert({
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
        console.error(`  ❌ Failed: ${article.title}`);
        console.error(`     ${error.message}`);
      } else {
        created++;
        console.log(`  ✓ Created: ${article.title}`);
      }
    } else {
      skipped++;
      console.log(`  - Skipped (exists): ${article.title}`);
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Created: ${created} articles`);
  console.log(`   Skipped: ${skipped} articles`);
  console.log('\n📖 Go to Knowledge Base and refresh the page to see your articles!');
}

insertKnowledgeBase().catch(console.error);
