/*
  # Warehouse Sync System

  1. New Tables
    - `warehouse_sync_history`
      - `id` (uuid, primary key)
      - `sync_started_at` (timestamptz)
      - `sync_completed_at` (timestamptz)
      - `status` (text) - 'running', 'completed', 'failed'
      - `file_name` (text) - Excel file name
      - `file_path` (text) - Egnyte file path
      - `file_modified_date` (timestamptz) - Last modified date from Egnyte
      - `records_processed` (integer)
      - `records_added` (integer)
      - `records_updated` (integer)
      - `records_skipped` (integer)
      - `error_message` (text)
      - `sync_mode` (text) - 'full_replace', 'additive', 'smart_merge'
      - `triggered_by` (uuid) - user who triggered sync
      - `metadata` (jsonb) - additional sync details

  2. Changes
    - Add sync tracking columns to `service_parts` table
      - `excel_row_number` (integer)
      - `last_synced_from_excel_at` (timestamptz)
      - `egnyte_source_file` (text)
      - `sync_source` (text) - 'manual', 'excel_sync', 'web_form'

  3. Security
    - Enable RLS on `warehouse_sync_history` table
    - Add policies for authenticated users to view sync history
    - Only admins can trigger syncs
*/

-- Create warehouse sync history table
CREATE TABLE IF NOT EXISTS warehouse_sync_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_started_at timestamptz DEFAULT now(),
  sync_completed_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  file_name text,
  file_path text,
  file_modified_date timestamptz,
  records_processed integer DEFAULT 0,
  records_added integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_skipped integer DEFAULT 0,
  error_message text,
  sync_mode text DEFAULT 'full_replace',
  triggered_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add sync tracking columns to service_parts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_parts' AND column_name = 'excel_row_number'
  ) THEN
    ALTER TABLE service_parts ADD COLUMN excel_row_number integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_parts' AND column_name = 'last_synced_from_excel_at'
  ) THEN
    ALTER TABLE service_parts ADD COLUMN last_synced_from_excel_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_parts' AND column_name = 'egnyte_source_file'
  ) THEN
    ALTER TABLE service_parts ADD COLUMN egnyte_source_file text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_parts' AND column_name = 'sync_source'
  ) THEN
    ALTER TABLE service_parts ADD COLUMN sync_source text DEFAULT 'manual';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE warehouse_sync_history ENABLE ROW LEVEL SECURITY;

-- Policies for warehouse_sync_history
CREATE POLICY "Authenticated users can view warehouse sync history"
  ON warehouse_sync_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert warehouse sync history"
  ON warehouse_sync_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update warehouse sync history"
  ON warehouse_sync_history
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_warehouse_sync_history_status ON warehouse_sync_history(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_sync_history_started_at ON warehouse_sync_history(sync_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_parts_excel_row ON service_parts(excel_row_number);
CREATE INDEX IF NOT EXISTS idx_service_parts_sync_source ON service_parts(sync_source);
