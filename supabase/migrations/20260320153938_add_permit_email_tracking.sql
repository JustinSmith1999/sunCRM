/*
  # Add Email Tracking to Permit System

  ## Overview
  Integrates Outlook email tracking with permit applications to automatically
  capture and link all permit-related correspondence with town building departments.

  ## New Table
  
  ### permit_email_correspondence
  Tracks all emails related to permit applications
  - `id` (uuid, primary key)
  - `application_id` (uuid) - Related permit application
  - `outlook_message_id` (text) - Outlook/Exchange message ID
  - `subject` (text) - Email subject
  - `from_email` (text) - Sender email
  - `to_email` (text) - Recipient email(s)
  - `cc_email` (text) - CC recipients
  - `body_preview` (text) - First 200 chars of body
  - `received_date` (timestamptz) - When email was received/sent
  - `direction` (text) - 'inbound' or 'outbound'
  - `has_attachments` (boolean)
  - `attachment_count` (integer)
  - `is_read` (boolean)
  - `importance` (text) - normal, high, low
  - `categories` (text[]) - Outlook categories
  - `outlook_folder` (text) - Which folder it's in
  - `created_at` (timestamptz)

  ## Updates to permit_applications
  - Add email tracking fields
  - Add last_town_contact_date
  - Add town_contact_email for filtering

  ## Indexes
  - Index on application_id for quick lookups
  - Index on outlook_message_id for deduplication
  - Index on received_date for chronological sorting

  ## Security
  - Enable RLS
  - Users can view emails for permits they have access to
*/

-- Create permit_email_correspondence table
CREATE TABLE IF NOT EXISTS permit_email_correspondence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES permit_applications(id) ON DELETE CASCADE,
  outlook_message_id text UNIQUE,
  subject text,
  from_email text,
  to_email text,
  cc_email text,
  body_preview text,
  received_date timestamptz,
  direction text CHECK (direction IN ('inbound', 'outbound')),
  has_attachments boolean DEFAULT false,
  attachment_count integer DEFAULT 0,
  is_read boolean DEFAULT false,
  importance text DEFAULT 'normal',
  categories text[],
  outlook_folder text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permit_emails_app ON permit_email_correspondence(application_id, received_date DESC);
CREATE INDEX IF NOT EXISTS idx_permit_emails_outlook_id ON permit_email_correspondence(outlook_message_id);
CREATE INDEX IF NOT EXISTS idx_permit_emails_date ON permit_email_correspondence(received_date DESC);
CREATE INDEX IF NOT EXISTS idx_permit_emails_direction ON permit_email_correspondence(direction);

-- Add email tracking fields to permit_applications
ALTER TABLE permit_applications ADD COLUMN IF NOT EXISTS last_town_contact_date timestamptz;
ALTER TABLE permit_applications ADD COLUMN IF NOT EXISTS town_contact_email text;
ALTER TABLE permit_applications ADD COLUMN IF NOT EXISTS total_email_count integer DEFAULT 0;
ALTER TABLE permit_applications ADD COLUMN IF NOT EXISTS last_email_subject text;

-- Enable RLS
ALTER TABLE permit_email_correspondence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permit_email_correspondence
CREATE POLICY "Users can view emails for their permits"
  ON permit_email_correspondence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM permit_applications pa
      WHERE pa.id = permit_email_correspondence.application_id
      AND (pa.assigned_coordinator = auth.uid() OR
           EXISTS (
             SELECT 1 FROM user_profiles up
             JOIN user_roles ur ON up.role_id = ur.id
             WHERE up.id = auth.uid()
             AND ur.name IN ('admin', 'super_admin', 'operations_manager')
           ))
    )
  );

CREATE POLICY "System can insert email records"
  ON permit_email_correspondence FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to update permit email counts
CREATE OR REPLACE FUNCTION update_permit_email_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE permit_applications
  SET 
    total_email_count = (
      SELECT COUNT(*) 
      FROM permit_email_correspondence 
      WHERE application_id = NEW.application_id
    ),
    last_town_contact_date = NEW.received_date,
    last_email_subject = NEW.subject
  WHERE id = NEW.application_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update stats
DROP TRIGGER IF EXISTS trigger_update_permit_email_stats ON permit_email_correspondence;
CREATE TRIGGER trigger_update_permit_email_stats
  AFTER INSERT ON permit_email_correspondence
  FOR EACH ROW
  EXECUTE FUNCTION update_permit_email_stats();

-- Create view for permit communication summary
CREATE OR REPLACE VIEW permit_communication_summary AS
SELECT 
  pa.id as application_id,
  pa.application_number,
  pj.name as jurisdiction_name,
  COUNT(pec.id) as total_emails,
  COUNT(pec.id) FILTER (WHERE pec.direction = 'inbound') as inbound_count,
  COUNT(pec.id) FILTER (WHERE pec.direction = 'outbound') as outbound_count,
  MAX(pec.received_date) FILTER (WHERE pec.direction = 'inbound') as last_inbound_date,
  MAX(pec.received_date) FILTER (WHERE pec.direction = 'outbound') as last_outbound_date,
  COUNT(pec.id) FILTER (WHERE NOT pec.is_read AND pec.direction = 'inbound') as unread_count
FROM permit_applications pa
JOIN permit_jurisdictions pj ON pa.jurisdiction_id = pj.id
LEFT JOIN permit_email_correspondence pec ON pa.id = pec.application_id
GROUP BY pa.id, pa.application_number, pj.name;

-- Add comment
COMMENT ON TABLE permit_email_correspondence IS 'Tracks all email correspondence with town building departments for permit applications. Automatically populated via Outlook sync.';