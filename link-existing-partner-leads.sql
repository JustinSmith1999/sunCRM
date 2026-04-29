-- ================================================================
-- LINK EXISTING LEADS TO CHANNEL PARTNERS
-- ================================================================
-- Run this AFTER inserting all partners
-- This will link existing leads based on LeadSource and Partner__c fields
-- ================================================================

-- Update leads with 3 Sons Energy
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = '3 Sons Energy'),
    partner_lead_source = '3 Sons Energy'
WHERE ("LeadSource" ILIKE '%3 sons%' OR "LeadSource" ILIKE '%3sons%'
   OR "Partner__c" ILIKE '%3 sons%' OR "Partner__c" ILIKE '%3sons%')
   AND partner_id IS NULL;

-- Update leads with ASCC Consulting LLC
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'ASCC Consulting LLC'),
    partner_lead_source = 'ASCC Consulting LLC'
WHERE ("LeadSource" ILIKE '%ascc%'
   OR "Partner__c" ILIKE '%ascc%')
   AND partner_id IS NULL;

-- Update leads with Bolo Group LLC
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Bolo Group LLC'),
    partner_lead_source = 'Bolo Group LLC'
WHERE ("LeadSource" ILIKE '%bolo%'
   OR "Partner__c" ILIKE '%bolo%')
   AND partner_id IS NULL;

-- Update leads with Clean Energy Connection LLC
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Clean Energy Connection LLC'),
    partner_lead_source = 'Clean Energy Connection LLC'
WHERE ("LeadSource" ILIKE '%clean energy connection%'
   OR "Partner__c" ILIKE '%clean energy connection%')
   AND partner_id IS NULL;

-- Update leads with Emerald Energy Solutions LLC
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Emerald Energy Solutions LLC'),
    partner_lead_source = 'Emerald Energy Solutions LLC'
WHERE ("LeadSource" ILIKE '%emerald%'
   OR "Partner__c" ILIKE '%emerald%')
   AND partner_id IS NULL;

-- Update leads with Galesi Enterprises
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Galesi Enterprises'),
    partner_lead_source = 'Galesi Enterprises'
WHERE ("LeadSource" ILIKE '%galesi%'
   OR "Partner__c" ILIKE '%galesi%')
   AND partner_id IS NULL;

-- Update leads with Harmony Energy
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Harmony Energy'),
    partner_lead_source = 'Harmony Energy'
WHERE ("LeadSource" ILIKE '%harmony%'
   OR "Partner__c" ILIKE '%harmony%')
   AND partner_id IS NULL;

-- Update leads with IntelliSun
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'IntelliSun'),
    partner_lead_source = 'IntelliSun'
WHERE ("LeadSource" ILIKE '%intellisun%'
   OR "Partner__c" ILIKE '%intellisun%')
   AND partner_id IS NULL;

-- Update leads with LI Solar
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'LI Solar'),
    partner_lead_source = 'LI Solar'
WHERE ("LeadSource" ILIKE '%li solar%' OR "LeadSource" ILIKE '%lisolar%'
   OR "Partner__c" ILIKE '%li solar%' OR "Partner__c" ILIKE '%lisolar%')
   AND partner_id IS NULL;

-- Update leads with Long Island Energy Bridge
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Long Island Energy Bridge'),
    partner_lead_source = 'Long Island Energy Bridge'
WHERE ("LeadSource" ILIKE '%long island energy%'
   OR "Partner__c" ILIKE '%long island energy%')
   AND partner_id IS NULL;

-- Update leads with MelCo Solar
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'MelCo Solar'),
    partner_lead_source = 'MelCo Solar'
WHERE ("LeadSource" ILIKE '%melco%'
   OR "Partner__c" ILIKE '%melco%')
   AND partner_id IS NULL;

-- Update leads with Mikabella Corp
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Mikabella Corp'),
    partner_lead_source = 'Mikabella Corp'
WHERE ("LeadSource" ILIKE '%mikabella%'
   OR "Partner__c" ILIKE '%mikabella%')
   AND partner_id IS NULL;

