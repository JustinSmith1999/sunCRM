import { supabase } from '../lib/supabase';

export const salesforceLeads = [
  { first_name: 'Paul', last_name: 'Fodor', email: 'lead+827090-507ac90-1901@msg.energysage.com', street: '22 Bobcat Lane', state: 'NY', city: 'Setauket- East Setauket', zip_postal_code: '11733', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Sherry', last_name: 'Cirilo', email: 'lead+826736-48f47fa-1901@msg.energysage.com', street: '772 Delafield Avenue', state: 'NY', city: 'Staten Island', zip_postal_code: '10310', county: 'Richmond', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Tem', last_name: 'Tash', email: 'lead+826386-c48c385-1901@msg.energysage.com', street: '53-19 96th Street', state: 'NY', city: 'Queens', zip_postal_code: '11368', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Sandi', last_name: 'Ford', email: 'lead+826353-801c540-1901@msg.energysage.com', street: '86 Sterling Street', state: 'NY', city: 'Brooklyn', zip_postal_code: '11225', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'George', last_name: 'McKee', email: 'lead+824045-0d14983-1901@msg.energysage.com', street: '1 Old North Highway', state: 'NY', city: 'Hampton Bays', zip_postal_code: '11946', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Rizi', last_name: 'Karim', email: 'lead+825834-ca82c78-1901@msg.energysage.com', street: '101-36 130th Street', state: 'NY', city: 'Queens', zip_postal_code: '11419', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Eric', last_name: 'Giedd', email: 'lead+825744-c0dd75e-1901@msg.energysage.com', street: '124 Plymouth Boulevard', state: 'NY', city: 'Smithtown', zip_postal_code: '11787', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Wei', last_name: 'Yn', email: 'lead+827267-53fb1b0-1901@msg.energysage.com', street: '51A Warwick Road', state: 'NY', city: 'Great Neck', zip_postal_code: '11023', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Jose', last_name: 'Martinez', email: 'lead+825466-df3136f-1901@msg.energysage.com', street: '482 Montauk Hwy', state: 'NY', city: 'East Moriches', zip_postal_code: '11940', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Michael', last_name: 'Cassidy', email: 'lead+824504-0f588cd-1901@msg.energysage.com', street: '16 West Raleigh Avenue', state: 'NY', city: 'Staten Island', zip_postal_code: '10310', county: 'Richmond', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Leonid', last_name: 'Ostromukhov', email: 'lead+824532-b994ea3-1901@msg.energysage.com', street: '2137 East 28th Street', state: 'NY', city: 'Brooklyn', zip_postal_code: '11229', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Stan', last_name: 'Gang', email: 'lead+823590-daf82cf-1901@msg.energysage.com', street: '26-31 210th Pl', state: 'NY', city: 'Queens', zip_postal_code: '11360', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Brian', last_name: 'Leonard', email: 'lead+823205-58bc130-1901@msg.energysage.com', street: '1349 81 St', state: 'NY', city: 'Brooklyn', zip_postal_code: '11228', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Ursula', last_name: 'Sanchez', email: 'lead+820918-53c7b62-1901@msg.energysage.com', street: '36 Lawton Street', state: 'NY', city: 'Brooklyn', zip_postal_code: '11221', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Yatin', last_name: 'Patel', email: 'lead+820380-929f8f5-1901@msg.energysage.com', street: '266-04 83rd Avenue', state: 'NY', city: 'Queens', zip_postal_code: '11004', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Michael', last_name: 'Chu', email: 'lead+819421-a783c9d-1901@msg.energysage.com', street: '7 Christine Court', state: 'NY', city: 'Staten Island', zip_postal_code: '10312', county: 'Richmond', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Michelle', last_name: 'Jiang', email: 'lead+828060-da12196-1901@msg.energysage.com', street: '43 Greenway East', state: 'NY', city: 'New Hyde Park', zip_postal_code: '11040', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Michael', last_name: 'Lemieszewski', email: 'lead+828720-9b6090f-1901@msg.energysage.com', street: '3639 Hunt Rd', state: 'NY', city: 'Wantagh', zip_postal_code: '11793', county: 'Nassau', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Sean', last_name: 'Hunter', email: 'lead+833052-3af698a-1901@msg.energysage.com', street: '42 Club Lane', state: 'NY', city: 'Remsenburg-Speonk', zip_postal_code: '11960', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Dennis', last_name: 'Caba', email: 'lead+834141-8f4707b-1901@msg.energysage.com', street: '93-33 Eldert Lane', state: 'NY', city: 'Queens', zip_postal_code: '11421', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Bruce', last_name: 'Wayne', email: 'batman@gmail.com', primary_phone: '(696) 532-9876', street: '5321 S. Bat St', state: 'NY', city: 'Gotham', zip_postal_code: '26325', lead_status: 'Open', lead_source: 'Three Ships', created_by_alias: 'RYau' },
  { first_name: 'Matt', last_name: 'Holly', email: 'lead+856091-0635946-1901@msg.energysage.com', street: '13 West Clearwater Road', state: 'NY', city: 'Lindenhurst', zip_postal_code: '11757', county: 'Suffolk', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Timothy', last_name: 'McDonagh', email: 'lead+855852-10291ec-1901@msg.energysage.com', street: '20 Groton Drive', state: 'NY', city: 'Port Jefferson Station', zip_postal_code: '11776', county: 'Suffolk', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Felix', last_name: 'Chu', email: 'lead+859533-b73fb64-1901@msg.energysage.com', street: '45 Lake Dr', state: 'NY', city: 'New Hyde Park', zip_postal_code: '11040', county: 'Nassau', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Stephen', last_name: 'Joester', email: 'lead+859792-e00749d-1901@msg.energysage.com', street: '401 Mecox Road', state: 'NY', city: 'Water Mill', zip_postal_code: '11976', county: 'Suffolk', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Mark', last_name: 'Gosdigian', email: 'lead+860010-b895388-1901@msg.energysage.com', street: '18 Blinker Light Road', state: 'NY', city: 'Stony Brook', zip_postal_code: '11790', county: 'Suffolk', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Anthony', last_name: 'Aurisano', email: 'lead+860355-e97e70b-1901@msg.energysage.com', street: '42 Moriches Drive', state: 'NY', city: 'Mastic Beach', zip_postal_code: '11951', county: 'Suffolk', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Testlead', last_name: 'Testlead', email: 'Testlead@testlead.com', primary_phone: '(805) 999-4613', lead_status: 'Open', lead_source: 'Rocket Leads', created_by_alias: 'RYau' },
  { first_name: 'Kevin', last_name: 'Holloway', email: 'lead+860455-34a540f-1901@msg.energysage.com', street: '1 Gina Court', state: 'NY', city: 'Nesconset', zip_postal_code: '11767', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Bosch', last_name: 'Tiena', email: 'lead+860922-72cd8e0-1901@msg.energysage.com', street: '404 Washington Avenue', state: 'NY', city: 'Bellmore', zip_postal_code: '11710', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Jennifer', last_name: 'Alfonso-Zea', email: 'lead+862445-3971faa-1901@msg.energysage.com', street: '67 Hiddink Street', state: 'NY', city: 'Sayville', zip_postal_code: '11782', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Eric', last_name: 'Swike', email: 'lead+862914-5a216f3-1901@msg.energysage.com', street: '9 Bayberry Lane', state: 'NY', city: 'Stony Brook', zip_postal_code: '11790', county: 'Nassau', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Yes', last_name: 'Homeowner', email: 'Test@testlead.com', primary_phone: '(818) 555-6969', zip_postal_code: '91733', lead_status: 'Open', lead_source: 'Rocket Leads', created_by_alias: 'RYau' },
  { first_name: 'Mary', last_name: 'George', email: 'lead+863096-ef0137f-1901@msg.energysage.com', street: '2554 6th Avenue', state: 'NY', city: 'East Meadow', zip_postal_code: '11554', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Dawn', last_name: 'Tufano', email: 'lead+863378-98d9e41-1901@msg.energysage.com', street: '320 Everit Avenue', state: 'NY', city: 'Hewlett', zip_postal_code: '11557', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Mike', last_name: 'DeMarino', email: 'lead+863478-0ee7df2-1901@msg.energysage.com', street: '58 Laurelton Drive', state: 'NY', city: 'Mastic Beach', zip_postal_code: '11951', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Brandon', last_name: 'Jones', email: 'lead+863877-abe98a3-1901@msg.energysage.com', street: '3244 Perry Avenue', state: 'NY', city: 'Oceanside', zip_postal_code: '11572', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Raheem', last_name: 'Isom', email: 'lead+865036-61e3dcb-1901@msg.energysage.com', street: '176 Allen Street', state: 'NY', city: 'Hempstead', zip_postal_code: '11550', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Jack', last_name: 'Grein', email: 'lead+865330-e7e0114-1901@msg.energysage.com', street: '127 Bellmore St', state: 'NY', city: 'Floral Park', zip_postal_code: '11001', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'John T.', last_name: 'Douglas', email: 'lead+865534-670128b-1901@msg.energysage.com', street: '2770 Linwood Avenue', state: 'NY', city: 'North Bellmore', zip_postal_code: '11710', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Dan', last_name: 'Cavuoto', email: 'lead+865750-0f267ed-1901@msg.energysage.com', street: '2009 New Hyde Park Road', state: 'NY', city: 'New Hyde Park', zip_postal_code: '11040', lead_status: 'Open', lead_source: 'EnergySage', created_by_alias: 'RYau' },
  { first_name: 'Ronald', last_name: 'Plumley', email: 'lead+991621-63b3389-1901@msg.energysage.com', street: '109 Edmonton Lane', state: 'FL', city: 'Brandon', zip_postal_code: '33511', lead_status: 'Disqualified', lead_source: 'EnergySage', created_by_alias: 'ITSup' },
  { first_name: 'Robert', last_name: 'White', email: 'lead+995005-9959851-1901@msg.energysage.com', street: '4001 West Bay Avenue', state: 'FL', city: 'Tampa', zip_postal_code: '33616', lead_status: 'Disqualified', lead_source: 'EnergySage', created_by_alias: 'ITSup' },
  { first_name: 'Chaitanya', last_name: 'Kolla', email: 'lead+995312-5e75b3b-1901@msg.energysage.com', street: '28328 Forelli Court', state: 'FL', city: 'Wesley Chapel', zip_postal_code: '33543', lead_status: 'Disqualified', lead_source: 'EnergySage', created_by_alias: 'ITSup' },
  { first_name: 'Christine', last_name: 'Fiechter', email: 'lead+995585-945a490-1901@msg.energysage.com', street: '481 Pine Warbler Way North', state: 'FL', city: 'Palm Harbor', zip_postal_code: '34683', lead_status: 'Disqualified', lead_source: 'EnergySage', created_by_alias: 'ITSup' }
];

export async function importLeadsToSupabase(organizationId: string) {
  console.log('Starting import with organization_id:', organizationId);
  console.log('Number of leads to import:', salesforceLeads.length);

  const leadsToImport = salesforceLeads.map(lead => ({
    ...lead,
    organization_id: organizationId,
    country: 'USA'
  }));

  console.log('Sample lead data:', leadsToImport[0]);

  const { data, error } = await supabase
    .from('leads')
    .insert(leadsToImport)
    .select();

  if (error) {
    console.error('Supabase error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Database error: ${error.message} (${error.code || 'unknown'})`);
  }

  console.log('Successfully imported leads:', data?.length);
  return data;
}
