/**
 * Salesforce to SUNation CRM Data Transformation Scripts
 */

class SalesforceDataTransformer {
  constructor() {
    this.stageMapping = {
      'Prospecting': 'prospecting',
      'Qualification': 'qualification', 
      'Needs Analysis': 'needs_analysis',
      'Value Proposition': 'needs_analysis',
      'Id. Decision Makers': 'qualification',
      'Perception Analysis': 'needs_analysis',
      'Proposal/Price Quote': 'proposal',
      'Negotiation/Review': 'negotiation',
      'Closed Won': 'closed_won',
      'Closed Lost': 'closed_lost'
    };

    this.priorityMapping = {
      'High': 'high',
      'Medium': 'normal',
      'Low': 'low',
      'Critical': 'urgent'
    };

    this.statusMapping = {
      'Not Started': 'not_started',
      'In Progress': 'in_progress',
      'Completed': 'completed',
      'Waiting on someone else': 'pending',
      'Deferred': 'cancelled'
    };
  }

  /**
   * Transform Salesforce Account data
   */
  transformAccount(sfAccount) {
    return {
      // Core fields
      name: sfAccount.Name,
      type: this.mapAccountType(sfAccount.Type),
      industry: sfAccount.Industry,
      website: sfAccount.Website,
      phone: sfAccount.Phone,
      
      // Financial data
      annual_revenue: this.parseNumber(sfAccount.AnnualRevenue),
      employee_count: this.parseNumber(sfAccount.NumberOfEmployees),
      
      // Address data
      billing_address: this.transformAddress({
        street: sfAccount.BillingStreet,
        city: sfAccount.BillingCity,
        state: sfAccount.BillingState,
        postal_code: sfAccount.BillingPostalCode,
        country: sfAccount.BillingCountry
      }),
      
      shipping_address: this.transformAddress({
        street: sfAccount.ShippingStreet,
        city: sfAccount.ShippingCity,
        state: sfAccount.ShippingState,
        postal_code: sfAccount.ShippingPostalCode,
        country: sfAccount.ShippingCountry
      }),
      
      // Metadata
      description: sfAccount.Description,
      external_id: sfAccount.Id,
      created_at: new Date(sfAccount.CreatedDate).toISOString(),
      updated_at: new Date(sfAccount.LastModifiedDate).toISOString()
    };
  }

  /**
   * Transform Salesforce Contact data
   */
  transformContact(sfContact) {
    return {
      first_name: sfContact.FirstName,
      last_name: sfContact.LastName,
      email: sfContact.Email,
      phone: sfContact.Phone,
      mobile: sfContact.MobilePhone,
      title: sfContact.Title,
      department: sfContact.Department,
      
      mailing_address: this.transformAddress({
        street: sfContact.MailingStreet,
        city: sfContact.MailingCity,
        state: sfContact.MailingState,
        postal_code: sfContact.MailingPostalCode,
        country: sfContact.MailingCountry
      }),
      
      is_primary: sfContact.IsPrimary || false,
      external_id: sfContact.Id,
      account_external_id: sfContact.AccountId,
      created_at: new Date(sfContact.CreatedDate).toISOString(),
      updated_at: new Date(sfContact.LastModifiedDate).toISOString()
    };
  }

  /**
   * Transform Salesforce Opportunity data
   */
  transformOpportunity(sfOpportunity) {
    return {
      name: sfOpportunity.Name,
      amount: this.parseNumber(sfOpportunity.Amount),
      stage: this.stageMapping[sfOpportunity.StageName] || 'prospecting',
      probability: parseInt(sfOpportunity.Probability) || 0,
      close_date: sfOpportunity.CloseDate,
      next_step: sfOpportunity.NextStep,
      description: sfOpportunity.Description,
      lead_source: sfOpportunity.LeadSource,
      
      external_id: sfOpportunity.Id,
      account_external_id: sfOpportunity.AccountId,
      owner_external_id: sfOpportunity.OwnerId,
      created_by_external_id: sfOpportunity.CreatedById,
      created_at: new Date(sfOpportunity.CreatedDate).toISOString(),
      updated_at: new Date(sfOpportunity.LastModifiedDate).toISOString()
    };
  }

  /**
   * Transform Salesforce Task/Event data
   */
  transformActivity(sfTask) {
    const isEvent = sfTask.attributes?.type === 'Event';
    
    return {
      type: this.mapActivityType(sfTask.Type || (isEvent ? 'meeting' : 'task')),
      subject: sfTask.Subject,
      description: sfTask.Description,
      status: this.statusMapping[sfTask.Status] || 'not_started',
      priority: this.priorityMapping[sfTask.Priority] || 'normal',
      
      due_date: isEvent ? sfTask.StartDateTime : sfTask.ActivityDate,
      completed_at: sfTask.Status === 'Completed' ? sfTask.LastModifiedDate : null,
      
      external_id: sfTask.Id,
      account_external_id: sfTask.AccountId,
      contact_external_id: sfTask.WhoId,
      opportunity_external_id: sfTask.WhatId,
      assigned_to_external_id: sfTask.OwnerId,
      created_by_external_id: sfTask.CreatedById,
      created_at: new Date(sfTask.CreatedDate).toISOString(),
      updated_at: new Date(sfTask.LastModifiedDate).toISOString()
    };
  }

