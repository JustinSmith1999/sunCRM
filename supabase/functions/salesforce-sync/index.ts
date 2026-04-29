import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SalesforceObjectConfig {
  sfObject: string;
  table: string;
  fields: string[];
  idField?: string;
}

const SALESFORCE_OBJECTS: SalesforceObjectConfig[] = [
  {
    sfObject: 'Lead',
    table: 'leads',
    fields: [
      // Standard fields
      'Id', 'FirstName', 'LastName', 'Email', 'Phone', 'Company', 'Status', 'Street', 'City', 'State', 'PostalCode', 'Country',
      'Latitude', 'Longitude', 'GeocodeAccuracy', 'CreatedDate', 'LastModifiedDate', 'Title', 'Salutation', 'MobilePhone',
      'Fax', 'Website', 'LeadSource', 'Industry', 'Rating', 'AnnualRevenue', 'NumberOfEmployees', 'Description', 'DoNotCall',
      'HasOptedOutOfEmail', 'HasOptedOutOfFax', 'IsConverted', 'ConvertedDate', 'ConvertedAccountId', 'ConvertedContactId',
      'ConvertedOpportunityId', 'IsDeleted', 'MasterRecordId', 'LastActivityDate', 'OwnerId', 'CreatedById', 'LastModifiedById',
      'SystemModstamp', 'Jigsaw', 'JigsawContactId', 'EmailBouncedReason', 'EmailBouncedDate', 'IndividualId',
      'FirstCallDateTime', 'FirstEmailDateTime', 'LastTransferDate', 'PartnerAccountId', 'PhotoUrl', 'Name',
      // Custom fields
      'ActivityMetricId', 'Additional_Information__c', 'Age_of_Roof__c', 'Age_of_Structure__c', 'Annual_KWh_Usage_NEW__c',
      'Annual_Production_kWhr__c', 'Annual_Sales__c', 'Anticipated_Closing__c', 'Appointment_Confirmation_Required__c',
      'Aurora_Design__c', 'Avg_Monthly_Elec_Bill_NEW__c', 'Bankruptcy__c', 'Call_Center_Rep__c', 'Call_Type__c',
      'Canvasser__c', 'Closed_Lost_Description__c', 'Community_Solar__c', 'Company_Website__c', 'ConnectionReceivedId',
      'ConnectionSentId', 'County__c', 'Created_By_Agent__c', 'Created_Date_Time__c', 'Credit_Score__c',
      'Customer_Expectations__c', 'Customer_Notes__c', 'Data_Import__c', 'Do_Not_Import_to_Marketing_Cloud__c',
      'Electric_Voltage__c', 'Event_Advocate__c', 'External_Lead_ID__c', 'Facilities_Manager__c', 'Financing__c',
      'First_Sit_Date__c', 'Floors__c', 'Future_Contact_Follow_up_Date__c', 'GenderIdentity', 'Historical_District__c',
      'Interacted_with_Agent__c', 'Is_Automation_Bypassed__c', 'Language_Preference__c', 'Last_Agent_Interaction_Date__c',
      'Layers__c', 'Lead_Assigned_Date__c', 'Lead_Channel__c', 'Lead_Cost__c', 'Lead_Rating__c', 'Lead_Resurrection_Date__c',
      'Lead_Resurrection__c', 'Lead_Source_Date__c', 'Lead_Source_info_confirmed__c', 'Lead_Sub_Status__c', 'Lead_Type__c',
      'Lead_from_Customer_Portal__c', 'Meter_1__c', 'Meter_2__c', 'Meter_3__c', 'Meter_4__c', 'NIACS_SIC_Code__c',
      'Name_on_PSEG_Account__c', 'New_Construction__c', 'Offset_Discussion__c', 'Orientation_of_Solar_Friendly_Roofs__c',
      'Other_Estimates_Who__c', 'Other_Source__c', 'Own_Residence__c', 'Owner_of_Property__c', 'PSEG_Account_1__c',
      'PSEG_Account_2__c', 'PSEG_Account_3__c', 'PSEG_Account_4__c', 'PSEG_Obtained__c', 'PSEG_Rate_Code__c',
      'PS_Estimated_Production__c', 'PS_Lifetime_Savings__c', 'PS_Module_Amount__c', 'PS_Rating__c', 'PS_Roof_Sq_Footage__c',
      'PS_Score__c', 'PS_Sunlight_Hours__c', 'PTO_Date__c', 'Partner_Opp_Created__c', 'Partner__c', 'Possible_Permit_Issues__c',
      'Profession__c', 'Program_Name__c', 'Pronouns', 'Re_Charge_NY_Discount_Program__c', 'Reason__c', 'Reason_for_deleting__c',
      'Reference__c', 'Referral_Lookup__c', 'Referral_Opportunity__c', 'Referral_Subtype__c', 'Referred_By__c',
      'Requested_Sales_Rep__c', 'Roof_Pitch__c', 'Roof_Style_Composition__c', 'Sales_Notes__c', 'Salesperson__c',
      'Satellite_Image__c', 'Secondary_Email__c', 'Shading_Issues__c', 'Size_of_System_Quoted__c', 'Source__c', 'Sq_Ft__c',
      'SubmitterIP__c', 'System_Size_kW__c', 'TOD_plan__c', 'Taxable_Income__c', 'Title_of_Contact_Person__c',
      'Title_of_Property_Owner__c', 'Town_for_Permit__c', 'Transformer_Location__c', 'TrustedForm_Cert_URL__c',
      'Type_of_Installation__c', 'Type_of_Purchase__c', 'Type_of_Sale__c', 'Type_of_Structure__c', 'UnbouncePageID__c',
      'UnbouncePageVariant__c', 'UnbounceSubmissionDate__c', 'UnbounceSubmissionTime__c', 'Utility__c', 'VTS_Phone__c',
      'Years_in_Residence__c', 'dupcheck__dc3DisableDuplicateCheck__c', 'dupcheck__dc3Index__c', 'dupcheck__dc3Web2Lead__c',
      'et4ae5__HasOptedOutOfMobile__c', 'et4ae5__Mobile_Country_Code__c', 'of_Employees__c', 'pi__Needs_Score_Synced__c',
      'pi__Pardot_Last_Scored_At__c', 'pi__campaign__c', 'pi__comments__c', 'pi__conversion_date__c', 'pi__conversion_object_name__c',
      'pi__conversion_object_type__c', 'pi__created_date__c', 'pi__first_activity__c', 'pi__first_search_term__c',
      'pi__first_search_type__c', 'pi__first_touch_url__c', 'pi__grade__c', 'pi__last_activity__c', 'pi__notes__c',
      'pi__pardot_hard_bounced__c', 'pi__score__c', 'pi__url__c', 'pi__utm_campaign__c', 'pi__utm_content__c',
      'pi__utm_medium__c', 'pi__utm_source__c', 'pi__utm_term__c', 'tdc_tsw__Phone_Verification_Status__c',
      'tdc_tsw__Phone_Verify_Result_Msg__c', 'tdc_tsw__Result__c', 'tdc_tsw__SMS_Opt_out__c', 'tdc_tsw__Type__c',
      'tdc_tsw__Verified_Phone__c', 'utm_campaign__c', 'utm_content__c', 'utm_medium__c', 'utm_source__c', 'utm_term__c'
    ],
    idField: 'Id'
  },
  {
    sfObject: 'Account',
    table: 'accounts',
    fields: [
      // Standard fields
      'Id', 'Name', 'Type', 'Industry', 'Phone', 'Website', 'BillingStreet', 'BillingCity', 'BillingState', 'BillingPostalCode',
      'BillingCountry', 'BillingLatitude', 'BillingLongitude', 'BillingGeocodeAccuracy', 'ShippingStreet', 'ShippingCity',
      'ShippingState', 'ShippingPostalCode', 'ShippingCountry', 'ShippingLatitude', 'ShippingLongitude', 'ShippingGeocodeAccuracy',
      'CreatedDate', 'LastModifiedDate', 'Fax', 'AccountNumber', 'Site', 'AccountSource', 'AnnualRevenue', 'NumberOfEmployees',
      'Ownership', 'TickerSymbol', 'Description', 'Rating', 'OwnerId', 'CreatedById', 'LastModifiedById', 'SystemModstamp',
      'LastActivityDate', 'IsDeleted', 'MasterRecordId', 'ParentId', 'Jigsaw', 'JigsawCompanyId', 'Sic', 'SicDesc',
      'IsCustomerPortal', 'IsPartner', 'ConnectionReceivedId', 'ConnectionSentId', 'RecordTypeId',
      // Custom fields
      'Additional_Information__c', 'Age_of_Roof__c', 'Age_of_Structure__c', 'Annual_KWh_Usage__c', 'Annual_Sales__c',
      'Avg_Monthly_Electric_Bill__c', 'Category__c', 'Comm_Type_of_Installation__c', 'Company_Website__c', 'Credit_Score__c',
      'Customer_Expectations__c', 'Customer_Notes__c', 'Electric_Voltage__c', 'Facilities_Manager__c', 'Financing__c',
      'Floors__c', 'Industry__c', 'Layers__c', 'Lead_Source_Commercial__c', 'Level_Job_Number__c', 'Meter_1__c',
      'Meter_2__c', 'Meter_3__c', 'Meter_4__c', 'NIACS_SIC_Code__c', 'Name_on_PSEG_Account__c', 'Orienation_of_Roofs__c',
      'Origination_Date__c', 'Other_Estimates_Who__c', 'Other_Source__c', 'Owner_of_Property__c', 'PSEG_Account_1__c',
      'PSEG_Account_2__c', 'PSEG_Account_3__c', 'PSEG_Account_4__c', 'PSEG_Rate_Code__c', 'Permit_Issues__c',
      'Primary_Contact__c', 'Re_charge_NY_Discount_Program__c', 'Referred_By__c', 'Roof_Composition__c', 'Roof_Pitch__c',
      'Roof_Style_Composition__c', 'Roof_Style__c', 'Shading_Issues__c', 'Size_of_System_Quoted__c', 'Sq_Ft__c',
      'Taxable_Income__c', 'Telemarketing_Partner__c', 'Title_of_Contact_Person__c', 'Title_of_Property_Owner__c',
      'Top_Prospect_Date__c', 'Township__c', 'Transformer_Location__c', 'Type_of_Structure__c', 'dupcheck__dc3DisableDuplicateCheck__c',
      'dupcheck__dc3Index__c', 'of_Employees__c', 'tdc_tsw__SMS_Opt_out__c'
    ],
    idField: 'Id'
  },
  {
    sfObject: 'Contact',
    table: 'salesforce_contacts',
    fields: [
      // Standard fields
      'Id', 'AccountId', 'FirstName', 'LastName', 'Email', 'Phone', 'Title', 'Department', 'MailingStreet', 'MailingCity',
      'MailingState', 'MailingPostalCode', 'MailingCountry', 'MailingLatitude', 'MailingLongitude', 'MailingGeocodeAccuracy',
      'OtherStreet', 'OtherCity', 'OtherState', 'OtherPostalCode', 'OtherCountry', 'OtherLatitude', 'OtherLongitude',
      'OtherGeocodeAccuracy', 'OtherPhone', 'CreatedDate', 'LastModifiedDate', 'Salutation', 'Name', 'MobilePhone', 'HomePhone',
      'Fax', 'AssistantName', 'AssistantPhone', 'ReportsToId', 'Birthdate', 'Description', 'LeadSource', 'OwnerId',
      'CreatedById', 'LastModifiedById', 'SystemModstamp', 'LastActivityDate', 'LastCURequestDate', 'LastCUUpdateDate',
      'EmailBouncedReason', 'EmailBouncedDate', 'IsEmailBounced', 'Jigsaw', 'JigsawContactId', 'IndividualId',
      'HasOptedOutOfEmail', 'HasOptedOutOfFax', 'DoNotCall', 'MasterRecordId', 'IsDeleted',
      'ConnectionReceivedId', 'ConnectionSentId', 'RecordTypeId', 'DepartmentGroup', 'TitleType', 'BuyerAttributes',
      // Custom fields
      'AVSFQB__Integration__c', 'AVSFQB__QB_Error__c', 'AVSFQB__Quickbooks_Id__c', 'Additional_Information__c',
      'Age_of_Roof__c', 'Age_of_Structure__c', 'Annual_KWh_Usage__c', 'Annual_KWh_Usage_temp__c', 'Annual_Sales__c',
      'Anticipated_Closing__c', 'Approved_Reference_List__c', 'Avg_Monthly_Elec_Bill_temp__c', 'Avg_Monthly_Electric_Bill__c',
      'Bankruptcy__c', 'Company_Website__c', 'ContactSource', 'Contact__c', 'County__c', 'Credit_Score__c',
      'Customer_Expectations__c', 'Customer_Notes__c', 'Do_Not_Email__c', 'Electric_Voltage__c', 'Employment_Status__c',
      'Facilities_Manager__c', 'Financing__c', 'Floors__c', 'GenderIdentity', 'Historical_District__c',
      'Industry__c', 'Install_Completion_Date__c', 'Language_Preference__c', 'Layers__c', 'Lead_Assigned_Date__c',
      'Lead_Created_Date__c', 'Lead_Rating__c', 'Lead_Resurrection_Date__c', 'Lead_Resurrection__c',
      'Lead_from_Customer_Portal__c', 'Leads_Assigned_Date__c', 'Level_Created_Date__c', 'Level_Job_Number__c',
      'Level_Netsuite_ID__c', 'Level_SF_Account_ID__c', 'Meter_1__c', 'Meter_2__c', 'Meter_3__c', 'Meter_4__c',
      'Municipality__c', 'NIACS_SIC_Code__c', 'NYC_ID_Account__c', 'Name_on_PSEG_Account__c', 'Neighborhood_Flyered__c',
      'No_Marketing_Mail__c', 'Notes_to_Team_India__c', 'On_Hold_for_Non_Payment__c', 'Opportunity_Job_Number__c',
      'Orientation_of_Roofs__c', 'Other_Estimates_Who__c', 'Other_Source__c', 'Own_Residence__c', 'Owner_of_Property__c',
      'PSEG_Account_1__c', 'PSEG_Account_2__c', 'PSEG_Account_3__c', 'PSEG_Account_4__c', 'PSEG_Obtained__c',
      'PSEG_Rate_Code__c', 'PS_Estimated_Production__c', 'PS_Lifetime_Savings__c', 'PS_Module_Amount__c', 'PS_Rating__c',
      'PS_Roof_Sq_Footage__c', 'PS_Score__c', 'PS_Sunlight_Hours__c', 'PTO_Date_Enphase_Orphan_Systems_Only__c',
      'PTO_Letter_Date__c', 'Personal_Info__c', 'Possible_Permit_Issues__c', 'Preferred_Customer_Name__c',
      'Primary_Contact__c', 'Profession__c', 'Pronouns', 'Re_charge_NY_Discount_Program__c', 'Realtor_Agency__c',
      'Realtor_Certification_No__c', 'Realtor_Email__c', 'Realtor_Mobile__c', 'Realtor_Name__c', 'Realtor_Phone__c',
      'Reason__c', 'Referral_Lookup__c', 'Referral_Subtype__c', 'Referred_by__c', 'Role__c', 'Roof_Pitch__c',
      'Roof_Style_Composition__c', 'SUNation_Loyalty_Program__c', 'Sales_Notes__c', 'Sales_Rep__c', 'Secondary_Email__c',
      'Send_to_Team_India__c', 'Shading_Issues__c', 'Size_of_System_Quoted__c', 'SolarEdgeID__c', 'Sq_Ft__c',
      'Taxable_Income__c', 'Title_of_Contact_Person__c', 'Title_of_Property_Owner__c', 'Total_Invoiced_Amount__c',
      'Transformer_Location__c', 'Type_of_Installation__c', 'Type_of_Structure__c', 'VTS_Phone__c',
      'Welcome_email_sent_by_PM__c', 'Years_in_Residence__c', 'dupcheck__dc3DisableDuplicateCheck__c',
      'dupcheck__dc3Index__c', 'et4ae5__HasOptedOutOfMobile__c', 'et4ae5__Mobile_Country_Code__c', 'of_Employees__c',
      'pi__Needs_Score_Synced__c', 'pi__Pardot_Last_Scored_At__c', 'pi__campaign__c', 'pi__comments__c',
      'pi__conversion_date__c', 'pi__conversion_object_name__c', 'pi__conversion_object_type__c', 'pi__created_date__c',
      'pi__first_activity__c', 'pi__first_search_term__c', 'pi__first_search_type__c', 'pi__first_touch_url__c',
      'pi__grade__c', 'pi__last_activity__c', 'pi__notes__c', 'pi__pardot_hard_bounced__c', 'pi__score__c',
      'pi__url__c', 'pi__utm_campaign__c', 'pi__utm_content__c', 'pi__utm_medium__c', 'pi__utm_source__c',
      'pi__utm_term__c', 'rcsfl__SMS_Number__c', 'tdc_tsw__Phone_Verification_Status__c', 'tdc_tsw__Phone_Verify_Result_Msg__c',
      'tdc_tsw__SMS_Opt_out__c', 'tdc_tsw__Type__c', 'tdc_tsw__Verified_Phone__c', 'tdc_tsw__result__c'
    ],
    idField: 'Id'
  },
  {
    sfObject: 'Opportunity',
    table: 'opportunities',
    fields: [
      'Id', 'AccountId', 'Name', 'Description', 'StageName', 'Amount',
      'Probability', 'CloseDate', 'Type', 'NextStep', 'LeadSource',
      'IsClosed', 'IsWon', 'OwnerId', 'CreatedDate', 'LastModifiedDate', 'ContactId'
    ],
    idField: 'Id'
  },
  {
    sfObject: 'Campaign',
    table: 'salesforce_campaigns',
    fields: ['Id', 'Name', 'Type', 'Status', 'StartDate', 'EndDate', 'BudgetedCost', 'ActualCost', 'ExpectedRevenue', 'NumberOfLeads', 'NumberOfContacts', 'CreatedDate', 'LastModifiedDate'],
    idField: 'Id'
  },
  {
    sfObject: 'CampaignMember',
    table: 'salesforce_campaign_members',
    fields: ['Id', 'CampaignId', 'LeadId', 'ContactId', 'Status', 'HasResponded', 'CreatedDate', 'LastModifiedDate'],
    idField: 'Id'
  },
  {
    sfObject: 'Case',
    table: 'salesforce_cases',
    fields: ['Id', 'AccountId', 'ContactId', 'Subject', 'Description', 'Status', 'Priority', 'Origin', 'Type', 'IsClosed', 'CreatedDate', 'LastModifiedDate',
      // External System Integration Fields
      'Egnyte_Folder_URL__c', 'Egnyte_Link__c', 'Project_Folder__c', 'Egnyte_Folder__c', 'Egnyte__c',
      'Aurora_Solar_URL__c', 'Aurora_Link__c', 'Aurora_Design_Link__c', 'Aurora_Project_URL__c', 'Aurora__c',
      'Basecamp_URL__c', 'Basecamp_Link__c', 'Basecamp_Project_URL__c', 'Basecamp__c'],
    idField: 'Id'
  },
  {
    sfObject: 'Task',
    table: 'salesforce_tasks',
    fields: ['Id', 'Subject', 'Status', 'Priority', 'ActivityDate', 'Description', 'WhoId', 'WhatId', 'CreatedDate', 'LastModifiedDate'],
    idField: 'Id'
  },
  {
    sfObject: 'Event',
    table: 'salesforce_events',
    fields: ['Id', 'Subject', 'Location', 'StartDateTime', 'EndDateTime', 'Description', 'WhoId', 'WhatId', 'CreatedDate', 'LastModifiedDate'],
    idField: 'Id'
  },
  {
    sfObject: 'Product2',
    table: 'salesforce_products',
    fields: ['Id', 'Name', 'ProductCode', 'Description', 'IsActive', 'Family', 'CreatedDate', 'LastModifiedDate'],
    idField: 'Id'
  },
  {
    sfObject: 'OpportunityLineItem',
    table: 'salesforce_opportunity_line_items',
    fields: ['Id', 'OpportunityId', 'Product2Id', 'Quantity', 'UnitPrice', 'TotalPrice', 'Description', 'CreatedDate', 'LastModifiedDate'],
    idField: 'Id'
  },
  {
    sfObject: 'User',
    table: 'salesforce_users',
    fields: ['Id', 'Name', 'Email', 'Username', 'IsActive', 'UserRoleId', 'ProfileId'],
    idField: 'Id'
  },
  {
    sfObject: 'Quote',
    table: 'salesforce_quotes',
    fields: ['Id', 'Name', 'OpportunityId', 'Status', 'ExpirationDate', 'TotalPrice', 'Subtotal', 'Tax', 'GrandTotal', 'BillingStreet', 'BillingCity', 'BillingState', 'BillingPostalCode', 'BillingCountry', 'ShippingStreet', 'ShippingCity', 'ShippingState', 'ShippingPostalCode', 'ShippingCountry', 'QuoteNumber', 'Description', 'LineItemCount', 'IsSyncing', 'CreatedDate', 'LastModifiedDate'],
    idField: 'Id'
  },
  {
    sfObject: 'Document',
    table: 'salesforce_documents',
    fields: ['Id', 'Name', 'Type', 'FolderId', 'Description', 'Keywords', 'Url', 'CreatedDate', 'LastModifiedDate'],
    idField: 'Id'
  },
  {
    sfObject: 'ContentNote',
    table: 'salesforce_notes',
    fields: ['Id', 'Title', 'Content', 'TextPreview', 'FileExtension', 'FileType', 'ContentSize', 'OwnerId', 'CreatedById', 'CreatedDate', 'LastModifiedById', 'LastModifiedDate', 'IsDeleted', 'SystemModstamp', 'LastViewedDate', 'LastReferencedDate', 'ParentId'],
    idField: 'Id'
  },
  {
    sfObject: 'Attachment',
    table: 'salesforce_attachments',
    fields: ['Id', 'Name', 'Body', 'BodyLength', 'ContentType', 'Description', 'ParentId', 'OwnerId', 'IsPrivate', 'IsDeleted', 'CreatedDate', 'CreatedById', 'LastModifiedDate', 'LastModifiedById', 'SystemModstamp'],
    idField: 'Id'
  },
  {
    sfObject: 'ContentDocument',
    table: 'salesforce_content_documents',
    fields: ['Id', 'Title', 'FileType', 'FileExtension', 'ContentSize', 'Description', 'OwnerId', 'CreatedById', 'CreatedDate', 'LastModifiedById', 'LastModifiedDate', 'IsDeleted', 'IsArchived', 'ArchivedById', 'ArchivedDate', 'SystemModstamp', 'LastViewedDate', 'LastReferencedDate', 'PublishStatus', 'LatestPublishedVersionId'],
    idField: 'Id'
  },
  {
    sfObject: 'ContentVersion',
    table: 'salesforce_content_versions',
    fields: ['Id', 'ContentDocumentId', 'VersionNumber', 'Title', 'Description', 'PathOnClient', 'FileType', 'FileExtension', 'ContentSize', 'ContentUrl', 'VersionData', 'IsLatest', 'IsMajorVersion', 'CreatedById', 'CreatedDate', 'LastModifiedById', 'LastModifiedDate', 'IsDeleted', 'SystemModstamp', 'ReasonForChange', 'PublishStatus'],
    idField: 'Id'
  },
  {
    sfObject: 'ContentDocumentLink',
    table: 'salesforce_content_document_links',
    fields: ['Id', 'ContentDocumentId', 'LinkedEntityId', 'ShareType', 'Visibility', 'IsDeleted', 'SystemModstamp'],
    idField: 'Id'
  },
  {
    sfObject: 'EmailMessage',
    table: 'salesforce_email_messages',
    fields: ['Id', 'ParentId', 'ActivityId', 'Subject', 'FromName', 'FromAddress', 'ToAddress', 'CcAddress', 'BccAddress', 'TextBody', 'HtmlBody', 'MessageDate', 'Status', 'Incoming', 'HasAttachment', 'Headers', 'MessageIdentifier', 'ThreadIdentifier', 'RelatedToId', 'IsDeleted', 'CreatedById', 'CreatedDate', 'LastModifiedDate', 'LastModifiedById', 'SystemModstamp', 'FirstOpenedDate', 'LastOpenedDate', 'IsExternallyVisible'],
    idField: 'Id'
  },
  {
    sfObject: 'OpportunityContactRole',
    table: 'salesforce_opportunity_contact_roles',
    fields: ['Id', 'OpportunityId', 'ContactId', 'Role', 'IsPrimary', 'CreatedDate', 'CreatedById', 'LastModifiedDate', 'LastModifiedById', 'SystemModstamp', 'IsDeleted'],
    idField: 'Id'
  }
];

