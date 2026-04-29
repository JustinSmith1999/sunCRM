/*
  # Add Remaining Salesforce Standard Objects

  Creates tables for Salesforce objects not yet in the database.

  ## New Tables
  
  ### 1. salesforce_campaigns
  - All standard Salesforce Campaign fields
  - Marketing campaigns from Salesforce
  - Budget, cost, and response tracking
  
  ### 2. salesforce_campaign_members
  - Links contacts/leads to campaigns
  - Member status and response tracking
  
  ### 3. salesforce_cases
  - Customer support cases from Salesforce
  - Status, priority, and resolution tracking
  
  ### 4. salesforce_tasks
  - To-do items from Salesforce
  - Related to various objects
  
  ### 5. salesforce_events
  - Calendar events from Salesforce
  - Meetings and appointments
  
  ### 6. salesforce_products
  - Product catalog from Salesforce
  
  ### 7. salesforce_opportunity_line_items
  - Products on opportunities
  - Pricing and quantities

  ## Security
  - RLS enabled on all tables
  - Service role can manage all data
*/

-- Salesforce Campaigns Table
CREATE TABLE IF NOT EXISTS salesforce_campaigns (
  "Id" text PRIMARY KEY,
  "IsDeleted" boolean DEFAULT false,
  "Name" text,
  "ParentId" text,
  "Type" text,
  "Status" text,
  "StartDate" date,
  "EndDate" date,
  "ExpectedRevenue" numeric,
  "BudgetedCost" numeric,
  "ActualCost" numeric,
  "ExpectedResponse" numeric,
  "NumberSent" numeric,
  "IsActive" boolean DEFAULT false,
  "Description" text,
  "NumberOfLeads" integer,
  "NumberOfConvertedLeads" integer,
  "NumberOfContacts" integer,
  "NumberOfResponses" integer,
  "NumberOfOpportunities" integer,
  "NumberOfWonOpportunities" integer,
  "AmountAllOpportunities" numeric,
  "AmountWonOpportunities" numeric,
  "OwnerId" text,
  "CreatedDate" timestamptz,
  "CreatedById" text,
  "LastModifiedDate" timestamptz,
  "LastModifiedById" text,
  "SystemModstamp" timestamptz,
  "LastActivityDate" date,
  "LastViewedDate" timestamptz,
  "LastReferencedDate" timestamptz
);

-- Salesforce Campaign Members Table
CREATE TABLE IF NOT EXISTS salesforce_campaign_members (
  "Id" text PRIMARY KEY,
  "IsDeleted" boolean DEFAULT false,
  "CampaignId" text,
  "LeadId" text,
  "ContactId" text,
  "Status" text,
  "HasResponded" boolean DEFAULT false,
  "CreatedDate" timestamptz,
  "CreatedById" text,
  "LastModifiedDate" timestamptz,
  "LastModifiedById" text,
  "SystemModstamp" timestamptz,
  "FirstRespondedDate" date
);

-- Salesforce Cases Table
CREATE TABLE IF NOT EXISTS salesforce_cases (
  "Id" text PRIMARY KEY,
  "IsDeleted" boolean DEFAULT false,
  "MasterRecordId" text,
  "CaseNumber" text,
  "ContactId" text,
  "AccountId" text,
  "ParentId" text,
  "SuppliedName" text,
  "SuppliedEmail" text,
  "SuppliedPhone" text,
  "SuppliedCompany" text,
  "Type" text,
  "Status" text,
  "Reason" text,
  "Origin" text,
  "Subject" text,
  "Priority" text,
  "Description" text,
  "IsClosed" boolean DEFAULT false,
  "ClosedDate" timestamptz,
  "IsEscalated" boolean DEFAULT false,
  "OwnerId" text,
  "CreatedDate" timestamptz,
  "CreatedById" text,
  "LastModifiedDate" timestamptz,
  "LastModifiedById" text,
  "SystemModstamp" timestamptz,
  "ContactPhone" text,
  "ContactMobile" text,
  "ContactEmail" text,
  "ContactFax" text,
  "Comments" text,
  "LastViewedDate" timestamptz,
  "LastReferencedDate" timestamptz
);

-- Salesforce Tasks Table
CREATE TABLE IF NOT EXISTS salesforce_tasks (
  "Id" text PRIMARY KEY,
  "IsDeleted" boolean DEFAULT false,
  "AccountId" text,
  "OwnerId" text,
  "Subject" text,
  "ActivityDate" date,
  "Status" text,
  "Priority" text,
  "IsHighPriority" boolean DEFAULT false,
  "WhoId" text,
  "WhatId" text,
  "Description" text,
  "IsClosed" boolean DEFAULT false,
  "CreatedDate" timestamptz,
  "CreatedById" text,
  "LastModifiedDate" timestamptz,
  "LastModifiedById" text,
  "SystemModstamp" timestamptz,
  "IsArchived" boolean DEFAULT false,
  "CallDurationInSeconds" integer,
  "CallType" text,
  "CallDisposition" text,
  "CallObject" text,
  "ReminderDateTime" timestamptz,
  "IsReminderSet" boolean DEFAULT false,
  "RecurrenceActivityId" text,
  "IsRecurrence" boolean DEFAULT false,
  "RecurrenceStartDateOnly" date,
  "RecurrenceEndDateOnly" date,
  "RecurrenceTimeZoneSidKey" text,
  "RecurrenceType" text,
  "RecurrenceInterval" integer,
  "RecurrenceDayOfWeekMask" integer,
  "RecurrenceDayOfMonth" integer,
  "RecurrenceInstance" text,
  "RecurrenceMonthOfYear" text,
  "TaskSubtype" text,
  "CompletedDateTime" timestamptz
);

