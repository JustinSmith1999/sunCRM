import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

// Get organization ID
const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
const orgId = orgs?.[0]?.id;

if (!orgId) {
  console.error('No organization found');
  process.exit(1);
}

const leads = [
  { first_name: 'Paul', last_name: 'Fodor', email: 'lead+827090-507ac90-1901@msg.energysage.com', street: '22 Bobcat Lane', city: 'Setauket- East Setauket', state: 'NY', zip_postal_code: '11733', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Sherry', last_name: 'Cirilo', email: 'lead+826736-48f47fa-1901@msg.energysage.com', street: '772 Delafield Avenue', city: 'Staten Island', state: 'NY', zip_postal_code: '10310', county: 'Richmond', primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Tem', last_name: 'Tash', email: 'lead+826386-c48c385-1901@msg.energysage.com', street: '53-19 96th Street', city: 'Queens', state: 'NY', zip_postal_code: '11368', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Sandi', last_name: 'Ford', email: 'lead+826353-801c540-1901@msg.energysage.com', street: '86 Sterling Street', city: 'Brooklyn', state: 'NY', zip_postal_code: '11225', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'George', last_name: 'McKee', email: 'lead+824045-0d14983-1901@msg.energysage.com', street: '1 Old North Highway', city: 'Hampton Bays', state: 'NY', zip_postal_code: '11946', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Rizi', last_name: 'Karim', email: 'lead+825834-ca82c78-1901@msg.energysage.com', street: '101-36 130th Street', city: 'Queens', state: 'NY', zip_postal_code: '11419', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Eric', last_name: 'Giedd', email: 'lead+825744-c0dd75e-1901@msg.energysage.com', street: '124 Plymouth Boulevard', city: 'Smithtown', state: 'NY', zip_postal_code: '11787', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Wei', last_name: 'Yn', email: 'lead+827267-53fb1b0-1901@msg.energysage.com', street: '51A Warwick Road', city: 'Great Neck', state: 'NY', zip_postal_code: '11023', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Jose', last_name: 'Martinez', email: 'lead+825466-df3136f-1901@msg.energysage.com', street: '482 Montauk Hwy', city: 'East Moriches', state: 'NY', zip_postal_code: '11940', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Michael', last_name: 'Cassidy', email: 'lead+824504-0f588cd-1901@msg.energysage.com', street: '16 West Raleigh Avenue', city: 'Staten Island', state: 'NY', zip_postal_code: '10310', county: 'Richmond', primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Leonid', last_name: 'Ostromukhov', email: 'lead+824532-b994ea3-1901@msg.energysage.com', street: '2137 East 28th Street', city: 'Brooklyn', state: 'NY', zip_postal_code: '11229', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Stan', last_name: 'Gang', email: 'lead+823590-daf82cf-1901@msg.energysage.com', street: '26-31 210th Pl', city: 'Queens', state: 'NY', zip_postal_code: '11360', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Brian', last_name: 'Leonard', email: 'lead+823205-58bc130-1901@msg.energysage.com', street: '1349 81 St', city: 'Brooklyn', state: 'NY', zip_postal_code: '11228', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Ursula', last_name: 'Sanchez', email: 'lead+820918-53c7b62-1901@msg.energysage.com', street: '36 Lawton Street', city: 'Brooklyn', state: 'NY', zip_postal_code: '11221', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Yatin', last_name: 'Patel', email: 'lead+820380-929f8f5-1901@msg.energysage.com', street: '266-04 83rd Avenue', city: 'Queens', state: 'NY', zip_postal_code: '11004', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Michael', last_name: 'Chu', email: 'lead+819421-a783c9d-1901@msg.energysage.com', street: '7 Christine Court', city: 'Staten Island', state: 'NY', zip_postal_code: '10312', county: 'Richmond', primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Michelle', last_name: 'Jiang', email: 'lead+828060-da12196-1901@msg.energysage.com', street: '43 Greenway East', city: 'New Hyde Park', state: 'NY', zip_postal_code: '11040', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Michael', last_name: 'Lemieszewski', email: 'lead+828720-9b6090f-1901@msg.energysage.com', street: '3639 Hunt Rd', city: 'Wantagh', state: 'NY', zip_postal_code: '11793', county: 'Nassau', primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Sean', last_name: 'Hunter', email: 'lead+833052-3af698a-1901@msg.energysage.com', street: '42 Club Lane', city: 'Remsenburg-Speonk', state: 'NY', zip_postal_code: '11960', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Dennis', last_name: 'Caba', email: 'lead+834141-8f4707b-1901@msg.energysage.com', street: '93-33 Eldert Lane', city: 'Queens', state: 'NY', zip_postal_code: '11421', county: null, primary_phone: null, lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Bruce', last_name: 'Wayne', email: 'batman@gmail.com', street: '5321 S. Bat St', city: 'Gotham', state: 'NY', zip_postal_code: '26325', county: null, primary_phone: '(696) 532-9876', lead_status: 'Open', lead_source: 'Three Ships', created_by_alias: 'RYau' },
  { first_name: 'Ronald', last_name: 'Plumley', email: 'lead+991621-63b3389-1901@msg.energysage.com', street: '109 Edmonton Lane', city: 'Brandon', state: 'FL', zip_postal_code: '33511', county: null, primary_phone: null, lead_status: 'Disqualified', lead_source: 'EnergySage', created_by_alias: 'ITSup' },
  { first_name: 'Robert', last_name: 'White', email: 'lead+995005-9959851-1901@msg.energysage.com', street: '4001 West Bay Avenue', city: 'Tampa', state: 'FL', zip_postal_code: '33616', county: null, primary_phone: null, lead_status: 'Disqualified', lead_source: 'EnergySage', created_by_alias: 'ITSup' },
];

// Add country and organization_id to each lead
const leadsWithOrg = leads.map(lead => ({
  ...lead,
  country: 'USA',
  organization_id: orgId
}));

console.log(`Inserting ${leadsWithOrg.length} leads...`);

const { data, error } = await supabase
  .from('leads')
  .insert(leadsWithOrg)
  .select();

if (error) {
  console.error('Error inserting leads:', error);
  process.exit(1);
}

console.log(`Successfully inserted ${data.length} leads`);