async function soapLogin(username: string, password: string) {
  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:enterprise.soap.sforce.com">
  <soapenv:Body>
    <urn:login>
      <urn:username>${username}</urn:username>
      <urn:password>${password}</urn:password>
    </urn:login>
  </soapenv:Body>
</soapenv:Envelope>`;

  const response = await fetch('https://login.salesforce.com/services/Soap/c/58.0', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      'SOAPAction': 'login'
    },
    body: soapBody
  });

  if (!response.ok) {
    throw new Error(`SOAP login failed: ${await response.text()}`);
  }

  const xmlText = await response.text();

  const sessionIdMatch = xmlText.match(/<sessionId>([^<]+)<\/sessionId>/);
  const serverUrlMatch = xmlText.match(/<serverUrl>([^<]+)<\/serverUrl>/);

  if (!sessionIdMatch || !serverUrlMatch) {
    throw new Error('Failed to parse SOAP response');
  }

  const instanceUrl = serverUrlMatch[1].match(/https:\/\/[^\/]+/)?.[0];

  return {
    sessionId: sessionIdMatch[1],
    instanceUrl: instanceUrl || 'https://sunation.my.salesforce.com'
  };
}

async function processAndSyncBatch(
  supabase: any,
  records: any[],
  config: SalesforceObjectConfig,
  batchNumber: number
): Promise<{ imported: number, errors: any[] }> {
  if (records.length === 0) return { imported: 0, errors: [] };

  const recordsData = records.map(record => {
    const recordData: any = {};
    for (const field of config.fields) {
      const preserveCaseTables = [
        'accounts',
        'leads',
        'opportunities',
        'salesforce_contacts',
        'salesforce_tasks',
        'salesforce_events',
        'salesforce_cases',
        'salesforce_notes',
        'salesforce_attachments',
        'salesforce_content_documents',
        'salesforce_content_versions',
        'salesforce_content_document_links',
        'salesforce_email_messages',
        'salesforce_opportunity_contact_roles'
      ];
      const dbColumnName = preserveCaseTables.includes(config.table) ? field : field.toLowerCase();
      recordData[dbColumnName] = record[field] ?? null;
    }

    // Map external system URLs to unified columns
    const egnyteFields = ['Egnyte_Folder_URL__c', 'Egnyte_Link__c', 'Project_Folder__c', 'Egnyte_Folder__c', 'Egnyte__c'];
    const egnyteField = egnyteFields.find(field => record[field]);
    if (egnyteField && record[egnyteField]) {
      recordData.egnyte_folder_url = record[egnyteField];
      recordData.egnyte_url = record[egnyteField];
    }

    const auroraFields = ['Aurora_Solar_URL__c', 'Aurora_Link__c', 'Aurora_Design_Link__c', 'Aurora_Project_URL__c', 'Aurora__c'];
    const auroraField = auroraFields.find(field => record[field]);
    if (auroraField && record[auroraField]) {
      recordData.aurora_solar_url = record[auroraField];
    }

    const basecampFields = ['Basecamp_URL__c', 'Basecamp_Link__c', 'Basecamp_Project_URL__c', 'Basecamp__c'];
    const basecampField = basecampFields.find(field => record[field]);
    if (basecampField && record[basecampField]) {
      recordData.basecamp_url = record[basecampField];
    }

    return recordData;
  });

  const CHUNK_SIZE = 100;
  let totalImported = 0;
  const errors = [];

  for (let i = 0; i < recordsData.length; i += CHUNK_SIZE) {
    const chunk = recordsData.slice(i, i + CHUNK_SIZE);

    try {
      const { error } = await supabase
        .from(config.table)
        .upsert(chunk, {
          onConflict: config.idField || 'Id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`  Chunk error:`, error.message);
        errors.push({ chunk: i / CHUNK_SIZE + 1, error: error.message });
      } else {
        totalImported += chunk.length;
      }
    } catch (err: any) {
      console.error(`  Chunk error:`, err.message);
      errors.push({ chunk: i / CHUNK_SIZE + 1, error: err.message });
    }
  }

  return { imported: totalImported, errors };
}

async function streamSalesforceData(
  supabase: any,
  sessionId: string,
  instanceUrl: string,
  config: SalesforceObjectConfig,
  lastSyncTime: string
) {
  const fieldList = config.fields.join(', ');
  const query = `SELECT ${fieldList} FROM ${config.sfObject} WHERE LastModifiedDate > ${lastSyncTime} ORDER BY LastModifiedDate ASC`;

  let nextUrl = `${instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(query)}`;
  let batchCount = 0;
  let totalProcessed = 0;
  let totalImported = 0;
  const allErrors: any[] = [];

  while (nextUrl) {
    batchCount++;
    console.log(`  ${config.sfObject}: Fetching batch ${batchCount}...`);

    const response = await fetch(nextUrl, {
      headers: {
        'Authorization': `Bearer ${sessionId}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Salesforce query failed for ${config.sfObject}: ${errorText}`);
    }

    const data = await response.json();
    const records = data.records || [];
    totalProcessed += records.length;

    console.log(`  ${config.sfObject}: Processing ${records.length} records from batch ${batchCount}...`);

    const { imported, errors } = await processAndSyncBatch(supabase, records, config, batchCount);
    totalImported += imported;
    allErrors.push(...errors);

    console.log(`  ${config.sfObject}: Batch ${batchCount} completed - ${imported} synced (${totalImported} total)`);

    if (data.nextRecordsUrl) {
      nextUrl = `${instanceUrl}${data.nextRecordsUrl}`;
    } else {
      nextUrl = null;
    }
  }

  console.log(`  ${config.sfObject}: All batches complete - ${totalProcessed} retrieved, ${totalImported} synced`);
  return { total: totalProcessed, imported: totalImported, errors: allErrors };
}

async function syncObject(
  supabase: any,
  sessionId: string,
  instanceUrl: string,
  config: SalesforceObjectConfig,
  lastSyncTime: string
) {
  console.log(`\nSyncing ${config.sfObject}...`);

  const result = await streamSalesforceData(
    supabase,
    sessionId,
    instanceUrl,
    config,
    lastSyncTime
  );

  return {
    imported: result.imported,
    updated: 0,
    total: result.total,
    errors: result.errors
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('=== Salesforce Sync Function Started ===');
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const objectParam = url.searchParams.get('object');
    console.log('Object parameter:', objectParam || 'ALL OBJECTS');

    // Get credentials from environment or use defaults
    const username = Deno.env.get('SALESFORCE_USERNAME') || 'developer@sunation.com';
    const password = Deno.env.get('SALESFORCE_PASSWORD') || 'Solar171!';
    // Security token is optional - not needed for most Salesforce orgs
    // const securityToken = Deno.env.get('SALESFORCE_SECURITY_TOKEN') || '';
    const securityToken = '';

    // Salesforce requires security token appended to password
    const passwordWithToken = password + securityToken;

    console.log('Logging into Salesforce via SOAP...');
    console.log('Username:', username);
    console.log('Using security token:', securityToken ? 'Yes' : 'No');

    let sfAuth;
    try {
      sfAuth = await soapLogin(username, passwordWithToken);
      console.log('Salesforce login successful:', sfAuth.instanceUrl);
    } catch (loginError: any) {
      console.error('Salesforce login failed:', loginError.message);
      throw new Error(`Salesforce authentication failed: ${loginError.message}`);
    }
    console.log('Salesforce login successful:', sfAuth.instanceUrl);

    const primaryObjects = ['Lead', 'Account', 'Contact', 'Opportunity', 'Task'];

    const objectsToSync = objectParam
      ? SALESFORCE_OBJECTS.filter(o => o.sfObject === objectParam)
      : SALESFORCE_OBJECTS.filter(o => primaryObjects.includes(o.sfObject));

    if (objectsToSync.length === 0) {
      throw new Error(`Object '${objectParam}' not found in configuration`);
    }

    console.log(`Syncing ${objectsToSync.length} objects: ${objectsToSync.map(o => o.sfObject).join(', ')}`);

    const { data: jobData, error: jobError } = await supabase
      .from('salesforce_sync_jobs')
      .insert({
        job_type: objectParam ? `sync_${objectParam}` : 'full_sync',
        status: 'running',
        started_at: new Date().toISOString(),
        total_objects: objectsToSync.length,
        completed_objects: 0,
        total_records_synced: 0,
        total_errors: 0,
        metadata: { objects: objectsToSync.map(o => o.sfObject) }
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create sync job:', jobError);
    }

    const jobId = jobData?.id;
    console.log('Created sync job:', jobId);

    const results: any = {
      success: true,
      objects: {},
      totalImported: 0,
      totalUpdated: 0,
      totalErrors: 0
    };

    for (const config of objectsToSync) {
      const { data: lastLog } = await supabase
        .from('salesforce_sync_logs')
        .select('created_at')
        .eq('salesforce_object', config.sfObject)
        .eq('log_level', 'success')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastSync = lastLog?.created_at || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const lastSyncFormatted = lastSync.split('.')[0] + 'Z';

      console.log(`\n${config.sfObject}: Fetching data modified since ${lastSyncFormatted}`);

      try {
        const result = await syncObject(
          supabase,
          sfAuth.sessionId,
          sfAuth.instanceUrl,
          config,
          lastSyncFormatted
        );

        results.objects[config.sfObject] = result;
        results.totalImported += result.imported;
        results.totalUpdated += result.updated;
        results.totalErrors += result.errors.length;

        await supabase
          .from('salesforce_sync_logs')
          .insert({
            salesforce_object: config.sfObject,
            log_level: 'success',
            message: `Synced ${result.imported + result.updated} records`,
            records_processed: result.total,
            records_inserted: result.imported,
            records_updated: result.updated,
            records_failed: result.errors.length
          });

        console.log(`✓ ${config.sfObject}: ${result.imported} imported, ${result.updated} updated (${result.total} total)`);
      } catch (err: any) {
        console.error(`✗ Failed to sync ${config.sfObject}:`, err.message);
        results.objects[config.sfObject] = {
          error: err.message,
          imported: 0,
          updated: 0,
          total: 0,
          errors: []
        };
        results.totalErrors++;

        await supabase
          .from('salesforce_sync_logs')
          .insert({
            salesforce_object: config.sfObject,
            log_level: 'error',
            message: err.message,
            records_processed: 0,
            records_inserted: 0,
            records_updated: 0,
            records_failed: 0,
            error_details: { error: err.message, stack: err.stack }
          });
      }

      if (jobId) {
        await supabase
          .from('salesforce_sync_jobs')
          .update({
            completed_objects: Object.keys(results.objects).length,
            total_records_synced: results.totalImported + results.totalUpdated,
            total_errors: results.totalErrors,
            metadata: { objects: objectsToSync.map(o => o.sfObject), results: results.objects }
          })
          .eq('id', jobId);
      }
    }

    if (jobId) {
      await supabase
        .from('salesforce_sync_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_objects: objectsToSync.length,
          total_records_synced: results.totalImported + results.totalUpdated,
          total_errors: results.totalErrors,
          metadata: { objects: objectsToSync.map(o => o.sfObject), results: results.objects }
        })
        .eq('id', jobId);
    }

    console.log('\n=== SYNC COMPLETE ===');
    console.log(`Total: ${results.totalImported} imported, ${results.totalUpdated} updated, ${results.totalErrors} errors`);

    return new Response(JSON.stringify(results), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error('Sync error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
});
