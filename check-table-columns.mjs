import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('Checking table columns...\n');

  // Get sample from hr_records
  const { data: hrSample, error: hrError } = await supabase
    .from('hr_records')
    .select('*')
    .limit(1);

  if (hrError) {
    console.error('hr_records error:', hrError);
  } else {
    console.log('hr_records columns:', hrSample && hrSample.length > 0 ? Object.keys(hrSample[0]) : 'No data');
  }

  // Get sample from salesforce_users
  const { data: sfSample, error: sfError } = await supabase
    .from('salesforce_users')
    .select('*')
    .limit(1);

  if (sfError) {
    console.error('salesforce_users error:', sfError);
  } else {
    console.log('salesforce_users columns:', sfSample && sfSample.length > 0 ? Object.keys(sfSample[0]) : 'No data');
  }

  // Get sample from leads
  const { data: leadsSample, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .limit(1);

  if (leadsError) {
    console.error('leads error:', leadsError);
  } else {
    console.log('leads columns:', leadsSample && leadsSample.length > 0 ? Object.keys(leadsSample[0]) : 'No data');
  }
}

checkColumns();
