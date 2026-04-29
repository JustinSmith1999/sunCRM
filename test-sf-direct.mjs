// Direct test of Salesforce API to check what data exists
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

  const xmlText = await response.text();
  const sessionIdMatch = xmlText.match(/<sessionId>([^<]+)<\/sessionId>/);
  const serverUrlMatch = xmlText.match(/<serverUrl>([^<]+)<\/serverUrl>/);
  const instanceUrl = serverUrlMatch[1].match(/https:\/\/[^\/]+/)?.[0];

  return {
    sessionId: sessionIdMatch[1],
    instanceUrl: instanceUrl
  };
}

async function getRecordCount(sessionId, instanceUrl, objectName) {
  const query = `SELECT COUNT() FROM ${objectName}`;
  const url = `${instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${sessionId}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  return data.totalSize || 0;
}

console.log('Logging into Salesforce...');
const sfAuth = await soapLogin('developer@sunation.com', 'Solar171!');
console.log('Connected to:', sfAuth.instanceUrl);

const objects = [
  'Lead',
  'Account',
  'Contact',
  'Opportunity',
  'Campaign',
  'CampaignMember',
  'Case',
  'Task',
  'Event',
  'Product2',
  'OpportunityLineItem'
];

console.log('\nTotal records in Salesforce:\n');
for (const obj of objects) {
  try {
    const count = await getRecordCount(sfAuth.sessionId, sfAuth.instanceUrl, obj);
    console.log(`  ${obj}: ${count.toLocaleString()}`);
  } catch (err) {
    console.log(`  ${obj}: Error - ${err.message}`);
  }
}
