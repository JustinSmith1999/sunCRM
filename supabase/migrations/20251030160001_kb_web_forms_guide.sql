/*
  # Knowledge Base: Complete Guide to Web Forms
  Extremely beginner-friendly web forms guide
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
    INSERT INTO knowledge_base (
      organization_id, title, content, summary, article_type, category, tags, is_published, author_id, view_count, helpful_count, not_helpful_count
    )
    SELECT
      v_org_id,
      'Complete Beginner Guide: Managing Web Forms',
      E'# Complete Beginner Guide: Managing Web Forms

## What is a Web Form?
A web form is like a digital contact card that people fill out on your website. Instead of manually typing their information into the CRM yourself, the web form does it automatically! When someone fills out a form on your website, their information instantly appears as a new lead in your CRM.

**Real-world example:**
Imagine someone visits your company website and fills out a "Contact Us" form with their name, email, and question. With web forms set up, that information automatically becomes a lead in your CRM without you having to do any typing!

## Before You Start
Make sure:
1. You are logged into the CRM
2. You have permission to create web forms (ask your manager if unsure)
3. You know which website form you want to connect to the CRM

---

## Part 1: Viewing Existing Web Forms

### STEP 1: Get to the Web Forms Section

**What to do:**
1. Look at the LEFT SIDE of your screen (the sidebar menu)
2. Click on **"Home"** - it''s usually at the very top of the menu
3. The screen will show tiles (colorful boxes) with different options

**What you''ll see:**
- Several colorful rectangular boxes (tiles)
- Each tile has an icon (picture) and a label
- One tile will say **"Web Forms"** - it might have a purple/blue color with a people icon

### STEP 2: Open Web Forms Console

**What to do:**
1. Find the tile labeled **"Web Forms"**
2. Move your mouse over it (it might change color slightly)
3. **CLICK** on this tile once

**What you''ll see:**
- A list of web forms (if any exist)
- Each form shows:
  - Form Name
  - How many times it''s been submitted
  - Whether it''s active (turned on) or inactive (turned off)
  - When it was last used

---

## Part 2: Creating a Brand New Web Form

### STEP 1: Click "Create Web Form" Button

**What to do:**
1. Look at the TOP RIGHT of the screen
2. Find a button that says **"Create Web Form"** or **"New Web Form"** or has a plus sign (+)
3. **CLICK** this button

**What you''ll see:**
- A form will appear (might be a popup or full page)
- Several empty boxes where you''ll type information

---

### STEP 2: Fill in the REQUIRED Information

These fields MUST be filled in or the form won''t work:

#### Form Name:
**What it is:** A name that helps you remember what this form is for. This is ONLY for internal use - customers never see this.

**What to do:**
1. Find the box labeled **"Form Name"**
2. Click in the box
3. Type a clear, descriptive name

**Examples of good names:**
- "Main Contact Form"
- "Quote Request Form"
- "Solar Panel Interest Form"
- "Customer Support Request"

**Examples of bad names:**
- "Form1" (not descriptive)
- "asdfjkl" (meaningless)
- "test" (unclear)

#### Form Key:
**What it is:** A special code name that connects your website form to this CRM. It MUST match exactly what''s in your website code. Think of it like a password that connects them together.

**What to do:**
1. Find the box labeled **"Form Key"**
2. Click in the box
3. Type a unique code (use lowercase letters and dashes, no spaces)

**IMPORTANT RULES:**
- Use only lowercase letters (a-z)
- Use dashes (-) instead of spaces
- No special characters like !, @, #, $, %
- Make it unique (don''t use the same key twice)

**Examples of good form keys:**
- "contact-form"
- "quote-request"
- "solar-interest"
- "support-form"

**Examples of bad form keys:**
- "Contact Form" (has spaces and capital letters)
- "form!!" (has special characters)
- "test" (too generic)

⚠️ **CRITICAL:** This exact code must be added to your website. Your web developer needs this!

#### Default Owner:
**What it is:** The person who will "own" every lead that comes from this form. They''ll see these leads in their list and be responsible for following up.

**What to do:**
1. Find the box labeled **"Default Owner"** or **"Assign Leads To"**
2. Click on the box (a list will appear)
3. Scroll through the list of names (these are people in your company)
4. **CLICK** on the name of the person who should receive these leads

**Who to choose:**
- If it''s a sales form: Choose a sales representative
- If it''s a support form: Choose a support person
- If unsure: Ask your manager who should get these leads

---

### STEP 3: Fill in OPTIONAL Information

These fields help customize how the form works, but they''re not required:

#### Description:
**What it is:** Notes to help you remember what this form is for.

**What to do:**
1. Find the LARGE box labeled **"Description"**
2. Click in it
3. Type any helpful notes

**Example:**
"This is the contact form on the homepage of our website. It''s for people who want general information about our services."

#### Default Lead Source:
**What it is:** This automatically fills in where the lead came from.

**What to do:**
1. Find the box labeled **"Default Lead Source"**
2. Click on it (a list appears)
3. Choose an option like:
   - Website
   - Landing Page
   - Homepage
   - Contact Page

**Why this matters:** Later you can see which forms bring in the most leads!

#### Success Message:
**What it is:** The message people see after submitting the form.

**What to do:**
1. Find the box labeled **"Success Message"**
2. Click in it
3. Type a friendly thank-you message

**Default (if you leave it empty):** "Thank you for your submission!"

**Example custom message:**
"Thank you! We''ll get back to you within 24 hours."

#### Redirect URL:
**What it is:** A webpage address where people go after submitting the form.

**What to do:**
1. Find the box labeled **"Redirect URL"**
2. If you want to send people to a thank-you page, type the full web address
3. Example: https://yourcompany.com/thank-you/

**If you''re not sure:** Leave this empty - people will just see the success message.

#### Capture IP Address:
**What it is:** Records the internet address of the computer that submitted the form (for security/tracking).

**What to do:**
1. Find the checkbox labeled **"Capture IP"** or **"Capture IP Address"**
2. To CHECK the box: Click on it once (a checkmark will appear)
3. To UNCHECK: Click again (checkmark disappears)

**Should you check it?**
- Most forms: YES, check it (it''s helpful for tracking)
- Privacy-sensitive forms: NO (if you''re worried about privacy)

#### Active:
**What it is:** Turns the form on or off.

**What to do:**
1. Find the checkbox labeled **"Active"** or **"Is Active"**
2. To turn ON: Check the box (click it until checkmark appears)
3. To turn OFF: Uncheck the box

**Should you check it?**
- If you''re ready to use the form: YES
- If you''re just testing: NO (keep it off until ready)

---

### STEP 4: Save Your Web Form

**What to do:**
1. Scroll down to the bottom of the form (use mouse wheel or scrollbar)
2. Find the **"Save"** or **"Create"** button (usually blue or green)
3. **CLICK** this button once

**What you''ll see:**
- The form will close
- You''ll return to the web forms list
- Your new form will appear in the list
- You might see a message saying "Web form created successfully!"

---

## Part 3: Getting Your Web Form to Work on Your Website

After creating the web form in the CRM, your website needs to be connected to it. **You''ll need help from your web developer or IT person for this part.**

### Information Your Web Developer Needs:

Give them these THREE things (write them down):

1. **Form Endpoint URL (Web Address):**
   - This is where the form sends information
   - Format: https://YOUR-SUPABASE-URL/functions/v1/web-to-lead
   - Example: https://husbupeealwuxyopfwwb.supabase.co/functions/v1/web-to-lead

2. **Form Key:**
   - The form key you created in Step 2
   - Example: contact-form

3. **What to tell them:**
   "Please update our website contact form to submit to this URL, and add a hidden field with name=''form_key'' and value=''YOUR-FORM-KEY''"

### What the Web Developer Will Do:
They''ll modify your website''s HTML code to:
1. Change where the form submits to (the endpoint URL)
2. Add a hidden field with your form key
3. Test it to make sure it works

**You don''t need to understand this part** - that''s what the web developer is for!

---

## Part 4: Testing Your Web Form

After the web developer updates your website, test it:

### STEP 1: Submit a Test Entry
1. Go to your company website (in a web browser like Chrome or Firefox)
2. Find the contact form
3. Fill it out with FAKE test information:
   - First Name: Test
   - Last Name: Form
   - Email: test@example.com
   - Phone: 555-0000
   - Any other fields
4. Click Submit

### STEP 2: Check if it Created a Lead
1. Go back to the CRM
2. Click **"Leads"** in the left sidebar
3. Look at the list of leads
4. **You should see** a new lead with the name "Test Form"
5. **If you see it:** SUCCESS! Your form is working!
6. **If you don''t see it:** Something is wrong - contact your web developer

### STEP 3: Delete the Test Lead
After confirming it works:
1. Find the test lead in the list
2. Click on it to open it
3. Look for a "Delete" button or trash can icon
4. Click it to delete (ask your manager if you can''t find it)

---

## Part 5: Managing Existing Web Forms

### Viewing Form Statistics

To see how many people have submitted a form:
1. Go to Home > Web Forms Console
2. Look at the number next to **"Submissions"** for each form
3. Higher numbers mean more people have filled it out!

### Editing a Web Form

To change a form''s settings:
1. Go to Home > Web Forms Console
2. Find the form you want to change
3. Look for an **"Edit"** button or pencil icon next to the form
4. **CLICK** on it
5. Change any settings you want
6. Scroll down and click **"Save"**

**Common things to edit:**
- Change who receives the leads (Default Owner)
- Turn a form on or off (Active checkbox)
- Update the success message

### Turning a Form On or Off

To temporarily disable a form without deleting it:
1. Go to Home > Web Forms Console
2. Find the form
3. Click the **"Edit"** button
4. Find the **"Active"** checkbox
5. UNCHECK it to turn OFF (form stops accepting submissions)
6. CHECK it to turn ON (form starts accepting submissions again)
7. Click **"Save"**

**Why you might turn off a form:**
- You''re running a limited-time promotion and the form was only for that
- The form has a problem and you need time to fix it
- You''re updating your website and don''t want submissions during the update

### Deleting a Web Form

**⚠️ Warning:** Deleting is permanent! Make sure you really want to delete it.

To delete a form:
1. Go to Home > Web Forms Console
2. Find the form you want to delete
3. Look for a **"Delete"** button or trash can icon (usually red)
4. **CLICK** on it
5. You''ll see a message asking "Are you sure?"
6. If you''re CERTAIN: Click **"Yes"** or **"Delete"**
7. If you changed your mind: Click **"No"** or **"Cancel"**

**Important:** Deleting a form DOES NOT delete the leads that came from it. Those leads stay in your CRM. Only the form configuration is deleted.

---

## Common Problems and Solutions

### Problem: "My form isn''t creating leads"
**Solutions to try:**
1. Check that the form is marked "Active" (go edit it and check the checkbox)
2. Make sure the form key matches EXACTLY between CRM and website (even one wrong letter breaks it)
3. Ask your web developer to check the website code
4. Try submitting the form again

### Problem: "I don''t see the Create Web Form button"
**Solution:** You might not have permission. Ask your manager to give you access or to create the form for you.

### Problem: "I forgot what form key I used"
**Solution:**
1. Go to Home > Web Forms Console
2. Find your form in the list
3. Click Edit
4. Look at the Form Key field - that''s your key!

### Problem: "Leads are going to the wrong person"
**Solution:**
1. Edit the form
2. Change the "Default Owner" to the correct person
3. Save
4. Note: This only affects NEW leads. Old leads still belong to the original owner.

---

## Important Tips

1. **Use clear form names** - Six months from now, you''ll forget what "Form2" was for!

2. **Write down form keys** - Keep a list of which form key goes with which website form

3. **Test after creation** - Always test a new form to make sure it works

4. **Don''t delete forms hastily** - Turn them off instead; you can always turn them back on

5. **Check submissions regularly** - Review the submission count to see which forms are most popular

6. **Keep forms active** - If a form is on your website, make sure it''s marked "Active" in the CRM

---

## Glossary of Terms

- **Web Form**: A digital form on your website that people fill out
- **Form Key**: A unique code that connects your website form to the CRM
- **Default Owner**: The person who receives leads from the form
- **Submission**: When someone fills out and sends a form
- **Active**: When a form is turned on and working
- **Inactive**: When a form is turned off temporarily
- **Lead**: A potential customer whose information came from a form
- **Endpoint URL**: The web address where form data is sent (technical term)

---

Need more help? Ask your manager or IT support person to walk through these steps with you!',
      'Ultra-detailed beginner guide for managing web forms - no prior knowledge needed',
      'howto',
      'Admin',
      ARRAY['web-forms', 'admin', 'beginner', 'step-by-step', 'website'],
      true,
      v_author_id,
      0, 0, 0
    WHERE NOT EXISTS (
      SELECT 1 FROM knowledge_base WHERE title = 'Complete Beginner Guide: Managing Web Forms' AND organization_id = v_org_id
    );
  END IF;
END $$;
