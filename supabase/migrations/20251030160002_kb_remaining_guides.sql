/*
  # Knowledge Base: Remaining Beginner Guides
  All remaining CRM feature guides in beginner-friendly format
*/

DO $$
DECLARE
  v_author_id uuid;
  v_org_id uuid;
BEGIN
  SELECT up.id, uor.organization_id
  INTO v_author_id, v_org_id
  FROM user_profiles up
  JOIN user_organization_roles uor ON up.id = uor.user_id
  LIMIT 1;

  IF v_author_id IS NOT NULL THEN

    -- Guide: My Day Dashboard
    INSERT INTO knowledge_base (
      organization_id, title, content, summary, article_type, category, tags, is_published, author_id, view_count, helpful_count, not_helpful_count
    )
    SELECT
      v_org_id,
      'Beginner Guide: Using Your My Day Dashboard',
      E'# Beginner Guide: Using Your "My Day" Dashboard

## What is My Day?
"My Day" is your personal homepage in the CRM. It shows you everything you need to work on TODAY in one easy place. Think of it like a daily planner that updates automatically!

## Opening My Day

**Step 1:** Click **"My Day"** in the left sidebar menu
**Step 2:** The screen shows your daily overview

## What You''ll See

### Today''s Tasks
**What it is:** Things you need to do today
**What to do:**
- Read through the list
- Click a checkbox when you finish a task
- Click on a task to see more details

### Overdue Items (in red)
**What it is:** Things you should have done already
**What to do:**
- Do these FIRST - they''re most urgent!
- Click the checkbox when complete
- Or reschedule them (click the task, then change the date)

### Today''s Appointments
**What it is:** Meetings or calls scheduled for today
**What to do:**
- Note the time of each appointment
- Set a reminder on your phone so you don''t forget
- Click to see details about who you''re meeting with

### Recent Leads
**What it is:** New potential customers assigned to you recently
**What to do:**
- Look at their names and contact info
- Click on a name to see full details
- Add tasks to follow up with them

## Using Quick Actions

Quick Actions are shortcuts. Instead of going through multiple menus, you can do things right from My Day!

### Log a Call
**When to use:** You just talked to someone on the phone
**What to do:**
1. Click the **"Log Call"** button
2. Select who you called (search their name)
3. Type notes about what you discussed
4. Click Save

### Create a Task
**When to use:** You need to remember to do something
**What to do:**
1. Click **"New Task"** button
2. Type what you need to do
3. Set a due date (when it must be done by)
4. Click Save

### Add a Lead
**When to use:** Someone new is interested in your services
**What to do:**
1. Click **"New Lead"** button
2. Fill in their name, email, phone
3. Add any notes
4. Click Save

## Best Practices

**START YOUR DAY HERE:**
Every morning when you log in:
1. Open My Day first thing
2. Review what''s overdue (do these first!)
3. Check today''s tasks
4. Look at your appointments
5. Review new leads assigned to you

**CHECK THROUGHOUT THE DAY:**
- Check My Day every few hours
- Mark tasks complete as you finish them
- Add new tasks as they come up

**END YOUR DAY HERE:**
Before you leave work:
1. Check what got done (feel good about it!)
2. See what''s left for tomorrow
3. Reschedule anything you couldn''t finish

## Tips
- Keep My Day open in a browser tab all day
- Refresh the page (press F5) to see latest updates
- Use those quick action buttons - they save time!
- If something is overdue for weeks, either do it or delete it

---

Need help? Ask your supervisor to show you My Day in person!',
      'Simple guide to using the My Day personal dashboard',
      'howto',
      'Getting Started',
      ARRAY['my-day', 'dashboard', 'beginner', 'daily-tasks'],
      true,
      v_author_id,
      0, 0, 0
    WHERE NOT EXISTS (
      SELECT 1 FROM knowledge_base WHERE title = 'Beginner Guide: Using Your My Day Dashboard' AND organization_id = v_org_id
    );

    -- Guide: Managing Tasks
    INSERT INTO knowledge_base (
      organization_id, title, content, summary, article_type, category, tags, is_published, author_id, view_count, helpful_count, not_helpful_count
    )
    SELECT
      v_org_id,
      'Beginner Guide: Managing Your Tasks',
      E'# Beginner Guide: Managing Your Tasks

