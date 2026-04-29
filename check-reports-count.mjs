import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkReportsCount() {
  console.log('Checking reports in database...\n');

  const { count: totalCount, error: countError } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting reports:', countError);
    return;
  }

  console.log(`Total reports in database: ${totalCount}`);

  // Get folder breakdown
  const { data: reports, error } = await supabase
    .from('reports')
    .select('folder');

  if (error) {
    console.error('Error loading reports:', error);
    return;
  }

  const folderCounts = {};
  reports.forEach(report => {
    const folder = report.folder || 'Custom Reports';
    folderCounts[folder] = (folderCounts[folder] || 0) + 1;
  });

  console.log('\nReports by folder:');
  Object.entries(folderCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([folder, count]) => {
      console.log(`  ${folder}: ${count}`);
    });

  console.log(`\nTotal unique folders: ${Object.keys(folderCounts).length}`);
}

checkReportsCount();