-- Salesforce Events Table
CREATE TABLE IF NOT EXISTS salesforce_events (
  "Id" text PRIMARY KEY,
  "IsDeleted" boolean DEFAULT false,
  "AccountId" text,
  "OwnerId" text,
  "WhoId" text,
  "WhatId" text,
  "Subject" text,
  "Location" text,
  "IsAllDayEvent" boolean DEFAULT false,
  "ActivityDateTime" timestamptz,
  "ActivityDate" date,
  "DurationInMinutes" integer,
  "StartDateTime" timestamptz,
  "EndDateTime" timestamptz,
  "EndDate" date,
  "Description" text,
  "CreatedDate" timestamptz,
  "CreatedById" text,
  "LastModifiedDate" timestamptz,
  "LastModifiedById" text,
  "SystemModstamp" timestamptz,
  "IsPrivate" boolean DEFAULT false,
  "ShowAs" text,
  "IsChild" boolean DEFAULT false,
  "IsGroupEvent" boolean DEFAULT false,
  "GroupEventType" text,
  "IsArchived" boolean DEFAULT false,
  "RecurrenceActivityId" text,
  "IsRecurrence" boolean DEFAULT false,
  "RecurrenceStartDateTime" timestamptz,
  "RecurrenceEndDateOnly" date,
  "RecurrenceTimeZoneSidKey" text,
  "RecurrenceType" text,
  "RecurrenceInterval" integer,
  "RecurrenceDayOfWeekMask" integer,
  "RecurrenceDayOfMonth" integer,
  "RecurrenceInstance" text,
  "RecurrenceMonthOfYear" text,
  "ReminderDateTime" timestamptz,
  "IsReminderSet" boolean DEFAULT false,
  "EventSubtype" text
);

-- Salesforce Products Table
CREATE TABLE IF NOT EXISTS salesforce_products (
  "Id" text PRIMARY KEY,
  "Name" text,
  "ProductCode" text,
  "Description" text,
  "IsActive" boolean DEFAULT true,
  "CreatedDate" timestamptz,
  "CreatedById" text,
  "LastModifiedDate" timestamptz,
  "LastModifiedById" text,
  "SystemModstamp" timestamptz,
  "Family" text,
  "IsDeleted" boolean DEFAULT false,
  "IsArchived" boolean DEFAULT false,
  "LastViewedDate" timestamptz,
  "LastReferencedDate" timestamptz
);

-- Salesforce Opportunity Line Items Table
CREATE TABLE IF NOT EXISTS salesforce_opportunity_line_items (
  "Id" text PRIMARY KEY,
  "OpportunityId" text,
  "SortOrder" integer,
  "PricebookEntryId" text,
  "Product2Id" text,
  "ProductCode" text,
  "Name" text,
  "Quantity" numeric,
  "TotalPrice" numeric,
  "UnitPrice" numeric,
  "ListPrice" numeric,
  "ServiceDate" date,
  "Description" text,
  "CreatedDate" timestamptz,
  "CreatedById" text,
  "LastModifiedDate" timestamptz,
  "LastModifiedById" text,
  "SystemModstamp" timestamptz,
  "IsDeleted" boolean DEFAULT false
);

-- Enable RLS on all tables
ALTER TABLE salesforce_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_opportunity_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Service role can manage all data
CREATE POLICY "Service role can manage salesforce campaigns"
  ON salesforce_campaigns FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage salesforce campaign members"
  ON salesforce_campaign_members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage salesforce cases"
  ON salesforce_cases FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage salesforce tasks"
  ON salesforce_tasks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage salesforce events"
  ON salesforce_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage salesforce products"
  ON salesforce_products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage salesforce opportunity line items"
  ON salesforce_opportunity_line_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_salesforce_campaigns_modified ON salesforce_campaigns("LastModifiedDate");
CREATE INDEX IF NOT EXISTS idx_salesforce_campaign_members_campaign ON salesforce_campaign_members("CampaignId");
CREATE INDEX IF NOT EXISTS idx_salesforce_campaign_members_contact ON salesforce_campaign_members("ContactId");
CREATE INDEX IF NOT EXISTS idx_salesforce_campaign_members_lead ON salesforce_campaign_members("LeadId");
CREATE INDEX IF NOT EXISTS idx_salesforce_campaign_members_modified ON salesforce_campaign_members("LastModifiedDate");
CREATE INDEX IF NOT EXISTS idx_salesforce_cases_account ON salesforce_cases("AccountId");
CREATE INDEX IF NOT EXISTS idx_salesforce_cases_contact ON salesforce_cases("ContactId");
CREATE INDEX IF NOT EXISTS idx_salesforce_cases_modified ON salesforce_cases("LastModifiedDate");
CREATE INDEX IF NOT EXISTS idx_salesforce_tasks_account ON salesforce_tasks("AccountId");
CREATE INDEX IF NOT EXISTS idx_salesforce_tasks_modified ON salesforce_tasks("LastModifiedDate");
CREATE INDEX IF NOT EXISTS idx_salesforce_events_account ON salesforce_events("AccountId");
CREATE INDEX IF NOT EXISTS idx_salesforce_events_modified ON salesforce_events("LastModifiedDate");
CREATE INDEX IF NOT EXISTS idx_salesforce_products_modified ON salesforce_products("LastModifiedDate");
CREATE INDEX IF NOT EXISTS idx_salesforce_opportunity_line_items_opportunity ON salesforce_opportunity_line_items("OpportunityId");
CREATE INDEX IF NOT EXISTS idx_salesforce_opportunity_line_items_product ON salesforce_opportunity_line_items("Product2Id");
CREATE INDEX IF NOT EXISTS idx_salesforce_opportunity_line_items_modified ON salesforce_opportunity_line_items("LastModifiedDate");
