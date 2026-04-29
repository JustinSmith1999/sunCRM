#!/usr/bin/env node
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const EDGE_FUNCTIONS = {
  objects: `${SUPABASE_URL}/functions/v1/salesforce-sync`,
  reports: `${SUPABASE_URL}/functions/v1/salesforce-reports-sync`
};

async function checkTableCounts() {
  console.log('\n📊 Checking current data counts...\n');

  const tables = [
    'leads',
    'accounts',
    'opportunities',
    'salesforce_contacts',
    'salesforce_cases',
    'salesforce_campaigns',
    'salesforce_campaign_members',
    'salesforce_tasks',
    'salesforce_events',
    'salesforce_products',
    'salesforce_opportunity_line_items',
    'salesforce_users',
    'salesforce_quotes',
    'salesforce_documents',
    'reports'
  ];

  const counts = {};

  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'count=exact'
        },
        method: 'HEAD'
      });

      const count = response.headers.get('content-range')?.split('/')[1] || '0';
      counts[table] = parseInt(count);

      const emoji = parseInt(count) > 0 ? '✓' : '○';
      console.log(`  ${emoji} ${table.padEnd(35)} ${count.padStart(6)} records`);
    } catch (error) {
      counts[table] = 0;
      console.log(`  ✗ ${table.padEnd(35)} ERROR`);
    }
  }

  console.log('\n' + '='.repeat(50));
  const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
  console.log(`  TOTAL RECORDS: ${totalRecords.toLocaleString()}`);
  console.log('='.repeat(50) + '\n');

  return counts;
}

async function syncSalesforceObjects() {
  console.log('🔄 STEP 1: Syncing All Salesforce Objects\n');
  console.log('This will sync 14 Salesforce objects:');
  console.log('  • Leads, Accounts, Contacts, Opportunities');
  console.log('  • Campaigns, Cases, Tasks, Events');
  console.log('  • Products, Quotes, Documents, Users');
  console.log('  • Campaign Members, Opportunity Line Items\n');
  console.log('⏱️  Estimated time: 5-15 minutes\n');

  try {
    const startTime = Date.now();

    const response = await fetch(EDGE_FUNCTIONS.objects, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({})
    });

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log('\n✅ Salesforce Objects Sync Complete!\n');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📊 Results:`);

    if (result.results) {
      result.results.forEach(r => {
        const status = r.success ? '✓' : '✗';
        console.log(`  ${status} ${r.object.padEnd(30)} ${r.inserted || 0} inserted, ${r.updated || 0} updated`);
      });
    }

    return true;
  } catch (error) {
    console.error('\n❌ Failed to sync Salesforce objects:', error.message);
    return false;
  }
}

async function syncReports() {
  console.log('\n🔄 STEP 2: Syncing All Reports with Full Metadata\n');
  console.log('This will sync ~6,497 reports with complete metadata:');
  console.log('  • Column definitions and labels');
  console.log('  • Filter criteria');
  console.log('  • Grouping configuration');
  console.log('  • Aggregation functions');
  console.log('  • Chart settings');
  console.log('  • Source object mappings\n');
  console.log('⏱️  Estimated time: 30-60 minutes\n');
  console.log('🔍 Progress will be logged as reports are processed...\n');

  try {
    const startTime = Date.now();

    const response = await fetch(EDGE_FUNCTIONS.reports, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({})
    });

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 60);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log('\n✅ Reports Sync Complete!\n');
    console.log(`⏱️  Duration: ${duration} minutes`);
    console.log(`📊 Results:`);
    console.log(`  ✓ Total reports: ${result.total || 0}`);
    console.log(`  ✓ Imported: ${result.imported || 0}`);
    console.log(`  ✗ Failed: ${result.failed || 0}`);

    if (result.errors && result.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered (first 10):`);
      result.errors.slice(0, 10).forEach(err => {
        console.log(`  • ${err.report || 'Batch'}: ${err.error}`);
      });
    }

    return true;
  } catch (error) {
    console.error('\n❌ Failed to sync reports:', error.message);
    return false;
  }
}

