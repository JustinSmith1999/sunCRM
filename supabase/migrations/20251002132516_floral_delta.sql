/*
  # Add RingCentral Integration Tables

  1. New Tables
    - `ringcentral_events` - Store webhook events from RingCentral
    - `user_presence` - Track user presence status
    - `ringcentral_settings` - Store organization RingCentral configuration

  2. Security
    - Enable RLS on all tables
    - Add policies for organization-based access
*/

-- RingCentral Events Table
CREATE TABLE IF NOT EXISTS ringcentral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  session_id text,
  direction text,
  from_number text,
  to_number text,
  status text,
  start_time timestamptz,
  duration integer,
  raw_data jsonb DEFAULT '{}',
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ringcentral_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access RingCentral events in their organization"
  ON ringcentral_events
  FOR ALL
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id 
    FROM user_organization_roles 
    WHERE user_id = auth.uid()
  ));

-- User Presence Table
CREATE TABLE IF NOT EXISTS user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  extension_id text,
  presence_status text DEFAULT 'Available',
  telephony_status text DEFAULT 'NoCall',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own presence"
  ON user_presence
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- RingCentral Settings Table
CREATE TABLE IF NOT EXISTS ringcentral_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id text,
  webhook_url text,
  auto_create_activities boolean DEFAULT true,
  auto_create_leads boolean DEFAULT true,
  default_activity_owner uuid REFERENCES user_profiles(id),
  settings jsonb DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ringcentral_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access RingCentral settings in their organization"
  ON ringcentral_settings
  FOR ALL
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id 
    FROM user_organization_roles 
    WHERE user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ringcentral_events_org_id ON ringcentral_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_ringcentral_events_session ON ringcentral_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ringcentral_events_phone ON ringcentral_events(from_number, to_number);
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_ringcentral_settings_org_id ON ringcentral_settings(organization_id);