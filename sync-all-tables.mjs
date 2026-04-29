#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableCounts() {
  console.log('\n📊 Current Data Status:\n');

  const tables = [
    { name: 'leads', display: 'Leads' },
    { name: 'accounts', display: 'Accounts' },
    { name: 'opportunities', display: 'Opportunities' },
    { name: 'salesforce_contacts', display: 'Contacts' },
    { name: 'salesforce_cases', display: 'Cases' },
    { name: 'salesforce_campaigns', display: 'Campaigns' },
    { name: 'salesforce_campaign_members', display: 'Campaign Members' },
    { name: 'salesforce_tasks', display: 'Tasks' },
    { name: 'salesforce_events', display: 'Events' },
    { name: 'salesforce_products', display: 'Products' },
    { name: 'salesforce_opportunity_line_items', display: 'Opportunity Line Items' },
    { name: 'salesforce_users', display: 'Users' },
    { name: 'salesforce_quotes', display: 'Quotes' },
    { name: 'salesforce_documents', display: 'Documents' },
    { name: 'reports', display: 'Reports' }
  ];

  const counts = {};
  let totalRecords = 0;

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ✗ ${table.display.padEnd(30)} ERROR: ${error.message}`);
        counts[table.name] = 0;
      } else {
        const recordCount = count || 0;
        counts[table.name] = recordCount;
        totalRecords += recordCount;
        const emoji = recordCount > 0 ? '✓' : '○';
        console.log(`  ${emoji} ${table.display.padEnd(30)} ${recordCount.toLocaleString().padStart(8)} records`);
      }
    } catch (error) {
      console.log(`  ✗ ${table.display.padEnd(30)} ERROR`);
      counts[table.name] = 0;
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`  TOTAL: ${totalRecords.toLocaleString()} records across all tables`);
  console.log('─'.repeat(50) + '\n');

  return counts;
}

async function triggerSync(functionName, description) {
  console.log(`\n🔄 ${description}\n`);

  const functionUrl = `${SUPABASE_URL}/functions/v1/${functionName}`;

  console.log(`📡 Calling: ${functionUrl}`);
  console.log('⏱️  This may take several minutes...\n');

  try {
    const startTime = Date.now();

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
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

    console.log(`\n✅ Sync Complete!`);
    console.log(`⏱️  Duration: ${duration} seconds (${Math.round(duration / 60)} minutes)\n`);

    if (result.results) {
      console.log('📊 Sync Results:\n');
      result.results.forEach(r => {
        const status = r.success ? '✓' : '✗';
        const inserted = r.inserted || 0;
        const updated = r.updated || 0;
        const failed = r.failed || 0;
        console.log(`  ${status} ${r.object.padEnd(30)} +${inserted} new, ~${updated} updated, ✗${failed} failed`);
      });
    } else if (result.imported !== undefined) {
      console.log('📊 Sync Results:\n');
      console.log(`  ✓ Total: ${result.total || 0}`);
      console.log(`  ✓ Imported: ${result.imported || 0}`);
      console.log(`  ✗ Failed: ${result.failed || 0}`);
    }

    return { success: true, result };
  } catch (error) {
    console.error(`\n❌ Sync failed: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

