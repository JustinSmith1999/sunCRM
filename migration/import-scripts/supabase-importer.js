/**
 * SUNation CRM Data Import Script
 * Imports transformed Salesforce data into Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
const SalesforceDataTransformer = require('../migration-scripts/data-transformer');

class SupabaseImporter {
  constructor(supabaseUrl, supabaseKey, organizationId) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.organizationId = organizationId;
    this.transformer = new SalesforceDataTransformer();
    this.externalIdMap = new Map(); // Track SF ID → Supabase ID mappings
  }

  /**
   * Main import orchestrator
   */
  async importAllData(dataDirectory) {
    console.log('🚀 Starting SUNation CRM data import...');
    
    try {
      // Import in dependency order
      await this.importUsers(`${dataDirectory}/users.csv`);
      await this.importAccounts(`${dataDirectory}/accounts.csv`);
      await this.importContacts(`${dataDirectory}/contacts.csv`);
      await this.importLeads(`${dataDirectory}/leads.csv`);
      await this.importOpportunities(`${dataDirectory}/opportunities.csv`);
      await this.importActivities(`${dataDirectory}/tasks.csv`);
      await this.importCases(`${dataDirectory}/cases.csv`);
      
      console.log('✅ Data import completed successfully!');
      
      // Generate import report
      await this.generateImportReport();
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
  }

  /**
   * Import Users
   */
  async importUsers(filePath) {
    console.log('👥 Importing users...');
    
    const users = await this.readCSV(filePath);
    const importedUsers = [];
    
    for (const sfUser of users) {
      try {
        // Create user profile
        const userData = {
          id: sfUser.Id, // Use SF ID as Supabase user ID for now
          email: sfUser.Email,
          full_name: `${sfUser.FirstName} ${sfUser.LastName}`,
          created_at: new Date(sfUser.CreatedDate).toISOString(),
          updated_at: new Date(sfUser.LastModifiedDate).toISOString()
        };

        const { data: user, error: userError } = await this.supabase
          .from('user_profiles')
          .insert(userData)
          .select()
          .single();

        if (userError) throw userError;

        // Create organization role
        const roleData = {
          user_id: user.id,
          organization_id: this.organizationId,
          role: this.mapUserRole(sfUser.Profile?.Name || sfUser.UserRole?.Name),
          created_at: new Date().toISOString()
        };

        const { error: roleError } = await this.supabase
          .from('user_organization_roles')
          .insert(roleData);

        if (roleError) throw roleError;

        this.externalIdMap.set(`User:${sfUser.Id}`, user.id);
        importedUsers.push(user);
        
      } catch (error) {
        console.error(`Failed to import user ${sfUser.Email}:`, error);
      }
    }
    
    console.log(`✅ Imported ${importedUsers.length} users`);
    return importedUsers;
  }

  /**
   * Import Accounts
   */
  async importAccounts(filePath) {
    console.log('🏢 Importing accounts...');
    
    const accounts = await this.readCSV(filePath);
    const importedAccounts = [];
    
    for (const sfAccount of accounts) {
      try {
        const accountData = this.transformer.transformAccount(sfAccount);
        accountData.organization_id = this.organizationId;
        accountData.owner_id = this.externalIdMap.get(`User:${sfAccount.OwnerId}`);
        accountData.created_by = this.externalIdMap.get(`User:${sfAccount.CreatedById}`);

        const { data: account, error } = await this.supabase
          .from('accounts')
          .insert(accountData)
          .select()
          .single();

        if (error) throw error;

        this.externalIdMap.set(`Account:${sfAccount.Id}`, account.id);
        importedAccounts.push(account);
        
      } catch (error) {
        console.error(`Failed to import account ${sfAccount.Name}:`, error);
      }
    }
    
    console.log(`✅ Imported ${importedAccounts.length} accounts`);
    return importedAccounts;
  }

  /**
   * Import Contacts
   */
  async importContacts(filePath) {
    console.log('👤 Importing contacts...');
    
    const contacts = await this.readCSV(filePath);
    const importedContacts = [];
    
    for (const sfContact of contacts) {
      try {
        const contactData = this.transformer.transformContact(sfContact);
        contactData.organization_id = this.organizationId;
        contactData.account_id = this.externalIdMap.get(`Account:${sfContact.AccountId}`);
        contactData.owner_id = this.externalIdMap.get(`User:${sfContact.OwnerId}`);
        contactData.created_by = this.externalIdMap.get(`User:${sfContact.CreatedById}`);

        const { data: contact, error } = await this.supabase
          .from('contacts')
          .insert(contactData)
          .select()
          .single();

        if (error) throw error;

        this.externalIdMap.set(`Contact:${sfContact.Id}`, contact.id);
        importedContacts.push(contact);
        
      } catch (error) {
        console.error(`Failed to import contact ${sfContact.FirstName} ${sfContact.LastName}:`, error);
      }
    }
    
    console.log(`✅ Imported ${importedContacts.length} contacts`);
    return importedContacts;
  }

  /**
   * Import Opportunities
   */
  async importOpportunities(filePath) {
    console.log('💰 Importing opportunities...');
    
    const opportunities = await this.readCSV(filePath);
    const importedOpportunities = [];
    
    for (const sfOpportunity of opportunities) {
      try {
        const opportunityData = this.transformer.transformOpportunity(sfOpportunity);
        opportunityData.organization_id = this.organizationId;
        opportunityData.account_id = this.externalIdMap.get(`Account:${sfOpportunity.AccountId}`);
        opportunityData.owner_id = this.externalIdMap.get(`User:${sfOpportunity.OwnerId}`);
        opportunityData.created_by = this.externalIdMap.get(`User:${sfOpportunity.CreatedById}`);

        const { data: opportunity, error } = await this.supabase
          .from('opportunities')
          .insert(opportunityData)
          .select()
          .single();

        if (error) throw error;

        this.externalIdMap.set(`Opportunity:${sfOpportunity.Id}`, opportunity.id);
        importedOpportunities.push(opportunity);
        
      } catch (error) {
        console.error(`Failed to import opportunity ${sfOpportunity.Name}:`, error);
      }
    }
    
    console.log(`✅ Imported ${importedOpportunities.length} opportunities`);
    return importedOpportunities;
  }

  /**
   * Import Activities (Tasks/Events)
   */
  async importActivities(filePath) {
    console.log('📋 Importing activities...');
    
    const activities = await this.readCSV(filePath);
    const importedActivities = [];
    
    for (const sfActivity of activities) {
      try {
        const activityData = this.transformer.transformActivity(sfActivity);
        activityData.organization_id = this.organizationId;
        activityData.account_id = this.externalIdMap.get(`Account:${sfActivity.AccountId}`);
        activityData.contact_id = this.externalIdMap.get(`Contact:${sfActivity.WhoId}`);
        activityData.opportunity_id = this.externalIdMap.get(`Opportunity:${sfActivity.WhatId}`);
        activityData.assigned_to = this.externalIdMap.get(`User:${sfActivity.OwnerId}`);
        activityData.created_by = this.externalIdMap.get(`User:${sfActivity.CreatedById}`);

        const { data: activity, error } = await this.supabase
          .from('activities')
          .insert(activityData)
          .select()
          .single();

        if (error) throw error;

        this.externalIdMap.set(`Activity:${sfActivity.Id}`, activity.id);
        importedActivities.push(activity);
        
      } catch (error) {
        console.error(`Failed to import activity ${sfActivity.Subject}:`, error);
      }
    }
    
    console.log(`✅ Imported ${importedActivities.length} activities`);
    return importedActivities;
  }

  /**
   * Import Cases
   */
  async importCases(filePath) {
    console.log('🎫 Importing cases...');
    
    const cases = await this.readCSV(filePath);
    const importedCases = [];
    
    for (const sfCase of cases) {
      try {
        const caseData = this.transformer.transformCase(sfCase);
        caseData.organization_id = this.organizationId;
        caseData.account_id = this.externalIdMap.get(`Account:${sfCase.AccountId}`);
        caseData.contact_id = this.externalIdMap.get(`Contact:${sfCase.ContactId}`);
        caseData.assigned_to = this.externalIdMap.get(`User:${sfCase.OwnerId}`);
        caseData.created_by = this.externalIdMap.get(`User:${sfCase.CreatedById}`);

        const { data: caseRecord, error } = await this.supabase
          .from('cases')
          .insert(caseData)
          .select()
          .single();

        if (error) throw error;

        this.externalIdMap.set(`Case:${sfCase.Id}`, caseRecord.id);
        importedCases.push(caseRecord);
        
      } catch (error) {
        console.error(`Failed to import case ${sfCase.CaseNumber}:`, error);
      }
    }
    
    console.log(`✅ Imported ${importedCases.length} cases`);
    return importedCases;
  }

  /**
   * Helper Methods
   */
  async readCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  mapUserRole(sfProfile) {
    const roleMapping = {
      'System Administrator': 'admin',
      'Sales Manager': 'manager',
      'Standard User': 'rep',
      'Marketing User': 'rep',
      'Support User': 'support',
      'Read Only': 'readonly'
    };
    return roleMapping[sfProfile] || 'rep';
  }

  async generateImportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      organization_id: this.organizationId,
      summary: {
        users: this.externalIdMap.size,
        accounts: Array.from(this.externalIdMap.keys()).filter(k => k.startsWith('Account:')).length,
        contacts: Array.from(this.externalIdMap.keys()).filter(k => k.startsWith('Contact:')).length,
        opportunities: Array.from(this.externalIdMap.keys()).filter(k => k.startsWith('Opportunity:')).length,
        activities: Array.from(this.externalIdMap.keys()).filter(k => k.startsWith('Activity:')).length,
        cases: Array.from(this.externalIdMap.keys()).filter(k => k.startsWith('Case:')).length
      }
    };

    fs.writeFileSync('import-report.json', JSON.stringify(report, null, 2));
    console.log('📊 Import report generated: import-report.json');
  }
}

// Usage example
async function runImport() {
  const importer = new SupabaseImporter(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.ORGANIZATION_ID
  );

  await importer.importAllData('./salesforce-export/data');
}

// Run if called directly
if (require.main === module) {
  runImport().catch(console.error);
}

module.exports = SupabaseImporter;