  /**
   * Transform Salesforce Lead data
   */
  transformLead(sfLead) {
    return {
      first_name: sfLead.FirstName,
      last_name: sfLead.LastName,
      email: sfLead.Email,
      phone: sfLead.Phone,
      mobile: sfLead.MobilePhone,
      company: sfLead.Company,
      title: sfLead.Title,
      industry: sfLead.Industry,
      lead_source: sfLead.LeadSource,
      status: this.mapLeadStatus(sfLead.Status),
      rating: this.mapLeadRating(sfLead.Rating),
      
      annual_revenue: this.parseNumber(sfLead.AnnualRevenue),
      employee_count: this.parseNumber(sfLead.NumberOfEmployees),
      website: sfLead.Website,
      description: sfLead.Description,
      
      address: this.transformAddress({
        street: sfLead.Street,
        city: sfLead.City,
        state: sfLead.State,
        postal_code: sfLead.PostalCode,
        country: sfLead.Country
      }),
      
      converted_account_external_id: sfLead.ConvertedAccountId,
      converted_contact_external_id: sfLead.ConvertedContactId,
      converted_opportunity_external_id: sfLead.ConvertedOpportunityId,
      converted_date: sfLead.ConvertedDate,
      
      external_id: sfLead.Id,
      owner_external_id: sfLead.OwnerId,
      created_by_external_id: sfLead.CreatedById,
      created_at: new Date(sfLead.CreatedDate).toISOString(),
      updated_at: new Date(sfLead.LastModifiedDate).toISOString()
    };
  }

  /**
   * Transform Salesforce Case data
   */
  transformCase(sfCase) {
    return {
      case_number: sfCase.CaseNumber,
      subject: sfCase.Subject,
      description: sfCase.Description,
      status: this.mapCaseStatus(sfCase.Status),
      priority: this.priorityMapping[sfCase.Priority] || 'normal',
      
      external_id: sfCase.Id,
      account_external_id: sfCase.AccountId,
      contact_external_id: sfCase.ContactId,
      assigned_to_external_id: sfCase.OwnerId,
      created_by_external_id: sfCase.CreatedById,
      created_at: new Date(sfCase.CreatedDate).toISOString(),
      updated_at: new Date(sfCase.LastModifiedDate).toISOString(),
      resolved_at: sfCase.Status === 'Closed' ? sfCase.ClosedDate : null
    };
  }

  /**
   * Helper methods
   */
  transformAddress(addressData) {
    if (!addressData.street && !addressData.city) return null;
    
    return {
      street: addressData.street,
      city: addressData.city,
      state: addressData.state,
      postal_code: addressData.postal_code,
      country: addressData.country
    };
  }

  parseNumber(value) {
    if (!value) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  mapAccountType(sfType) {
    const typeMapping = {
      'Customer - Direct': 'customer',
      'Customer - Channel': 'customer',
      'Channel Partner / Reseller': 'partner',
      'Installation Partner': 'partner',
      'Technology Partner': 'partner',
      'Prospect': 'prospect',
      'Other': 'prospect'
    };
    return typeMapping[sfType] || 'prospect';
  }

  mapActivityType(sfType) {
    const typeMapping = {
      'Call': 'call',
      'Email': 'email',
      'Meeting': 'meeting',
      'Task': 'task',
      'Other': 'note'
    };
    return typeMapping[sfType] || 'task';
  }

  mapLeadStatus(sfStatus) {
    const statusMapping = {
      'Open - Not Contacted': 'new',
      'Working - Contacted': 'contacted',
      'Closed - Converted': 'converted',
      'Closed - Not Converted': 'unqualified',
      'Qualified': 'qualified'
    };
    return statusMapping[sfStatus] || 'new';
  }

  mapLeadRating(sfRating) {
    const ratingMapping = {
      'Hot': 'hot',
      'Warm': 'warm',
      'Cold': 'cold'
    };
    return ratingMapping[sfRating] || 'cold';
  }

  mapCaseStatus(sfStatus) {
    const statusMapping = {
      'New': 'new',
      'Working': 'in_progress',
      'Escalated': 'in_progress',
      'On Hold': 'pending',
      'Closed': 'resolved'
    };
    return statusMapping[sfStatus] || 'new';
  }
}

module.exports = SalesforceDataTransformer;