-- Update leads with Northern Energy Collective
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Northern Energy Collective'),
    partner_lead_source = 'Northern Energy Collective'
WHERE ("LeadSource" ILIKE '%northern energy%'
   OR "Partner__c" ILIKE '%northern energy%')
   AND partner_id IS NULL;

-- Update leads with Planet Sun Solutions
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Planet Sun Solutions'),
    partner_lead_source = 'Planet Sun Solutions'
WHERE ("LeadSource" ILIKE '%planet sun%'
   OR "Partner__c" ILIKE '%planet sun%')
   AND partner_id IS NULL;

-- Update leads with Radiant Energy
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Radiant Energy'),
    partner_lead_source = 'Radiant Energy'
WHERE ("LeadSource" ILIKE '%radiant%'
   OR "Partner__c" ILIKE '%radiant%')
   AND partner_id IS NULL;

-- Update leads with Renewable Earth Inc
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Renewable Earth Inc'),
    partner_lead_source = 'Renewable Earth Inc'
WHERE ("LeadSource" ILIKE '%renewable earth%'
   OR "Partner__c" ILIKE '%renewable earth%')
   AND partner_id IS NULL;

-- Update leads with Solar Pro Roofing
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Solar Pro Roofing'),
    partner_lead_source = 'Solar Pro Roofing'
WHERE ("LeadSource" ILIKE '%solar pro%' OR "LeadSource" ILIKE '%solarproroofing%'
   OR "Partner__c" ILIKE '%solar pro%' OR "Partner__c" ILIKE '%solarproroofing%')
   AND partner_id IS NULL;

-- Update leads with South Paw Solar
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'South Paw Solar'),
    partner_lead_source = 'South Paw Solar'
WHERE ("LeadSource" ILIKE '%south paw%' OR "LeadSource" ILIKE '%southpaw%'
   OR "Partner__c" ILIKE '%south paw%' OR "Partner__c" ILIKE '%southpaw%')
   AND partner_id IS NULL;

-- Update leads with Sunchain Energy
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Sunchain Energy'),
    partner_lead_source = 'Sunchain Energy'
WHERE ("LeadSource" ILIKE '%sunchain%'
   OR "Partner__c" ILIKE '%sunchain%')
   AND partner_id IS NULL;

-- Update leads with SunSolar Solutions
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'SunSolar Solutions'),
    partner_lead_source = 'SunSolar Solutions'
WHERE ("LeadSource" ILIKE '%sunsolar%'
   OR "Partner__c" ILIKE '%sunsolar%')
   AND partner_id IS NULL;

-- Update leads with Southern Skies Solar
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Southern Skies Solar'),
    partner_lead_source = 'Southern Skies Solar'
WHERE ("LeadSource" ILIKE '%southern skies%'
   OR "Partner__c" ILIKE '%southern skies%')
   AND partner_id IS NULL;

-- Update leads with Energy Investors
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = 'Energy Investors'),
    partner_lead_source = 'Energy Investors'
WHERE ("LeadSource" ILIKE '%energy investor%'
   OR "Partner__c" ILIKE '%energy investor%')
   AND partner_id IS NULL;

-- Show results by partner
SELECT
  cp.name as partner_name,
  COUNT(l.id) as total_leads,
  COUNT(CASE WHEN l."Status" = 'Converted' THEN 1 END) as converted_leads,
  COUNT(CASE WHEN l."Status" IN ('New', 'Working', 'Open') THEN 1 END) as active_leads
FROM channel_partners cp
LEFT JOIN leads l ON l.partner_id = cp.id
GROUP BY cp.id, cp.name
ORDER BY total_leads DESC;

-- Show leads that still don't have partner attribution
SELECT
  COUNT(*) as unattributed_leads,
  array_agg(DISTINCT "LeadSource") FILTER (WHERE "LeadSource" IS NOT NULL) as unique_lead_sources,
  array_agg(DISTINCT "Partner__c") FILTER (WHERE "Partner__c" IS NOT NULL) as unique_partners
FROM leads
WHERE partner_id IS NULL
  AND ("LeadSource" IS NOT NULL OR "Partner__c" IS NOT NULL);
