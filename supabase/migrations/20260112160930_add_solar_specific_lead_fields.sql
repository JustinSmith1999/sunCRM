/*
  # Add Solar-Specific Lead Qualification Fields
  
  1. Lead Table Enhancements
    - Electric bill amount and usage fields
    - Roof characteristics (ownership, age, condition, material, shading)
    - Solar interest and urgency scoring
    - Utility company and financing preferences
    - Pre-qualification status
    
  2. Purpose
    - Enable smart lead qualification and routing
    - Calculate solar interest scores automatically
    - Track financing preferences early
    - Identify high-value solar prospects
    
  3. Security
    - Uses existing RLS policies on leads table
*/

-- Add solar-specific qualification fields to leads table
DO $$
BEGIN
  -- Electric usage and bills
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'monthly_electric_bill') THEN
    ALTER TABLE leads ADD COLUMN monthly_electric_bill numeric(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'average_monthly_kwh') THEN
    ALTER TABLE leads ADD COLUMN average_monthly_kwh numeric(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'utility_company') THEN
    ALTER TABLE leads ADD COLUMN utility_company text;
  END IF;
  
  -- Roof characteristics
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'roof_ownership_status') THEN
    ALTER TABLE leads ADD COLUMN roof_ownership_status text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'roof_age_years') THEN
    ALTER TABLE leads ADD COLUMN roof_age_years integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'roof_condition') THEN
    ALTER TABLE leads ADD COLUMN roof_condition text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'roof_material') THEN
    ALTER TABLE leads ADD COLUMN roof_material text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'shading_concerns') THEN
    ALTER TABLE leads ADD COLUMN shading_concerns text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'roof_direction_facing') THEN
    ALTER TABLE leads ADD COLUMN roof_direction_facing text;
  END IF;
  
  -- Financing and timeline
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'financing_preference') THEN
    ALTER TABLE leads ADD COLUMN financing_preference text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'timeline_urgency') THEN
    ALTER TABLE leads ADD COLUMN timeline_urgency text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'credit_score_range') THEN
    ALTER TABLE leads ADD COLUMN credit_score_range text;
  END IF;
  
  -- Qualification scoring
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'solar_interest_score') THEN
    ALTER TABLE leads ADD COLUMN solar_interest_score integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'qualification_status') THEN
    ALTER TABLE leads ADD COLUMN qualification_status text DEFAULT 'new';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'disqualification_reason') THEN
    ALTER TABLE leads ADD COLUMN disqualification_reason text;
  END IF;
  
  -- Additional preferences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'battery_storage_interest') THEN
    ALTER TABLE leads ADD COLUMN battery_storage_interest boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'ev_charger_interest') THEN
    ALTER TABLE leads ADD COLUMN ev_charger_interest boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'hoa_approval_needed') THEN
    ALTER TABLE leads ADD COLUMN hoa_approval_needed boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'hoa_status') THEN
    ALTER TABLE leads ADD COLUMN hoa_status text;
  END IF;
END $$;

-- Add helpful indexes for solar-specific queries
CREATE INDEX IF NOT EXISTS idx_leads_qualification_status ON leads(qualification_status);
CREATE INDEX IF NOT EXISTS idx_leads_solar_interest_score ON leads(solar_interest_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_monthly_bill ON leads(monthly_electric_bill DESC);
CREATE INDEX IF NOT EXISTS idx_leads_timeline_urgency ON leads(timeline_urgency);
CREATE INDEX IF NOT EXISTS idx_leads_financing_preference ON leads(financing_preference);

-- Add column comments for documentation
COMMENT ON COLUMN leads.monthly_electric_bill IS 'Average monthly electric bill in dollars';
COMMENT ON COLUMN leads.average_monthly_kwh IS 'Average monthly electricity usage in kilowatt-hours';
COMMENT ON COLUMN leads.utility_company IS 'Electric utility provider name';
COMMENT ON COLUMN leads.roof_ownership_status IS 'Own, Rent, or Other';
COMMENT ON COLUMN leads.roof_age_years IS 'Approximate age of roof in years';
COMMENT ON COLUMN leads.roof_condition IS 'Excellent, Good, Fair, Poor, Unknown';
COMMENT ON COLUMN leads.roof_material IS 'Asphalt Shingle, Tile, Metal, Flat, Other';
COMMENT ON COLUMN leads.shading_concerns IS 'None, Minimal, Moderate, Significant';
COMMENT ON COLUMN leads.roof_direction_facing IS 'Primary roof direction: South, Southwest, Southeast, etc.';
COMMENT ON COLUMN leads.financing_preference IS 'Cash, Loan, Lease, PPA, Undecided';
COMMENT ON COLUMN leads.timeline_urgency IS 'Immediate, 1-3 months, 3-6 months, 6-12 months, Just exploring';
COMMENT ON COLUMN leads.credit_score_range IS 'Excellent (750+), Good (700-749), Fair (650-699), Poor (<650), Unknown';
COMMENT ON COLUMN leads.solar_interest_score IS 'Calculated score 0-100 based on qualification factors';
COMMENT ON COLUMN leads.qualification_status IS 'new, qualified, disqualified, pending_review';
COMMENT ON COLUMN leads.battery_storage_interest IS 'Customer interested in adding battery backup';
COMMENT ON COLUMN leads.ev_charger_interest IS 'Customer interested in EV charger installation';
COMMENT ON COLUMN leads.hoa_approval_needed IS 'Property is in HOA requiring approval';
COMMENT ON COLUMN leads.hoa_status IS 'Not needed, Pending, Approved, Denied';