## What is a Task?
A task is a reminder to do something. Like a sticky note on your computer that won''t get lost! Examples: "Call John Smith", "Send quote to ABC Company", "Follow up with new lead".

## Opening the Tasks Section

1. Click **"Tasks"** in the left sidebar
2. You''ll see all your tasks in a list

## Creating a New Task

### Step 1: Click "Add Task" or "New Task" button (top right)

### Step 2: Fill in the basics

**Task Name/Subject:**
- Type what you need to do
- Be specific!
- GOOD: "Call Sarah Johnson about solar quote"
- BAD: "Call someone"

**Due Date:**
- Click the calendar icon
- Click on the date when this should be done
- Today? Click today''s date
- Next week? Click a date next week

**Priority:**
- Click to choose High, Medium, or Low
- HIGH: Urgent and important
- MEDIUM: Important but not urgent
- LOW: Nice to do eventually

### Step 3: Optional Details

**Assigned To:**
- Usually yourself (should be automatic)
- If someone else should do it, click and select their name

**Related To:**
- Connect this task to a lead, account, or deal
- Click the box, search for the name, click it
- This keeps everything organized together

**Description/Notes:**
- Add any extra details
- Example: "She asked about the 10kW system, mentioned June installation"

### Step 4: Click "Save"

## Viewing Your Tasks

### Different Views:

Click tabs or filters to see:
- **My Tasks**: Only yours
- **Today**: Due today
- **This Week**: Due in the next 7 days
- **Overdue**: Past the due date (do these first!)
- **All Tasks**: Everything

## Completing a Task

**When you finish a task:**
1. Find it in the list
2. Click the checkbox next to it
3. It disappears from the main list (moves to "Completed")
4. Feel good - you got something done!

## Editing a Task

**If you need to change something:**
1. Click on the task name
2. Change any details
3. Click "Save"

**Common changes:**
- Moving the due date (if you can''t finish in time)
- Changing priority (if something became more urgent)
- Adding notes (new information)

## Deleting a Task

**If a task is no longer needed:**
1. Click on the task
2. Look for a "Delete" or trash icon
3. Click it
4. Confirm "Yes" when asked

**When to delete:**
- Task is no longer relevant
- Someone else is doing it
- The reason for the task went away

## Best Practices

### Writing Good Task Names
✅ GOOD: "Email Jones Construction the roof quote"
✅ GOOD: "Call Mary Williams - she left voicemail about leak"
❌ BAD: "Email"
❌ BAD: "Call that person"
❌ BAD: "Do thing"

### Setting Realistic Due Dates
- Don''t set everything for today
- Give yourself buffer time
- If you miss dates constantly, you''re setting them too soon

### Using Priorities
- Don''t make EVERYTHING high priority
- Save "High" for truly urgent things
- Most tasks should be Medium

### Daily Task Routine
**Morning:**
- Review today''s tasks (what''s due?)
- Check overdue (do these first!)
- Pick your top 3 must-dos

**Throughout Day:**
- Mark complete as you finish
- Add new tasks immediately (don''t forget them!)
- Update priorities if things change

**End of Day:**
- Check what got done (pat yourself on the back!)
- Reschedule anything you couldn''t finish
- Set up tomorrow''s top priorities

## Common Problems

**"I have too many tasks!"**
- Do the overdue ones first
- Sort by priority (do High priority first)
- Can you delegate some? Assign to teammates
- Delete tasks that aren''t needed anymore