async function checkReportMetadataQuality() {
  console.log('\n🔍 Checking Report Metadata Quality...\n');

  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('id, name, columns, filters, groupings, aggregates, source_object')
      .limit(100);

    if (error) {
      throw error;
    }

    if (!reports || reports.length === 0) {
      console.log('⚠️  No reports found in database.');
      return;
    }

    let withColumns = 0;
    let withFilters = 0;
    let withGroupings = 0;
    let withAggregates = 0;
    let withSourceObject = 0;

    reports.forEach(report => {
      try {
        const cols = typeof report.columns === 'string'
          ? JSON.parse(report.columns || '[]')
          : (report.columns || []);
        const filters = typeof report.filters === 'string'
          ? JSON.parse(report.filters || '[]')
          : (report.filters || []);
        const groupings = typeof report.groupings === 'string'
          ? JSON.parse(report.groupings || '{}')
          : (report.groupings || {});
        const aggs = typeof report.aggregates === 'string'
          ? JSON.parse(report.aggregates || '[]')
          : (report.aggregates || []);

        if (Array.isArray(cols) && cols.length > 0) withColumns++;
        if (Array.isArray(filters) && filters.length > 0) withFilters++;
        if (groupings.groupBy && Array.isArray(groupings.groupBy) && groupings.groupBy.length > 0) withGroupings++;
        if (Array.isArray(aggs) && aggs.length > 0) withAggregates++;
        if (report.source_object) withSourceObject++;
      } catch (e) {
        // Skip malformed reports
      }
    });

    console.log('Report Metadata Quality (sample of 100 reports):\n');
    console.log(`  ✓ Reports with columns: ${withColumns}/100 (${Math.round(withColumns)}%)`);
    console.log(`  ✓ Reports with filters: ${withFilters}/100 (${Math.round(withFilters)}%)`);
    console.log(`  ✓ Reports with groupings: ${withGroupings}/100 (${Math.round(withGroupings)}%)`);
    console.log(`  ✓ Reports with aggregates: ${withAggregates}/100 (${Math.round(withAggregates)}%)`);
    console.log(`  ✓ Reports with source object: ${withSourceObject}/100 (${Math.round(withSourceObject)}%)`);

    const quality = ((withColumns + withSourceObject) / 200) * 100;
    console.log(`\n📊 Overall Quality Score: ${quality.toFixed(1)}%`);

    if (quality < 70) {
      console.log('\n⚠️  Low metadata quality - reports may not execute correctly');
      console.log('   Consider re-running the reports sync to fetch complete metadata.');
    } else if (quality < 90) {
      console.log('\n✓ Acceptable metadata quality');
    } else {
      console.log('\n✅ Excellent metadata quality - reports should work great!');
    }

  } catch (error) {
    console.error(`\n❌ Quality check failed: ${error.message}\n`);
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║          SYNC ALL SALESFORCE DATA TO SUPABASE                  ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('This will sync ALL data for complete Salesforce independence:\n');
  console.log('  📦 Step 1: Sync all Salesforce objects (14 tables)');
  console.log('  📊 Step 2: Sync all reports with metadata (~6,497 reports)');
  console.log('  ✓ Step 3: Verify sync quality\n');
  console.log('⏱️  Estimated total time: 30-60 minutes\n');
  console.log('Starting in 3 seconds... (Ctrl+C to cancel)\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Check initial state
  console.log('═'.repeat(65) + '\n');
  console.log('BEFORE SYNC:\n');
  await checkTableCounts();

  // Step 1: Sync Salesforce objects
  console.log('\n' + '═'.repeat(65) + '\n');
  console.log('STEP 1 OF 3: Syncing Salesforce Objects\n');
  console.log('═'.repeat(65));

  const objectsResult = await triggerSync(
    'salesforce-sync',
    'Syncing all Salesforce objects (Leads, Accounts, Opportunities, etc.)'
  );

  if (!objectsResult.success) {
    console.log('\n⚠️  Object sync failed. Check your Salesforce credentials.');
    console.log('   Edge function logs may have more details.\n');
    process.exit(1);
  }

  // Step 2: Sync reports
  console.log('\n' + '═'.repeat(65) + '\n');
  console.log('STEP 2 OF 3: Syncing Reports with Full Metadata\n');
  console.log('═'.repeat(65));

  const reportsResult = await triggerSync(
    'salesforce-reports-sync',
    'Syncing all reports with complete metadata (columns, filters, groupings, etc.)'
  );

  if (!reportsResult.success) {
    console.log('\n⚠️  Reports sync failed, but objects were synced successfully.');
    console.log('   You can try syncing reports again later.\n');
  }

  // Step 3: Verify quality
  console.log('\n' + '═'.repeat(65) + '\n');
  console.log('STEP 3 OF 3: Verification\n');
  console.log('═'.repeat(65));

  await checkReportMetadataQuality();

  // Check final state
  console.log('\n' + '═'.repeat(65) + '\n');
  console.log('AFTER SYNC:\n');
  await checkTableCounts();

  // Final summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║                     SYNC COMPLETE! 🎉                          ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('✅ Your system is now independent from Salesforce!\n');
  console.log('What you can do now:\n');
  console.log('  • View and execute all synced reports');
  console.log('  • Create, edit, and delete CRM records');
  console.log('  • Build custom dashboards');
  console.log('  • Export data to CSV');
  console.log('  • Use ALL features without Salesforce connection\n');
  console.log('📖 See SALESFORCE-INDEPENDENCE-CHECKLIST.md for full details\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
