/*
  # Create Web Forms table for Web-to-Lead functionality

  1. New Tables
    - `web_forms`
      - `id` (uuid, primary key) - Unique form identifier
      - `organization_id` (uuid) - Organization that owns the form
      - `name` (text) - Form name for internal reference
      - `description` (text) - Form description
      - `is_active` (boolean) - Whether form accepts submissions
      - `redirect_url` (text) - URL to redirect after successful submission
      - `success_message` (text) - Message shown on success
      - `default_owner_id` (uuid) - Default lead owner
      - `default_lead_source` (text) - Default lead source value
      - `default_campaign_id` (uuid) - Optional default campaign
      - `fields_config` (jsonb) - Custom field configurations
      - `form_key` (text, unique) - Public key for form submissions
      - `submissions_count` (integer) - Track total submissions
      - `created_by` (uuid) - User who created the form
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `web_forms` table
    - Policy for authenticated users to read forms in their org
    - Policy for authenticated users to create forms in their org
    - Policy for authenticated users to update forms in their org
    - Policy for authenticated users to delete forms in their org
*/

CREATE TABLE IF NOT EXISTS web_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  redirect_url text,
  success_message text DEFAULT 'Thank you for your submission!',
  default_owner_id uuid REFERENCES user_profiles(id),
  default_lead_source text DEFAULT 'Website',
  default_campaign_id uuid,
  fields_config jsonb DEFAULT '{"fields": []}'::jsonb,
  form_key text UNIQUE NOT NULL DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 32),
  submissions_count integer DEFAULT 0,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE web_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view web forms in their organization"
  ON web_forms FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create web forms in their organization"
  ON web_forms FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update web forms in their organization"
  ON web_forms FOR UPDATE
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

CREATE POLICY "Users can delete web forms in their organization"
  ON web_forms FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_web_forms_organization ON web_forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_web_forms_form_key ON web_forms(form_key);
CREATE INDEX IF NOT EXISTS idx_web_forms_is_active ON web_forms(is_active);