**"I keep forgetting to check my tasks"**
- Make it a habit: Check first thing each morning
- Keep the Tasks tab open in your browser
- Set a phone alarm to check at lunch time

**"Tasks keep piling up"**
- Be realistic with due dates
- Break big tasks into smaller ones
- Ask for help if you''re overwhelmed

## Tips for Success
- Check tasks every morning without fail
- Mark complete immediately when done
- Don''t let overdue tasks sit for weeks
- Use the notes field to add important details
- Link tasks to leads/accounts for context
- Set reminders for really important tasks

---

Need more help? Ask a colleague to show you their task management!',
      'Simple guide to creating and managing tasks',
      'howto',
      'Productivity',
      ARRAY['tasks', 'to-do', 'beginner', 'productivity'],
      true,
      v_author_id,
      0, 0, 0
    WHERE NOT EXISTS (
      SELECT 1 FROM knowledge_base WHERE title = 'Beginner Guide: Managing Your Tasks' AND organization_id = v_org_id
    );

    -- Guide: Working with Deals/Opportunities
    INSERT INTO knowledge_base (
      organization_id, title, content, summary, article_type, category, tags, is_published, author_id, view_count, helpful_count, not_helpful_count
    )
    SELECT
      v_org_id,
      'Beginner Guide: Tracking Deals and Opportunities',
      E'# Beginner Guide: Tracking Deals and Opportunities

## What is a Deal?
A deal (also called an "opportunity") is a potential sale. It''s when a lead has moved past just being interested and is actually considering buying. Think of it as a lead that''s gotten more serious!

**Example:** Jane Smith asked for information (she''s a lead). Now she wants a quote for $10,000 worth of services (she''s a deal!).

## Opening the Deals Section

1. Click **"Deals"** or **"Opportunities"** in the left sidebar
2. You''ll see a board with columns (called a "Kanban board")

## Understanding the Deal Board

### What You See:
Columns (vertical sections) representing stages:
- **Prospecting**: Just started talking
- **Qualification**: Figuring out if they''re a good fit
- **Proposal**: Sent them a quote/proposal
- **Negotiation**: Working out the details
- **Closed Won**: They bought! 🎉
- **Closed Lost**: They decided not to buy 😞

### Each Deal Shows:
- Customer/Company name
- Deal amount (how much money)
- Expected close date
- Who owns it (whose deal it is)

## Creating a New Deal

### Method 1: Convert a Lead

**When to use:** You have a lead who''s ready to buy
**Steps:**
1. Go to Leads section
2. Click on the lead name
3. Find button that says **"Convert to Opportunity"** or **"Create Deal"**
4. Click it
5. Fill in deal amount and expected close date
6. Click Save
7. Lead information transfers automatically!

### Method 2: Create from Scratch

**When to use:** Direct deal not from a lead
**Steps:**
1. In Deals section, click **"New Deal"** or **"Add Deal"**
2. Fill in:
   - **Deal Name**: Customer name + what they want (e.g., "ABC Corp - Solar Installation")
   - **Account/Company**: Business name
   - **Amount**: Expected value in dollars ($10,000)
   - **Close Date**: When you think they''ll decide (pick a date)
   - **Stage**: Usually start with "Prospecting" or "Qualification"
   - **Owner**: Who''s managing this deal (usually yourself)
3. Click Save

## Moving Deals Through Stages

**This is the most important part!**

### How to Move a Deal:
1. Find the deal card
2. **Click and HOLD** on it with your mouse
3. **Drag** it to the new column
4. **Release** the mouse button
5. Done! The deal is now in the new stage

**Example:** You sent a quote? Drag the deal from "Qualification" to "Proposal"

### When to Move Deals:

**To Prospecting:** Initial contact made
**To Qualification:** Figuring out their needs and budget
**To Proposal:** You''ve sent them a formal quote/proposal
**To Negotiation:** Going back and forth on price/terms
**To Closed Won:** THEY BOUGHT! 🎉 (Celebrate!)
**To Closed Lost:** They said no or went with someone else 😞

