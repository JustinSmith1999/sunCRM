/*
  # Populate Long Island Towns and Permit Requirements

  ## Overview
  Adds all major Long Island municipalities with their specific permit requirements,
  contact information, fees, and document checklists.

  ## Towns Included
  - Suffolk County: Babylon, Brookhaven, East Hampton, Huntington, Islip, Riverhead, Shelter Island, Smithtown, Southampton, Southold
  - Nassau County: Glen Cove, Hempstead, Long Beach, North Hempstead, Oyster Bay

  Each town includes:
  - Building department contact info
  - Typical review times
  - Fee structures
  - Required documents
  - Special requirements
*/

-- Insert Suffolk County Towns

INSERT INTO permit_jurisdictions (name, county, contact_name, contact_phone, contact_email, department_address, website_url, typical_review_days, requires_pre_application, allows_online_submission, base_permit_fee, per_watt_fee, special_requirements) VALUES
('Town of Babylon', 'Suffolk', 'Building Department', '631-957-3077', 'buildingdept@townofbabylon.com', '200 East Sunrise Highway, Lindenhurst, NY 11757', 'https://www.townofbabylon.com/departments/building', 21, false, true, 250.00, 0.50, '{"notes": "Requires NYSERDA approval before permit submission", "hoa_required_villages": ["Lindenhurst", "West Babylon"]}'),

('Town of Brookhaven', 'Suffolk', 'Building Division', '631-451-9400', 'building@brookhavenny.gov', '1 Independence Hill, Farmingville, NY 11738', 'https://www.brookhavenny.gov/building', 28, false, true, 300.00, 0.45, '{"notes": "Online portal preferred, requires electrical inspection", "expedited_available": true}'),

('Town of Huntington', 'Suffolk', 'Building Department', '631-351-3151', 'building@huntingtonny.gov', '100 Main Street, Huntington, NY 11743', 'https://www.huntingtonny.gov/building', 21, false, true, 275.00, 0.55, '{"notes": "Pre-application meeting recommended for systems over 10kW", "historic_district_review": true}'),

('Town of Islip', 'Suffolk', 'Building Department', '631-224-5460', 'building@islipny.gov', '401 Main Street, Islip, NY 11751', 'https://www.islipny.gov/building', 25, false, true, 260.00, 0.48, '{"notes": "Requires fire marshal review for commercial", "coastal_zone_restrictions": true}'),

('Town of Smithtown', 'Suffolk', 'Building Department', '631-360-7563', 'building@smithtownny.gov', '99 West Main Street, Smithtown, NY 11787', 'https://www.smithtownny.gov/building', 20, false, false, 240.00, 0.52, '{"notes": "Walk-in submission required, fastest review time on LI", "same_day_review_available": true}'),

('Town of Southampton', 'Suffolk', 'Building Department', '631-287-5717', 'building@southamptontownny.gov', '116 Hampton Road, Southampton, NY 11968', 'https://www.southamptontownny.gov/building', 30, true, false, 350.00, 0.60, '{"notes": "Requires architectural review in historic districts", "hamptons_restrictions": true, "seasonal_delays": "June-August"}'),

('Town of East Hampton', 'Suffolk', 'Building Department', '631-324-4143', 'building@ehamptonny.gov', '159 Pantigo Road, East Hampton, NY 11937', 'https://www.ehamptonny.gov/building', 35, true, false, 400.00, 0.65, '{"notes": "Strictest requirements on LI, architectural review board approval often needed", "design_guidelines": true}'),

('Town of Riverhead', 'Suffolk', 'Building Department', '631-727-3200', 'building@townofriverheadny.gov', '200 Howell Avenue, Riverhead, NY 11901', 'https://www.townofriverheadny.gov/building', 24, false, true, 235.00, 0.47, '{"notes": "Agricultural zone exemptions available", "expedited_commercial": true}'),

('Town of Southold', 'Suffolk', 'Building Department', '631-765-1892', 'building@southoldtownny.gov', '53095 Main Road, Southold, NY 11971', 'https://www.southoldtownny.gov/building', 28, false, false, 280.00, 0.53, '{"notes": "Environmental review required for coastal properties", "north_fork_specific": true}'),

