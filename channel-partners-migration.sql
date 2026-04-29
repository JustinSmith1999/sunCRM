-- ================================================================
-- CHANNEL PARTNERS SYSTEM MIGRATION
-- ================================================================
-- Run this in Supabase SQL Editor:
-- https://husbupeealwuxyopfwwb.supabase.co/project/_/sql/new
-- ================================================================

-- Create channel_partners table
CREATE TABLE IF NOT EXISTS channel_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  webhook_url text UNIQUE,
  contact_email text,
  phone text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  commission_rate numeric(5,2) DEFAULT 0,
  commission_type text DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'flat_fee')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create partner_contacts table
CREATE TABLE IF NOT EXISTS partner_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES channel_partners(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'contact' CHECK (role IN ('primary', 'secondary', 'contact')),
  can_view_leads boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(partner_id, user_id)
);

-- Create partner_commissions table
CREATE TABLE IF NOT EXISTS partner_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES channel_partners(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  deal_id uuid,
  commission_amount numeric(10,2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add partner_id to leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'partner_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN partner_id uuid REFERENCES channel_partners(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add partner_lead_source to leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'partner_lead_source'
  ) THEN
    ALTER TABLE leads ADD COLUMN partner_lead_source text;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_channel_partners_slug ON channel_partners(slug);
CREATE INDEX IF NOT EXISTS idx_channel_partners_status ON channel_partners(status);
CREATE INDEX IF NOT EXISTS idx_partner_contacts_partner_id ON partner_contacts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_contacts_user_id ON partner_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_partner_id ON partner_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_lead_id ON partner_commissions(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_partner_id ON leads(partner_id);

-- Enable RLS
ALTER TABLE channel_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_commissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage channel partners" ON channel_partners;
DROP POLICY IF EXISTS "Partner contacts can view their partner" ON channel_partners;
DROP POLICY IF EXISTS "Admins can manage partner contacts" ON partner_contacts;
DROP POLICY IF EXISTS "Users can view their own partner contacts" ON partner_contacts;
DROP POLICY IF EXISTS "Admins can manage partner commissions" ON partner_commissions;
DROP POLICY IF EXISTS "Partner contacts can view their commissions" ON partner_commissions;
DROP POLICY IF EXISTS "Partner contacts can view their partner leads" ON leads;

-- RLS Policies for channel_partners
CREATE POLICY "Admins can manage channel partners"
  ON channel_partners FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Partner contacts can view their partner"
  ON channel_partners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_contacts
      WHERE partner_contacts.partner_id = channel_partners.id
      AND partner_contacts.user_id = auth.uid()
    )
  );

-- RLS Policies for partner_contacts
CREATE POLICY "Admins can manage partner contacts"
  ON partner_contacts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own partner contacts"
  ON partner_contacts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for partner_commissions
CREATE POLICY "Admins can manage partner commissions"
  ON partner_commissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Partner contacts can view their commissions"
  ON partner_commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_contacts
      WHERE partner_contacts.partner_id = partner_commissions.partner_id
      AND partner_contacts.user_id = auth.uid()
    )
  );

-- Update leads RLS to allow partner contacts to view their leads
CREATE POLICY "Partner contacts can view their partner leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_contacts
      WHERE partner_contacts.partner_id = leads.partner_id
      AND partner_contacts.user_id = auth.uid()
      AND partner_contacts.can_view_leads = true
    )
  );
