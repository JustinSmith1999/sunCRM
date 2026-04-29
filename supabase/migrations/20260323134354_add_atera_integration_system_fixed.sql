/*
  # Atera Integration System

  1. New Tables
    - `atera_config` - Store Atera API configuration
    - `atera_ticket_mappings` - Map IT tickets to Atera tickets
    - `atera_sync_log` - Log all sync activities

  2. Security
    - Enable RLS on all tables
    - Only admins can manage Atera configuration
    - IT staff and ticket owners can view sync status

  3. Purpose
    - Sync IT support tickets with Atera PSA system
    - Track sync status and errors
    - Maintain bidirectional sync capability
*/

-- Create Atera config table
CREATE TABLE IF NOT EXISTS atera_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text NOT NULL,
  api_url text DEFAULT 'https://app.atera.com/api/v3',
  is_active boolean DEFAULT false,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Atera ticket mappings table
CREATE TABLE IF NOT EXISTS atera_ticket_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  it_ticket_id uuid NOT NULL REFERENCES it_support_tickets(id) ON DELETE CASCADE,
  atera_ticket_id text NOT NULL,
  atera_ticket_number text,
  last_synced_at timestamptz DEFAULT now(),
  sync_status text DEFAULT 'pending',
  sync_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_sync_status CHECK (sync_status IN ('pending', 'synced', 'error')),
  CONSTRAINT unique_it_ticket UNIQUE (it_ticket_id),
  CONSTRAINT unique_atera_ticket UNIQUE (atera_ticket_id)
);

-- Create Atera sync log table
CREATE TABLE IF NOT EXISTS atera_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES it_support_tickets(id) ON DELETE CASCADE,
  action text NOT NULL,
  direction text NOT NULL,
  status text NOT NULL,
  request_data jsonb,
  response_data jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_action CHECK (action IN ('create', 'update', 'comment', 'resolve', 'close')),
  CONSTRAINT valid_direction CHECK (direction IN ('to_atera', 'from_atera')),
  CONSTRAINT valid_log_status CHECK (status IN ('success', 'error'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_atera_mappings_it_ticket ON atera_ticket_mappings(it_ticket_id);
CREATE INDEX IF NOT EXISTS idx_atera_mappings_atera_ticket ON atera_ticket_mappings(atera_ticket_id);
CREATE INDEX IF NOT EXISTS idx_atera_mappings_status ON atera_ticket_mappings(sync_status);
CREATE INDEX IF NOT EXISTS idx_atera_sync_log_ticket ON atera_sync_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_atera_sync_log_created ON atera_sync_log(created_at DESC);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_atera_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_atera_config_timestamp
  BEFORE UPDATE ON atera_config
  FOR EACH ROW
  EXECUTE FUNCTION update_atera_timestamp();

CREATE TRIGGER trigger_update_atera_mappings_timestamp
  BEFORE UPDATE ON atera_ticket_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_atera_timestamp();

-- Enable RLS
ALTER TABLE atera_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE atera_ticket_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE atera_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for atera_config

-- Only tech@sunation.com can view config
CREATE POLICY "IT staff can view Atera config"
  ON atera_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'tech@sunation.com'
    )
  );

-- Only tech@sunation.com can manage config
CREATE POLICY "IT staff can manage Atera config"
  ON atera_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'tech@sunation.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'tech@sunation.com'
    )
  );

-- RLS Policies for atera_ticket_mappings

-- IT staff can view all mappings
CREATE POLICY "IT staff can view Atera mappings"
  ON atera_ticket_mappings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'tech@sunation.com'
    )
  );

-- Users can view mappings for their tickets
CREATE POLICY "Users can view own ticket mappings"
  ON atera_ticket_mappings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM it_support_tickets
      WHERE it_support_tickets.id = it_ticket_id
      AND it_support_tickets.user_id = auth.uid()
    )
  );

-- Only IT staff can create/update mappings
CREATE POLICY "IT staff can manage mappings"
  ON atera_ticket_mappings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'tech@sunation.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'tech@sunation.com'
    )
  );

-- RLS Policies for atera_sync_log

-- IT staff can view all logs
CREATE POLICY "IT staff can view sync logs"
  ON atera_sync_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'tech@sunation.com'
    )
  );

-- Users can view logs for their tickets
CREATE POLICY "Users can view own ticket logs"
  ON atera_sync_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM it_support_tickets
      WHERE it_support_tickets.id = ticket_id
      AND it_support_tickets.user_id = auth.uid()
    )
  );

-- System can insert logs
CREATE POLICY "System can insert sync logs"
  ON atera_sync_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add Atera sync fields to IT tickets table
ALTER TABLE it_support_tickets
ADD COLUMN IF NOT EXISTS synced_to_atera boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS atera_sync_status text DEFAULT 'not_synced',
ADD COLUMN IF NOT EXISTS last_atera_sync timestamptz;

-- Add constraint for sync status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_atera_sync_status'
  ) THEN
    ALTER TABLE it_support_tickets
    ADD CONSTRAINT valid_atera_sync_status 
    CHECK (atera_sync_status IN ('not_synced', 'syncing', 'synced', 'error'));
  END IF;
END $$;