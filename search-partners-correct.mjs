import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function searchPartners() {
  console.log('🔍 Searching for Partner Contacts (Jessica Grady & Gary Roffman)...\n');

  // Search hr_records for Jessica Grady
  const { data: jessica, error: jessicaError } = await supabase
    .from('hr_records')
    .select('*')
    .or('Name.ilike.%jessica%grady%,Work_Email__c.ilike.%jessica%grady%,Personal_Email__c.ilike.%jessica%grady%')
    .limit(5);

  if (jessicaError) {
    console.error('Error searching for Jessica:', jessicaError);
  } else if (jessica && jessica.length > 0) {
    console.log('✅ Found Jessica Grady in HR Records:');
    jessica.forEach(person => {
      console.log({
        Name: person.Name,
        Work_Email: person.Work_Email__c,
        Personal_Email: person.Personal_Email__c,
        Position: person.Position__c,
        Job_Title: person.Job_Title__c,
        Id: person.Id
      });
    });
  } else {
    console.log('❌ Jessica Grady not found in HR records');
  }

  // Search hr_records for Gary Roffman
  const { data: gary, error: garyError } = await supabase
    .from('hr_records')
    .select('*')
    .or('Name.ilike.%gary%roffman%,Work_Email__c.ilike.%gary%roffman%,Personal_Email__c.ilike.%gary%roffman%')
    .limit(5);

  if (garyError) {
    console.error('Error searching for Gary:', garyError);
  } else if (gary && gary.length > 0) {
    console.log('\n✅ Found Gary Roffman in HR Records:');
    gary.forEach(person => {
      console.log({
        Name: person.Name,
        Work_Email: person.Work_Email__c,
        Personal_Email: person.Personal_Email__c,
        Position: person.Position__c,
        Job_Title: person.Job_Title__c,
        Id: person.Id
      });
    });
  } else {
    console.log('\n❌ Gary Roffman not found in HR records');
  }

  // Search for partners in leads data
  console.log('\n\n📊 Searching for Partner Information in Leads...\n');

  const { data: partnerLeads, error: leadsError } = await supabase
    .from('leads')
    .select('Name, Partner__c, LeadSource')
    .or('Partner__c.ilike.%3 brothers%,Partner__c.ilike.%melco%,Partner__c.ilike.%3 sons%,LeadSource.ilike.%3 brothers%,LeadSource.ilike.%melco%,LeadSource.ilike.%3 sons%')
    .limit(15);

  if (leadsError) {
    console.error('Error searching leads:', leadsError);
  } else if (partnerLeads && partnerLeads.length > 0) {
    console.log(`✅ Found ${partnerLeads.length} leads with partner info:`);

    // Group by partner
    const byPartner = {};
    partnerLeads.forEach(lead => {
      const partner = lead.Partner__c || lead.LeadSource || 'Unknown';
      if (!byPartner[partner]) {
        byPartner[partner] = 0;
      }
      byPartner[partner]++;
    });

    console.log('\nPartner breakdown:');
    Object.entries(byPartner).forEach(([partner, count]) => {
      console.log(`  ${partner}: ${count} leads`);
    });

    console.log('\nSample leads:');
    partnerLeads.slice(0, 5).forEach(lead => {
      console.log({
        Name: lead.Name,
        Partner: lead.Partner__c,
        LeadSource: lead.LeadSource
      });
    });
  } else {
    console.log('❌ No partner leads found');
  }

  // Get all unique Partner__c values
  const { data: uniquePartners, error: uniqueError } = await supabase
    .from('leads')
    .select('Partner__c')
    .not('Partner__c', 'is', null)
    .limit(100);

  if (!uniqueError && uniquePartners && uniquePartners.length > 0) {
    const partners = [...new Set(uniquePartners.map(l => l.Partner__c))];
    console.log('\n\n📋 All unique Partner values in database:');
    partners.forEach(p => console.log(`  - ${p}`));
  }
}

searchPartners();
