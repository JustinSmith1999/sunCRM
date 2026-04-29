#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Need VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Salesforce credentials
const SF_USERNAME = 'developer@sunation.com';
const SF_PASSWORD = 'Solar171!';

async function soapLogin() {
  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:enterprise.soap.sforce.com">
  <soapenv:Body>
    <urn:login>
      <urn:username>${SF_USERNAME}</urn:username>
      <urn:password>${SF_PASSWORD}</urn:password>
    </urn:login>
  </soapenv:Body>
</soapenv:Envelope>`;

  console.log('Logging into Salesforce...');
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

  console.log('✓ Salesforce login successful');
  return {
    sessionId: sessionIdMatch[1],
    instanceUrl: instanceUrl || 'https://sunation.my.salesforce.com'
  };
}

async function fetchAllReports(sessionId, instanceUrl) {
  console.log('\nFetching reports from Salesforce...');

  let allReports = [];
  const query = encodeURIComponent("SELECT Id, Name, Description, FolderName, OwnerId, CreatedDate, LastModifiedDate, DeveloperName FROM Report");
  let queryUrl = `${instanceUrl}/services/data/v58.0/query?q=${query}`;

  do {
    const response = await fetch(queryUrl, {
      headers: {
        'Authorization': `Bearer ${sessionId}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch reports: ${await response.text()}`);
    }

    const data = await response.json();

    if (data.records && data.records.length > 0) {
      allReports = allReports.concat(data.records);
      console.log(`  Fetched ${allReports.length} reports...`);
    }

    queryUrl = data.nextRecordsUrl ? `${instanceUrl}${data.nextRecordsUrl}` : null;
  } while (queryUrl);

  console.log(`✓ Found ${allReports.length} total reports\n`);
  return allReports;
}

async function importReportsToSupabase(reports, userId) {
  console.log(`Importing ${reports.length} reports to Supabase...\n`);

  let imported = 0;
  let failed = 0;
  const errors = [];

  // Process in batches of 50 (no metadata fetching = faster)
  const batchSize = 50;

  for (let i = 0; i < reports.length; i += batchSize) {
    const batch = reports.slice(i, Math.min(i + batchSize, reports.length));

    const reportData = batch.map(report => ({
      salesforce_id: report.Id,
      name: report.Name,
      description: report.Description || null,
      report_type: 'tabular', // Default, can be updated later with metadata
      entity_type: 'leads', // Default
      source_object: 'leads', // Default
      columns: JSON.stringify([]), // Will be populated when report is run
      filters: JSON.stringify([]),
      grouping: null,
      groupings: JSON.stringify({ groupBy: [] }),
      aggregates: JSON.stringify([]),
      chart_config: null,
      folder: report.FolderName || 'Imported from Salesforce',
      is_public: true,
      is_system: false,
      created_by: userId,
      salesforce_created_date: report.CreatedDate || null,
      salesforce_modified_date: report.LastModifiedDate || null,
      salesforce_owner_id: report.OwnerId || null
    }));

    try {
      const { data, error } = await supabase
        .from('reports')
        .upsert(reportData, {
          onConflict: 'salesforce_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`✗ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
        failed += batch.length;
        errors.push({ batch: i, error: error.message });
      } else {
        imported += batch.length;
        console.log(`✓ Batch ${Math.floor(i / batchSize) + 1}: Imported ${batch.length} reports (${imported} total)`);
      }
    } catch (error) {
      console.error(`✗ Batch ${Math.floor(i / batchSize) + 1} exception:`, error.message);
      failed += batch.length;
      errors.push({ batch: i, error: error.message });
    }
  }

  return { imported, failed, total: reports.length, errors };
}

async function syncReports() {
  console.log('\n=== SALESFORCE REPORTS SYNC (Direct Mode) ===\n');

  try {
    // Get or create user
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle();

    let userId;
    if (users) {
      userId = users.id;
    } else {
      const { data: authData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (authData && authData.users && authData.users.length > 0) {
        userId = authData.users[0].id;
      } else {
        throw new Error('No users found in system');
      }
    }

    console.log(`Using user ID: ${userId}\n`);

    // Login to Salesforce
    const sfAuth = await soapLogin();

    // Fetch all reports
    const reports = await fetchAllReports(sfAuth.sessionId, sfAuth.instanceUrl);

    // Import to Supabase
    const result = await importReportsToSupabase(reports, userId);

    // Log sync
    await supabase
      .from('salesforce_sync_logs')
      .insert({
        salesforce_object: 'Report',
        log_level: 'success',
        message: `Synced ${result.imported} reports from Salesforce`,
        records_processed: result.total,
        records_inserted: result.imported,
        records_updated: 0,
        records_failed: result.failed
      });

    console.log('\n=== SYNC COMPLETE ===\n');
    console.log(`✅ Imported: ${result.imported}`);
    console.log(`❌ Failed: ${result.failed}`);
    console.log(`📊 Total: ${result.total}`);

    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. Batch ${err.batch}: ${err.error}`);
      });
    }

    console.log('\n✅ Reports synced successfully!');
    console.log('📝 Note: Report metadata (columns, filters, etc.) will be populated when reports are first run.\n');

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

syncReports();
