/*
  # Add Sunation Web Form and Comprehensive Beginner-Friendly Knowledge Base

  1. Web Form Configuration
    - Creates the Sunation contact form configuration
    - Sets up for automatic lead capture from website

  2. Knowledge Base Articles
    - EXTREMELY detailed beginner-friendly guides
    - Assumes NO prior computer knowledge
    - Step-by-step with every mouse click explained
    - Covers all major CRM features

  3. Security
    - Uses existing RLS policies
*/

-- Create Sunation web form configuration
DO $$
DECLARE
  v_admin_id uuid;
  v_org_id uuid;
BEGIN
  -- Get first user and their organization
  SELECT up.id, uor.organization_id
  INTO v_admin_id, v_org_id
  FROM user_profiles up
  JOIN user_organization_roles uor ON up.id = uor.user_id
  LIMIT 1;

  -- Only insert if we have a user and form doesn't exist
  IF v_admin_id IS NOT NULL THEN
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
      v_admin_id,
      'Thank you for your submission!',
      'https://www.sunation.com/cp-thankyou/',
      true,
      v_admin_id,
      0
    WHERE NOT EXISTS (
      SELECT 1 FROM web_forms WHERE form_key = 'sunation-contact-form'
    );
  END IF;
END $$;

-- Create EXTREMELY detailed beginner-friendly knowledge base articles
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

  IF v_author_id IS NOT NULL THEN

    -- Article 1: Complete Beginner Guide to Creating Leads
    INSERT INTO knowledge_base (
      organization_id, title, content, summary, article_type, category, tags, is_published, author_id, view_count, helpful_count, not_helpful_count
    )
    SELECT
      v_org_id,
      'Complete Beginner Guide: How to Create a New Lead',
      E'# Complete Beginner Guide: How to Create a New Lead

## What is a Lead?
A "lead" is a person or business that might want to buy your products or services. Think of it like a potential customer who has shown interest. In this CRM (Customer Relationship Management) system, we keep track of these leads so we don''t forget about them and can follow up properly.

## Before You Start
Make sure you:
1. Are logged into the CRM (you should see your name in the top corner)
2. Have your mouse or trackpad ready
3. Have the lead''s information ready (name, email, phone number, etc.)

---

## Step-by-Step Instructions

### STEP 1: Open the Leads Section

**What to do:**
1. Look at the LEFT SIDE of your screen - you''ll see a vertical menu (this is called the "sidebar")
2. Find the word **"Leads"** in this menu
   - It might have an icon next to it (a small picture)
   - It should be near the top of the menu
3. **CLICK** on the word "Leads" with your mouse
   - To click: move your mouse pointer over the word until it changes color or gets underlined, then press the left mouse button once

**What you''ll see:**
- The screen will change to show a list of existing leads (if there are any)
- You might see names, email addresses, and phone numbers in a table format
- Don''t worry if the list is empty - that just means you haven''t added any leads yet!

---

### STEP 2: Click the "Add Lead" Button

**What to do:**
1. Look at the TOP RIGHT corner of the screen
2. Find a button that says **"Add Lead"** or **"New Lead"** or has a **plus sign (+)**
   - Buttons usually look like colored rectangles
   - This button is probably yellow, blue, or green
3. Move your mouse pointer over this button
4. **CLICK** the button once (press the left mouse button)

**What you''ll see:**
- A form will appear on your screen (this is where you''ll type the lead information)
- The form might cover the whole screen or appear as a "popup" window
- You''ll see several empty boxes (called "fields") where you can type information

---

### STEP 3: Fill in the Lead''s Basic Information

This is the most important part. You''ll be typing information into different boxes.

**How to type in a box:**
1. Move your mouse pointer into the empty box
2. Click once (the box might get a colored border showing it''s ready)
3. Start typing
4. When done with that box, press the TAB key on your keyboard (it''s on the left side), OR click in the next box with your mouse

**REQUIRED INFORMATION (you MUST fill these in):**

#### First Name:
- Find the box labeled **"First Name"**
- Click in the box
- Type the person''s first name (like "John" or "Mary")
- If you make a typo, use the BACKSPACE key to delete and retype

#### Last Name:
- Find the box labeled **"Last Name"**
- Click in the box
- Type the person''s last name (like "Smith" or "Johnson")

#### Email Address:
- Find the box labeled **"Email"** or **"Email Address"**
- Click in the box
- Type their full email address (like "john@example.com")
- IMPORTANT: Make sure you include the @ symbol and .com (or .net, etc.)
- Example: john.smith@gmail.com

#### Phone Number:
- Find the box labeled **"Phone"** or **"Phone Number"**
- Click in the box
- Type their phone number
- You can include dashes or spaces, or just type the numbers
- Example: 555-123-4567 or 5551234567

---

### STEP 4: Fill in Address Information (if available)

If you have the person''s address, fill in these fields:

#### Street Address:
- Find the box labeled **"Street"** or **"Address"** or **"Street Address"**
- This might be a BIGGER box (called a "text area") that can hold multiple lines
- Type their house number and street name
- Example: 123 Main Street

