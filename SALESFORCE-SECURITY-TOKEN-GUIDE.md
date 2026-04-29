# Salesforce Security Token Required

## The Issue

Your Salesforce sync is failing with this error:
```
Failed to get Salesforce token: {"error":"invalid_grant","error_description":"authentication failure"}
```

This means Salesforce needs your **Security Token** to authenticate from external applications.

## How to Get Your Security Token

### Option 1: Reset Security Token (Recommended)

1. Log into Salesforce
2. Click your profile icon (top right) → **Settings**
3. In the left sidebar, search for "Reset My Security Token"
4. Click **Reset Security Token**
5. Check your email - Salesforce will send you a new security token
6. Copy the token from the email

### Option 2: Check if You Already Have It

If you've previously reset your token, check your email for "salesforce.com security token" from `noreply@salesforce.com`

## Add Token to Supabase

Once you have your security token:

1. Go to your Supabase dashboard:
   https://supabase.com/dashboard/project/husbupeealwuxyopfwwb/settings/functions

2. Click **Add New Secret** and add:
   ```
   Name: SALESFORCE_SECURITY_TOKEN
   Value: [paste your security token here]
   ```

3. Make sure you also have these other environment variables set:
   - `SALESFORCE_USERNAME` = developer@sunation.com
   - `SALESFORCE_PASSWORD` = Solar171!
   - `SALESFORCE_SECURITY_TOKEN` = [your token]

## Important Notes

- The security token is appended to your password automatically by the system
- You don't need to change your password in Salesforce
- The token stays the same unless you reset it or change your password
- If you change your Salesforce password, you'll need to get a new security token

## Test the Sync

After adding the security token:

1. Go to Admin Console → Salesforce Sync
2. Click **Sync All Objects**
3. It should now successfully authenticate and pull data from Salesforce

## Still Not Working?

Make sure:
- Your Salesforce username is correct (usually an email)
- Your password is correct
- The security token has no extra spaces
- You're using the production login (not sandbox)
