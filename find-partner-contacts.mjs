import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findPartnerContacts() {
  console.log('🔍 Searching for partner contacts...\n');

  // Search for Jessica Grady
  console.log('Searching for Jessica Grady...');
  const { data: jessica, error: jessicaError } = await supabase
    .from('hr_records')
    .select('*')
    .or('"Name".ilike.%jessica%grady%,"Email".ilike.%jessica%grady%')
    .limit(5);

  if (jessicaError) {
    console.error('Error searching for Jessica:', jessicaError);
  } else {
    console.log('Jessica Grady results:', jessica);
  }

  // Search for Gary Roffman
  console.log('\nSearching for Gary Roffman...');
  const { data: gary, error: garyError } = await supabase
    .from('hr_records')
    .select('*')
    .or('"Name".ilike.%gary%roffman%,"Email".ilike.%gary%roffman%')
    .limit(5);

  if (garyError) {
    console.error('Error searching for Gary:', garyError);
  } else {
    console.log('Gary Roffman results:', gary);
  }

  // Check salesforce_users table
  console.log('\n--- Checking Salesforce Users ---\n');

  const { data: sfJessica, error: sfJessicaError } = await supabase
    .from('salesforce_users')
    .select('*')
    .or('"Name".ilike.%jessica%grady%,"Email".ilike.%jessica%grady%')
    .limit(5);

  if (sfJessicaError) {
    console.error('Error searching Salesforce for Jessica:', sfJessicaError);
  } else {
    console.log('Salesforce - Jessica Grady:', sfJessica);
  }

  const { data: sfGary, error: sfGaryError } = await supabase
    .from('salesforce_users')
    .select('*')
    .or('"Name".ilike.%gary%roffman%,"Email".ilike.%gary%roffman%')
    .limit(5);

  if (sfGaryError) {
    console.error('Error searching Salesforce for Gary:', sfGaryError);
  } else {
    console.log('Salesforce - Gary Roffman:', sfGary);
  }

  // Check auth.users
  console.log('\n--- Checking Auth Users ---\n');

  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.log('Cannot access auth.users with anon key (expected)');
    console.log('Will need to query via service role or check directly in Supabase dashboard');
  } else {
    const jessicaAuth = authUsers.users.filter(u =>
      u.email?.toLowerCase().includes('jessica') ||
      u.user_metadata?.name?.toLowerCase().includes('jessica')
    );
    const garyAuth = authUsers.users.filter(u =>
      u.email?.toLowerCase().includes('gary') ||
      u.user_metadata?.name?.toLowerCase().includes('gary')
    );

    console.log('Auth - Jessica:', jessicaAuth);
    console.log('Auth - Gary:', garyAuth);
  }

  // Search all partner-related data in Salesforce tables
  console.log('\n--- Searching for Partner in Salesforce Data ---\n');

  // Check leads for partner mentions
  const { data: partnerLeads, error: leadsError } = await supabase
    .from('leads')
    .select('id, "Name", "Partner__c", "LeadSource"')
    .or('"Partner__c".ilike.%3 brothers%,"Partner__c".ilike.%melco%,"LeadSource".ilike.%3 brothers%,"LeadSource".ilike.%melco%')
    .limit(10);

  if (leadsError) {
    console.error('Error searching leads:', leadsError);
  } else {
    console.log('Leads with partner info:', partnerLeads);
  }
}

findPartnerContacts();
