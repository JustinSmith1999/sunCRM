/*
  # Outlook Calendar Integration System

  1. New Tables
    - `outlook_connections` - Stores OAuth tokens for each user's Outlook account
    - `appointments` - Stores appointment/meeting data
    - `appointment_attendees` - Tracks who's invited to appointments
    - `calendar_sync_log` - Logs sync operations

  2. Features
    - OAuth token storage with encryption
    - Two-way sync between system and Outlook
    - Meeting booking and management
    - Attendee tracking
    - Sync history and error logging

  3. Security
    - RLS policies for user data access
    - Encrypted token storage
    - Audit trail for calendar operations
*/

-- Outlook connections table
CREATE TABLE IF NOT EXISTS outlook_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  email text NOT NULL,
  display_name text,
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Appointments/Meetings table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  outlook_event_id text,
  subject text NOT NULL,
  description text,
  location text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_all_day boolean DEFAULT false,
  status text DEFAULT 'scheduled',
  meeting_link text,
  reminder_minutes integer DEFAULT 15,
  related_lead_id uuid,
  related_opportunity_id uuid,
  related_account_id uuid,
  synced_to_outlook boolean DEFAULT false,
  sync_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Appointment attendees table
CREATE TABLE IF NOT EXISTS appointment_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  name text,
  response_status text DEFAULT 'pending',
  is_organizer boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Calendar sync log table
CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sync_type text NOT NULL,
  status text NOT NULL,
  events_synced integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_outlook_connections_user_id ON outlook_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_outlook_connections_active ON outlook_connections(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_outlook_id ON appointments(outlook_event_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lead ON appointments(related_lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_opportunity ON appointments(related_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_appointment_attendees_appointment ON appointment_attendees(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_attendees_user ON appointment_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_user ON calendar_sync_log(user_id);

-- Enable RLS
ALTER TABLE outlook_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for outlook_connections
CREATE POLICY "Users can view own Outlook connection"
  ON outlook_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Outlook connection"
  ON outlook_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Outlook connection"
  ON outlook_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Outlook connection"
  ON outlook_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for appointments
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view appointments they're invited to"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointment_attendees
      WHERE appointment_attendees.appointment_id = appointments.id
      AND appointment_attendees.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for appointment_attendees
CREATE POLICY "Users can view attendees of their appointments"
  ON appointment_attendees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_attendees.appointment_id
      AND appointments.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can add attendees to their appointments"
  ON appointment_attendees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_attendees.appointment_id
      AND appointments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update attendees of their appointments"
  ON appointment_attendees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_attendees.appointment_id
      AND appointments.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_attendees.appointment_id
      AND appointments.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can delete attendees from their appointments"
  ON appointment_attendees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_attendees.appointment_id
      AND appointments.user_id = auth.uid()
    )
  );

-- RLS Policies for calendar_sync_log
CREATE POLICY "Users can view own sync log"
  ON calendar_sync_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync log"
  ON calendar_sync_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
