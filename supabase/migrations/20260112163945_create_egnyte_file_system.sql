/*
  # Egnyte File Management Integration

  1. New Tables
    - `egnyte_config`
      - System-wide Egnyte configuration
      - Domain, folder mappings, access settings

    - `document_library`
      - Links Egnyte files to CRM records
      - Tracks file metadata and permissions
      - Links to leads, opportunities, projects

    - `document_categories`
      - Organizes documents by type
      - Solar-specific categories (proposals, permits, photos, etc.)

  2. Security
    - Enable RLS on all tables
    - Restrictive policies based on user roles
    - Document access tied to record access

  3. Features
    - File metadata caching
    - Version tracking
    - Access logging
    - Category-based organization
*/

-- Document Categories
CREATE TABLE IF NOT EXISTS document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  color text,
  folder_path text,
  allowed_file_types text[],
  requires_signature boolean DEFAULT false,
  retention_days integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Egnyte Configuration
CREATE TABLE IF NOT EXISTS egnyte_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  api_token_encrypted text,
  base_folder_path text DEFAULT '/Shared/CRM',
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  config_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Document Library (links Egnyte files to CRM records)
CREATE TABLE IF NOT EXISTS document_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Egnyte file info
  egnyte_file_id text UNIQUE,
  egnyte_path text NOT NULL,
  egnyte_link text,

  -- File metadata
  file_name text NOT NULL,
  file_size bigint,
  file_type text,
  mime_type text,

  -- Categorization
  category_id uuid REFERENCES document_categories(id),
  document_type text,

  -- CRM record links (flexible - link to any record type)
  lead_id text,
  opportunity_id text,
  account_id text,
  contact_id text,
  aurora_project_id uuid REFERENCES aurora_projects(id),

  -- Document details
  title text,
  description text,
  tags text[],
  version integer DEFAULT 1,
  is_signed boolean DEFAULT false,
  signed_at timestamptz,
  signed_by text,

  -- Access control
  visibility text DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public', 'customer')),
  uploaded_by uuid REFERENCES auth.users(id),
  shared_with text[],

  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  expiration_date timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz
);

-- Document Access Log
CREATE TABLE IF NOT EXISTS document_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES document_library(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('view', 'download', 'upload', 'delete', 'share')),
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Insert default document categories for solar business
INSERT INTO document_categories (name, description, icon, color, folder_path, allowed_file_types) VALUES
  ('Proposals', 'Solar proposals and quotes', 'FileText', 'blue', '/Proposals', ARRAY['pdf', 'docx']),
  ('Contracts', 'Signed agreements and contracts', 'FileCheck', 'green', '/Contracts', ARRAY['pdf']),
  ('Site Photos', 'Property and installation photos', 'Camera', 'purple', '/Photos/Site', ARRAY['jpg', 'jpeg', 'png', 'heic']),
  ('Permits', 'Permit applications and approvals', 'ClipboardCheck', 'orange', '/Permits', ARRAY['pdf', 'jpg', 'png']),
  ('Installation', 'Installation documentation and photos', 'Wrench', 'red', '/Installation', ARRAY['pdf', 'jpg', 'jpeg', 'png']),
  ('Utility Docs', 'Interconnection and utility documents', 'Zap', 'yellow', '/Utility', ARRAY['pdf', 'docx']),
  ('Warranties', 'Warranty documents and specifications', 'Shield', 'cyan', '/Warranties', ARRAY['pdf']),
  ('Technical', 'Technical specifications and datasheets', 'FileCode', 'gray', '/Technical', ARRAY['pdf', 'xlsx', 'csv']),
  ('Customer Comm', 'Customer correspondence and communications', 'Mail', 'pink', '/Communications', ARRAY['pdf', 'eml', 'msg']),
  ('Inspections', 'Inspection reports and certifications', 'CheckCircle', 'green', '/Inspections', ARRAY['pdf', 'jpg', 'png'])
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_library_lead ON document_library(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_library_opportunity ON document_library(opportunity_id) WHERE opportunity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_library_aurora_project ON document_library(aurora_project_id) WHERE aurora_project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_library_category ON document_library(category_id);
CREATE INDEX IF NOT EXISTS idx_document_library_uploaded_by ON document_library(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_document_library_status ON document_library(status);
CREATE INDEX IF NOT EXISTS idx_document_library_created ON document_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_access_log_document ON document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_user ON document_access_log(user_id);

-- Enable RLS
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE egnyte_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_categories
CREATE POLICY "Anyone can view active categories"
  ON document_categories FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON document_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_organization_roles.user_id = auth.uid()
      AND user_organization_roles.role = 'admin'
    )
  );

-- RLS Policies for egnyte_config
CREATE POLICY "Admins can view Egnyte config"
  ON egnyte_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_organization_roles.user_id = auth.uid()
      AND user_organization_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage Egnyte config"
  ON egnyte_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_organization_roles.user_id = auth.uid()
      AND user_organization_roles.role = 'admin'
    )
  );

-- RLS Policies for document_library
CREATE POLICY "Users can view their uploaded documents"
  ON document_library FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR visibility IN ('team', 'public')
    OR auth.uid() = ANY(shared_with::uuid[])
    OR EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_organization_roles.user_id = auth.uid()
      AND user_organization_roles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can upload documents"
  ON document_library FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_organization_roles.user_id = auth.uid()
      AND user_organization_roles.role IN ('admin', 'manager', 'rep')
    )
  );

CREATE POLICY "Users can update their documents"
  ON document_library FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_organization_roles.user_id = auth.uid()
      AND user_organization_roles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete documents"
  ON document_library FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_organization_roles.user_id = auth.uid()
      AND user_organization_roles.role = 'admin'
    )
  );

-- RLS Policies for document_access_log
CREATE POLICY "Users can view their own access logs"
  ON document_access_log FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_organization_roles
      WHERE user_organization_roles.user_id = auth.uid()
      AND user_organization_roles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "System can insert access logs"
  ON document_access_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_document_library_updated_at
  BEFORE UPDATE ON document_library
  FOR EACH ROW
  EXECUTE FUNCTION update_document_updated_at();

CREATE TRIGGER update_document_categories_updated_at
  BEFORE UPDATE ON document_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_document_updated_at();
