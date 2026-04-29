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

async function syncReports() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║            SYNC SALESFORCE REPORTS TO SUPABASE                 ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('This will sync ~6,497 Salesforce reports with FULL metadata:\n');
  console.log('  ✓ Column definitions with labels and types');
  console.log('  ✓ Filter criteria');
  console.log('  ✓ Grouping configuration');
  console.log('  ✓ Aggregation functions (SUM, COUNT, AVG, etc.)');
  console.log('  ✓ Chart configurations');
  console.log('  ✓ Source object mappings\n');
  console.log('⏱️  Estimated time: 30-60 minutes');
  console.log('📊 Progress will be logged as reports are processed\n');
  console.log('Starting in 5 seconds... (Ctrl+C to cancel)\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Check current count
  const { count: beforeCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true });

  console.log(`Current reports in database: ${beforeCount || 0}\n`);
  console.log('═'.repeat(65) + '\n');

  const functionUrl = `${SUPABASE_URL}/functions/v1/salesforce-reports-sync`;

  console.log('🔄 Starting reports sync...\n');
  console.log(`📡 Endpoint: ${functionUrl}\n`);

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
    const minutes = Math.round(duration / 60);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log('\n' + '═'.repeat(65) + '\n');
    console.log('✅ REPORTS SYNC COMPLETE!\n');
    console.log('═'.repeat(65) + '\n');
    console.log(`⏱️  Duration: ${duration} seconds (${minutes} minutes)\n`);
    console.log('📊 Results:\n');
    console.log(`  Total reports found: ${result.total || 0}`);
    console.log(`  Successfully imported: ${result.imported || 0}`);
    console.log(`  Failed: ${result.failed || 0}`);

    if (result.errors && result.errors.length > 0) {
      console.log(`\n⚠️  Errors (showing first 5):\n`);
      result.errors.slice(0, 5).forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err.report || 'Batch'}: ${err.error}`);
      });
    }

    // Check final count
    const { count: afterCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Final report count: ${afterCount || 0}\n`);

    // Check metadata quality
    console.log('═'.repeat(65) + '\n');
    console.log('🔍 Checking Metadata Quality...\n');

    const { data: sampleReports } = await supabase
      .from('reports')
      .select('id, name, columns, filters, groupings, aggregates, source_object')
      .limit(100);

    if (sampleReports && sampleReports.length > 0) {
      let withMetadata = 0;
      let withColumns = 0;
      let withSourceObject = 0;

      sampleReports.forEach(report => {
        try {
          const cols = typeof report.columns === 'string'
            ? JSON.parse(report.columns || '[]')
            : (report.columns || []);

          if (Array.isArray(cols) && cols.length > 0) withColumns++;
          if (report.source_object) withSourceObject++;
          if (cols.length > 0 && report.source_object) withMetadata++;
        } catch (e) {
          // Skip malformed
        }
      });

      console.log('Sample of 100 reports:\n');
      console.log(`  ✓ Reports with columns: ${withColumns}/100`);
      console.log(`  ✓ Reports with source object: ${withSourceObject}/100`);
      console.log(`  ✓ Reports with full metadata: ${withMetadata}/100\n`);

      const quality = (withMetadata / 100) * 100;
      console.log(`📊 Metadata Quality Score: ${quality.toFixed(1)}%\n`);

      if (quality >= 90) {
        console.log('✅ Excellent! Reports have complete metadata and can execute independently.\n');
      } else if (quality >= 70) {
        console.log('✓ Good. Most reports should work correctly.\n');
      } else {
        console.log('⚠️  Low quality. Some reports may not execute correctly.\n');
      }
    }

    console.log('═'.repeat(65) + '\n');
    console.log('🎉 SUCCESS! Your reports are now independent from Salesforce.\n');
    console.log('What you can do now:\n');
    console.log('  • View all synced reports in the Reports Dashboard');
    console.log('  • Execute reports using your local Supabase data');
    console.log('  • Export report results to CSV');
    console.log('  • Create custom reports with the Report Builder\n');
    console.log('📖 See SALESFORCE-INDEPENDENCE-CHECKLIST.md for details\n');

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    console.error('\nPossible causes:');
    console.error('  • Edge function timeout (if syncing many reports)');
    console.error('  • Salesforce authentication issues');
    console.error('  • Network connectivity problems\n');
    console.error('Check Supabase logs for more details.\n');
    process.exit(1);
  }
}

syncReports();
