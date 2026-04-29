# Sunation Form → CRM Setup

## Quick Setup (2 minutes)

Your existing form at your website needs to start sending data to the CRM. Here's how:

### Step 1: Create Web Form in CRM (1 minute)

1. **Log into your CRM** at your deployment URL
2. **Click "Home"** in the sidebar
3. **Click the "Web Forms" tile** (purple icon with Users)
4. **Click "Create Web Form"** button
5. Fill in these exact values:
   - **Form Name**: `Sunation Contact Form`
   - **Form Key**: `sunation-contact-form` ⚠️ Must be exact!
   - **Description**: `Main contact form from website`
   - **Default Lead Source**: `3 Sons Energy`
   - **Default Owner**: Select yourself or sales team member
   - **Success Message**: `Thank you for your submission!`
   - **Redirect URL**: `https://www.sunation.com/cp-thankyou/`
   - **Active**: ✅ Yes
   - **Capture IP**: ✅ Yes (optional)
6. **Click Save**

### Step 2: Update Your Live Form (1 minute)

Find your existing HTML form on your website and update the `<form>` tag:

**Change this:**
```html
<form action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00D80000000dmAG" method="POST">
```

**To this:**
```html
<form action="https://husbupeealwuxyopfwwb.supabase.co/functions/v1/web-to-lead" method="POST">
```

**Then add this hidden field** right after the opening `<form>` tag:
```html
<input type="hidden" name="form_key" value="sunation-contact-form">
```

**Keep everything else the same** - all your existing fields, styling, reCAPTCHA, etc.

### Step 3: Test It

1. Submit a test entry through your form
2. Check the **Leads** section in your CRM
3. You should see the new lead with all data captured

## What Gets Captured

All form fields are automatically captured and mapped:

- ✅ First Name, Last Name
- ✅ Email, Phone
- ✅ Street Address, City, State, Zip
- ✅ County
- ✅ Utility Provider
- ✅ Utility Account Number
- ✅ Own Residence (Yes/No)
- ✅ Type of Installation
- ✅ New Construction (checkbox)
- ✅ Sales Notes
- ✅ Partner (3 Sons Energy)
- ✅ Lead Source (3 Sons Energy)

## Technical Details

The edge function at `/supabase/functions/web-to-lead/index.ts` handles:
- Both Salesforce field IDs (`00N4X00000BUSdK`) and standard names (`county`)
- Form-encoded POST data (what your form sends)
- Automatic redirect to your thank-you page
- IP address tracking
- All custom fields from your Salesforce setup

## Troubleshooting

**Leads not appearing?**
- Check the form_key matches exactly: `sunation-contact-form`
- Make sure the web form is marked "Active" in CRM
- Check browser console for errors

**Missing fields?**
- All Salesforce field IDs are already mapped
- The edge function was updated to handle your specific form

**Need help?**
- Check the edge function logs in Supabase Dashboard
- Review leads in the CRM to see what data is captured

---

That's it! Your form will now create leads in your CRM while still redirecting to your thank-you page.
