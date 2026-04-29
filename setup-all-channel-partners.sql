-- ================================================================
-- BULK INSERT ALL CHANNEL PARTNERS
-- ================================================================
-- Run this in Supabase SQL Editor after running the main migration
-- https://husbupeealwuxyopfwwb.supabase.co/project/_/sql/new
-- ================================================================

-- Insert all 22 channel partners
INSERT INTO channel_partners (name, slug, contact_email, commission_rate, commission_type, status, notes) VALUES
  ('3 Sons Energy', '3sonsenergy', 'contact@3sonsenergy.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/3sonsenergy/'),
  ('ASCC Consulting LLC', 'ascc-consulting', 'contact@asccconsulting.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/ascc-consulting'),
  ('Bolo Group LLC', 'bologroup', 'contact@bologroup.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/bologroup/'),
  ('Clean Energy Connection LLC', 'clean-energy-connection-llc', 'contact@cleanenergyconnection.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/clean-energy-connection-llc/'),
  ('Emerald Energy Solutions LLC', 'emerald-energy-solutions-llc', 'contact@emeraldenergysolutions.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/emerald-energy-solutions-llc/'),
  ('Galesi Enterprises', 'galesi-enterprises', 'contact@galesienterprises.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/galesi-enterprises/'),
  ('Harmony Energy', 'harmony-energy', 'contact@harmonyenergy.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/harmony-energy/'),
  ('IntelliSun', 'intellisun', 'contact@intellisun.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/intellisun/'),
  ('LI Solar', 'li-solar', 'contact@lisolar.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/li-solar/'),
  ('Long Island Energy Bridge', 'long-island-energy-bridge', 'contact@lienergybridge.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/long-island-energy-bridge/'),
  ('MelCo Solar', 'melco-solar', 'contact@melcosolar.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/melco-solar/'),
  ('Mikabella Corp', 'mikabella-corp', 'contact@mikabellacorp.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/mikabella-corp'),
  ('Northern Energy Collective', 'northern-energy-collective', 'contact@northernenergycollective.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/northern-energy-collective/'),
  ('Planet Sun Solutions', 'planet-sun-solutions', 'contact@planetsunsolutions.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/planet-sun-solutions/'),
  ('Radiant Energy', 'radiant-energy', 'contact@radiantenergy.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/radiant-energy/'),
  ('Renewable Earth Inc', 'renewable-earth-inc', 'contact@renewableearth.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/renewable-earth-inc/'),
  ('Solar Pro Roofing', 'solarproroofing', 'contact@solarproroofing.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/solarproroofing/'),
  ('South Paw Solar', 'south-paw-solar', 'contact@southpawsolar.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/south-paw-solar/'),
  ('Sunchain Energy', 'sunchain-energy', 'contact@sunchainenergy.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/sunchain-energy/'),
  ('SunSolar Solutions', 'sunsolar-solutions', 'contact@sunsolarsolutions.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/sunsolar-solutions/'),
  ('Southern Skies Solar', 'southern-skies-solar', 'contact@southernskiessolar.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/southern-skies-solar/'),
  ('Energy Investors', 'energy-investors', 'contact@energyinvestors.com', 10.00, 'percentage', 'active', 'SUNation page: https://www.sunation.com/energy-investors/')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  contact_email = EXCLUDED.contact_email,
  notes = EXCLUDED.notes,
  status = EXCLUDED.status;

-- Show inserted partners
SELECT id, name, slug, status,
       CONCAT(current_setting('app.settings.app_url', true), '/partner-form/', slug) as form_url
FROM channel_partners
ORDER BY name;
