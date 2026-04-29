import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Inserting 150 leads into Supabase...\n');

const { data: profiles, error: profileError } = await supabase.from('user_profiles').select('id').limit(1).maybeSingle();
if (!profiles) {
  console.error('No user profiles found. Create an account first!');
  process.exit(1);
}

const { data: orgRole, error: orgError } = await supabase.from('user_organization_roles').select('organization_id').eq('user_id', profiles.id).maybeSingle();
if (!orgRole) {
  console.error('No organization found for user!');
  process.exit(1);
}

const userId = profiles.id;
const orgId = orgRole.organization_id;

console.log(`Using User: ${userId}`);
console.log(`Using Org: ${orgId}\n`);

const leads = [
  { first_name: 'Paul', last_name: 'Fodor', email: 'lead+827090-507ac90-1901@msg.energysage.com', street: '22 Bobcat Lane', city: 'Setauket- East Setauket', state: 'NY', postal_code: '11733', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Sherry', last_name: 'Cirilo', email: 'lead+826736-48f47fa-1901@msg.energysage.com', street: '772 Delafield Avenue', city: 'Staten Island', state: 'NY', postal_code: '10310', county: 'Richmond', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Tem', last_name: 'Tash', email: 'lead+826386-c48c385-1901@msg.energysage.com', street: '53-19 96th Street', city: 'Queens', state: 'NY', postal_code: '11368', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Sandi', last_name: 'Ford', email: 'lead+826353-801c540-1901@msg.energysage.com', street: '86 Sterling Street', city: 'Brooklyn', state: 'NY', postal_code: '11225', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'George', last_name: 'McKee', email: 'lead+824045-0d14983-1901@msg.energysage.com', street: '1 Old North Highway', city: 'Hampton Bays', state: 'NY', postal_code: '11946', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Rizi', last_name: 'Karim', email: 'lead+825834-ca82c78-1901@msg.energysage.com', street: '101-36 130th Street', city: 'Queens', state: 'NY', postal_code: '11419', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Eric', last_name: 'Giedd', email: 'lead+825744-c0dd75e-1901@msg.energysage.com', street: '124 Plymouth Boulevard', city: 'Smithtown', state: 'NY', postal_code: '11787', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Wei', last_name: 'Yn', email: 'lead+827267-53fb1b0-1901@msg.energysage.com', street: '51A Warwick Road', city: 'Great Neck', state: 'NY', postal_code: '11023', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Jose', last_name: 'Martinez', email: 'lead+825466-df3136f-1901@msg.energysage.com', street: '482 Montauk Hwy', city: 'East Moriches', state: 'NY', postal_code: '11940', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Michael', last_name: 'Cassidy', email: 'lead+824504-0f588cd-1901@msg.energysage.com', street: '16 West Raleigh Avenue', city: 'Staten Island', state: 'NY', postal_code: '10310', county: 'Richmond', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Leonid', last_name: 'Ostromukhov', email: 'lead+824532-b994ea3-1901@msg.energysage.com', street: '2137 East 28th Street', city: 'Brooklyn', state: 'NY', postal_code: '11229', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Stan', last_name: 'Gang', email: 'lead+823590-daf82cf-1901@msg.energysage.com', street: '26-31 210th Pl', city: 'Queens', state: 'NY', postal_code: '11360', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Brian', last_name: 'Leonard', email: 'lead+823205-58bc130-1901@msg.energysage.com', street: '1349 81 St', city: 'Brooklyn', state: 'NY', postal_code: '11228', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Ursula', last_name: 'Sanchez', email: 'lead+820918-53c7b62-1901@msg.energysage.com', street: '36 Lawton Street', city: 'Brooklyn', state: 'NY', postal_code: '11221', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Yatin', last_name: 'Patel', email: 'lead+820380-929f8f5-1901@msg.energysage.com', street: '266-04 83rd Avenue', city: 'Queens', state: 'NY', postal_code: '11004', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Michael', last_name: 'Chu', email: 'lead+819421-a783c9d-1901@msg.energysage.com', street: '7 Christine Court', city: 'Staten Island', state: 'NY', postal_code: '10312', county: 'Richmond', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Michelle', last_name: 'Jiang', email: 'lead+828060-da12196-1901@msg.energysage.com', street: '43 Greenway East', city: 'New Hyde Park', state: 'NY', postal_code: '11040', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Michael', last_name: 'Lemieszewski', email: 'lead+828720-9b6090f-1901@msg.energysage.com', street: '3639 Hunt Rd', city: 'Wantagh', state: 'NY', postal_code: '11793', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Sean', last_name: 'Hunter', email: 'lead+833052-3af698a-1901@msg.energysage.com', street: '42 Club Lane', city: 'Remsenburg-Speonk', state: 'NY', postal_code: '11960', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Dennis', last_name: 'Caba', email: 'lead+834141-8f4707b-1901@msg.energysage.com', street: '93-33 Eldert Lane', city: 'Queens', state: 'NY', postal_code: '11421', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Nazary', last_name: 'Nebeluk', email: 'lead+830909-4bea215-1901@msg.energysage.com', street: '9 Elson Street', city: 'Staten Island', state: 'NY', postal_code: '10314', county: 'Richmond', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'rabjot', last_name: 'gill', email: 'lead+834317-47c047a-1901@msg.energysage.com', street: '161 Radcliff Road', city: 'Staten Island', state: 'NY', postal_code: '10305', county: 'Richmond', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Elizabeth', last_name: 'Polanco', email: 'lead+830419-d665273-1901@msg.energysage.com', street: '276 Delafield Avenue', city: 'Staten Island', state: 'NY', postal_code: '10310', county: 'Richmond', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Anthony', last_name: 'Accardo', email: 'lead+835019-62587cb-1901@msg.energysage.com', street: '1974 74th Street', city: 'Brooklyn', state: 'NY', postal_code: '11204', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Alice', last_name: 'Newkirk', email: 'lead+830827-faf87eb-1901@msg.energysage.com', street: '31-14 48th Street', city: 'Queens', state: 'NY', postal_code: '11103', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Frank', last_name: 'Craparotta', email: 'lead+848046-c0129d6-1901@msg.energysage.com', street: '3008 Rhode Island Avenue', city: 'Medford', state: 'NY', postal_code: '11763', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Bruce', last_name: 'Wayne', email: 'batman@gmail.com', phone: '(696) 532-9876', street: '5321 S. Bat St', city: 'Gotham', state: 'NY', postal_code: '26325', lead_source: 'Three Ships', status: 'Open' },
  { first_name: 'Matt', last_name: 'Holly', email: 'lead+856091-0635946-1901@msg.energysage.com', street: '13 West Clearwater Road', city: 'Lindenhurst', state: 'NY', postal_code: '11757', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Timothy', last_name: 'McDonagh', email: 'lead+855852-10291ec-1901@msg.energysage.com', street: '20 Groton Drive', city: 'Port Jefferson Station', state: 'NY', postal_code: '11776', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Felix', last_name: 'Chu', email: 'lead+859533-b73fb64-1901@msg.energysage.com', street: '45 Lake Dr', city: 'New Hyde Park', state: 'NY', postal_code: '11040', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Stephen', last_name: 'Joester', email: 'lead+859792-e00749d-1901@msg.energysage.com', street: '401 Mecox Road', city: 'Water Mill', state: 'NY', postal_code: '11976', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Mark', last_name: 'Gosdigian', email: 'lead+860010-b895388-1901@msg.energysage.com', street: '18 Blinker Light Road', city: 'Stony Brook', state: 'NY', postal_code: '11790', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Anthony', last_name: 'Aurisano', email: 'lead+860355-e97e70b-1901@msg.energysage.com', street: '42 Moriches Drive', city: 'Mastic Beach', state: 'NY', postal_code: '11951', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Testlead', last_name: 'Testlead', email: 'Testlead@testlead.com', phone: '(805) 999-4613', lead_source: 'Rocket Leads', status: 'Open' },
  { first_name: 'Kevin', last_name: 'Holloway', email: 'lead+860455-34a540f-1901@msg.energysage.com', street: '1 Gina Court', city: 'Nesconset', state: 'NY', postal_code: '11767', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Bosch', last_name: 'Tiena', email: 'lead+860922-72cd8e0-1901@msg.energysage.com', street: '404 Washington Avenue', city: 'Bellmore', state: 'NY', postal_code: '11710', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Jennifer', last_name: 'Alfonso-Zea', email: 'lead+862445-3971faa-1901@msg.energysage.com', street: '67 Hiddink Street', city: 'Sayville', state: 'NY', postal_code: '11782', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Eric', last_name: 'Swike', email: 'lead+862914-5a216f3-1901@msg.energysage.com', street: '9 Bayberry Lane', city: 'Stony Brook', state: 'NY', postal_code: '11790', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Yes', last_name: 'Homeowner', email: 'Test@testlead.com', phone: '(818) 555-6969', postal_code: '91733', lead_source: 'Rocket Leads', status: 'Open' },
  { first_name: 'Mary', last_name: 'George', email: 'lead+863096-ef0137f-1901@msg.energysage.com', street: '2554 6th Avenue', city: 'East Meadow', state: 'NY', postal_code: '11554', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Dawn', last_name: 'Tufano', email: 'lead+863378-98d9e41-1901@msg.energysage.com', street: '320 Everit Avenue', city: 'Hewlett', state: 'NY', postal_code: '11557', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Mike', last_name: 'DeMarino', email: 'lead+863478-0ee7df2-1901@msg.energysage.com', street: '58 Laurelton Drive', city: 'Mastic Beach', state: 'NY', postal_code: '11951', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Brandon', last_name: 'Jones', email: 'lead+863877-abe98a3-1901@msg.energysage.com', street: '3244 Perry Avenue', city: 'Oceanside', state: 'NY', postal_code: '11572', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Jack', last_name: 'Grein', email: 'lead+865330-e7e0114-1901@msg.energysage.com', street: '127 Bellmore St', city: 'Floral Park', state: 'NY', postal_code: '11001', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'John T.', last_name: 'Douglas', email: 'lead+865534-670128b-1901@msg.energysage.com', street: '2770 Linwood Avenue', city: 'North Bellmore', state: 'NY', postal_code: '11710', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Dan', last_name: 'Cavuoto', email: 'lead+865750-0f267ed-1901@msg.energysage.com', street: '2009 New Hyde Park Road', city: 'New Hyde Park', state: 'NY', postal_code: '11040', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Robert', last_name: 'Grasberger', email: 'lead+621350-bdf80ea-1901@msg.energysage.com', street: '85 Old Northwest Road', city: 'East Hampton', state: 'NY', postal_code: '11937', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'My', last_name: 'Name', email: 'lead+867395-d7d9bd8-1901@msg.energysage.com', street: '22 Circle Drive', city: 'Shoreham', state: 'NY', postal_code: '11786', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Beatriz', last_name: 'Ramirez', email: 'lead+868096-736b740-1901@msg.energysage.com', street: '9 Mohawk Place', city: 'Selden', state: 'NY', postal_code: '11784', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Rob', last_name: 'Schneider', email: 'lead+868142-0fd481c-1901@msg.energysage.com', street: '78 Wildwood Road', city: 'Sag Harbor', state: 'NY', postal_code: '11963', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Richard', last_name: 'Moriarty', email: 'lead+873301-91bd65d-1901@msg.energysage.com', street: '30 Lonni Lane', city: 'Smithtown', state: 'NY', postal_code: '11787', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Gage', last_name: 'Mersereau', email: 'lead+875821-8f8493e-1901@msg.energysage.com', street: '111 East Shore Drive', city: 'Babylon', state: 'NY', postal_code: '11702', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Sean', last_name: 'Wilson', email: 'lead+875574-46ccc91-1901@msg.energysage.com', street: '40 Westmoreland Dr', city: 'Shelter Island', state: 'NY', postal_code: '11965', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'John', last_name: 'Grossmann', email: 'lead+876401-e53ee68-1901@msg.energysage.com', street: '62 Hollywood Avenue', city: 'Massapequa', state: 'NY', postal_code: '11758', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Jessica', last_name: 'Perez', email: 'lead+876460-7dd3654-1901@msg.energysage.com', street: '503 5th Avenue', city: 'East Northport', state: 'NY', postal_code: '11731', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Sven', last_name: 'Herrmann', email: 'lead+876423-68319a1-1901@msg.energysage.com', street: '116 Nadia Court', city: 'Port Jefferson', state: 'NY', postal_code: '11777', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Thomas', last_name: 'Kane', email: 'lead+878048-714b643-1901@msg.energysage.com', street: '163 Harbor Beach Road', city: 'Manhattan', state: 'NY', postal_code: '11766', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'testlead', last_name: '[not provided]', email: 'test@testlead.com', phone: '(888) 555-1110', street: '1234 Main St.', postal_code: '91324', lead_source: 'Rocket Leads', status: 'Open' },
  { first_name: 'Thomas', last_name: 'Ar', email: 'lead+880713-0781510-1901@msg.energysage.com', street: '18 Night Heron Drive', city: 'Stony Brook', state: 'NY', postal_code: '11790', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Jessica', last_name: 'Wolfarth', email: 'lead+881327-3f8b847-1901@msg.energysage.com', street: '3770 Verleye Street', city: 'Seaford', state: 'NY', postal_code: '11783', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Anna', last_name: 'Dinkins', email: 'lead+870735-6e16cc1-1901@msg.energysage.com', street: '249 Yaphank Avenue', city: 'Yaphank', state: 'NY', postal_code: '11980', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Sheri', last_name: 'Whitley', email: 'lead+879745-980e2b3-1901@msg.energysage.com', street: '43 Overlook Drive', city: 'Mastic', state: 'NY', postal_code: '11950', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Brian', last_name: 'Valdez', email: 'lead+883974-2365b9a-1901@msg.energysage.com', street: '8 Island Bay Avenue', city: 'Middle Island', state: 'NY', postal_code: '11953', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Jo Ann', last_name: 'Sutton', email: 'lead+885575-2bb349c-1901@msg.energysage.com', street: '62A Tamarack Street', city: 'East Northport', state: 'NY', postal_code: '11731', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Peter', last_name: 'Feldman', email: 'lead+885629-4f234b4-1901@msg.energysage.com', street: '44 Abrahams Landing Road', city: 'Amagansett', state: 'NY', postal_code: '11930', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Stephanie', last_name: 'Stahl', email: 'lead+885485-c53ba85-1901@msg.energysage.com', street: '8 Little Ram Island Drive', city: 'Shelter Island', state: 'NY', postal_code: '11964', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Vinny', last_name: 'Cerullo', email: 'lead+886901-ac4d686-1901@msg.energysage.com', street: '377 Auborn Avenue', city: 'Shirley', state: 'NY', postal_code: '11967', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'R.', last_name: 'McCabe', email: 'lead+887549-9e973a1-1901@msg.energysage.com', street: '34 Ferry Road', city: 'Sag Harbor', state: 'NY', postal_code: '11963', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Peter', last_name: 'Stratoudakis', email: 'lead+888401-9d146b6-1901@msg.energysage.com', street: '229 Park Avenue', city: 'Williston Park', state: 'NY', postal_code: '11596', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Arman', last_name: 'Ozgun', email: 'lead+888980-ce50cf7-1901@msg.energysage.com', street: '52 Ely Brook Road', city: 'East Hampton', state: 'NY', postal_code: '11937', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Adam', last_name: 'Smith', email: 'lead+889046-f9b6589-1901@msg.energysage.com', street: '543 Nassau Avenue', city: 'Freeport', state: 'NY', postal_code: '11520', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Jeorge', last_name: 'Klein', email: 'lead+889066-a954516-1901@msg.energysage.com', street: '258 Mill Lane', city: 'Gordon Heights', state: 'NY', postal_code: '11953', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Mark', last_name: 'Furman', email: 'lead+889482-e993a8b-1901@msg.energysage.com', street: '377 Lewis Street', city: 'West Hempstead', state: 'NY', postal_code: '11552', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Jay', last_name: 'ass', email: 'lead+889883-a923f6c-1901@msg.energysage.com', street: '24 McCulloch Dr', city: 'Dix Hills', state: 'NY', postal_code: '11746', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Dennis', last_name: 'Mendez', email: 'lead+891170-f05a2c5-1901@msg.energysage.com', street: '143 Leverich Street', city: 'Hempstead', state: 'NY', postal_code: '11550', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'gary', last_name: 'lerner', email: 'lead+885136-0bb36c8-1901@msg.energysage.com', street: '18 Wood Ln', city: 'Woodmere', state: 'NY', postal_code: '11598', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Liza', last_name: 'Dorado', email: 'lead+892399-e6c773e-1901@msg.energysage.com', street: '215 Bryant Avenue', city: 'Floral Park', state: 'NY', postal_code: '11001', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Michael', last_name: 'Dobie', email: 'lead+892128-f40d2cb-1901@msg.energysage.com', street: '74 Avenue B', city: 'West Babylon', state: 'NY', postal_code: '11704', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Robert', last_name: 'gonzaloz', email: 'lead+893968-e1b0757-1901@msg.energysage.com', street: '3 Albert Road', city: 'Amityville', state: 'NY', postal_code: '11701', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'massif', last_name: 'cadf', email: 'lead+893754-bdce3bc-1901@msg.energysage.com', street: '2340 Westlake Court', city: 'Oceanside', state: 'NY', postal_code: '11572', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'barbara', last_name: 'zimet', email: 'lead+893214-6b5cd5e-1901@msg.energysage.com', street: '27 Mitchell Road', city: 'Westhampton Beach', state: 'NY', postal_code: '11978', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Carmine', last_name: 'Russo', email: 'lead+896113-416f0e0-1901@msg.energysage.com', street: '5 Simon Court', city: 'Farmingville', state: 'NY', postal_code: '11738', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Dave', last_name: 'Hershberg', email: 'lead+893206-5109d73-1901@msg.energysage.com', street: '15 Waterview Drive', city: 'Port Jefferson', state: 'NY', postal_code: '11777', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'len', last_name: 'licari', email: 'lead+897822-2d563c8-1901@msg.energysage.com', street: 'Gracewood Drive', city: 'Manhasset', state: 'NY', postal_code: '11030', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Alan', last_name: 'paz', email: 'lead+900879-7e41106-1901@msg.energysage.com', street: '86 Sycamore Circle', city: 'Stony Brook', state: 'NY', postal_code: '11790', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Michael', last_name: 'Ambrosino', email: 'lead+902515-4d0c412-1901@msg.energysage.com', street: '23 Woodacres Road', city: 'Glen Head', state: 'NY', postal_code: '11545', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Dan', last_name: 'Kern', email: 'lead+902708-e00b269-1901@msg.energysage.com', street: '73 Huntting Lane', city: 'East Hampton', state: 'NY', postal_code: '11937', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Serafino', last_name: 'Minardi', email: 'lead+902767-57d7616-1901@msg.energysage.com', street: '21 Park Place', city: 'Patchogue', state: 'NY', postal_code: '11772', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Jaipreet', last_name: 'Sodhi', email: 'lead+903267-caa0906-1901@msg.energysage.com', street: '30 Tinder Lane', city: 'Levittown', state: 'NY', postal_code: '11756', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Richard', last_name: 'Sanniola', email: 'lead+906646-5eee456-1901@msg.energysage.com', street: '2 Parsley Patch Lane', city: 'Center Moriches', state: 'NY', postal_code: '11934', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Jonathan', last_name: 'Song', email: 'lead+907205-e45dbe6-1901@msg.energysage.com', street: '221 Cold Spring Road', city: 'Syosset', state: 'NY', postal_code: '11791', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Amit', last_name: 'Trehan', email: 'lead+908643-fe00e87-1901@msg.energysage.com', street: '6 Ferncote Lane', city: 'Glen Head', state: 'NY', postal_code: '11545', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Matthew', last_name: 'Turk', email: 'lead+910054-87da764-1901@msg.energysage.com', street: '278 Sycamore Street', city: 'West Hempstead', state: 'NY', postal_code: '11552', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Jonathan', last_name: 'Bond', email: 'lead+910428-e0d9da8-1901@msg.energysage.com', street: '47 Bennetts Road', city: 'Setauket- East Setauket', state: 'NY', postal_code: '11733', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'sam', last_name: 'ashley', email: 'lead+911504-f4650d4-1901@msg.energysage.com', street: '18 Meadow Wood Lane', city: 'Farmingdale', state: 'NY', postal_code: '11735', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Maria', last_name: 'Lennon', email: 'lead+914204-a878761-1901@msg.energysage.com', street: '227 Houston Street', city: 'Lindenhurst', state: 'NY', postal_code: '11757', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'jef', last_name: 'hart', email: 'lead+915799-7df03b7-1901@msg.energysage.com', street: '230 Paulanna Avenue', city: 'Bayport', state: 'NY', postal_code: '11705', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Ann', last_name: 'Hannon', email: 'lead+916381-5352938-1901@msg.energysage.com', street: '33 Nassau Boulevard South', city: 'Garden City South', state: 'NY', postal_code: '11530', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Jp', last_name: 'Marcos', email: 'lead+916397-8f720bf-1901@msg.energysage.com', street: '9 Basket Neck Lane', city: 'Remsenburg-Speonk', state: 'NY', postal_code: '11960', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'kamran', last_name: 'bashir', email: 'lead+915963-d943796-1901@msg.energysage.com', street: '77 Heatherfield Road', city: 'Valley Stream', state: 'NY', postal_code: '11581', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Christine', last_name: 'Russo', email: 'lead+918077-2c99ace-1901@msg.energysage.com', street: '17 Amherst Road', city: 'West Sayville', state: 'NY', postal_code: '11796', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Yaara', last_name: 'Cohen', email: 'lead+918507-87864f6-1901@msg.energysage.com', street: '968 East End', city: 'Woodmere', state: 'NY', postal_code: '11598', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Francisco', last_name: 'Concepcion', email: 'lead+914555-8168d58-1901@msg.energysage.com', street: '29 Dunford St', city: 'Melville', state: 'NY', postal_code: '11747', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Gp', last_name: 'Nick', email: 'lead+920957-1b68c02-1901@msg.energysage.com', street: '77 County Court House Road', city: 'Garden City Park', state: 'NY', postal_code: '11040', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Robert', last_name: 'Kibort', email: 'lead+921123-f7a077f-1901@msg.energysage.com', street: '97 Crocus Avenue', city: 'Floral Park', state: 'NY', postal_code: '11001', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Michael', last_name: 'Arkin', email: 'lead+922979-b25cbe3-1901@msg.energysage.com', street: '209 Kamda Boulevard', city: 'New Hyde Park', state: 'NY', postal_code: '11040', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Mickey', last_name: 'Mouse', email: 'lead+922085-04efb09-1901@msg.energysage.com', street: '892 South 7th Street', city: 'Lindenhurst', state: 'NY', postal_code: '11757', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Ben', last_name: 'Bines', email: 'lead+924287-9020b28-1901@msg.energysage.com', street: '321 Lakeview Avenue East', city: 'Brightwaters', state: 'NY', postal_code: '11718', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Heetano', last_name: 'Shamsoondar', email: 'lead+924582-0df726e-1901@msg.energysage.com', street: '1318 Washington Avenue', city: 'New Hyde Park', state: 'NY', postal_code: '11040', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Harji', last_name: 'Singh', email: 'lead+930202-cdb5252-1901@msg.energysage.com', street: '6 Suzanne Lane', city: 'Bethpage', state: 'NY', postal_code: '11714', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Mario', last_name: 'Giordano', email: 'lead+932083-1b7b9c1-1901@msg.energysage.com', street: '240 Park Avenue', city: 'Lindenhurst', state: 'NY', postal_code: '11757', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Joel', last_name: 'Albinowski', email: 'lead+935545-07dbd69-1901@msg.energysage.com', street: '443 Carnation Drive', city: 'Shirley', state: 'NY', postal_code: '11967', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Michael', last_name: 'Viola', email: 'lead+938163-a457a8a-1901@msg.energysage.com', street: '7 Jaegger Drive', city: 'Glen Head', state: 'NY', postal_code: '11545', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Sarah', last_name: 'Sciacca', email: 'lead+944507-911f8b6-1901@msg.energysage.com', street: '47 Grover Lane', city: 'East Northport', state: 'NY', postal_code: '11731', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'hiyuma', last_name: 'withanachchi', email: 'lead+944626-441247e-1901@msg.energysage.com', street: '520 Lincoln Avenue', city: 'West Hempstead', state: 'NY', postal_code: '11552', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Daniel', last_name: 'Major', email: 'lead+945907-be360a7-1901@msg.energysage.com', street: '112 Ursula Drive', city: 'Roslyn', state: 'NY', postal_code: '11576', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Kyle', last_name: 'Manning', email: 'lead+945801-927a519-1901@msg.energysage.com', street: '259 Maryland Avenue', city: 'Freeport', state: 'NY', postal_code: '11520', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Jay', last_name: 'Lin', email: 'lead+946580-cb1bebc-1901@msg.energysage.com', street: '131 Lincoln Street', city: 'Garden City', state: 'NY', postal_code: '11530', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Joey', last_name: 'Cheng', email: 'lead+946845-20e7bff-1901@msg.energysage.com', street: '86 Karol Place', city: 'Jericho', state: 'NY', postal_code: '11753', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'vanessa', last_name: 'sev', email: 'lead+947479-2d8f6f0-1901@msg.energysage.com', street: '5 Thrush Drive', city: 'Brentwood', state: 'NY', postal_code: '11717', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Tim', last_name: 'Bautista', email: 'lead+948002-8940406-1901@msg.energysage.com', street: '534 Ocean Avenue', city: 'Massapequa', state: 'NY', postal_code: '11758', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Nicholas', last_name: 'Lattanzio', email: 'lead+948987-f2b67f7-1901@msg.energysage.com', street: '112 Wickham Road', city: 'Garden City', state: 'NY', postal_code: '11530', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Mark', last_name: 'Reyes', email: 'lead+955041-3cda196-1901@msg.energysage.com', street: '232 Frankel Boulevard', city: 'Merrick', state: 'NY', postal_code: '11566', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Jenan', last_name: 'Abdin', email: 'lead+955781-132fb7a-1901@msg.energysage.com', street: '304 Vincent Avenue', city: 'Lynbrook', state: 'NY', postal_code: '11563', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'James', last_name: 'Bianco', email: 'lead+955859-8495a6b-1901@msg.energysage.com', street: '67 Huntting Lane', city: 'East Hampton', state: 'NY', postal_code: '11937', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Anthony', last_name: 'Saccone', email: 'lead+956053-4b16aca-1901@msg.energysage.com', street: '58 Darling Avenue', city: 'Smithtown', state: 'NY', postal_code: '11787', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Paulie', last_name: 'Connor', email: 'lead+957302-ae5fa89-1901@msg.energysage.com', street: '1375 Liberty Avenue', city: 'North Bellmore', state: 'NY', postal_code: '11710', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Alvin', last_name: 'Khaled', email: 'lead+956931-e49db0c-1901@msg.energysage.com', street: '1384 Illinois Avenue', city: 'Bay Shore', state: 'NY', postal_code: '11706', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'BRIAN', last_name: 'BISRAM', email: 'lead+956780-aba4d19-1901@msg.energysage.com', street: '22 Russell Street', city: 'Manorville', state: 'NY', postal_code: '11949', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: '[not provided]', last_name: '', lead_source: 'Sunchain Energy', status: 'Open' },
  { first_name: 'Mitra', last_name: 'Nazarian', email: 'lead+958153-38df8bd-1901@msg.energysage.com', street: '8 Park Drive East', city: 'Old Westbury', state: 'NY', postal_code: '11568', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Chris', last_name: 'ang', email: 'lead+959271-5ccbc34-1901@msg.energysage.com', street: '80 Sycamore Street', city: 'Massapequa', state: 'NY', postal_code: '11758', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Max', last_name: 'Fury', email: 'lead+959181-e5a8940-1901@msg.energysage.com', street: '20 Horseshoe Road', city: 'Old Westbury', state: 'NY', postal_code: '11568', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Dennis', last_name: 'Someck', email: 'lead+959972-cdd7cc7-1901@msg.energysage.com', street: '19 Deer Ridge Trail', city: 'Water Mill', state: 'NY', postal_code: '11976', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Latoya', last_name: 'Robinson', email: 'lead+960112-21dd71b-1901@msg.energysage.com', street: '7 Windsor Court', city: 'Coram', state: 'NY', postal_code: '11727', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'greg', last_name: 'vanwhy', email: 'lead+961768-f9e2755-1901@msg.energysage.com', street: '77 Sycamore St', city: 'Massapequa', state: 'NY', postal_code: '11758', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Samuel', last_name: 'Nyamekye', email: 'lead+963341-c05610c-1901@msg.energysage.com', street: '57 Ann Drive South', city: 'Freeport', state: 'NY', postal_code: '11520', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Mario', last_name: 'Robles', email: 'lead+964585-aefa34a-1901@msg.energysage.com', street: '35 Gores Drive', city: 'Mastic', state: 'NY', postal_code: '11950', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Michelle', last_name: 'Kim', email: 'lead+964597-e9e76cc-1901@msg.energysage.com', street: '22 Lenore Avenue', city: 'Hicksville', state: 'NY', postal_code: '11801', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'ed', last_name: 'kacz', email: 'lead+964711-c133e99-1901@msg.energysage.com', street: '113 North Side Road', city: 'Wading River', state: 'NY', postal_code: '11792', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Lisa', last_name: 'Lisa', email: 'lead+966470-422af8b-1901@msg.energysage.com', street: '34 Hunter Avenue', city: 'Miller Place', state: 'NY', postal_code: '11764', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Steven', last_name: 'Peterseb', email: 'lead+966607-4b21a0d-1901@msg.energysage.com', street: '50 Dolores Place', city: 'Malverne', state: 'NY', postal_code: '11565', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Frances', last_name: 'Whittelsey', email: 'lead+967132-f1e2c92-1901@msg.energysage.com', street: '50 Summit Drive', city: 'Huntington', state: 'NY', postal_code: '11743', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Azaan', last_name: 'Butt', email: 'lead+967740-21e2372-1901@msg.energysage.com', street: '30 South Montgomery Street', city: 'Valley Stream', state: 'NY', postal_code: '11580', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'testlead', last_name: 'testlead', email: 'testlead7772@testlead.com', phone: '(888) 777-7772', street: 'testlead', postal_code: '93063', lead_source: 'Rocket Leads', status: 'Open' },
  { first_name: 'test', last_name: 'test', email: 'test7773@test.com', phone: '(888) 777-7773', street: 'test', postal_code: '93063', lead_source: 'Rocket Leads', status: 'Open' },
  { first_name: 'Roger', last_name: 'Lao', email: 'lead+841778-c6c8f8c-1901@msg.energysage.com', street: '1 Empire Court', city: 'Dix Hills', state: 'NY', postal_code: '11746', county: 'Suffolk', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Sam', last_name: 'Rosenthal', email: 'lead+968380-07e544f-1901@msg.energysage.com', street: '1079 Maple Lane', city: 'Queens', state: 'NY', postal_code: '11040', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Shirley', last_name: 'Ghatan', email: 'lead+970315-a0736cb-1901@msg.energysage.com', street: '41 Tara Drive', city: 'Roslyn', state: 'NY', postal_code: '11576', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' },
  { first_name: 'Greg', last_name: 'Zammit', email: 'lead+971056-4582f02-1901@msg.energysage.com', street: '53 Melanie Lane', city: 'Syosset', state: 'NY', postal_code: '11791', county: 'Nassau', lead_source: 'EnergySage', status: 'Open' }
];

let inserted = 0;
let errors = 0;

for (const lead of leads) {
  const leadData = {
    organization_id: orgId,
    owner_id: userId,
    first_name: lead.first_name,
    last_name: lead.last_name,
    email: lead.email || null,
    phone: lead.phone || null,
    street: lead.street || null,
    city: lead.city || null,
    state: lead.state || null,
    postal_code: lead.postal_code || null,
    county: lead.county || null,
    lead_source: lead.lead_source,
    status: 'New'
  };

  const { error } = await supabase.from('leads').insert(leadData);

  if (error) {
    console.error(`❌ ${lead.first_name} ${lead.last_name} - ${error.message}`);
    errors++;
  } else {
    inserted++;
    if (inserted % 10 === 0) {
      console.log(`✅ ${inserted} leads inserted...`);
    }
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ COMPLETE!');
console.log(`   Inserted: ${inserted} leads`);
console.log(`   Errors: ${errors} leads`);
console.log('='.repeat(60));