('Town of Shelter Island', 'Suffolk', 'Building Department', '631-749-1166', 'building@shelterislandtown.us', '38 North Ferry Road, Shelter Island, NY 11964', 'https://www.shelterislandtown.us/building', 21, false, false, 200.00, 0.45, '{"notes": "Small community, personal service, flexible scheduling", "ferry_access_only": true}');

-- Insert Nassau County Towns

INSERT INTO permit_jurisdictions (name, county, contact_name, contact_phone, contact_email, department_address, website_url, typical_review_days, requires_pre_application, allows_online_submission, base_permit_fee, per_watt_fee, special_requirements) VALUES
('Town of Hempstead', 'Nassau', 'Building Department', '516-489-5000', 'building@tohmail.org', '1 Washington Street, Hempstead, NY 11550', 'https://www.toh.li/building', 30, false, true, 320.00, 0.58, '{"notes": "Largest town on LI, requires PSEG approval letter", "multiple_villages": true, "village_approval_needed": ["Garden City", "Rockville Centre"]}'),

('Town of North Hempstead', 'Nassau', 'Building Department', '516-869-6311', 'building@northhempstead.com', '220 Plandome Road, Manhasset, NY 11030', 'https://www.northhempstead.com/building', 25, false, true, 295.00, 0.54, '{"notes": "Separate village approvals may be required", "environmental_review": true}'),

('Town of Oyster Bay', 'Nassau', 'Building Department', '516-624-6350', 'building@oysterbaytown.com', '977 Hicksville Road, Massapequa, NY 11758', 'https://www.oysterbaytown.com/building', 27, false, true, 310.00, 0.56, '{"notes": "Check for village jurisdiction first", "multiple_offices": true}'),

('City of Glen Cove', 'Nassau', 'Building Department', '516-676-2020', 'building@glencove-li.us', '9 Village Square, Glen Cove, NY 11542', 'https://www.glencove-li.us/building', 22, false, false, 265.00, 0.51, '{"notes": "City jurisdiction, different rules than towns", "quick_turnaround": true}'),

('City of Long Beach', 'Nassau', 'Building Department', '516-431-1000', 'building@longbeachny.gov', '1 West Chester Street, Long Beach, NY 11561', 'https://www.longbeachny.gov/building', 26, false, false, 290.00, 0.54, '{"notes": "Coastal city with special wind load requirements", "flood_zone_restrictions": true, "enhanced_structural_review": true}');

-- Now insert document requirements for Town of Babylon (most detailed)
INSERT INTO permit_document_requirements (jurisdiction_id, document_name, document_type, is_required, description, sort_order) 
SELECT 
  id,
  'Building Permit Application',
  'application',
  true,
  'Complete building permit application form with property owner signature',
  1
FROM permit_jurisdictions WHERE name = 'Town of Babylon';

INSERT INTO permit_document_requirements (jurisdiction_id, document_name, document_type, is_required, description, sort_order)
SELECT 
  id,
  'Site Plan',
  'technical',
  true,
  'Detailed site plan showing solar array location, setbacks, and property boundaries',
  2
FROM permit_jurisdictions WHERE name = 'Town of Babylon';

INSERT INTO permit_document_requirements (jurisdiction_id, document_name, document_type, is_required, description, sort_order)
SELECT 
  id,
  'Electrical Single Line Diagram',
  'technical',
  true,
  'Complete electrical single line diagram showing all system components and connections',
  3
FROM permit_jurisdictions WHERE name = 'Town of Babylon';

INSERT INTO permit_document_requirements (jurisdiction_id, document_name, document_type, is_required, description, sort_order)
SELECT 
  id,
  'Roof Plan with Array Layout',
  'technical',
  true,
  'Roof plan showing panel layout, dimensions, and mounting details',
  4
FROM permit_jurisdictions WHERE name = 'Town of Babylon';

INSERT INTO permit_document_requirements (jurisdiction_id, document_name, document_type, is_required, description, sort_order)
SELECT 
  id,
  'Structural Engineering Letter',
  'engineering',
  true,
  'PE-stamped letter certifying roof can support additional load',
  5
FROM permit_jurisdictions WHERE name = 'Town of Babylon';

