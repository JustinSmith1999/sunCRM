/*
  # Recreate Leads Table with All Salesforce Columns

  1. Changes
    - Drop existing leads table
    - Create new leads table with exact Salesforce schema (218+ columns)
    - All standard and custom Salesforce Lead fields
    - Proper data types for each field
  
  2. Security
    - Enable RLS
    - Public read access
    - Authenticated users can insert/update/delete
*/

-- Drop existing leads table
DROP TABLE IF EXISTS leads CASCADE;

-- Create leads table with all Salesforce columns
CREATE TABLE leads (
  -- Standard Salesforce System Fields
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "IsDeleted" boolean DEFAULT false,
  "MasterRecordId" text,
  
  -- Name Fields
  "LastName" text,
  "FirstName" text,
  "Salutation" text,
  "Name" text,
  
  -- Basic Information
  "Title" text,
  "Company" text,
  
  -- Address Fields
  "Street" text,
  "City" text,
  "State" text,
  "PostalCode" text,
  "Country" text DEFAULT 'USA',
  "Latitude" numeric,
  "Longitude" numeric,
  "GeocodeAccuracy" text,
  
  -- Contact Fields
  "Phone" text,
  "MobilePhone" text,
  "Fax" text,
  "Email" text,
  "Website" text,
  "PhotoUrl" text,
  
  -- Lead Details
  "Description" text,
  "LeadSource" text,
  "Status" text DEFAULT 'Open',
  "Industry" text,
  "Rating" text,
  "AnnualRevenue" numeric,
  "NumberOfEmployees" integer,
  
  -- Ownership & Assignment
  "OwnerId" text,
  
  -- Email & Communication Preferences
  "HasOptedOutOfEmail" boolean DEFAULT false,
  
  -- Conversion Fields
  "IsConverted" boolean DEFAULT false,
  "ConvertedDate" timestamptz,
  "ConvertedAccountId" text,
  "ConvertedContactId" text,
  "ConvertedOpportunityId" text,
  
  -- System Timestamps
  "CreatedDate" timestamptz DEFAULT now(),
  "CreatedById" text,
  "LastModifiedDate" timestamptz DEFAULT now(),
  "LastModifiedById" text,
  "SystemModstamp" timestamptz DEFAULT now(),
  "LastActivityDate" timestamptz,
  
  -- Communication Preferences
  "DoNotCall" boolean DEFAULT false,
  "HasOptedOutOfFax" boolean DEFAULT false,
  
  -- Transfer & Partner Fields
  "LastTransferDate" timestamptz,
  "PartnerAccountId" text,
  
  -- Data.com Fields
  "Jigsaw" text,
  "JigsawContactId" text,
  
  -- Connection Fields
  "ConnectionReceivedId" text,
  "ConnectionSentId" text,
  
  -- Email Bounce
  "EmailBouncedReason" text,
  "EmailBouncedDate" timestamptz,
  
  -- Individual & Identity
  "IndividualId" text,
  "Pronouns" text,
  "GenderIdentity" text,
  
  -- Activity Metrics
  "FirstCallDateTime" timestamptz,
  "FirstEmailDateTime" timestamptz,
  "ActivityMetricId" text,
  "IsPriorityRecord" boolean DEFAULT false,
  
  -- Custom Fields - Partner & Sales
  "Partner_Opp_Created__c" boolean,
  "Sales_Notes__c" text,
  "Referral_Opportunity__c" text,
  "Own_Residence__c" text,
  "Reason__c" text,
  "Salesperson__c" text,
  "Other_Source__c" text,
  "Referred_By__c" text,
  "Type_of_Installation__c" text,
  "Type_of_Sale__c" text,
  
  -- Phone Verification (TDC)
  "tdc_tsw__Phone_Verification_Status__c" text,
  
  -- PSEG Utility Fields
  "PSEG_Account_1__c" text,
  "Name_on_PSEG_Account__c" text,
  
  -- Property Information
  "Type_of_Structure__c" text,
  "Age_of_Structure__c" text,
  "Floors__c" text,
  "Sq_Ft__c" text,
  "Roof_Style_Composition__c" text,
  "Layers__c" text,
  "Age_of_Roof__c" text,
  "Roof_Pitch__c" text,
  "Orientation_of_Solar_Friendly_Roofs__c" text,
  "Shading_Issues__c" text,
  
  -- Customer Assessment
  "Customer_Expectations__c" text,
  "Credit_Score__c" text,
  "Customer_Notes__c" text,
  "Additional_Information__c" text,
  "Taxable_Income__c" numeric,
  "Financing__c" text,
  "Possible_Permit_Issues__c" text,
  
  -- Sales Team
  "Canvasser__c" text,
  
  -- Additional Contact
  "Secondary_Email__c" text,
  "VTS_Phone__c" text,
  
  -- Energy Usage
  "Avg_Monthly_Elec_Bill_NEW__c" numeric,
  "Annual_KWh_Usage_NEW__c" numeric,
  
  -- Phone Verification Results
  "tdc_tsw__Phone_Verify_Result_Msg__c" text,
  "tdc_tsw__Result__c" text,
  
  -- Sales Process
  "Anticipated_Closing__c" date,
  "tdc_tsw__Type__c" text,
  "Lead_Resurrection__c" boolean,
  "Lead_Resurrection_Date__c" date,
  "Lead_Assigned_Date__c" timestamptz,
  
  -- Residence Information
  "Years_in_Residence__c" text,
  "Company_Website__c" text,
  "Owner_of_Property__c" text,
  "Title_of_Property_Owner__c" text,
  "Title_of_Contact_Person__c" text,
  "Facilities_Manager__c" text,
  
  -- Utility Details
  "Electric_Voltage__c" text,
  "PSEG_Rate_Code__c" text,
  "PSEG_Account_2__c" text,
  "PSEG_Account_3__c" text,
  "PSEG_Account_4__c" text,
  "Meter_1__c" text,
  "Meter_2__c" text,
  "Meter_3__c" text,
  "Meter_4__c" text,
  "Re_Charge_NY_Discount_Program__c" text,
  "Transformer_Location__c" text,
  
  -- Competition
  "Other_Estimates_Who__c" text,
  "Size_of_System_Quoted__c" text,
  
  -- Business Classification
  "Industry__c" text,
  "NIACS_SIC_Code__c" text,
  "of_Employees__c" integer,
  "Annual_Sales__c" numeric,
  
  -- Utility & Assignment
  "PSEG_Obtained__c" boolean,
  "Call_Center_Rep__c" text,
  "Utility__c" text,
  
  -- Duplicate Check Fields
  "dupcheck__dc3DisableDuplicateCheck__c" boolean,
  "dupcheck__dc3Index__c" text,
  "dupcheck__dc3Web2Lead__c" boolean,
  
  -- Portal & Referral
  "Lead_from_Customer_Portal__c" boolean,
  "Requested_Sales_Rep__c" text,
  "Referral_Lookup__c" text,
  
  -- Permit Information
  "Town_for_Permit__c" text,
  "Historical_District__c" boolean,
  
  -- Pardot/Marketing Cloud Fields
  "pi__Needs_Score_Synced__c" boolean,
  "pi__Pardot_Last_Scored_At__c" timestamptz,
  "pi__campaign__c" text,
  "pi__comments__c" text,
  "pi__conversion_date__c" timestamptz,
  "pi__conversion_object_name__c" text,
  "pi__conversion_object_type__c" text,
  "pi__created_date__c" timestamptz,
  "pi__first_activity__c" timestamptz,
  "pi__first_search_term__c" text,
  "pi__first_search_type__c" text,
  "pi__first_touch_url__c" text,
  "pi__grade__c" text,
  "pi__last_activity__c" timestamptz,
  "pi__notes__c" text,
  "pi__pardot_hard_bounced__c" boolean,
  "pi__score__c" numeric,
  "pi__url__c" text,
  "pi__utm_campaign__c" text,
  "pi__utm_content__c" text,
  "pi__utm_medium__c" text,
  "pi__utm_source__c" text,
  "pi__utm_term__c" text,
  
  -- Phone & SMS
  "tdc_tsw__Verified_Phone__c" text,
  "tdc_tsw__SMS_Opt_out__c" boolean,
  
  -- Appointment & Follow-up
  "First_Sit_Date__c" date,
  "Created_Date_Time__c" timestamptz,
  "et4ae5__HasOptedOutOfMobile__c" boolean,
  "Closed_Lost_Description__c" text,
  "Lead_Sub_Status__c" text,
  "Future_Contact_Follow_up_Date__c" date,
  
  -- Program & Service
  "Community_Solar__c" boolean,
  "Profession__c" text,
  "et4ae5__Mobile_Country_Code__c" text,
  
  -- Financial Status
  "Bankruptcy__c" boolean,
  "Reference__c" text,
  
  -- Communication Preferences
  "Language_Preference__c" text,
  "Appointment_Confirmation_Required__c" boolean,
  
  -- Installation & Operations
  "PTO_Date__c" date,
  "Data_Import__c" boolean,
  "Partner__c" text,
  
  -- Lead Source Details
  "Lead_Channel__c" text,
  "Lead_Cost__c" numeric,
  "Call_Type__c" text,
  "Event_Advocate__c" text,
  
  -- Additional Fields
  "Satellite_Image__c" text,
  "Reason_for_deleting__c" text,
  "Do_Not_Import_to_Marketing_Cloud__c" boolean,
  "Lead_Type__c" text,
  "Lead_Source_info_confirmed__c" boolean,
  "Is_Automation_Bypassed__c" boolean,
  "Lead_Source_Date__c" date,
  "County__c" text,
  "Type_of_Purchase__c" text,
  
  -- UTM Parameters
  "utm_source__c" text,
  "utm_medium__c" text,
  "utm_campaign__c" text,
  "utm_term__c" text,
  "utm_content__c" text,
  
  -- External & TrustedForm
  "External_Lead_ID__c" text,
  "TrustedForm_Cert_URL__c" text,
  
  -- PowerScout Fields
  "PS_Sunlight_Hours__c" numeric,
  "PS_Estimated_Production__c" numeric,
  "PS_Lifetime_Savings__c" numeric,
  "PS_Module_Amount__c" integer,
  "PS_Roof_Sq_Footage__c" numeric,
  "PS_Score__c" numeric,
  "PS_Rating__c" text,
  
  -- Program & Rating
  "Program_Name__c" text,
  "Lead_Rating__c" text,
  "Referral_Subtype__c" text,
  "Offset_Discussion__c" text,
  "New_Construction__c" boolean,
  
  -- Unbounce Fields
  "UnbouncePageID__c" text,
  "Source__c" text,
  "SubmitterIP__c" text,
  "UnbounceSubmissionTime__c" text,
  "UnbouncePageVariant__c" text,
  "UnbounceSubmissionDate__c" date,
  
  -- Agent Interaction
  "Created_By_Agent__c" boolean,
  "Interacted_with_Agent__c" boolean,
  "Last_Agent_Interaction_Date__c" timestamptz,
  
  -- Rate Plan
  "TOD_plan__c" text,
  
  -- Internal timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_leads_email ON leads("Email");
CREATE INDEX idx_leads_status ON leads("Status");
CREATE INDEX idx_leads_lead_source ON leads("LeadSource");
CREATE INDEX idx_leads_owner ON leads("OwnerId");
CREATE INDEX idx_leads_created_date ON leads("CreatedDate" DESC);
CREATE INDEX idx_leads_company ON leads("Company");
CREATE INDEX idx_leads_last_name ON leads("LastName");
CREATE INDEX idx_leads_is_converted ON leads("IsConverted");
CREATE INDEX idx_leads_county ON leads("County__c");
CREATE INDEX idx_leads_lead_channel ON leads("Lead_Channel__c");

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view leads"
  ON leads FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger to update LastModifiedDate
CREATE OR REPLACE FUNCTION update_leads_modified_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW."LastModifiedDate" = now();
  NEW."SystemModstamp" = now();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_update_modified_date
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_modified_date();
