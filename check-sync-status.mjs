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

async function checkStatus() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║              SALESFORCE SYNC STATUS CHECK                      ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const tables = [
    { name: 'leads', display: 'Leads', critical: true },
    { name: 'accounts', display: 'Accounts', critical: true },
    { name: 'opportunities', display: 'Opportunities', critical: true },
    { name: 'salesforce_contacts', display: 'Contacts', critical: true },
    { name: 'salesforce_cases', display: 'Cases', critical: false },
    { name: 'salesforce_campaigns', display: 'Campaigns', critical: false },
    { name: 'salesforce_campaign_members', display: 'Campaign Members', critical: false },
    { name: 'salesforce_tasks', display: 'Tasks', critical: false },
    { name: 'salesforce_events', display: 'Events', critical: false },
    { name: 'salesforce_products', display: 'Products', critical: false },
    { name: 'salesforce_opportunity_line_items', display: 'Opportunity Line Items', critical: false },
    { name: 'salesforce_users', display: 'Salesforce Users', critical: true },
    { name: 'salesforce_quotes', display: 'Quotes', critical: false },
    { name: 'salesforce_documents', display: 'Documents', critical: false },
    { name: 'reports', display: 'Reports', critical: true }
  ];

  console.log('📊 Salesforce Data Status:\n');

  let totalRecords = 0;
  let criticalSynced = 0;
  let criticalTotal = 0;

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ✗ ${table.display.padEnd(35)} ERROR: ${error.message.substring(0, 30)}`);
      } else {
        const recordCount = count || 0;
        totalRecords += recordCount;

        if (table.critical) {
          criticalTotal++;
          if (recordCount > 0) criticalSynced++;
        }

        const emoji = recordCount > 0 ? '✓' : '○';
        const critical = table.critical ? '🔴' : '  ';
        const status = recordCount > 0 ? '' : '← NEEDS SYNC';

        console.log(`  ${emoji} ${critical} ${table.display.padEnd(30)} ${recordCount.toLocaleString().padStart(8)} ${status}`);
      }
    } catch (error) {
      console.log(`  ✗ ${table.display.padEnd(35)} ERROR`);
    }
  }

  console.log('\n' + '─'.repeat(65));
  console.log(`  TOTAL: ${totalRecords.toLocaleString()} records across all tables`);
  console.log('─'.repeat(65) + '\n');

  // Check reports metadata quality
  const { data: reports, count: reportCount } = await supabase
    .from('reports')
    .select('id, columns, source_object', { count: 'exact' })
    .limit(100);

  if (reportCount && reportCount > 0) {
    let withMetadata = 0;

    reports?.forEach(report => {
      try {
        const cols = typeof report.columns === 'string'
          ? JSON.parse(report.columns || '[]')
          : (report.columns || []);

        if (Array.isArray(cols) && cols.length > 0 && report.source_object) {
          withMetadata++;
        }
      } catch (e) {
        // Skip
      }
    });

    const quality = (withMetadata / Math.min(reports?.length || 0, 100)) * 100;

    console.log('📈 Reports Metadata Quality:\n');
    console.log(`  Total reports: ${reportCount.toLocaleString()}`);
    console.log(`  Sample checked: ${Math.min(reports?.length || 0, 100)}`);
    console.log(`  With complete metadata: ${withMetadata}/${Math.min(reports?.length || 0, 100)}`);
    console.log(`  Quality score: ${quality.toFixed(1)}%\n`);

    if (quality >= 90) {
      console.log('  ✅ Excellent! Reports ready for independent execution.\n');
    } else if (quality >= 70) {
      console.log('  ✓ Good. Most reports should work.\n');
    } else if (reportCount > 0) {
      console.log('  ⚠️  Low quality. Re-sync reports to get full metadata.\n');
    }
  }

  console.log('═'.repeat(65) + '\n');
  console.log('📋 Status Summary:\n');

  const percentage = (criticalSynced / criticalTotal) * 100;

  console.log(`  Critical tables synced: ${criticalSynced}/${criticalTotal} (${percentage.toFixed(0)}%)`);
  console.log(`  🔴 = Critical for Salesforce independence\n`);

  if (percentage === 100) {
    console.log('✅ ALL CRITICAL DATA SYNCED!\n');
    console.log('Your system can now operate independently from Salesforce.\n');
    console.log('What you can do:\n');
    console.log('  • View and run all synced reports');
    console.log('  • Manage leads, accounts, opportunities, contacts');
    console.log('  • Create custom dashboards');
    console.log('  • Export data to CSV');
    console.log('  • Use all features without Salesforce connection\n');
  } else {
    console.log('⚠️  SOME CRITICAL DATA NOT YET SYNCED\n');
    console.log('To achieve complete Salesforce independence, run:\n');

    if (reportCount === 0) {
      console.log('  node sync-reports-only.mjs    (sync reports with metadata)');
    }

    console.log('  node sync-all-tables.mjs      (sync all remaining tables)\n');
  }

  console.log('📖 See SALESFORCE-INDEPENDENCE-CHECKLIST.md for full details\n');
}

checkStatus().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
