import 'dotenv/config';

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

async function testReportsQuery() {
  console.log('🔐 Logging into Salesforce...\n');

  const username = process.env.SALESFORCE_USERNAME;
  const password = process.env.SALESFORCE_PASSWORD + (process.env.SALESFORCE_SECURITY_TOKEN || '');

  const { sessionId, instanceUrl } = await soapLogin(username, password);
  console.log('✅ Logged in successfully');
  console.log('Instance URL:', instanceUrl);

  console.log('\n📊 Querying all reports...\n');

  const query = encodeURIComponent("SELECT Id, Name, Description, FolderName, OwnerId FROM Report LIMIT 200");
  const queryUrl = `${instanceUrl}/services/data/v58.0/query?q=${query}`;

  const response = await fetch(queryUrl, {
    headers: {
      'Authorization': `Bearer ${sessionId}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Query failed:', errorText);
    return;
  }

  const data = await response.json();
  console.log(`✅ Found ${data.totalSize} total reports`);
  console.log(`📄 Retrieved ${data.records.length} reports in this batch\n`);

  console.log('First 10 reports:');
  data.records.slice(0, 10).forEach((report, idx) => {
    console.log(`  ${idx + 1}. ${report.Name} (${report.FolderName || 'No Folder'})`);
  });

  if (data.records.length > 10) {
    console.log(`  ... and ${data.records.length - 10} more`);
  }
}

testReportsQuery().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
