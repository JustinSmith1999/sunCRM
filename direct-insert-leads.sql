-- Get your user_id and org_id first:
-- SELECT up.id as user_id, uor.organization_id 
-- FROM user_profiles up 
-- JOIN user_organization_roles uor ON up.id = uor.user_id 
-- LIMIT 1;

-- Then replace YOUR_USER_ID and YOUR_ORG_ID below with actual values

INSERT INTO leads (organization_id, owner_id, first_name, last_name, email, phone, street, city, state, postal_code, county, lead_source, status) VALUES
('YOUR_ORG_ID', 'YOUR_USER_ID', 'Paul', 'Fodor', 'lead+827090-507ac90-1901@msg.energysage.com', NULL, '22 Bobcat Lane', 'Setauket- East Setauket', 'NY', '11733', NULL, 'EnergySage', 'New'),
('YOUR_ORG_ID', 'YOUR_USER_ID', 'Sherry', 'Cirilo', 'lead+826736-48f47fa-1901@msg.energysage.com', NULL, '772 Delafield Avenue', 'Staten Island', 'NY', '10310', 'Richmond', 'EnergySage', 'New'),
('YOUR_ORG_ID', 'YOUR_USER_ID', 'Tem', 'Tash', 'lead+826386-c48c385-1901@msg.energysage.com', NULL, '53-19 96th Street', 'Queens', 'NY', '11368', NULL, 'EnergySage', 'New'),
('YOUR_ORG_ID', 'YOUR_USER_ID', 'Sandi', 'Ford', 'lead+826353-801c540-1901@msg.energysage.com', NULL, '86 Sterling Street', 'Brooklyn', 'NY', '11225', NULL, 'EnergySage', 'New'),
('YOUR_ORG_ID', 'YOUR_USER_ID', 'George', 'McKee', 'lead+824045-0d14983-1901@msg.energysage.com', NULL, '1 Old North Highway', 'Hampton Bays', 'NY', '11946', NULL, 'EnergySage', 'New'),
('YOUR_ORG_ID', 'YOUR_USER_ID', 'Bruce', 'Wayne', 'batman@gmail.com', '(696) 532-9876', '5321 S. Bat St', 'Gotham', 'NY', '26325', NULL, 'Three Ships', 'New');
