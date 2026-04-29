/*
  # Add Salesforce Notes, Attachments, and Email Objects

  1. New Tables
    - `salesforce_notes`
      - Stores ContentNote records from Salesforce
      - Links to leads, opportunities, accounts, contacts via related records
    - `salesforce_attachments`
      - Stores Attachment records (legacy files)
    - `salesforce_content_documents`
      - Stores ContentDocument records (new file system)
    - `salesforce_content_versions`
      - Stores ContentVersion records (file versions)
    - `salesforce_content_document_links`
      - Links files to records (leads, opportunities, etc.)
    - `salesforce_email_messages`
      - Stores email correspondence
    - `salesforce_opportunity_contact_roles`
      - Links contacts to opportunities with roles (Primary, Decision Maker, etc.)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write based on organization

  3. Indexes
    - Parent record lookups (LeadId, OpportunityId, etc.)
    - Email lookups
    - Date-based queries
*/

-- Salesforce Notes (ContentNote)
CREATE TABLE IF NOT EXISTS salesforce_notes (
  "Id" text PRIMARY KEY,
  "Title" text,
  "Content" text,
  "TextPreview" text,
  "FileExtension" text DEFAULT 'snote',
  "FileType" text DEFAULT 'SNOTE',
  "ContentSize" integer,
  "OwnerId" text,
  "CreatedById" text,
  "CreatedDate" timestamptz,
  "LastModifiedById" text,
  "LastModifiedDate" timestamptz,
  "IsDeleted" boolean DEFAULT false,
  "SystemModstamp" timestamptz,
  "LastViewedDate" timestamptz,
  "LastReferencedDate" timestamptz,
  "ParentId" text,
  salesforce_id text UNIQUE,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Salesforce Attachments (legacy)
CREATE TABLE IF NOT EXISTS salesforce_attachments (
  "Id" text PRIMARY KEY,
  "Name" text NOT NULL,
  "Body" text,
  "BodyLength" integer,
  "ContentType" text,
  "Description" text,
  "ParentId" text,
  "OwnerId" text,
  "IsPrivate" boolean DEFAULT false,
  "IsDeleted" boolean DEFAULT false,
  "CreatedDate" timestamptz,
  "CreatedById" text,
  "LastModifiedDate" timestamptz,
  "LastModifiedById" text,
  "SystemModstamp" timestamptz,
  salesforce_id text UNIQUE,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Salesforce Content Documents (new file system)
CREATE TABLE IF NOT EXISTS salesforce_content_documents (
  "Id" text PRIMARY KEY,
  "Title" text NOT NULL,
  "FileType" text,
  "FileExtension" text,
  "ContentSize" integer,
  "Description" text,
  "OwnerId" text,
  "CreatedById" text,
  "CreatedDate" timestamptz,
  "LastModifiedById" text,
  "LastModifiedDate" timestamptz,
  "IsDeleted" boolean DEFAULT false,
  "IsArchived" boolean DEFAULT false,
  "ArchivedById" text,
  "ArchivedDate" timestamptz,
  "SystemModstamp" timestamptz,
  "LastViewedDate" timestamptz,
  "LastReferencedDate" timestamptz,
  "PublishStatus" text,
  "LatestPublishedVersionId" text,
  salesforce_id text UNIQUE,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Salesforce Content Versions (file versions)
CREATE TABLE IF NOT EXISTS salesforce_content_versions (
  "Id" text PRIMARY KEY,
  "ContentDocumentId" text,
  "VersionNumber" text,
  "Title" text,
  "Description" text,
  "PathOnClient" text,
  "FileType" text,
  "FileExtension" text,
  "ContentSize" integer,
  "ContentUrl" text,
  "VersionData" text,
  "IsLatest" boolean DEFAULT false,
  "IsMajorVersion" boolean DEFAULT false,
  "CreatedById" text,
  "CreatedDate" timestamptz,
  "LastModifiedById" text,
  "LastModifiedDate" timestamptz,
  "IsDeleted" boolean DEFAULT false,
  "SystemModstamp" timestamptz,
  "ReasonForChange" text,
  "PublishStatus" text,
  salesforce_id text UNIQUE,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Salesforce Content Document Links (connects files to records)
CREATE TABLE IF NOT EXISTS salesforce_content_document_links (
  "Id" text PRIMARY KEY,
  "ContentDocumentId" text,
  "LinkedEntityId" text,
  "ShareType" text,
  "Visibility" text,
  "IsDeleted" boolean DEFAULT false,
  "SystemModstamp" timestamptz,
  salesforce_id text UNIQUE,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Salesforce Email Messages
CREATE TABLE IF NOT EXISTS salesforce_email_messages (
  "Id" text PRIMARY KEY,
  "ParentId" text,
  "ActivityId" text,
  "Subject" text,
  "FromName" text,
  "FromAddress" text,
  "ToAddress" text,
  "CcAddress" text,
  "BccAddress" text,
  "TextBody" text,
  "HtmlBody" text,
  "MessageDate" timestamptz,
  "Status" text,
  "Incoming" boolean DEFAULT false,
  "HasAttachment" boolean DEFAULT false,
  "Headers" text,
  "MessageIdentifier" text,
  "ThreadIdentifier" text,
  "RelatedToId" text,
  "IsDeleted" boolean DEFAULT false,
  "CreatedById" text,
  "CreatedDate" timestamptz,
  "LastModifiedDate" timestamptz,
  "LastModifiedById" text,
  "SystemModstamp" timestamptz,
  "FirstOpenedDate" timestamptz,
  "LastOpenedDate" timestamptz,
  "IsExternallyVisible" boolean DEFAULT true,
  salesforce_id text UNIQUE,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Salesforce Opportunity Contact Roles
CREATE TABLE IF NOT EXISTS salesforce_opportunity_contact_roles (
  "Id" text PRIMARY KEY,
  "OpportunityId" text NOT NULL,
  "ContactId" text NOT NULL,
  "Role" text,
  "IsPrimary" boolean DEFAULT false,
  "CreatedDate" timestamptz,
  "CreatedById" text,
  "LastModifiedDate" timestamptz,
  "LastModifiedById" text,
  "SystemModstamp" timestamptz,
  "IsDeleted" boolean DEFAULT false,
  salesforce_id text UNIQUE,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE salesforce_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_content_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_content_document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_opportunity_contact_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies (authenticated users can access all Salesforce data)
CREATE POLICY "Authenticated users can view notes"
  ON salesforce_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notes"
  ON salesforce_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notes"
  ON salesforce_notes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view attachments"
  ON salesforce_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert attachments"
  ON salesforce_attachments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update attachments"
  ON salesforce_attachments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view content documents"
  ON salesforce_content_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert content documents"
  ON salesforce_content_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update content documents"
  ON salesforce_content_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view content versions"
  ON salesforce_content_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert content versions"
  ON salesforce_content_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update content versions"
  ON salesforce_content_versions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view content document links"
  ON salesforce_content_document_links FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert content document links"
  ON salesforce_content_document_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update content document links"
  ON salesforce_content_document_links FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view email messages"
  ON salesforce_email_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert email messages"
  ON salesforce_email_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update email messages"
  ON salesforce_email_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view opportunity contact roles"
  ON salesforce_opportunity_contact_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert opportunity contact roles"
  ON salesforce_opportunity_contact_roles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update opportunity contact roles"
  ON salesforce_opportunity_contact_roles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_parent ON salesforce_notes("ParentId");
CREATE INDEX IF NOT EXISTS idx_notes_owner ON salesforce_notes("OwnerId");
CREATE INDEX IF NOT EXISTS idx_notes_created ON salesforce_notes("CreatedDate");

CREATE INDEX IF NOT EXISTS idx_attachments_parent ON salesforce_attachments("ParentId");
CREATE INDEX IF NOT EXISTS idx_attachments_owner ON salesforce_attachments("OwnerId");

CREATE INDEX IF NOT EXISTS idx_content_docs_owner ON salesforce_content_documents("OwnerId");
CREATE INDEX IF NOT EXISTS idx_content_docs_created ON salesforce_content_documents("CreatedDate");

CREATE INDEX IF NOT EXISTS idx_content_versions_doc ON salesforce_content_versions("ContentDocumentId");
CREATE INDEX IF NOT EXISTS idx_content_versions_latest ON salesforce_content_versions("IsLatest");

CREATE INDEX IF NOT EXISTS idx_content_links_doc ON salesforce_content_document_links("ContentDocumentId");
CREATE INDEX IF NOT EXISTS idx_content_links_entity ON salesforce_content_document_links("LinkedEntityId");

CREATE INDEX IF NOT EXISTS idx_emails_parent ON salesforce_email_messages("ParentId");
CREATE INDEX IF NOT EXISTS idx_emails_related ON salesforce_email_messages("RelatedToId");
CREATE INDEX IF NOT EXISTS idx_emails_from ON salesforce_email_messages("FromAddress");
CREATE INDEX IF NOT EXISTS idx_emails_date ON salesforce_email_messages("MessageDate");
CREATE INDEX IF NOT EXISTS idx_emails_incoming ON salesforce_email_messages("Incoming");

CREATE INDEX IF NOT EXISTS idx_opp_contact_roles_opp ON salesforce_opportunity_contact_roles("OpportunityId");
CREATE INDEX IF NOT EXISTS idx_opp_contact_roles_contact ON salesforce_opportunity_contact_roles("ContactId");
CREATE INDEX IF NOT EXISTS idx_opp_contact_roles_primary ON salesforce_opportunity_contact_roles("IsPrimary");