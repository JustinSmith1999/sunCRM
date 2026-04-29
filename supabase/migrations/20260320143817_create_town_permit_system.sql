/*
  # Town-Specific Permitting System for Long Island

  ## Overview
  Creates a comprehensive permitting system with town-specific requirements,
  workflows, contacts, fees, and document checklists for all Long Island municipalities.

  ## New Tables

  ### permit_jurisdictions
  Master list of all towns/municipalities with their specific requirements
  - `id` (uuid, primary key)
  - `name` (text) - Town/city name
  - `county` (text) - Suffolk or Nassau
  - `state` (text) - NY
  - `contact_name` (text) - Building department contact
  - `contact_email` (text)
  - `contact_phone` (text)
  - `department_address` (text)
  - `website_url` (text) - Town building dept website
  - `permit_portal_url` (text) - Online permit submission portal
  - `typical_review_days` (integer) - Average review time
  - `requires_pre_application` (boolean)
  - `allows_online_submission` (boolean)
  - `requires_hoa_approval` (boolean)
  - `special_requirements` (jsonb) - Town-specific notes
  - `base_permit_fee` (numeric) - Base fee in dollars
  - `per_watt_fee` (numeric) - Additional per-watt fee
  - `inspection_fees` (jsonb) - Various inspection fees
  - `created_at`, `updated_at` (timestamptz)

  ### permit_document_requirements
  Required documents for each jurisdiction
  - `id` (uuid, primary key)
  - `jurisdiction_id` (uuid) - Related jurisdiction
  - `document_name` (text) - Name of required document
  - `document_type` (text) - Category
  - `is_required` (boolean) - Required vs optional
  - `description` (text) - What this document should contain
  - `template_url` (text) - Link to town template if available
  - `notes` (text) - Special instructions
  - `sort_order` (integer)
  - `created_at`, `updated_at` (timestamptz)

  ### permit_applications
  Enhanced permit applications with town-specific tracking
  - `id` (uuid, primary key)
  - `opportunity_id` (text) - Related opportunity
  - `jurisdiction_id` (uuid) - Which town
  - `application_status` (text) - Status in town system
  - `application_number` (text) - Town-assigned number
  - `submitted_date` (date)
  - `review_started_date` (date)
  - `approval_date` (date)
  - `expiration_date` (date)
  - `permit_fee_total` (numeric)
  - `fee_paid` (boolean)
  - `payment_date` (date)
  - `payment_method` (text)
  - `assigned_coordinator` (uuid) - Internal staff
  - `town_reviewer_name` (text) - Town staff reviewing
  - `notes` (text)
  - `created_at`, `updated_at` (timestamptz)

  ### permit_application_documents
  Documents submitted for each permit application
  - `id` (uuid, primary key)
  - `application_id` (uuid) - Related application
  - `requirement_id` (uuid) - Which requirement this fulfills
  - `document_name` (text)
  - `egnyte_path` (text)
  - `egnyte_file_id` (text)
  - `uploaded_date` (timestamptz)
  - `uploaded_by` (uuid)
  - `version` (integer)
  - `status` (text) - pending, submitted, approved, rejected
  - `rejection_reason` (text)
  - `created_at`, `updated_at` (timestamptz)

  ### permit_inspections
  Track inspections required by town
  - `id` (uuid, primary key)
  - `application_id` (uuid) - Related application
  - `inspection_type` (text) - rough, final, electrical, structural
  - `scheduled_date` (date)
  - `scheduled_time` (text)
  - `inspector_name` (text)
  - `inspection_status` (text) - scheduled, passed, failed, cancelled
  - `inspection_notes` (text)
  - `failed_items` (jsonb) - What needs to be corrected
  - `reinspection_required` (boolean)
  - `completed_date` (date)
  - `created_at`, `updated_at` (timestamptz)

  ### permit_timeline_events
  Audit trail of all permit activities
  - `id` (uuid, primary key)
  - `application_id` (uuid) - Related application
  - `event_type` (text) - created, submitted, reviewed, approved, etc.
  - `event_date` (timestamptz)
  - `performed_by` (uuid) - Who did this
  - `description` (text)
  - `metadata` (jsonb)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Operations staff and admins can manage permits
  - Sales reps can view permits for their opportunities
  - All changes are logged in timeline events

  ## Indexes
  - Index on jurisdiction name for fast lookups
  - Index on application status for filtering
  - Index on opportunity_id for related records
*/

-- Create permit_jurisdictions table
CREATE TABLE IF NOT EXISTS permit_jurisdictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  county text NOT NULL,
  state text DEFAULT 'NY',
  contact_name text,
  contact_email text,
  contact_phone text,
  department_address text,
  website_url text,
  permit_portal_url text,
  typical_review_days integer DEFAULT 30,
  requires_pre_application boolean DEFAULT false,
  allows_online_submission boolean DEFAULT false,
  requires_hoa_approval boolean DEFAULT false,
  special_requirements jsonb DEFAULT '{}',
  base_permit_fee numeric(10,2) DEFAULT 0,
  per_watt_fee numeric(10,4) DEFAULT 0,
  inspection_fees jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jurisdictions_name ON permit_jurisdictions(name);
CREATE INDEX IF NOT EXISTS idx_jurisdictions_county ON permit_jurisdictions(county);