## Viewing Deal Details

**To see more information:**
1. Click on the deal card
2. You''ll see:
   - Full customer information
   - All notes and activities
   - History of changes
   - Related contacts
   - Tasks associated with this deal

**To edit:**
1. Look for "Edit" button
2. Change any information
3. Click Save

## Updating Deal Information

### Changing the Amount:
**When to do it:** Price increased/decreased
**How:**
1. Click on the deal
2. Click Edit
3. Change the Amount field
4. Save

### Changing the Close Date:
**When to do it:** They need more time to decide
**How:**
1. Click on the deal
2. Click Edit
3. Click the calendar for Close Date
4. Pick new date
5. Save

## Best Practices

### Keep Deals Moving
- Review your deals weekly
- Move them forward as things progress
- Don''t let deals sit in one stage forever

### Update Amounts Regularly
- If scope changes, update the amount
- Be realistic about what they''ll actually spend

### Set Realistic Close Dates
- Don''t guess wildly
- Ask the customer their timeline
- Add buffer time (things usually take longer than expected)

### Add Notes
Every time something important happens:
1. Click on the deal
2. Add a note in the activity section
3. Example: "Called today - they need approval from board next month"

### Track Activities
Log every:
- Phone call
- Email
- Meeting
- Proposal sent

This keeps everyone informed!

## Common Scenarios

### "They want to buy!"
1. Drag deal to **Closed Won**
2. Add final amount
3. Add a note: "Signed contract!"
4. Celebrate!
5. Create an account for them (if new customer)

### "They said no"
1. Drag deal to **Closed Lost**
2. Add a note explaining why they said no
3. Learn from it for next time
4. Move on to next opportunity!

### "They''re not responding"
- Add a note about lack of response
- Set follow-up tasks
- After too long with no response: Move to Closed Lost

### "The deal got bigger/smaller"
- Click the deal
- Edit the Amount
- Add a note explaining the change
- Save

## Metrics to Watch

### Pipeline Value
**What it is:** Total of all open deals
**Where to see it:** Usually at top of Deals page
**What it means:** How much money you MIGHT make if all deals close

### Win Rate
**What it is:** Percentage of deals you win
**Example:** 10 deals, won 3 = 30% win rate
**How to improve:** Learn from lost deals

## Tips for Success

1. **Update deals immediately** when something changes
2. **Move deals forward** weekly (don''t let them stagnate)
3. **Be honest about close dates** (don''t be overly optimistic)
4. **Add notes constantly** (you''ll forget details later)
5. **Clean up old deals** (if someone hasn''t responded in 6 months, close it)
6. **Celebrate wins!** Moving a deal to Closed Won is a big deal!
7. **Learn from losses** Read notes on lost deals to improve

## Common Problems

**"I can''t drag the deals"**
- Try clicking and holding longer before dragging
- Make sure your mouse is working
- Try refreshing the page (press F5)

**"I don''t know what stage a deal should be in"**
- Ask yourself: "What''s the next step?"
- If sending quote: Proposal stage
- If waiting for decision: Negotiation
- If unsure: Ask your manager

**"My pipeline is huge but nothing closes"**
- Check if deals are realistic (are they really going to buy?)
- Clean out stale deals (close lost if no response in months)
- Focus on moving deals forward, not just adding new ones

---

Need help? Ask your sales manager to review your deals with you!',
      'Simple guide to managing deals and opportunities',
      'howto',
      'Sales',
      ARRAY['deals', 'opportunities', 'sales', 'beginner'],
      true,
      v_author_id,
      0, 0, 0
    WHERE NOT EXISTS (
      SELECT 1 FROM knowledge_base WHERE title = 'Beginner Guide: Tracking Deals and Opportunities' AND organization_id = v_org_id
    );

  END IF;
END $$;
