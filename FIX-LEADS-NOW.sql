-- Get organization ID and insert all leads
DO $$
DECLARE
  org_id uuid;
BEGIN
  -- Get first organization
  SELECT id INTO org_id FROM organizations LIMIT 1;
  
  -- Insert all leads
  INSERT INTO leads (first_name, last_name, email, street, state, city, zip_postal_code, county, primary_phone, lead_status, lead_source, created_by_alias, country, organization_id) VALUES
  ('Paul', 'Fodor', 'lead+827090-507ac90-1901@msg.energysage.com', '22 Bobcat Lane', 'NY', 'Setauket- East Setauket', '11733', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Sherry', 'Cirilo', 'lead+826736-48f47fa-1901@msg.energysage.com', '772 Delafield Avenue', 'NY', 'Staten Island', '10310', 'Richmond', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Tem', 'Tash', 'lead+826386-c48c385-1901@msg.energysage.com', '53-19 96th Street', 'NY', 'Queens', '11368', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Sandi', 'Ford', 'lead+826353-801c540-1901@msg.energysage.com', '86 Sterling Street', 'NY', 'Brooklyn', '11225', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('George', 'McKee', 'lead+824045-0d14983-1901@msg.energysage.com', '1 Old North Highway', 'NY', 'Hampton Bays', '11946', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Rizi', 'Karim', 'lead+825834-ca82c78-1901@msg.energysage.com', '101-36 130th Street', 'NY', 'Queens', '11419', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Eric', 'Giedd', 'lead+825744-c0dd75e-1901@msg.energysage.com', '124 Plymouth Boulevard', 'NY', 'Smithtown', '11787', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Wei', 'Yn', 'lead+827267-53fb1b0-1901@msg.energysage.com', '51A Warwick Road', 'NY', 'Great Neck', '11023', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Jose', 'Martinez', 'lead+825466-df3136f-1901@msg.energysage.com', '482 Montauk Hwy', 'NY', 'East Moriches', '11940', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Michael', 'Cassidy', 'lead+824504-0f588cd-1901@msg.energysage.com', '16 West Raleigh Avenue', 'NY', 'Staten Island', '10310', 'Richmond', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Leonid', 'Ostromukhov', 'lead+824532-b994ea3-1901@msg.energysage.com', '2137 East 28th Street', 'NY', 'Brooklyn', '11229', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Stan', 'Gang', 'lead+823590-daf82cf-1901@msg.energysage.com', '26-31 210th Pl', 'NY', 'Queens', '11360', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Brian', 'Leonard', 'lead+823205-58bc130-1901@msg.energysage.com', '1349 81 St', 'NY', 'Brooklyn', '11228', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Ursula', 'Sanchez', 'lead+820918-53c7b62-1901@msg.energysage.com', '36 Lawton Street', 'NY', 'Brooklyn', '11221', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Yatin', 'Patel', 'lead+820380-929f8f5-1901@msg.energysage.com', '266-04 83rd Avenue', 'NY', 'Queens', '11004', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Michael', 'Chu', 'lead+819421-a783c9d-1901@msg.energysage.com', '7 Christine Court', 'NY', 'Staten Island', '10312', 'Richmond', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Michelle', 'Jiang', 'lead+828060-da12196-1901@msg.energysage.com', '43 Greenway East', 'NY', 'New Hyde Park', '11040', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Michael', 'Lemieszewski', 'lead+828720-9b6090f-1901@msg.energysage.com', '3639 Hunt Rd', 'NY', 'Wantagh', '11793', 'Nassau', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Sean', 'Hunter', 'lead+833052-3af698a-1901@msg.energysage.com', '42 Club Lane', 'NY', 'Remsenburg-Speonk', '11960', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Dennis', 'Caba', 'lead+834141-8f4707b-1901@msg.energysage.com', '93-33 Eldert Lane', 'NY', 'Queens', '11421', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Nazary', 'Nebeluk', 'lead+830909-4bea215-1901@msg.energysage.com', '9 Elson Street', 'NY', 'Staten Island', '10314', 'Richmond', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('rabjot', 'gill', 'lead+834317-47c047a-1901@msg.energysage.com', '161 Radcliff Road', 'NY', 'Staten Island', '10305', 'Richmond', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Elizabeth', 'Polanco', 'lead+830419-d665273-1901@msg.energysage.com', '276 Delafield Avenue', 'NY', 'Staten Island', '10310', 'Richmond', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Anthony', 'Accardo', 'lead+835019-62587cb-1901@msg.energysage.com', '1974 74th Street', 'NY', 'Brooklyn', '11204', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Alice', 'Newkirk', 'lead+830827-faf87eb-1901@msg.energysage.com', '31-14 48th Street', 'NY', 'Queens', '11103', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Frank', 'Craparotta', 'lead+848046-c0129d6-1901@msg.energysage.com', '3008 Rhode Island Avenue', 'NY', 'Medford', '11763', 'Suffolk', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Bruce', 'Wayne', 'batman@gmail.com', '5321 S. Bat St', 'NY', 'Gotham', '26325', NULL, '(696) 532-9876', 'Open', 'Three Ships', 'RYau', 'USA', org_id),
  ('Matt', 'Holly', 'lead+856091-0635946-1901@msg.energysage.com', '13 West Clearwater Road', 'NY', 'Lindenhurst', '11757', 'Suffolk', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Timothy', 'McDonagh', 'lead+855852-10291ec-1901@msg.energysage.com', '20 Groton Drive', 'NY', 'Port Jefferson Station', '11776', 'Suffolk', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Felix', 'Chu', 'lead+859533-b73fb64-1901@msg.energysage.com', '45 Lake Dr', 'NY', 'New Hyde Park', '11040', 'Nassau', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Stephen', 'Joester', 'lead+859792-e00749d-1901@msg.energysage.com', '401 Mecox Road', 'NY', 'Water Mill', '11976', 'Suffolk', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Mark', 'Gosdigian', 'lead+860010-b895388-1901@msg.energysage.com', '18 Blinker Light Road', 'NY', 'Stony Brook', '11790', 'Suffolk', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Anthony', 'Aurisano', 'lead+860355-e97e70b-1901@msg.energysage.com', '42 Moriches Drive', 'NY', 'Mastic Beach', '11951', 'Suffolk', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Testlead', 'Testlead', 'Testlead@testlead.com', NULL, NULL, NULL, NULL, NULL, '(805) 999-4613', 'Open', 'Rocket Leads', 'RYau', 'USA', org_id),
  ('Kevin', 'Holloway', 'lead+860455-34a540f-1901@msg.energysage.com', '1 Gina Court', 'NY', 'Nesconset', '11767', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Bosch', 'Tiena', 'lead+860922-72cd8e0-1901@msg.energysage.com', '404 Washington Avenue', 'NY', 'Bellmore', '11710', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Jennifer', 'Alfonso-Zea', 'lead+862445-3971faa-1901@msg.energysage.com', '67 Hiddink Street', 'NY', 'Sayville', '11782', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Eric', 'Swike', 'lead+862914-5a216f3-1901@msg.energysage.com', '9 Bayberry Lane', 'NY', 'Stony Brook', '11790', 'Nassau', NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Yes', 'Homeowner', 'Test@testlead.com', NULL, NULL, NULL, '91733', NULL, '(818) 555-6969', 'Open', 'Rocket Leads', 'RYau', 'USA', org_id),
  ('Mary', 'George', 'lead+863096-ef0137f-1901@msg.energysage.com', '2554 6th Avenue', 'NY', 'East Meadow', '11554', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Dawn', 'Tufano', 'lead+863378-98d9e41-1901@msg.energysage.com', '320 Everit Avenue', 'NY', 'Hewlett', '11557', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Mike', 'DeMarino', 'lead+863478-0ee7df2-1901@msg.energysage.com', '58 Laurelton Drive', 'NY', 'Mastic Beach', '11951', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Brandon', 'Jones', 'lead+863877-abe98a3-1901@msg.energysage.com', '3244 Perry Avenue', 'NY', 'Oceanside', '11572', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Raheem', 'Isom', 'lead+865036-61e3dcb-1901@msg.energysage.com', '176 Allen Street', 'NY', 'Hempstead', '11550', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Jack', 'Grein', 'lead+865330-e7e0114-1901@msg.energysage.com', '127 Bellmore St', 'NY', 'Floral Park', '11001', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('John T.', 'Douglas', 'lead+865534-670128b-1901@msg.energysage.com', '2770 Linwood Avenue', 'NY', 'North Bellmore', '11710', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Dan', 'Cavuoto', 'lead+865750-0f267ed-1901@msg.energysage.com', '2009 New Hyde Park Road', 'NY', 'New Hyde Park', '11040', NULL, NULL, 'Open', 'EnergySage', 'RYau', 'USA', org_id),
  ('Ronald', 'Plumley', 'lead+991621-63b3389-1901@msg.energysage.com', '109 Edmonton Lane', 'FL', 'Brandon', '33511', NULL, NULL, 'Disqualified', 'EnergySage', 'ITSup', 'USA', org_id),
  ('Robert', 'White', 'lead+995005-9959851-1901@msg.energysage.com', '4001 West Bay Avenue', 'FL', 'Tampa', '33616', NULL, NULL, 'Disqualified', 'EnergySage', 'ITSup', 'USA', org_id),
  ('Chaitanya', 'Kolla', 'lead+995312-5e75b3b-1901@msg.energysage.com', '28328 Forelli Court', 'FL', 'Wesley Chapel', '33543', NULL, NULL, 'Disqualified', 'EnergySage', 'ITSup', 'USA', org_id),
  ('Christine', 'Fiechter', 'lead+995585-945a490-1901@msg.energysage.com', '481 Pine Warbler Way North', 'FL', 'Palm Harbor', '34683', NULL, NULL, 'Disqualified', 'EnergySage', 'ITSup', 'USA', org_id);
  
  RAISE NOTICE 'Inserted 50 leads successfully!';
END $$;
