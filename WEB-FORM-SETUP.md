# Web Form Setup Instructions

Your web form is now configured to submit leads directly to your CRM!

## Form Endpoint

Your form submits to:
```
https://husbupeealwuxyopfwwb.supabase.co/functions/v1/web-to-lead
```

## Setup Steps

### 1. Create Web Form in CRM

Before your form will work, you need to create a web form configuration in your CRM:

1. Log into your CRM
2. Navigate to **Home** → **Web Forms** (in the admin tiles)
3. Click **Create Web Form**
4. Fill in the details:
   - **Form Name**: Sunation Contact Form
   - **Form Key**: `sunation-contact-form` (IMPORTANT: Must match the form_key in your HTML)
   - **Default Lead Source**: Website or 3 Sons Energy
   - **Default Owner**: Select the user who should receive these leads
   - **Active**: Yes
   - **Redirect URL**: https://www.sunation.com/cp-thankyou/ (optional)

5. Click **Save**

### 2. Update Your HTML Form

The form is ready at `/public/lead-form.html` or you can update your existing form:

```html
<form action="https://husbupeealwuxyopfwwb.supabase.co/functions/v1/web-to-lead" method="POST">
    <!-- REQUIRED: Form key must match what you created in the CRM -->
    <input type="hidden" name="form_key" value="sunation-contact-form">

    <!-- Optional: Where to redirect after submission -->
    <input type="hidden" name="retURL" value="https://www.sunation.com/cp-thankyou/">

    <!-- Your form fields here -->
</form>
```

### 3. Field Mapping

The following fields from your Salesforce form are automatically mapped:

| Salesforce Field ID | CRM Field Name | Description |
|---------------------|----------------|-------------|
| `00N4X00000BUSdK` | `county` | County |
| `00N0h000006k8NV` | `utility` | Utility Provider |
| `00NC0000005oM2i` | `utility_account_1` | Utility Account Number |
| `00N4X00000Bpycp` | `own_residence` | Own Residence? |
| `00NC0000005DS8g` | `type_of_installation` | Type of Installation |
| `00NUX000001QfdF` | `new_construction` | New Construction |
| `00N0h000006fXkj` | `sales_notes` | Sales Notes |
| `00N4X00000BmeYh` | `partner` | Partner |

Standard fields like `first_name`, `last_name`, `email`, `phone`, `street`, `city`, `state`, `zip` are automatically captured.

### 4. Test Your Form

1. Submit a test entry through your form
2. Check the **Leads** section in your CRM
3. You should see the new lead with all the submitted data

## Features

- **Automatic Lead Creation**: All form submissions automatically create leads in your CRM
- **Field Mapping**: Both standard names and Salesforce field IDs are supported
- **Address Parsing**: Street, city, state, and zip are automatically combined into an address
- **Redirect Support**: Form automatically redirects to your thank-you page
- **IP Tracking**: Optionally capture submitter IP address (configure in Web Forms settings)
- **Auto-Response**: Configure automatic email responses (optional)

## Troubleshooting

### Form submissions not appearing in CRM

1. Check that the `form_key` in your HTML matches exactly what you created in the CRM
2. Make sure the web form is marked as "Active" in the CRM
3. Verify the form is submitting to the correct URL
4. Check browser console for any errors

### Missing fields

1. Verify field names match the mapping table above
2. Check that all required fields have values
3. Review the leads table to confirm the fields exist

### Can't create web form in CRM

1. Make sure you're logged in as an admin user
2. The Web Forms console is only accessible from the Home dashboard admin tiles

## Support

If you encounter issues, check the edge function logs in your Supabase dashboard or contact support.
