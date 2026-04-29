/*
  # Add Email Templates and Enhance Web Forms

  1. New Tables
    - `email_templates`
      - `id` (uuid, primary key) - Template identifier
      - `organization_id` (uuid) - Organization owner
      - `name` (text) - Template name
      - `subject` (text) - Email subject line
      - `body_html` (text) - HTML email body
      - `body_text` (text) - Plain text fallback
      - `template_type` (text) - Type: lead_auto_response, notification, etc.
      - `is_active` (boolean) - Whether template is active
      - `created_by` (uuid) - Creator
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update

  2. Changes to web_forms
    - Add `selected_fields` (jsonb) - Array of field names to display
    - Add `auto_response_enabled` (boolean) - Enable auto-response emails
    - Add `auto_response_template_id` (uuid) - Link to email template
    - Add `notification_enabled` (boolean) - Send notifications to owner
    - Add `notification_emails` (text[]) - Additional emails to notify
    - Add `capture_utm` (boolean) - Auto-capture UTM parameters
    - Add `capture_ip` (boolean) - Capture submitter IP

  3. Security
    - Enable RLS on `email_templates` table
    - Add policies for email_templates access
*/

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  template_type text DEFAULT 'lead_auto_response',
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email templates in their organization"
  ON email_templates FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create email templates in their organization"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update email templates in their organization"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete email templates in their organization"
  ON email_templates FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_email_templates_organization ON email_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_forms' AND column_name = 'selected_fields') THEN
    ALTER TABLE web_forms ADD COLUMN selected_fields jsonb DEFAULT '["first_name", "last_name", "email", "phone", "company", "description"]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_forms' AND column_name = 'auto_response_enabled') THEN
    ALTER TABLE web_forms ADD COLUMN auto_response_enabled boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_forms' AND column_name = 'auto_response_template_id') THEN
    ALTER TABLE web_forms ADD COLUMN auto_response_template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_forms' AND column_name = 'notification_enabled') THEN
    ALTER TABLE web_forms ADD COLUMN notification_enabled boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_forms' AND column_name = 'notification_emails') THEN
    ALTER TABLE web_forms ADD COLUMN notification_emails text[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_forms' AND column_name = 'capture_utm') THEN
    ALTER TABLE web_forms ADD COLUMN capture_utm boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_forms' AND column_name = 'capture_ip') THEN
    ALTER TABLE web_forms ADD COLUMN capture_ip boolean DEFAULT true;
  END IF;
END $$;
