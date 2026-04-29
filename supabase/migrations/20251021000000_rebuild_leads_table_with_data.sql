/*
  # Rebuild Leads Table with All Data

  1. Drop existing leads table completely
  2. Recreate with simplified schema (no organization requirement)
  3. Insert all 200+ leads from Salesforce export
  4. Enable RLS with permissive policies for initial setup
*/

-- Drop existing table
DROP TABLE IF EXISTS leads CASCADE;

-- Create simplified leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Name fields
  first_name text,
  last_name text,

  -- Contact fields
  email text UNIQUE,
  primary_phone text,
  mobile_phone text,

  -- Address fields
  street text,
  city text,
  state text,
  zip_postal_code text,
  county text,
  country text DEFAULT 'USA',

  -- Business fields
  company text,
  title text,

  -- Lead management
  lead_status text DEFAULT 'Open',
  lead_source text,
  other_source text,
  type_of_installation text,
  created_by_alias text,

  -- Dates
  created_date date,

  -- System fields
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_leads_status ON leads(lead_status);
CREATE INDEX idx_leads_source ON leads(lead_source);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated users
CREATE POLICY "Anyone can view leads"
  ON leads FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (true);

-- Insert all leads data
INSERT INTO leads (first_name, last_name, email, primary_phone, street, city, state, zip_postal_code, county, lead_status, lead_source, other_source, created_by_alias, created_date) VALUES
('Paul', 'Fodor', 'lead+827090-507ac90-1901@msg.energysage.com', NULL, '22 Bobcat Lane', 'Setauket- East Setauket', 'NY', '11733', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Sherry', 'Cirilo', 'lead+826736-48f47fa-1901@msg.energysage.com', NULL, '772 Delafield Avenue', 'Staten Island', 'NY', '10310', 'Richmond', 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Tem', 'Tash', 'lead+826386-c48c385-1901@msg.energysage.com', NULL, '53-19 96th Street', 'Queens', 'NY', '11368', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Sandi', 'Ford', 'lead+826353-801c540-1901@msg.energysage.com', NULL, '86 Sterling Street', 'Brooklyn', 'NY', '11225', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('George', 'McKee', 'lead+824045-0d14983-1901@msg.energysage.com', NULL, '1 Old North Highway', 'Hampton Bays', 'NY', '11946', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Rizi', 'Karim', 'lead+825834-ca82c78-1901@msg.energysage.com', NULL, '101-36 130th Street', 'Queens', 'NY', '11419', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Eric', 'Giedd', 'lead+825744-c0dd75e-1901@msg.energysage.com', NULL, '124 Plymouth Boulevard', 'Smithtown', 'NY', '11787', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Wei', 'Yn', 'lead+827267-53fb1b0-1901@msg.energysage.com', NULL, '51A Warwick Road', 'Great Neck', 'NY', '11023', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Jose', 'Martinez', 'lead+825466-df3136f-1901@msg.energysage.com', NULL, '482 Montauk Hwy', 'East Moriches', 'NY', '11940', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Michael', 'Cassidy', 'lead+824504-0f588cd-1901@msg.energysage.com', NULL, '16 West Raleigh Avenue', 'Staten Island', 'NY', '10310', 'Richmond', 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Leonid', 'Ostromukhov', 'lead+824532-b994ea3-1901@msg.energysage.com', NULL, '2137 East 28th Street', 'Brooklyn', 'NY', '11229', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Stan', 'Gang', 'lead+823590-daf82cf-1901@msg.energysage.com', NULL, '26-31 210th Pl', 'Queens', 'NY', '11360', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Brian', 'Leonard', 'lead+823205-58bc130-1901@msg.energysage.com', NULL, '1349 81 St', 'Brooklyn', 'NY', '11228', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Ursula', 'Sanchez', 'lead+820918-53c7b62-1901@msg.energysage.com', NULL, '36 Lawton Street', 'Brooklyn', 'NY', '11221', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Yatin', 'Patel', 'lead+820380-929f8f5-1901@msg.energysage.com', NULL, '266-04 83rd Avenue', 'Queens', 'NY', '11004', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Michael', 'Chu', 'lead+819421-a783c9d-1901@msg.energysage.com', NULL, '7 Christine Court', 'Staten Island', 'NY', '10312', 'Richmond', 'Open', 'EnergySage', NULL, 'RYau', '2022-09-06'),
('Michelle', 'Jiang', 'lead+828060-da12196-1901@msg.energysage.com', NULL, '43 Greenway East', 'New Hyde Park', 'NY', '11040', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-07'),
('Michael', 'Lemieszewski', 'lead+828720-9b6090f-1901@msg.energysage.com', NULL, '3639 Hunt Rd', 'Wantagh', 'NY', '11793', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2022-09-08'),
('Sean', 'Hunter', 'lead+833052-3af698a-1901@msg.energysage.com', NULL, '42 Club Lane', 'Remsenburg-Speonk', 'NY', '11960', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-14'),
('Dennis', 'Caba', 'lead+834141-8f4707b-1901@msg.energysage.com', NULL, '93-33 Eldert Lane', 'Queens', 'NY', '11421', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-20'),
('Nazary', 'Nebeluk', 'lead+830909-4bea215-1901@msg.energysage.com', NULL, '9 Elson Street', 'Staten Island', 'NY', '10314', 'Richmond', 'Open', 'EnergySage', NULL, 'RYau', '2022-09-20'),
('rabjot', 'gill', 'lead+834317-47c047a-1901@msg.energysage.com', NULL, '161 Radcliff Road', 'Staten Island', 'NY', '10305', 'Richmond', 'Open', 'EnergySage', NULL, 'RYau', '2022-09-20'),
('Elizabeth', 'Polanco', 'lead+830419-d665273-1901@msg.energysage.com', NULL, '276 Delafield Avenue', 'Staten Island', 'NY', '10310', 'Richmond', 'Open', 'EnergySage', NULL, 'RYau', '2022-09-20'),
('Anthony', 'Accardo', 'lead+835019-62587cb-1901@msg.energysage.com', NULL, '1974 74th Street', 'Brooklyn', 'NY', '11204', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-20'),
('Alice', 'Newkirk', 'lead+830827-faf87eb-1901@msg.energysage.com', NULL, '31-14 48th Street', 'Queens', 'NY', '11103', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-09-20'),
('Frank', 'Craparotta', 'lead+848046-c0129d6-1901@msg.energysage.com', NULL, '3008 Rhode Island Avenue', 'Medford', 'NY', '11763', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2022-10-12'),
('Bruce', 'Wayne', 'batman@gmail.com', '(696) 532-9876', '5321 S. Bat St', 'Gotham', 'NY', '26325', NULL, 'Open', 'Three Ships', NULL, 'RYau', '2022-10-21'),
('Matt', 'Holly', 'lead+856091-0635946-1901@msg.energysage.com', NULL, '13 West Clearwater Road', 'Lindenhurst', 'NY', '11757', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2022-10-28'),
('Timothy', 'McDonagh', 'lead+855852-10291ec-1901@msg.energysage.com', NULL, '20 Groton Drive', 'Port Jefferson Station', 'NY', '11776', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2022-10-28'),
('Felix', 'Chu', 'lead+859533-b73fb64-1901@msg.energysage.com', NULL, '45 Lake Dr', 'New Hyde Park', 'NY', '11040', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2022-11-06'),
('Stephen', 'Joester', 'lead+859792-e00749d-1901@msg.energysage.com', NULL, '401 Mecox Road', 'Water Mill', 'NY', '11976', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2022-11-07'),
('Mark', 'Gosdigian', 'lead+860010-b895388-1901@msg.energysage.com', NULL, '18 Blinker Light Road', 'Stony Brook', 'NY', '11790', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2022-11-07'),
('Anthony', 'Aurisano', 'lead+860355-e97e70b-1901@msg.energysage.com', NULL, '42 Moriches Drive', 'Mastic Beach', 'NY', '11951', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2022-11-08'),
('Testlead', 'Testlead', 'Testlead@testlead.com', '(805) 999-4613', NULL, NULL, NULL, NULL, NULL, 'Open', 'Rocket Leads', NULL, 'RYau', '2022-11-08'),
('Kevin', 'Holloway', 'lead+860455-34a540f-1901@msg.energysage.com', NULL, '1 Gina Court', 'Nesconset', 'NY', '11767', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-09'),
('Bosch', 'Tiena', 'lead+860922-72cd8e0-1901@msg.energysage.com', NULL, '404 Washington Avenue', 'Bellmore', 'NY', '11710', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-10'),
('Jennifer', 'Alfonso-Zea', 'lead+862445-3971faa-1901@msg.energysage.com', NULL, '67 Hiddink Street', 'Sayville', 'NY', '11782', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-14'),
('Eric', 'Swike', 'lead+862914-5a216f3-1901@msg.energysage.com', NULL, '9 Bayberry Lane', 'Stony Brook', 'NY', '11790', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2022-11-15'),
('Yes', 'Homeowner', 'Test@testlead.com', '(818) 555-6969', NULL, NULL, NULL, '91733', NULL, 'Open', 'Rocket Leads', NULL, 'RYau', '2022-11-15'),
('Mary', 'George', 'lead+863096-ef0137f-1901@msg.energysage.com', NULL, '2554 6th Avenue', 'East Meadow', 'NY', '11554', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-16'),
('Dawn', 'Tufano', 'lead+863378-98d9e41-1901@msg.energysage.com', NULL, '320 Everit Avenue', 'Hewlett', 'NY', '11557', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-16'),
('Mike', 'DeMarino', 'lead+863478-0ee7df2-1901@msg.energysage.com', NULL, '58 Laurelton Drive', 'Mastic Beach', 'NY', '11951', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-17'),
('Brandon', 'Jones', 'lead+863877-abe98a3-1901@msg.energysage.com', NULL, '3244 Perry Avenue', 'Oceanside', 'NY', '11572', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-17'),
('Raheem', 'Isom', 'lead+865036-61e3dcb-1901@msg.energysage.com', NULL, '176 Allen Street', 'Hempstead', 'NY', '11550', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-20'),
('Jack', 'Grein', 'lead+865330-e7e0114-1901@msg.energysage.com', NULL, '127 Bellmore St', 'Floral Park', 'NY', '11001', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-21'),
('John T.', 'Douglas', 'lead+865534-670128b-1901@msg.energysage.com', NULL, '2770 Linwood Avenue', 'North Bellmore', 'NY', '11710', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-21'),
('Dan', 'Cavuoto', 'lead+865750-0f267ed-1901@msg.energysage.com', NULL, '2009 New Hyde Park Road', 'New Hyde Park', 'NY', '11040', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-22'),
('Robert', 'Grasberger', 'lead+621350-bdf80ea-1901@msg.energysage.com', NULL, '85 Old Northwest Road', 'East Hampton', 'NY', '11937', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-25'),
('My', 'Name', 'lead+867395-d7d9bd8-1901@msg.energysage.com', NULL, '22 Circle Drive', 'Shoreham', 'NY', '11786', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-30'),
('Beatriz', 'Ramirez', 'lead+868096-736b740-1901@msg.energysage.com', NULL, '9 Mohawk Place', 'Selden', 'NY', '11784', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-30'),
('Rob', 'Schneider', 'lead+868142-0fd481c-1901@msg.energysage.com', NULL, '78 Wildwood Road', 'Sag Harbor', 'NY', '11963', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-11-30'),
('Richard', 'Moriarty', 'lead+873301-91bd65d-1901@msg.energysage.com', NULL, '30 Lonni Lane', 'Smithtown', 'NY', '11787', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-12-14'),
('Gage', 'Mersereau', 'lead+875821-8f8493e-1901@msg.energysage.com', NULL, '111 East Shore Drive', 'Babylon', 'NY', '11702', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-12-21'),
('Sean', 'Wilson', 'lead+875574-46ccc91-1901@msg.energysage.com', NULL, '40 Westmoreland Dr', 'Shelter Island', 'NY', '11965', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2022-12-21'),
('John', 'Grossmann', 'lead+876401-e53ee68-1901@msg.energysage.com', NULL, '62 Hollywood Avenue', 'Massapequa', 'NY', '11758', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-12-22'),
('Jessica', 'Perez', 'lead+876460-7dd3654-1901@msg.energysage.com', NULL, '503 5th Avenue', 'East Northport', 'NY', '11731', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-12-22'),
('Sven', 'Herrmann', 'lead+876423-68319a1-1901@msg.energysage.com', NULL, '116 Nadia Court', 'Port Jefferson', 'NY', '11777', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-12-22'),
('Thomas', 'Kane', 'lead+878048-714b643-1901@msg.energysage.com', NULL, '163 Harbor Beach Road', 'Manhattan', 'NY', '11766', NULL, 'Open', 'EnergySage', NULL, 'RYau', '2022-12-27'),
('testlead', '[not provided]', 'test@testlead.com', '(888) 555-1110', '1234 Main St.', NULL, NULL, '91324', NULL, 'Open', 'Rocket Leads', NULL, 'RYau', '2022-12-30'),
('Thomas', 'Ar', 'lead+880713-0781510-1901@msg.energysage.com', NULL, '18 Night Heron Drive', 'Stony Brook', 'NY', '11790', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-03'),
('Jessica', 'Wolfarth', 'lead+881327-3f8b847-1901@msg.energysage.com', NULL, '3770 Verleye Street', 'Seaford', 'NY', '11783', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-03'),
('Anna', 'Dinkins', 'lead+870735-6e16cc1-1901@msg.energysage.com', NULL, '249 Yaphank Avenue', 'Yaphank', 'NY', '11980', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-03'),
('Sheri', 'Whitley', 'lead+879745-980e2b3-1901@msg.energysage.com', NULL, '43 Overlook Drive', 'Mastic', 'NY', '11950', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-06'),
('Brian', 'Valdez', 'lead+883974-2365b9a-1901@msg.energysage.com', NULL, '8 Island Bay Avenue', 'Middle Island', 'NY', '11953', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-07'),
('Jo Ann', 'Sutton', 'lead+885575-2bb349c-1901@msg.energysage.com', NULL, '62A Tamarack Street', 'East Northport', 'NY', '11731', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-10'),
('Peter', 'Feldman', 'lead+885629-4f234b4-1901@msg.energysage.com', NULL, '44 Abrahams Landing Road', 'Amagansett', 'NY', '11930', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-10'),
('Stephanie', 'Stahl', 'lead+885485-c53ba85-1901@msg.energysage.com', NULL, '8 Little Ram Island Drive', 'Shelter Island', 'NY', '11964', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-12'),
('Vinny', 'Cerullo', 'lead+886901-ac4d686-1901@msg.energysage.com', NULL, '377 Auborn Avenue', 'Shirley', 'NY', '11967', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-12'),
('R.', 'McCabe', 'lead+887549-9e973a1-1901@msg.energysage.com', NULL, '34 Ferry Road', 'Sag Harbor', 'NY', '11963', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-13'),
('Peter', 'Stratoudakis', 'lead+888401-9d146b6-1901@msg.energysage.com', NULL, '229 Park Avenue', 'Williston Park', 'NY', '11596', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-15'),
('Arman', 'Ozgun', 'lead+888980-ce50cf7-1901@msg.energysage.com', NULL, '52 Ely Brook Road', 'East Hampton', 'NY', '11937', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-16'),
('Adam', 'Smith', 'lead+889046-f9b6589-1901@msg.energysage.com', NULL, '543 Nassau Avenue', 'Freeport', 'NY', '11520', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-16'),
('Jeorge', 'Klein', 'lead+889066-a954516-1901@msg.energysage.com', NULL, '258 Mill Lane', 'Gordon Heights', 'NY', '11953', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-16'),
('Mark', 'Furman', 'lead+889482-e993a8b-1901@msg.energysage.com', NULL, '377 Lewis Street', 'West Hempstead', 'NY', '11552', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-16'),
('Jay', 'ass', 'lead+889883-a923f6c-1901@msg.energysage.com', NULL, '24 McCulloch Dr', 'Dix Hills', 'NY', '11746', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-18'),
('Dennis', 'Mendez', 'lead+891170-f05a2c5-1901@msg.energysage.com', NULL, '143 Leverich Street', 'Hempstead', 'NY', '11550', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-18'),
('gary', 'lerner', 'lead+885136-0bb36c8-1901@msg.energysage.com', NULL, '18 Wood Ln', 'Woodmere', 'NY', '11598', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-20'),
('Liza', 'Dorado', 'lead+892399-e6c773e-1901@msg.energysage.com', NULL, '215 Bryant Avenue', 'Floral Park', 'NY', '11001', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-20'),
('Michael', 'Dobie', 'lead+892128-f40d2cb-1901@msg.energysage.com', NULL, '74 Avenue B', 'West Babylon', 'NY', '11704', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-20'),
('Robert', 'gonzaloz', 'lead+893968-e1b0757-1901@msg.energysage.com', NULL, '3 Albert Road', 'Amityville', 'NY', '11701', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-23'),
('massif', 'cadf', 'lead+893754-bdce3bc-1901@msg.energysage.com', NULL, '2340 Westlake Court', 'Oceanside', 'NY', '11572', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-23'),
('barbara', 'zimet', 'lead+893214-6b5cd5e-1901@msg.energysage.com', NULL, '27 Mitchell Road', 'Westhampton Beach', 'NY', '11978', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-23'),
('Carmine', 'Russo', 'lead+896113-416f0e0-1901@msg.energysage.com', NULL, '5 Simon Court', 'Farmingville', 'NY', '11738', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-25'),
('Dave', 'Hershberg', 'lead+893206-5109d73-1901@msg.energysage.com', NULL, '15 Waterview Drive', 'Port Jefferson', 'NY', '11777', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-25'),
('len', 'licari', 'lead+897822-2d563c8-1901@msg.energysage.com', NULL, 'Gracewood Drive', 'Manhasset', 'NY', '11030', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-27'),
('Alan', 'paz', 'lead+900879-7e41106-1901@msg.energysage.com', NULL, '86 Sycamore Circle', 'Stony Brook', 'NY', '11790', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-01-31'),
('Michael', 'Ambrosino', 'lead+902515-4d0c412-1901@msg.energysage.com', NULL, '23 Woodacres Road', 'Glen Head', 'NY', '11545', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-02'),
('Dan', 'Kern', 'lead+902708-e00b269-1901@msg.energysage.com', NULL, '73 Huntting Lane', 'East Hampton', 'NY', '11937', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-02'),
('Serafino', 'Minardi', 'lead+902767-57d7616-1901@msg.energysage.com', NULL, '21 Park Place', 'Patchogue', 'NY', '11772', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-02'),
('Jaipreet', 'Sodhi', 'lead+903267-caa0906-1901@msg.energysage.com', NULL, '30 Tinder Lane', 'Levittown', 'NY', '11756', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-03'),
('Richard', 'Sanniola', 'lead+906646-5eee456-1901@msg.energysage.com', NULL, '2 Parsley Patch Lane', 'Center Moriches', 'NY', '11934', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-07'),
('Jonathan', 'Song', 'lead+907205-e45dbe6-1901@msg.energysage.com', NULL, '221 Cold Spring Road', 'Syosset', 'NY', '11791', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-09'),
('Amit', 'Trehan', 'lead+908643-fe00e87-1901@msg.energysage.com', NULL, '6 Ferncote Lane', 'Glen Head', 'NY', '11545', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-10'),
('Matthew', 'Turk', 'lead+910054-87da764-1901@msg.energysage.com', NULL, '278 Sycamore Street', 'West Hempstead', 'NY', '11552', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-12'),
('Jonathan', 'Bond', 'lead+910428-e0d9da8-1901@msg.energysage.com', NULL, '47 Bennetts Road', 'Setauket- East Setauket', 'NY', '11733', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-13'),
('sam', 'ashley', 'lead+911504-f4650d4-1901@msg.energysage.com', NULL, '18 Meadow Wood Lane', 'Farmingdale', 'NY', '11735', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-14'),
('Maria', 'Lennon', 'lead+914204-a878761-1901@msg.energysage.com', NULL, '227 Houston Street', 'Lindenhurst', 'NY', '11757', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-17'),
('jef', 'hart', 'lead+915799-7df03b7-1901@msg.energysage.com', NULL, '230 Paulanna Avenue', 'Bayport', 'NY', '11705', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-21'),
('Ann', 'Hannon', 'lead+916381-5352938-1901@msg.energysage.com', NULL, '33 Nassau Boulevard South', 'Garden City South', 'NY', '11530', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-21'),
('Jp', 'Marcos', 'lead+916397-8f720bf-1901@msg.energysage.com', NULL, '9 Basket Neck Lane', 'Remsenburg-Speonk', 'NY', '11960', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-21'),
('kamran', 'bashir', 'lead+915963-d943796-1901@msg.energysage.com', NULL, '77 Heatherfield Road', 'Valley Stream', 'NY', '11581', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-21'),
('Christine', 'Russo', 'lead+918077-2c99ace-1901@msg.energysage.com', NULL, '17 Amherst Road', 'West Sayville', 'NY', '11796', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-22'),
('Yaara', 'Cohen', 'lead+918507-87864f6-1901@msg.energysage.com', NULL, '968 East End', 'Woodmere', 'NY', '11598', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-23'),
('Francisco', 'Concepcion', 'lead+914555-8168d58-1901@msg.energysage.com', NULL, '29 Dunford St', 'Melville', 'NY', '11747', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-23'),
('Gp', 'Nick', 'lead+920957-1b68c02-1901@msg.energysage.com', NULL, '77 County Court House Road', 'Garden City Park', 'NY', '11040', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-27'),
('Robert', 'Kibort', 'lead+921123-f7a077f-1901@msg.energysage.com', NULL, '97 Crocus Avenue', 'Floral Park', 'NY', '11001', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-02-27'),
('Michael', 'Arkin', 'lead+922979-b25cbe3-1901@msg.energysage.com', NULL, '209 Kamda Boulevard', 'New Hyde Park', 'NY', '11040', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-03-01'),
('Mickey', 'Mouse', 'lead+922085-04efb09-1901@msg.energysage.com', NULL, '892 South 7th Street', 'Lindenhurst', 'NY', '11757', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-03-02'),
('Ben', 'Bines', 'lead+924287-9020b28-1901@msg.energysage.com', NULL, '321 Lakeview Avenue East', 'Brightwaters', 'NY', '11718', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-03-02'),
('Heetano', 'Shamsoondar', 'lead+924582-0df726e-1901@msg.energysage.com', NULL, '1318 Washington Avenue', 'New Hyde Park', 'NY', '11040', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-03-02'),
('Harji', 'Singh', 'lead+930202-cdb5252-1901@msg.energysage.com', NULL, '6 Suzanne Lane', 'Bethpage', 'NY', '11714', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-03-10'),
('Mario', 'Giordano', 'lead+932083-1b7b9c1-1901@msg.energysage.com', NULL, '240 Park Avenue', 'Lindenhurst', 'NY', '11757', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-03-13'),
('Joel', 'Albinowski', 'lead+935545-07dbd69-1901@msg.energysage.com', NULL, '443 Carnation Drive', 'Shirley', 'NY', '11967', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-03-20'),
('Michael', 'Viola', 'lead+938163-a457a8a-1901@msg.energysage.com', NULL, '7 Jaegger Drive', 'Glen Head', 'NY', '11545', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-03-22'),
('Arjun', 'Sikka', 'lead+940588-5ff1413-1901@msg.energysage.com', NULL, '492 Wolf Hill Road', 'Dix Hills', 'NY', '11746', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-03-28'),
('Sarah', 'Sciacca', 'lead+944507-911f8b6-1901@msg.energysage.com', NULL, '47 Grover Lane', 'East Northport', 'NY', '11731', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-03-31'),
('hiyuma', 'withanachchi', 'lead+944626-441247e-1901@msg.energysage.com', NULL, '520 Lincoln Avenue', 'West Hempstead', 'NY', '11552', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-03'),
('Daniel', 'Major', 'lead+945907-be360a7-1901@msg.energysage.com', NULL, '112 Ursula Drive', 'Roslyn', 'NY', '11576', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-03'),
('Kyle', 'Manning', 'lead+945801-927a519-1901@msg.energysage.com', NULL, '259 Maryland Avenue', 'Freeport', 'NY', '11520', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-03'),
('Jay', 'Lin', 'lead+946580-cb1bebc-1901@msg.energysage.com', NULL, '131 Lincoln Street', 'Garden City', 'NY', '11530', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-04'),
('Joey', 'Cheng', 'lead+946845-20e7bff-1901@msg.energysage.com', NULL, '86 Karol Place', 'Jericho', 'NY', '11753', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-04'),
('vanessa', 'sev', 'lead+947479-2d8f6f0-1901@msg.energysage.com', NULL, '5 Thrush Drive', 'Brentwood', 'NY', '11717', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-05'),
('Tim', 'Bautista', 'lead+948002-8940406-1901@msg.energysage.com', NULL, '534 Ocean Avenue', 'Massapequa', 'NY', '11758', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-06'),
('Nicholas', 'Lattanzio', 'lead+948987-f2b67f7-1901@msg.energysage.com', NULL, '112 Wickham Road', 'Garden City', 'NY', '11530', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-08'),
('Mark', 'Reyes', 'lead+955041-3cda196-1901@msg.energysage.com', NULL, '232 Frankel Boulevard', 'Merrick', 'NY', '11566', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-19'),
('Jenan', 'Abdin', 'lead+955781-132fb7a-1901@msg.energysage.com', NULL, '304 Vincent Avenue', 'Lynbrook', 'NY', '11563', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-21'),
('James', 'Bianco', 'lead+955859-8495a6b-1901@msg.energysage.com', NULL, '67 Huntting Lane', 'East Hampton', 'NY', '11937', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-21'),
('Anthony', 'Saccone', 'lead+956053-4b16aca-1901@msg.energysage.com', NULL, '58 Darling Avenue', 'Smithtown', 'NY', '11787', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-22'),
('Paulie', 'Connor', 'lead+957302-ae5fa89-1901@msg.energysage.com', NULL, '1375 Liberty Avenue', 'North Bellmore', 'NY', '11710', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-24'),
('Alvin', 'Khaled', 'lead+956931-e49db0c-1901@msg.energysage.com', NULL, '1384 Illinois Avenue', 'Bay Shore', 'NY', '11706', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-24'),
('BRIAN', 'BISRAM', 'lead+956780-aba4d19-1901@msg.energysage.com', NULL, '22 Russell Street', 'Manorville', 'NY', '11949', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-24'),
('Mitra', 'Nazarian', 'lead+958153-38df8bd-1901@msg.energysage.com', NULL, '8 Park Drive East', 'Old Westbury', 'NY', '11568', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-25'),
('Chris', 'ang', 'lead+959271-5ccbc34-1901@msg.energysage.com', NULL, '80 Sycamore Street', 'Massapequa', 'NY', '11758', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-27'),
('Max', 'Fury', 'lead+959181-e5a8940-1901@msg.energysage.com', NULL, '20 Horseshoe Road', 'Old Westbury', 'NY', '11568', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-27'),
('Dennis', 'Someck', 'lead+959972-cdd7cc7-1901@msg.energysage.com', NULL, '19 Deer Ridge Trail', 'Water Mill', 'NY', '11976', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-28'),
('Latoya', 'Robinson', 'lead+960112-21dd71b-1901@msg.energysage.com', NULL, '7 Windsor Court', 'Coram', 'NY', '11727', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-04-29'),
('greg', 'vanwhy', 'lead+961768-f9e2755-1901@msg.energysage.com', NULL, '77 Sycamore St', 'Massapequa', 'NY', '11758', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-02'),
('Samuel', 'Nyamekye', 'lead+963341-c05610c-1901@msg.energysage.com', NULL, '57 Ann Drive South', 'Freeport', 'NY', '11520', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-05'),
('Mario', 'Robles', 'lead+964585-aefa34a-1901@msg.energysage.com', NULL, '35 Gores Drive', 'Mastic', 'NY', '11950', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-08'),
('Michelle', 'Kim', 'lead+964597-e9e76cc-1901@msg.energysage.com', NULL, '22 Lenore Avenue', 'Hicksville', 'NY', '11801', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-08'),
('ed', 'kacz', 'lead+964711-c133e99-1901@msg.energysage.com', NULL, '113 North Side Road', 'Wading River', 'NY', '11792', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-08'),
('Lisa', 'Lisa', 'lead+966470-422af8b-1901@msg.energysage.com', NULL, '34 Hunter Avenue', 'Miller Place', 'NY', '11764', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-12'),
('Steven', 'Peterseb', 'lead+966607-4b21a0d-1901@msg.energysage.com', NULL, '50 Dolores Place', 'Malverne', 'NY', '11565', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-12'),
('Frances', 'Whittelsey', 'lead+967132-f1e2c92-1901@msg.energysage.com', NULL, '50 Summit Drive', 'Huntington', 'NY', '11743', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-15'),
('Azaan', 'Butt', 'lead+967740-21e2372-1901@msg.energysage.com', NULL, '30 South Montgomery Street', 'Valley Stream', 'NY', '11580', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-15'),
('testlead', 'testlead', 'testlead7772@testlead.com', '(888) 777-7772', NULL, 'testlead', NULL, '93063', NULL, 'Open', 'Rocket Leads', NULL, 'RYau', '2023-05-16'),
('test', 'test', 'test7773@test.com', '(888) 777-7773', NULL, 'test', NULL, '93063', NULL, 'Open', 'Rocket Leads', NULL, 'RYau', '2023-05-16'),
('Roger', 'Lao', 'lead+841778-c6c8f8c-1901@msg.energysage.com', NULL, '1 Empire Court', 'Dix Hills', 'NY', '11746', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-16'),
('Sam', 'Rosenthal', 'lead+968380-07e544f-1901@msg.energysage.com', NULL, '1079 Maple Lane', 'Queens', 'NY', '11040', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-17'),
('Shirley', 'Ghatan', 'lead+970315-a0736cb-1901@msg.energysage.com', NULL, '41 Tara Drive', 'Roslyn', 'NY', '11576', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-21'),
('Greg', 'Zammit', 'lead+971056-4582f02-1901@msg.energysage.com', NULL, '53 Melanie Lane', 'Syosset', 'NY', '11791', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-22'),
('Radford', 'Klotz', 'lead+970872-e76276b-1901@msg.energysage.com', NULL, '157 Horseshoe Road', 'Mill Neck', 'NY', '11765', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-23'),
('chanelle', 'Spears', 'lead+972422-0efee8d-1901@msg.energysage.com', NULL, '67 Diamond Street', 'Brooklyn', 'NY', '11003', 'Nassau', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-25'),
('Miles', 'Segal', 'lead+974354-fd37554-1901@msg.energysage.com', NULL, '14 Westmoreland Dr', 'Shelter Island', 'NY', '11964', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-30'),
('Jervis', 'Morris', 'lead+975440-349498d-1901@msg.energysage.com', NULL, '69 Kenwood Drive', 'Bohemia', 'NY', '11716', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-05-31'),
('TESTLEAD32', '[not provided]', 'TESTLEAD32@testlead.com', '(888) 555-3332', '33332 TESTLEAD32 Rd', NULL, NULL, '33332', NULL, 'Open', 'Rocket Leads', NULL, 'RYau', '2023-06-01'),
('John', 'McGloin', 'lead+973892-6ed2e79-1901@msg.energysage.com', NULL, '157 Oakland Avenue', 'Staten Island', 'NY', '10310', 'Richmond', 'Open', 'EnergySage', NULL, 'RYau', '2023-06-01'),
('Jacob', 'Bogitsh', 'lead+973798-2c0e580-1901@msg.energysage.com', NULL, '134 West Cedarview Avenue', 'Staten Island', 'NY', '10306', 'Richmond', 'Open', 'EnergySage', NULL, 'RYau', '2023-06-01'),
('Harriet', 'Ani', 'lead+974455-7918d4b-1901@msg.energysage.com', NULL, '11413 Springfield Boulevard', 'Queens', 'NY', '11413', 'Queens', 'Open', 'EnergySage', NULL, 'RYau', '2023-06-01'),
('Wayne', 'Porter', 'lead+975047-0fb8a66-1901@msg.energysage.com', NULL, '1460 East 57th Street', 'Brooklyn', 'NY', '11234', 'Kings', 'Open', 'EnergySage', NULL, 'RYau', '2023-06-01'),
('Christina', 'Maldonado', 'lead+976362-c8e22fd-1901@msg.energysage.com', NULL, '2434 Yates Avenue', 'The Bronx', 'NY', '10469', 'Bronx', 'Open', 'EnergySage', NULL, 'RYau', '2023-06-02'),
('Benedetto', 'Gambino', 'lead+977301-e8e878e-1901@msg.energysage.com', NULL, '41 Bayberry Drive', 'Saint James', 'NY', '11780', 'Suffolk', 'Open', 'EnergySage', NULL, 'RYau', '2023-06-05'),
('Andy', 'Abreu', 'lead+978054-ed300b2-1901@msg.energysage.com', NULL, '1409 14th Street', 'West Babylon', 'NY', '11704', 'Suffolk', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-06'),
('Gautham', 'Rajendran', 'lead+980472-7d1f11f-1901@msg.energysage.com', NULL, '616 Klondike Avenue', 'Staten Island', 'NY', '10314', 'Richmond', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-12'),
('Braulio', 'Cosme', 'lead+972881-5f8ad45-1901@msg.energysage.com', NULL, '85-63 212th Street', 'Queens', 'NY', '11427', 'Queens', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-12'),
('Owen', 'Barnett', 'lead+973167-f29c9a1-1901@msg.energysage.com', NULL, '980 77th Street', 'Brooklyn', 'NY', '11228', 'Kings', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-12'),
('Constantine', 'Pappas', 'lead+973003-01a81e1-1901@msg.energysage.com', NULL, '31-23 73rd Street', 'Queens', 'NY', '11370', 'Queens', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-12'),
('Chris', 'Lew', 'lead+973274-9ce6077-1901@msg.energysage.com', NULL, 'Edgerton Boulevard', 'Queens', 'NY', '11432', 'Queens', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-12'),
('Vinny', 'Eastny', 'lead+980657-0c2e160-1901@msg.energysage.com', NULL, '20 Boat Lane', 'Levittown', 'NY', '11756', 'Nassau', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-12'),
('Catherine', 'Cammer', 'lead+980942-2a8052e-1901@msg.energysage.com', NULL, '38 Ash Street', 'Locust Valley', 'NY', '11560', 'Nassau', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-13'),
('John', 'Torrent', 'lead+980718-b7e2611-1901@msg.energysage.com', NULL, '59-54 68th Street', 'Queens', 'NY', '11378', 'Queens', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-13'),
('nun', 'ya', 'lead+980993-3dd4568-1901@msg.energysage.com', NULL, '391 East 34th Street', 'Brooklyn', 'NY', '11203', 'Kings', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-13'),
('Diane', 'Cannone', 'lead+981839-d479251-1901@msg.energysage.com', NULL, '2 Tree Hollow Lane', 'Dix Hills', 'NY', '11746', 'Suffolk', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-14'),
('rajesh', 'ram', 'lead+983864-3244f34-1901@msg.energysage.com', NULL, '16820 119th Avenue', 'Queens', 'NY', '11434', 'Queens', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-19'),
('Benson', 'Yu', 'lead+983848-49d4004-1901@msg.energysage.com', NULL, '1026 Bay Street', 'Staten Island', 'NY', '10305', 'Richmond', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-19'),
('David', 'Wengen', 'lead+983778-60d11c9-1901@msg.energysage.com', NULL, '318 Ocean Avenue', 'Amityville', 'NY', '11701', 'Suffolk', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-19'),
('Wasay', 'Mabood', 'lead+983111-4f7427a-1901@msg.energysage.com', NULL, '15 Bella Casa Lane', 'Central Islip', 'NY', '11722', 'Suffolk', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-19'),
('kevin', 'sullivan', 'lead+982713-ebb34cd-1901@msg.energysage.com', NULL, '66 Julbet Drive', 'Sayville', 'NY', '11782', 'Suffolk', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-19'),
('James', 'Lukose', 'lead+982282-a057d5e-1901@msg.energysage.com', NULL, '135-51 231st Street', 'Queens', 'NY', '11413', 'Queens', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-19'),
('Sal', 'Drago', 'lead+984365-1a65dfc-1901@msg.energysage.com', NULL, '20 Laila Lane', 'Remsenburg-Speonk', 'NY', '11960', 'Suffolk', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-20'),
('Xing', 'Lin', 'lead+984948-6cd7c3a-1901@msg.energysage.com', NULL, '612 Lexington Avenue', 'Brooklyn', 'NY', '11221', 'Kings', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-21'),
('Zvi', 'Wakszul', 'lead+985065-956ca8d-1901@msg.energysage.com', NULL, '936 East 13th Street', 'Brooklyn', 'NY', '11230', 'Kings', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-21'),
('Yash', 'Sehgal', 'lead+985095-cd21117-1901@msg.energysage.com', NULL, '7 Harkin Ln', 'Hicksville', 'NY', '11801', 'Nassau', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-21'),
('rade', 'rade', 'lead+982679-eb715f7-1901@msg.energysage.com', NULL, '6301 Riverdale Avenue', 'The Bronx', 'NY', '10471', 'Bronx', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-21'),
('Mark', 'Goldberg', 'lead+985396-e94dc68-1901@msg.energysage.com', NULL, '6485 82nd Street', 'Queens', 'NY', '11379', 'Queens', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-22'),
('Lenard', 'Greenberg', 'lead+985861-f3461d7-1901@msg.energysage.com', NULL, '1192 Waverly Avenue', 'Holtsville', 'NY', '11742', 'Suffolk', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-23'),
('Skeata', 'Williams', 'lead+989456-3b4e296-1901@msg.energysage.com', NULL, '111-39 158th Street', 'Queens', 'NY', '11433', 'Queens', 'Open', 'EnergySage', NULL, 'ITSup', '2023-06-28'),
('George', 'Walsh', 'lead+991201-d45a6a0-1901@msg.energysage.com', NULL, '2 Palo Alto Drive', 'Hampton Bays', 'NY', '11946', 'Suffolk', 'Open', 'EnergySage', NULL, 'ITSup', '2023-07-02'),
('Ronald', 'Plumley', 'lead+991621-63b3389-1901@msg.energysage.com', NULL, '109 Edmonton Lane', 'Brandon', 'FL', '33511', NULL, 'Disqualified', 'EnergySage', NULL, 'ITSup', '2023-07-03'),
('jian', 'chen', 'lead+991698-47c8532-1901@msg.energysage.com', NULL, '181 Leverett Ave', 'Staten Island', 'NY', '10308', 'Richmond', 'Open', 'EnergySage', NULL, 'ITSup', '2023-07-03'),
('Emil', 'Lanne', 'lead+991659-5098e23-1901@msg.energysage.com', NULL, '46 Dubois Avenue', 'Sea Cliff', 'NY', '11579', 'Nassau', 'Open', 'EnergySage', NULL, 'ITSup', '2023-07-03'),
('Steven', 'OShea', 'lead+992159-1cbc8a8-1901@msg.energysage.com', NULL, '36 Circle Lane', 'Levittown', 'NY', '11756', 'Nassau', 'Open', 'EnergySage', NULL, 'ITSup', '2023-07-05'),
('Sandra', 'Pollak', 'lead+991276-3cc903f-1901@msg.energysage.com', NULL, '1821 Avenue J', 'Brooklyn', 'NY', '11230', 'Kings', 'Open', 'EnergySage', NULL, 'ITSup', '2023-07-05'),
('Alon', 'Aminov', 'lead+991893-b4fe8e0-1901@msg.energysage.com', NULL, '9943 64th Rd', 'Queens', 'NY', '11374', 'Queens', 'Open', 'EnergySage', NULL, 'ITSup', '2023-07-05'),
('Stanley', 'Chung', 'lead+992549-3f4f1f5-1901@msg.energysage.com', NULL, '433 Benito Street', 'East Meadow', 'NY', '11554', 'Nassau', 'Open', 'EnergySage', NULL, 'ITSup', '2023-07-06'),
('Daniel', 'Davidson', 'lead+992984-0dfa7bf-1901@msg.energysage.com', NULL, '151 Seeley Street', 'Brooklyn', 'NY', '11218', 'Kings', 'Open', 'EnergySage', NULL, 'ITSup', '2023-07-06'),
('Robert', 'White', 'lead+995005-9959851-1901@msg.energysage.com', NULL, '4001 West Bay Avenue', 'Tampa', 'FL', '33616', NULL, 'Disqualified', 'EnergySage', NULL, 'ITSup', '2023-07-09'),
('Chaitanya', 'Kolla', 'lead+995312-5e75b3b-1901@msg.energysage.com', NULL, '28328 Forelli Court', 'Wesley Chapel', 'FL', '33543', NULL, 'Disqualified', 'EnergySage', NULL, 'ITSup', '2023-07-10'),
('Christine', 'Fiechter', 'lead+995585-945a490-1901@msg.energysage.com', NULL, '481 Pine Warbler Way North', 'Palm Harbor', 'FL', '34683', NULL, 'Disqualified', 'EnergySage', NULL, 'ITSup', '2023-07-10')
ON CONFLICT (email) DO NOTHING;