INSERT INTO permit_document_requirements (jurisdiction_id, document_name, document_type, is_required, description, sort_order)
SELECT 
  id,
  'Manufacturer Spec Sheets',
  'technical',
  true,
  'Equipment specifications for panels, inverters, and all major components',
  6
FROM permit_jurisdictions WHERE name = 'Town of Babylon';

INSERT INTO permit_document_requirements (jurisdiction_id, document_name, document_type, is_required, description, sort_order)
SELECT 
  id,
  'Installer License',
  'licensing',
  true,
  'Copy of NYS licensed electrician and/or contractor license',
  7
FROM permit_jurisdictions WHERE name = 'Town of Babylon';

INSERT INTO permit_document_requirements (jurisdiction_id, document_name, document_type, is_required, description, sort_order)
SELECT 
  id,
  'Proof of Property Ownership',
  'legal',
  true,
  'Recent deed or tax bill showing property ownership',
  8
FROM permit_jurisdictions WHERE name = 'Town of Babylon';

INSERT INTO permit_document_requirements (jurisdiction_id, document_name, document_type, is_required, description, sort_order)
SELECT 
  id,
  'NYSERDA Approval Letter',
  'legal',
  true,
  'NY-Sun approval letter if applicable to project',
  9
FROM permit_jurisdictions WHERE name = 'Town of Babylon';

INSERT INTO permit_document_requirements (jurisdiction_id, document_name, document_type, is_required, description, sort_order)
SELECT 
  id,
  'PSEG Interconnection Application',
  'utility',
  true,
  'Copy of submitted PSEG interconnection application',
  10
FROM permit_jurisdictions WHERE name = 'Town of Babylon';

INSERT INTO permit_document_requirements (jurisdiction_id, document_name, document_type, is_required, description, sort_order)
SELECT 
  id,
  'HOA Approval Letter',
  'legal',
  false,
  'Homeowners Association approval if property is in HOA',
  11
FROM permit_jurisdictions WHERE name = 'Town of Babylon';

INSERT INTO permit_document_requirements (jurisdiction_id, document_name, document_type, is_required, description, sort_order)
SELECT 
  id,
  'Historic District Approval',
  'legal',
  false,
  'Historic preservation approval if in designated district',
  12
FROM permit_jurisdictions WHERE name = 'Town of Babylon';

-- Add similar requirements for other towns (simplified for brevity)
INSERT INTO permit_document_requirements (jurisdiction_id, document_name, document_type, is_required, description, sort_order)
SELECT 
  pj.id,
  doc.document_name,
  doc.document_type,
  doc.is_required,
  doc.description,
  doc.sort_order
FROM permit_jurisdictions pj
CROSS JOIN (
  SELECT 'Building Permit Application' as document_name, 'application' as document_type, true as is_required, 'Complete building permit application form' as description, 1 as sort_order
  UNION ALL SELECT 'Site Plan', 'technical', true, 'Detailed site plan', 2
  UNION ALL SELECT 'Electrical Single Line Diagram', 'technical', true, 'Electrical diagram', 3
  UNION ALL SELECT 'Roof Plan', 'technical', true, 'Roof plan with array layout', 4
  UNION ALL SELECT 'Structural Letter', 'engineering', true, 'PE structural certification', 5
  UNION ALL SELECT 'Equipment Specs', 'technical', true, 'Manufacturer specifications', 6
  UNION ALL SELECT 'Installer License', 'licensing', true, 'Licensed contractor/electrician', 7
  UNION ALL SELECT 'Proof of Ownership', 'legal', true, 'Deed or tax bill', 8
) doc
WHERE pj.name != 'Town of Babylon';

-- Set inspection fees for all jurisdictions
UPDATE permit_jurisdictions SET inspection_fees = '{
  "rough_inspection": 150,
  "final_inspection": 150,
  "electrical_inspection": 125,
  "reinspection": 100
}'::jsonb;

-- Update special requirements for expedited processing
UPDATE permit_jurisdictions 
SET special_requirements = special_requirements || '{"expedited_fee": 500, "expedited_review_days": 10}'::jsonb
WHERE name IN ('Town of Brookhaven', 'Town of Smithtown', 'City of Glen Cove');