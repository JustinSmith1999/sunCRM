import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://husbupeealwuxyopfwwb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1c2J1cGVlYWx3dXh5b3Bmd3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTE3ODMsImV4cCI6MjA3NDUyNzc4M30.ERC3k2pHFZ0MOmrbcSAgS1FwTIMpMh0fKbgzLuMXP6s';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

async function importHRRecords() {
  try {
    console.log('Reading CSV file...');
    const csvContent = readFileSync('./hr-records-import.csv', 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    const headers = parseCSVLine(lines[0]);
    console.log('Headers:', headers);

    const records = [];
    const orgId = 'b024caf8-fabc-4c7e-967f-bac942a27be4';

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      if (values.length < 2 || !values[0]) continue;

      const record = {
        organization_id: orgId,
        employee_name: values[0] || '',
        first_name: values[1] || '',
        employment_status: values[2] || 'Candidate',
        birthday: parseDate(values[3]),
        department: values[4] || 'Not Specified',
        employee_start_date: parseDate(values[5]),
        termination_date: parseDate(values[6]),
        reports_to: values[7] || null,
        employee_number: `EMP-${Date.now()}-${i}`,
        position: values[4] || 'Not Specified',
        job_title: values[4] || 'Not Specified',
        personal_phone: '',
        license_plate: ''
      };

      records.push(record);
    }

    console.log(`Importing ${records.length} HR records...`);

    const batchSize = 50;
    let imported = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('hr_records')
        .insert(batch);

      if (error) {
        console.error(`Error importing batch ${i / batchSize + 1}:`, error);
      } else {
        imported += batch.length;
        console.log(`Imported ${imported}/${records.length} records`);
      }
    }

    console.log('Import completed!');
    console.log(`Successfully imported ${imported} HR records`);

  } catch (error) {
    console.error('Error:', error);
  }
}

importHRRecords();