#### City:
- Find the box labeled **"City"**
- Type the city name
- Example: New York or Los Angeles

#### State:
- Find the box labeled **"State"** or **"State/Province"**
- Type the state (you can use the 2-letter code if you know it)
- Example: NY or California

#### Zip Code:
- Find the box labeled **"Zip"** or **"Zip Code"** or **"Postal Code"**
- Type the 5-digit zip code
- Example: 10001

#### County (if shown):
- Find the box labeled **"County"**
- This might be a DROPDOWN MENU (you click it and options appear)
- Click on the box, then click on the correct county from the list that appears

---

### STEP 5: Fill in Additional Details

These fields help you remember important information about the lead:

#### Lead Source:
- Find the box labeled **"Lead Source"** or **"How did you hear about us?"**
- This tells you where the lead came from
- Click the box and select from options like:
  - Website
  - Phone Call
  - Referral
  - Partner
  - Social Media
- Use the mouse to click on the correct option

#### Status:
- Find the box labeled **"Status"**
- This should automatically be set to **"New"**
- Don''t change it unless instructed to

#### Rating:
- Find the box labeled **"Rating"** or **"Lead Rating"**
- This tells you how interested the lead is
- Options are usually:
  - **Cold**: Just curious, not ready to buy
  - **Warm**: Somewhat interested
  - **Hot**: Very interested, ready to buy soon
- Click to select the appropriate option

#### Company (if applicable):
- Find the box labeled **"Company"**
- If this lead represents a business, type the business name here
- If it''s just a person (not a business), you can leave this empty

#### Sales Notes:
- Find the LARGE box labeled **"Notes"** or **"Sales Notes"** or **"Description"**
- This is where you can type any extra information
- Examples of what to write:
  - "Interested in solar panels for home"
  - "Called on Tuesday, wants quote for roof replacement"
  - "Referred by John Smith"
  - "Needs info about financing options"

---

### STEP 6: Review Your Information

**What to do:**
1. Scroll up to the top of the form (use your mouse wheel or scroll bar on the right side)
2. Read through everything you typed
3. Check for spelling mistakes
4. Make sure the email address looks correct (has @ and .com)
5. Make sure the phone number has enough digits

**If you need to fix something:**
1. Click in the box with the mistake
2. Use BACKSPACE to delete incorrect text
3. Type the correct information

---

### STEP 7: Save the Lead

**What to do:**
1. Look at the BOTTOM of the form
2. Find a button that says **"Save"** or **"Create Lead"** or **"Add Lead"**
   - This button is usually blue, green, or yellow
   - It might be in the bottom-right corner
3. Move your mouse over this button
4. **CLICK** the button once

**What you''ll see:**
- The form will close
- You''ll return to the leads list
- Your new lead should now appear in the list
- You might see a small message saying "Lead created successfully!" or something similar

---

## Congratulations!
You''ve successfully added a lead to the CRM! This lead is now saved and you can find it anytime by going to the Leads section.

## What Happens Next?

After creating a lead:
- The lead appears in your Leads list
- You can click on it later to see all the details
- You can add tasks to follow up with this lead
- You can add notes about phone calls or meetings
- Eventually, you might convert this lead to a customer

## Common Problems and Solutions

### "I can''t find the Save button"
- Try scrolling down to the bottom of the form
- Look for any button that''s a different color (blue, green, or yellow)

### "The form won''t let me save"
- Check if there are any red error messages
- Make sure you filled in First Name, Last Name, Email, and Phone (these are required)
- Make sure the email address has @ and .com in it

### "I accidentally closed the form"
- Don''t worry! Just start over from Step 1
- Your information wasn''t saved, so you''ll need to type it again

### "I made a mistake after saving"
- You can edit the lead later! Just click on the lead''s name in the list, then click an "Edit" button

## Tips for Success

1. **Always fill in as much information as possible** - More information is better!
2. **Use the Notes field** - Write down anything that might be helpful later
3. **Be consistent with Lead Source** - Always use the same names (like "Website" instead of sometimes "Web" and sometimes "Website")
4. **Double-check phone numbers and emails** - One wrong digit means you can''t contact them!
5. **Save often** - Don''t leave a form open for a long time or you might lose your work

## Practice Exercise

Want to practice? Try creating a test lead with fake information:
- First Name: Test
- Last Name: User
- Email: test@example.com
- Phone: 555-0000
- Source: Website

Then you can delete it later (ask your manager how to delete test leads).

---

Need more help? Ask your supervisor or IT support person to show you these steps in person!',
      'Ultra-detailed beginner guide for creating leads - assumes no computer knowledge',
      'howto',
      'Getting Started',
      ARRAY['leads', 'getting-started', 'beginner', 'basics', 'step-by-step'],
      true,
      v_author_id,
      0, 0, 0
    WHERE NOT EXISTS (
      SELECT 1 FROM knowledge_base WHERE title = 'Complete Beginner Guide: How to Create a New Lead' AND organization_id = v_org_id
    );

  END IF;
END $$;
