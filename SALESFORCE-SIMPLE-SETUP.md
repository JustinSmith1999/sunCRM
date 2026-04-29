# Salesforce Auto-Connect Setup

## One-Time Configuration

1. **Create Connected App in Salesforce:**
   - Go to Salesforce Setup → App Manager → New Connected App
   - Name: "Your CRM Integration"
   - Enable OAuth Settings
   - Selected OAuth Scopes: "Full access (full)"
   - Save and copy your Consumer Key and Consumer Secret

2. **Get Your Security Token:**
   - Go to Salesforce → Personal Settings → Reset My Security Token
   - Check your email for the security token

3. **Add to Supabase Environment Variables:**
   - Go to: https://supabase.com/dashboard/project/husbupeealwuxyopfwwb/settings/functions
   - Add these 6 environment variables:
     ```
     SALESFORCE_CLIENT_ID = your_consumer_key
     SALESFORCE_CLIENT_SECRET = your_consumer_secret
     SALESFORCE_USERNAME = your_salesforce_username@domain.com
     SALESFORCE_PASSWORD = your_salesforce_password
     SALESFORCE_SECURITY_TOKEN = your_security_token_from_email
     SALESFORCE_SANDBOX = false
     ```

## That's It!

The system now automatically:
- Connects to Salesforce on page load
- No clicks or authorization needed
- Keeps connection alive
- Syncs data continuously
