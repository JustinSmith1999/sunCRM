# Salesforce to SUNation CRM Migration Guide

## 📋 Required Salesforce Exports

### 1. **Data Exports** (CSV/Excel format)
Please export the following objects with ALL fields:

#### Core Objects:
- **Account** - All account records with custom fields
- **Contact** - All contacts with relationships to accounts
- **Opportunity** - All opportunities with stages, amounts, close dates
- **Lead** - All leads with conversion history
- **Task** - All tasks and activities
- **Event** - All calendar events and meetings
- **Case** - All support cases with resolution data
- **User** - All users with roles and profiles
- **Product2** - All products in your catalog
- **Quote** - All quotes and quote line items
- **Campaign** - All marketing campaigns
- **CampaignMember** - Campaign membership data

#### Custom Objects:
- List all custom objects and their API names
- Export data for each custom object

### 2. **Configuration Exports**

#### Field Definitions:
```
Setup → Object Manager → [Object] → Fields & Relationships
```
Export for each object:
- Field API names
- Field types (Text, Number, Picklist, etc.)
- Field lengths and validation rules
- Required fields
- Default values
- Picklist values
- Field dependencies

#### Page Layouts:
```
Setup → Object Manager → [Object] → Page Layouts
```
- Screenshot or export each page layout
- Field positioning and sections
- Related lists configuration

#### Record Types:
```
Setup → Object Manager → [Object] → Record Types
```
- Record type names and descriptions
- Picklist value assignments per record type

#### Validation Rules:
```
Setup → Object Manager → [Object] → Validation Rules
```
- Rule names and formulas
- Error messages
- Active/inactive status

#### Workflow Rules & Process Builder:
```
Setup → Process Automation → Workflow Rules
Setup → Process Automation → Process Builder
```
- All automation rules and their criteria
- Actions (field updates, email alerts, tasks)
- Flow definitions

#### Security & Sharing:
```
Setup → Users → Profiles
Setup → Users → Permission Sets
Setup → Security → Sharing Settings
```
- Profile permissions matrix
- Permission set assignments
- Organization-wide defaults
- Sharing rules

### 3. **Integration Details**

#### Connected Apps:
```
Setup → Apps → App Manager → Connected Apps
```
- OAuth configurations
- API integrations
- Third-party connections

#### Email Templates:
```
Setup → Communication Templates → Email Templates
```
- Template HTML/text content
- Merge field usage
- Folder organization

#### Reports & Dashboards:
```
Reports Tab → All Folders
Dashboards Tab → All Folders
```
- Report definitions and filters
- Dashboard layouts and components
- Scheduled report settings

## 📊 Data Export Instructions

### Using Data Export Wizard:
1. Go to `Setup → Data → Data Export`
2. Select "Export Now" or schedule weekly export
3. Include all objects and all data
4. Choose CSV format
5. Include deleted records if needed

### Using Workbench (for detailed exports):
1. Go to workbench.developerforce.com
2. Login with your Salesforce credentials
3. Use SOQL queries to export specific data with relationships

### Sample SOQL Queries:
```sql
-- Accounts with all fields
SELECT FIELDS(ALL) FROM Account LIMIT 200

-- Opportunities with Account relationship
SELECT Id, Name, Amount, StageName, CloseDate, Account.Name, Account.Id 
FROM Opportunity

-- Contacts with Account relationship
SELECT Id, FirstName, LastName, Email, Phone, Account.Name, Account.Id 
FROM Contact
```

## 🔧 Configuration Documentation Needed

### 1. Business Process Documentation:
- Sales process stages and criteria
- Lead qualification process
- Case escalation procedures
- Approval processes
- Territory assignment rules

### 2. Custom Field Mapping:
Create a spreadsheet with:
- Object Name
- Field API Name
- Field Label
- Field Type
- Required/Optional
- Default Values
- Picklist Values
- Business Purpose

### 3. Integration Requirements:
- Email system (Office 365/Gmail)
- Phone system details
- ERP system connections
- Marketing automation tools
- Document storage systems

### 4. User Roles & Permissions:
- Current role hierarchy
- Permission requirements per role
- Data access restrictions
- Territory assignments

## 📁 File Organization

Please organize your exports in this structure:
```
salesforce-export/
├── data/
│   ├── accounts.csv
│   ├── contacts.csv
│   ├── opportunities.csv
│   ├── leads.csv
│   ├── tasks.csv
│   ├── cases.csv
│   └── users.csv
├── configuration/
│   ├── custom-fields.xlsx
│   ├── validation-rules.xlsx
│   ├── workflows.xlsx
│   └── page-layouts/
├── reports/
│   ├── report-definitions.xlsx
│   └── dashboard-screenshots/
└── integrations/
    ├── connected-apps.xlsx
    └── email-templates/
```

## 🚀 Next Steps After Export

1. **Data Validation**: We'll validate data integrity and relationships
2. **Field Mapping**: Map Salesforce fields to SUNation CRM schema
3. **Custom Field Creation**: Create any missing custom fields
4. **Data Transformation**: Clean and transform data for import
5. **User Migration**: Set up users with appropriate roles
6. **Testing**: Validate migrated data and functionality
7. **Training**: Provide user training on new system

## ⚠️ Important Notes

- **Backup Everything**: Keep complete Salesforce backup during transition
- **API Limits**: Large orgs may need multiple export sessions
- **Data Privacy**: Ensure compliance with data protection regulations
- **Timing**: Plan migration during low-usage periods
- **Rollback Plan**: Maintain ability to revert if needed

## 📞 Support

If you need help with any export process, please provide:
- Your Salesforce edition (Professional, Enterprise, Unlimited)
- Number of records per object
- Any custom objects or complex configurations
- Integration requirements
- Timeline constraints