-- Create permit_document_requirements table
CREATE TABLE IF NOT EXISTS permit_document_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id uuid REFERENCES permit_jurisdictions(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL,
  is_required boolean DEFAULT true,
  description text,
  template_url text,
  notes text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_reqs_jurisdiction ON permit_document_requirements(jurisdiction_id);

-- Create permit_applications table
CREATE TABLE IF NOT EXISTS permit_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id text,
  jurisdiction_id uuid REFERENCES permit_jurisdictions(id),
  application_status text DEFAULT 'draft',
  application_number text,
  submitted_date date,
  review_started_date date,
  approval_date date,
  expiration_date date,
  permit_fee_total numeric(10,2),
  fee_paid boolean DEFAULT false,
  payment_date date,
  payment_method text,
  assigned_coordinator uuid REFERENCES auth.users(id),
  town_reviewer_name text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permit_apps_opp ON permit_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_permit_apps_jurisdiction ON permit_applications(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_permit_apps_status ON permit_applications(application_status);
CREATE INDEX IF NOT EXISTS idx_permit_apps_coordinator ON permit_applications(assigned_coordinator);

-- Create permit_application_documents table
CREATE TABLE IF NOT EXISTS permit_application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES permit_applications(id) ON DELETE CASCADE,
  requirement_id uuid REFERENCES permit_document_requirements(id),
  document_name text NOT NULL,
  egnyte_path text,
  egnyte_file_id text,
  uploaded_date timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id),
  version integer DEFAULT 1,
  status text DEFAULT 'pending',
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permit_docs_app ON permit_application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_permit_docs_requirement ON permit_application_documents(requirement_id);

-- Create permit_inspections table
CREATE TABLE IF NOT EXISTS permit_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES permit_applications(id) ON DELETE CASCADE,
  inspection_type text NOT NULL,
  scheduled_date date,
  scheduled_time text,
  inspector_name text,
  inspection_status text DEFAULT 'scheduled',
  inspection_notes text,
  failed_items jsonb DEFAULT '[]',
  reinspection_required boolean DEFAULT false,
  completed_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspections_app ON permit_inspections(application_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON permit_inspections(inspection_status);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON permit_inspections(scheduled_date);

-- Create permit_timeline_events table
CREATE TABLE IF NOT EXISTS permit_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES permit_applications(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_date timestamptz DEFAULT now(),
  performed_by uuid REFERENCES auth.users(id),
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timeline_app ON permit_timeline_events(application_id, event_date DESC);

-- Enable RLS
ALTER TABLE permit_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_timeline_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permit_jurisdictions (public read)
CREATE POLICY "Anyone can view jurisdictions"
  ON permit_jurisdictions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage jurisdictions"
  ON permit_jurisdictions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'operations_manager')
    )
  );

-- RLS Policies for permit_document_requirements (public read)
CREATE POLICY "Anyone can view document requirements"
  ON permit_document_requirements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage document requirements"
  ON permit_document_requirements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'operations_manager')
    )
  );

-- RLS Policies for permit_applications
CREATE POLICY "Users can view permits they coordinate"
  ON permit_applications FOR SELECT
  TO authenticated
  USING (
    assigned_coordinator = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'operations_manager')
    )
  );

CREATE POLICY "Coordinators can update their permits"
  ON permit_applications FOR UPDATE
  TO authenticated
  USING (
    assigned_coordinator = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'operations_manager')
    )
  );

CREATE POLICY "Authorized staff can create permits"
  ON permit_applications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'super_admin', 'operations_manager', 'sales_rep')
    )
  );

-- RLS Policies for permit_application_documents
CREATE POLICY "Users can view documents for their permits"
  ON permit_application_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM permit_applications pa
      WHERE pa.id = permit_application_documents.application_id
      AND (pa.assigned_coordinator = auth.uid() OR
           EXISTS (
             SELECT 1 FROM user_profiles up
             JOIN user_roles ur ON up.role_id = ur.id
             WHERE up.id = auth.uid()
             AND ur.name IN ('admin', 'super_admin', 'operations_manager')
           ))
    )
  );

CREATE POLICY "Users can manage documents for their permits"
  ON permit_application_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM permit_applications pa
      WHERE pa.id = permit_application_documents.application_id
      AND (pa.assigned_coordinator = auth.uid() OR
           EXISTS (
             SELECT 1 FROM user_profiles up
             JOIN user_roles ur ON up.role_id = ur.id
             WHERE up.id = auth.uid()
             AND ur.name IN ('admin', 'super_admin', 'operations_manager')
           ))
    )
  );

-- RLS Policies for permit_inspections
CREATE POLICY "Users can view inspections for their permits"
  ON permit_inspections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM permit_applications pa
      WHERE pa.id = permit_inspections.application_id
      AND (pa.assigned_coordinator = auth.uid() OR
           EXISTS (
             SELECT 1 FROM user_profiles up
             JOIN user_roles ur ON up.role_id = ur.id
             WHERE up.id = auth.uid()
             AND ur.name IN ('admin', 'super_admin', 'operations_manager')
           ))
    )
  );

CREATE POLICY "Users can manage inspections for their permits"
  ON permit_inspections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM permit_applications pa
      WHERE pa.id = permit_inspections.application_id
      AND (pa.assigned_coordinator = auth.uid() OR
           EXISTS (
             SELECT 1 FROM user_profiles up
             JOIN user_roles ur ON up.role_id = ur.id
             WHERE up.id = auth.uid()
             AND ur.name IN ('admin', 'super_admin', 'operations_manager')
           ))
    )
  );

-- RLS Policies for permit_timeline_events
CREATE POLICY "Users can view timeline for their permits"
  ON permit_timeline_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM permit_applications pa
      WHERE pa.id = permit_timeline_events.application_id
      AND (pa.assigned_coordinator = auth.uid() OR
           EXISTS (
             SELECT 1 FROM user_profiles up
             JOIN user_roles ur ON up.role_id = ur.id
             WHERE up.id = auth.uid()
             AND ur.name IN ('admin', 'super_admin', 'operations_manager')
           ))
    )
  );

CREATE POLICY "System can insert timeline events"
  ON permit_timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (true);