#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const integrations = [
  {
    name: 'egnyte',
    display: 'Egnyte File Storage',
    requiredCreds: ['domain', 'api_key'],
    testEndpoint: (domain) => `https://${domain}.egnyte.com/pubapi/v1/userinfo`,
  },
  {
    name: 'powerbi',
    display: 'Power BI',
    requiredCreds: ['client_id', 'client_secret', 'tenant_id'],
    testEndpoint: (tenantId) => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
  },
  {
    name: 'ringcentral',
    display: 'RingCentral',
    requiredCreds: ['client_id', 'client_secret'],
    testEndpoint: () => 'https://platform.ringcentral.com/restapi/v1.0',
  },
  {
    name: 'aurora_solar',
    display: 'Aurora Solar',
    requiredCreds: ['api_key', 'tenant_id'],
    testEndpoint: () => 'https://api.aurorasolar.com/v1',
  },
  {
    name: 'salesforce',
    display: 'Salesforce',
    requiredCreds: ['client_id', 'client_secret', 'username', 'password'],
    testEndpoint: () => 'https://login.salesforce.com/services/oauth2/token',
  },
  {
    name: 'stripe',
    display: 'Stripe',
    requiredCreds: ['secret_key'],
    testEndpoint: () => 'https://api.stripe.com/v1',
  },
  {
    name: 'twilio',
    display: 'Twilio',
    requiredCreds: ['account_sid', 'auth_token'],
    testEndpoint: (accountSid) => `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
  },
  {
    name: 'sendgrid',
    display: 'SendGrid',
    requiredCreds: ['api_key'],
    testEndpoint: () => 'https://api.sendgrid.com/v3/user/profile',
  },
];

async function testIntegration(integration) {
  console.log(`\n🔍 Testing ${integration.display}...\n`);

  const { data: credential, error } = await supabase
    .from('api_credentials')
    .select('*')
    .eq('service_name', integration.name)
    .single();

  if (error || !credential) {
    console.log(`   ⚠️  Not configured in database`);
    return { name: integration.name, configured: false, active: false, connected: false };
  }

  const creds = typeof credential.credentials === 'string'
    ? JSON.parse(credential.credentials)
    : credential.credentials;

  const missingCreds = integration.requiredCreds.filter(key => !creds[key] || creds[key] === '');

  if (missingCreds.length > 0) {
    console.log(`   ⚠️  Missing credentials: ${missingCreds.join(', ')}`);
    console.log(`   Status: Configured but incomplete`);
    return { name: integration.name, configured: true, active: false, connected: false };
  }

  console.log(`   ✓ All required credentials present`);
  console.log(`   Active: ${credential.is_active ? 'Yes' : 'No'}`);
  console.log(`   Connected: ${credential.is_connected ? 'Yes' : 'No'}`);

  if (credential.last_tested_at) {
    const lastTested = new Date(credential.last_tested_at);
    const hoursAgo = Math.floor((Date.now() - lastTested.getTime()) / (1000 * 60 * 60));
    console.log(`   Last tested: ${hoursAgo} hours ago`);
  }

  return {
    name: integration.name,
    configured: true,
    active: credential.is_active,
    connected: credential.is_connected,
  };
}

async function generateSetupInstructions(results) {
  console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║                  INTEGRATION SETUP GUIDE                       ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const unconfigured = results.filter(r => !r.configured || !r.active);

  if (unconfigured.length === 0) {
    console.log('✅ All integrations are configured and active!\n');
    return;
  }

  console.log('The following integrations need setup:\n');

  unconfigured.forEach(result => {
    const integration = integrations.find(i => i.name === result.name);
    if (!integration) return;

    console.log(`\n${integration.display}:`);
    console.log(`  Required credentials: ${integration.requiredCreds.join(', ')}`);

    switch (integration.name) {
      case 'egnyte':
        console.log(`  Setup steps:`);
        console.log(`    1. Go to https://[your-domain].egnyte.com/web/admin/developers`);
        console.log(`    2. Create a new API key or OAuth application`);
        console.log(`    3. Copy the domain and API key`);
        console.log(`    4. Add to API Integrations console`);
        break;

      case 'powerbi':
        console.log(`  Setup steps:`);
        console.log(`    1. Go to https://portal.azure.com`);
        console.log(`    2. Register a new app in Azure AD`);
        console.log(`    3. Add Power BI Service API permissions`);
        console.log(`    4. Create a client secret`);
        console.log(`    5. Copy Client ID, Tenant ID, and Secret`);
        console.log(`    6. Get Workspace ID from Power BI`);
        break;

      case 'ringcentral':
        console.log(`  Setup steps:`);
        console.log(`    1. Go to https://developers.ringcentral.com`);
        console.log(`    2. Create a new app`);
        console.log(`    3. Set OAuth redirect URL`);
        console.log(`    4. Copy Client ID and Client Secret`);
        break;

      case 'aurora_solar':
        console.log(`  Setup steps:`);
        console.log(`    1. Contact Aurora Solar support for API access`);
        console.log(`    2. Request API key and tenant ID`);
        console.log(`    3. Copy credentials to console`);
        break;

      case 'salesforce':
        console.log(`  Setup steps:`);
        console.log(`    1. Already configured via edge functions`);
        console.log(`    2. Check Supabase dashboard for credentials`);
        break;

      case 'stripe':
        console.log(`  Setup steps:`);
        console.log(`    1. Go to https://dashboard.stripe.com/apikeys`);
        console.log(`    2. Copy Secret Key`);
        console.log(`    3. Get webhook secret from webhooks section`);
        break;

      case 'twilio':
        console.log(`  Setup steps:`);
        console.log(`    1. Go to https://console.twilio.com`);
        console.log(`    2. Copy Account SID and Auth Token`);
        console.log(`    3. Get a phone number`);
        break;

      case 'sendgrid':
        console.log(`  Setup steps:`);
        console.log(`    1. Go to https://app.sendgrid.com/settings/api_keys`);
        console.log(`    2. Create a new API key`);
        console.log(`    3. Copy the key immediately (only shown once)`);
        break;
    }
  });

  console.log('\n\n📖 To configure integrations:');
  console.log('   1. Log in as admin');
  console.log('   2. Go to Admin Dashboard > API Integrations');
  console.log('   3. Select each service and enter credentials');
  console.log('   4. Click "Test Connection" to verify');
  console.log('   5. Save and activate\n');
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║              API INTEGRATIONS STATUS CHECK                     ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const results = [];

  for (const integration of integrations) {
    const result = await testIntegration(integration);
    results.push(result);
  }

  console.log('\n\n═'.repeat(65));
  console.log('\n📊 SUMMARY\n');

  const configured = results.filter(r => r.configured).length;
  const active = results.filter(r => r.active).length;
  const connected = results.filter(r => r.connected).length;

  console.log(`  Total integrations: ${integrations.length}`);
  console.log(`  Configured: ${configured}/${integrations.length}`);
  console.log(`  Active: ${active}/${integrations.length}`);
  console.log(`  Connected: ${connected}/${integrations.length}`);

  const configPercent = Math.round((configured / integrations.length) * 100);
  console.log(`\n  Overall completion: ${configPercent}%`);

  if (configPercent < 100) {
    await generateSetupInstructions(results);
  } else {
    console.log('\n✅ All integrations are configured!');
    console.log('\nTest each integration connection in the Admin Dashboard.\n');
  }
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