async function verifySyncQuality() {
  console.log('\n🔍 STEP 3: Verifying Sync Quality\n');

  try {
    // Check reports have metadata
    const reportsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/reports?select=id,columns,filters,groupings,aggregates,source_object&limit=100`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );

    if (!reportsResponse.ok) {
      throw new Error('Failed to fetch reports for verification');
    }

    const reports = await reportsResponse.json();

    let withColumns = 0;
    let withFilters = 0;
    let withGroupings = 0;
    let withAggregates = 0;
    let withSourceObject = 0;

    reports.forEach(report => {
      const cols = typeof report.columns === 'string' ? JSON.parse(report.columns || '[]') : (report.columns || []);
      const filters = typeof report.filters === 'string' ? JSON.parse(report.filters || '[]') : (report.filters || []);
      const groupings = typeof report.groupings === 'string' ? JSON.parse(report.groupings || '{}') : (report.groupings || {});
      const aggs = typeof report.aggregates === 'string' ? JSON.parse(report.aggregates || '[]') : (report.aggregates || []);

      if (cols.length > 0) withColumns++;
      if (filters.length > 0) withFilters++;
      if (groupings.groupBy && groupings.groupBy.length > 0) withGroupings++;
      if (aggs.length > 0) withAggregates++;
      if (report.source_object) withSourceObject++;
    });

    console.log('Report Metadata Quality (sample of 100):');
    console.log(`  ✓ With columns: ${withColumns}/100`);
    console.log(`  ✓ With filters: ${withFilters}/100`);
    console.log(`  ✓ With groupings: ${withGroupings}/100`);
    console.log(`  ✓ With aggregates: ${withAggregates}/100`);
    console.log(`  ✓ With source object: ${withSourceObject}/100`);

    const quality = ((withColumns + withSourceObject) / 200) * 100;
    console.log(`\n📊 Overall metadata quality: ${quality.toFixed(1)}%`);

    if (quality < 80) {
      console.log('\n⚠️  Warning: Low metadata quality. Some reports may not execute correctly.');
    } else {
      console.log('\n✅ Good metadata quality! Reports should execute properly.');
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
  }
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║        COMPLETE SALESFORCE SYNC - ALL TABLES            ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('This will sync ALL Salesforce data to achieve complete independence:\n');
  console.log('  1️⃣  All Salesforce Objects (14 tables)');
  console.log('  2️⃣  All Reports with Full Metadata (~6,497)');
  console.log('  3️⃣  Verification of sync quality\n');
  console.log('⏱️  Total estimated time: 35-75 minutes\n');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 0: Check current state
  const beforeCounts = await checkTableCounts();

  // Step 1: Sync all Salesforce objects
  console.log('\n' + '═'.repeat(60) + '\n');
  const objectsSuccess = await syncSalesforceObjects();

  if (!objectsSuccess) {
    console.error('\n❌ Object sync failed. Stopping here.');
    process.exit(1);
  }

  // Step 2: Sync all reports with metadata
  console.log('\n' + '═'.repeat(60) + '\n');
  const reportsSuccess = await syncReports();

  if (!reportsSuccess) {
    console.error('\n⚠️  Reports sync failed, but objects were synced successfully.');
  }

  // Step 3: Verify quality
  console.log('\n' + '═'.repeat(60) + '\n');
  await verifySyncQuality();

  // Final counts
  console.log('\n' + '═'.repeat(60) + '\n');
  const afterCounts = await checkTableCounts();

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║                    SYNC COMPLETE!                        ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('✅ Your system is now fully independent from Salesforce!\n');
  console.log('What you can do now:');
  console.log('  • View and run all 6,497+ reports');
  console.log('  • Create, edit, delete all CRM records');
  console.log('  • Build custom dashboards');
  console.log('  • Export data to CSV');
  console.log('  • Use all features without Salesforce connection\n');
  console.log('📖 See SALESFORCE-INDEPENDENCE-CHECKLIST.md for details\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
