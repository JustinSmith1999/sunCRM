import 'dotenv/config';

const username = 'developer@sunation.com';
const password = 'Solar171!';

async function soapLogin(username, password) {
  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:enterprise.soap.sforce.com">
  <soapenv:Body>
    <urn:login>
      <urn:username>${username}</urn:username>
      <urn:password>${password}</urn:password>
    </urn:login>
  </soapenv:Body>
</soapenv:Envelope>`;

  const response = await fetch('https://login.salesforce.com/services/Soap/c/58.0', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      'SOAPAction': 'login'
    },
    body: soapBody
  });

  if (!response.ok) {
    throw new Error(`SOAP login failed: ${await response.text()}`);
  }

  const xmlText = await response.text();

  const sessionIdMatch = xmlText.match(/<sessionId>([^<]+)<\/sessionId>/);
  const serverUrlMatch = xmlText.match(/<serverUrl>([^<]+)<\/serverUrl>/);

  if (!sessionIdMatch || !serverUrlMatch) {
    throw new Error('Failed to parse SOAP response');
  }

  const instanceUrl = serverUrlMatch[1].match(/https:\/\/[^\/]+/)?.[0];

  return {
    sessionId: sessionIdMatch[1],
    instanceUrl: instanceUrl || 'https://sunation.my.salesforce.com'
  };
}

console.log('🔐 Logging into Salesforce...');
const { sessionId, instanceUrl } = await soapLogin(username, password);
console.log('✅ Logged in successfully\n');

console.log('📋 Fetching Opportunity field metadata...');

// Use the Salesforce REST API to describe the Opportunity object
const describeUrl = `${instanceUrl}/services/data/v58.0/sobjects/Opportunity/describe`;

const response = await fetch(describeUrl, {
  headers: {
    'Authorization': `Bearer ${sessionId}`,
    'Content-Type': 'application/json'
  }
});

if (!response.ok) {
  throw new Error(`Failed to describe Opportunity: ${await response.text()}`);
}

const metadata = await response.json();

console.log(`\n✅ Found ${metadata.fields.length} fields on Opportunity object\n`);

// Extract field names, filtering for commonly needed fields
const allFields = metadata.fields
  .filter(f => !f.deprecatedAndHidden)
  .map(f => f.name);

console.log('All Available Fields:');
console.log(JSON.stringify(allFields, null, 2));

// Generate the fields array for the sync function
console.log('\n\n=== COPY THIS TO salesforce-sync/index.ts ===\n');
console.log('fields: [');
const chunked = [];
for (let i = 0; i < allFields.length; i += 5) {
  const chunk = allFields.slice(i, i + 5);
  chunked.push(`  '${chunk.join("', '")}'`);
}
console.log(chunked.join(',\n'));
console.log('],');
