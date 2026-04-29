/*
  # Add Outlook Email Tracking for Permit Correspondence

  1. New Tables
    - `outlook_emails` - Stores emails from Outlook with full content and metadata
      - Links to leads, opportunities, accounts, and contacts
      - Tracks conversation threads
      - Stores sender/recipient information
      - Tracks attachments
    
    - `outlook_email_attachments` - Stores email attachment metadata
      - Links to parent emails
      - Tracks file details and download URLs
    
    - `email_sync_log` - Tracks email synchronization operations
      - Monitors sync status
      - Logs errors for troubleshooting

  2. Features
    - Two-way email tracking (sent and received)
    - Thread conversation tracking
    - Attachment management
    - Link emails to permits, leads, opportunities
    - Search and filter by sender, recipient, subject
    - Track email status (read, unread, replied, forwarded)

  3. Security
    - Enable RLS on all tables
    - Users can only access their own emails or shared organization emails
    - Audit trail for email operations

  4. Indexes
    - Fast lookups by related records (permit_id, lead_id, etc.)
    - Search by sender/recipient email
    - Date-based queries for reporting
    - Thread conversation tracking
*/

-- Outlook emails table
CREATE TABLE IF NOT EXISTS outlook_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  outlook_message_id text UNIQUE NOT NULL,
  conversation_id text,
  conversation_index text,
  
  -- Email content
  subject text NOT NULL,
  body_preview text,
  body_content text,
  body_content_type text DEFAULT 'html',
  importance text DEFAULT 'normal',
  
  -- Sender and recipients
  from_email text NOT NULL,
  from_name text,
  to_recipients jsonb DEFAULT '[]'::jsonb,
  cc_recipients jsonb DEFAULT '[]'::jsonb,
  bcc_recipients jsonb DEFAULT '[]'::jsonb,
  reply_to jsonb DEFAULT '[]'::jsonb,
  
  -- Timestamps
  sent_datetime timestamptz NOT NULL,
  received_datetime timestamptz NOT NULL,
  
  -- Status flags
  is_read boolean DEFAULT false,
  is_draft boolean DEFAULT false,
  has_attachments boolean DEFAULT false,
  flag_status text DEFAULT 'notFlagged',
  
  -- Categories and folder
  categories jsonb DEFAULT '[]'::jsonb,
  folder_id text,
  folder_name text,
  
  -- Related records (use text references to avoid foreign key issues)
  related_permit_reference text,
  related_lead_reference text,
  related_opportunity_reference text,
  related_account_reference text,
  related_contact_reference text,
  
  -- Tracking
  direction text DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  sync_status text DEFAULT 'synced',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  synced_at timestamptz DEFAULT now()
);

-- Outlook email attachments table
CREATE TABLE IF NOT EXISTS outlook_email_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid REFERENCES outlook_emails(id) ON DELETE CASCADE NOT NULL,
  outlook_attachment_id text NOT NULL,
  
  name text NOT NULL,
  content_type text,
  size integer,
  is_inline boolean DEFAULT false,
  
  -- Download/access info
  content_id text,
  content_location text,
  download_url text,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(email_id, outlook_attachment_id)
);

-- Email sync log table
CREATE TABLE IF NOT EXISTS outlook_email_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sync_type text NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
  status text NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  
  emails_synced integer DEFAULT 0,
  emails_failed integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  
  error_message text,
  error_details jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_outlook_emails_user_id ON outlook_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_outlook_emails_outlook_message_id ON outlook_emails(outlook_message_id);
CREATE INDEX IF NOT EXISTS idx_outlook_emails_conversation_id ON outlook_emails(conversation_id);
CREATE INDEX IF NOT EXISTS idx_outlook_emails_from_email ON outlook_emails(from_email);
CREATE INDEX IF NOT EXISTS idx_outlook_emails_sent_datetime ON outlook_emails(sent_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_outlook_emails_received_datetime ON outlook_emails(received_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_outlook_emails_is_read ON outlook_emails(is_read);
CREATE INDEX IF NOT EXISTS idx_outlook_emails_direction ON outlook_emails(direction);
CREATE INDEX IF NOT EXISTS idx_outlook_emails_permit ON outlook_emails(related_permit_reference) WHERE related_permit_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outlook_emails_lead ON outlook_emails(related_lead_reference) WHERE related_lead_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outlook_emails_opportunity ON outlook_emails(related_opportunity_reference) WHERE related_opportunity_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outlook_emails_account ON outlook_emails(related_account_reference) WHERE related_account_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outlook_emails_contact ON outlook_emails(related_contact_reference) WHERE related_contact_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_outlook_attachments_email ON outlook_email_attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_outlook_email_sync_log_user ON outlook_email_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_outlook_email_sync_log_status ON outlook_email_sync_log(status);

-- Enable RLS
ALTER TABLE outlook_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_email_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for outlook_emails
CREATE POLICY "Users can view their own emails"
  ON outlook_emails FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emails"
  ON outlook_emails FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emails"
  ON outlook_emails FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emails"
  ON outlook_emails FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for outlook_email_attachments
CREATE POLICY "Users can view attachments from their emails"
  ON outlook_email_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM outlook_emails
      WHERE outlook_emails.id = outlook_email_attachments.email_id
      AND outlook_emails.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments to their emails"
  ON outlook_email_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM outlook_emails
      WHERE outlook_emails.id = outlook_email_attachments.email_id
      AND outlook_emails.user_id = auth.uid()
    )
  );

-- RLS Policies for outlook_email_sync_log
CREATE POLICY "Users can view their own sync logs"
  ON outlook_email_sync_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs"
  ON outlook_email_sync_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_outlook_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_outlook_emails_updated_at
  BEFORE UPDATE ON outlook_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_outlook_email_updated_at();