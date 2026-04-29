-- Insert leads into the actual table structure (no organization_id or owner_id)

INSERT INTO leads (first_name, last_name, email, primary_phone, street, city, state, zip_postal_code, county, lead_source, lead_status) VALUES
('Paul', 'Fodor', 'lead+827090-507ac90-1901@msg.energysage.com', NULL, '22 Bobcat Lane', 'Setauket- East Setauket', 'NY', '11733', NULL, 'EnergySage', 'Open'),
('Sherry', 'Cirilo', 'lead+826736-48f47fa-1901@msg.energysage.com', NULL, '772 Delafield Avenue', 'Staten Island', 'NY', '10310', 'Richmond', 'EnergySage', 'Open'),
('Tem', 'Tash', 'lead+826386-c48c385-1901@msg.energysage.com', NULL, '53-19 96th Street', 'Queens', 'NY', '11368', NULL, 'EnergySage', 'Open'),
('Sandi', 'Ford', 'lead+826353-801c540-1901@msg.energysage.com', NULL, '86 Sterling Street', 'Brooklyn', 'NY', '11225', NULL, 'EnergySage', 'Open'),
('George', 'McKee', 'lead+824045-0d14983-1901@msg.energysage.com', NULL, '1 Old North Highway', 'Hampton Bays', 'NY', '11946', NULL, 'EnergySage', 'Open'),
('Rizi', 'Karim', 'lead+825834-ca82c78-1901@msg.energysage.com', NULL, '101-36 130th Street', 'Queens', 'NY', '11419', NULL, 'EnergySage', 'Open'),
('Eric', 'Giedd', 'lead+825744-c0dd75e-1901@msg.energysage.com', NULL, '124 Plymouth Boulevard', 'Smithtown', 'NY', '11787', NULL, 'EnergySage', 'Open'),
('Wei', 'Yn', 'lead+827267-53fb1b0-1901@msg.energysage.com', NULL, '51A Warwick Road', 'Great Neck', 'NY', '11023', NULL, 'EnergySage', 'Open'),
('Jose', 'Martinez', 'lead+825466-df3136f-1901@msg.energysage.com', NULL, '482 Montauk Hwy', 'East Moriches', 'NY', '11940', NULL, 'EnergySage', 'Open'),
('Michael', 'Cassidy', 'lead+824504-0f588cd-1901@msg.energysage.com', NULL, '16 West Raleigh Avenue', 'Staten Island', 'NY', '10310', 'Richmond', 'EnergySage', 'Open'),
('Bruce', 'Wayne', 'batman@gmail.com', '(696) 532-9876', '5321 S. Bat St', 'Gotham', 'NY', '26325', NULL, 'Three Ships', 'Open');
