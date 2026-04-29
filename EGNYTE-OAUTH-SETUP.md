# Egnyte OAuth Setup - Simple Instructions

Since you created an OAuth app in Egnyte Developer Portal, here's what to do:

## What You Have

From the Egnyte Developer Portal, you should have:
- **Client ID** (looks like: `abc123xyz`)
- **Client Secret** (looks like: `xyz789abc`)
- **Your Egnyte Domain** (e.g., `sunation`)

## Setup Steps (5 minutes)

### Step 1: Configure Redirect URI in Egnyte

1. Go to: https://developers.egnyte.com/apps
2. Click on your app
3. Find **"Redirect URIs"**
4. Add this EXACT URL:
   ```
   http://localhost:5173/admin
   ```
   (or your production URL like `https://yourapp.com/admin`)
5. Click **Save**

### Step 2: Connect in CRM

1. **Log into your CRM** as admin
2. Go to: **Admin** → **API Integrations**
3. You'll see **"Connect Egnyte (OAuth)"** at the top
4. Fill in:
   - **Egnyte Domain**: `sunation` (just the name, not .egnyte.com)
   - **Client ID**: Paste from Developer Portal
   - **Client Secret**: Paste from Developer Portal
5. Click **"Connect to Egnyte"**
6. You'll be redirected to Egnyte - click **"Allow"**
7. You'll come back and see **"Egnyte Connected ✅"**

### Step 3: Test It

1. Click **"Test Connection"**
2. Should see: "Connection successful"
3. Done!

## Troubleshooting

### "Invalid redirect URI"
- Make sure you added the EXACT redirect URI in Egnyte Developer Portal
- Check for typos (http vs https, port number, trailing slash)

### "Invalid client credentials"
- Double-check Client ID and Client Secret
- Make sure you're using the right app

### Still not working?
- Try creating a fresh OAuth app in Egnyte Developer Portal
- Make sure the app has these permissions:
  - `Egnyte.filesystem` (File System API)
  - `Egnyte.link` (Link API)

## What Happens Behind the Scenes

1. CRM sends you to Egnyte with your Client ID
2. You authorize the app in Egnyte
3. Egnyte sends back a code
4. CRM exchanges code for access token
5. Token is saved in database
6. CRM can now access Egnyte files

## Security Notes

- Tokens are stored encrypted in the database
- Tokens automatically refresh when expired
- Only admins can configure integrations
- All API calls are logged for audit

## Next Steps

Once connected, you can:
- Upload documents to Egnyte from CRM
- Link files to leads/opportunities
- Browse Egnyte folders from CRM
- Share documents with customers
