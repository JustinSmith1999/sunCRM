# Department and Role Mappings

## Automatic Role Assignment from Salesforce

When you sync users from Salesforce, the system automatically assigns roles and permissions based on their Salesforce Profile, Role, Department, and Title.

## Role Definitions and Permissions

### 1. **Administrator**
- **Triggered by:** Salesforce Profile contains "System Administrator" or "Admin"
- **Permissions:**
  - Full system access
  - Manage all users and settings
  - Access all analytics and reports
  - Manage Salesforce integration
  - Configure automation and integrations

### 2. **Executive**
- **Triggered by:** Title contains CEO, CFO, CTO, President, Chief, VP, Vice President, or Director
- **Permissions:**
  - View all data across the system
  - Access executive dashboards
  - View all reports and financials
  - View analytics
  - Approve large deals

### 3. **Sales Manager**
- **Triggered by:**
  - Department: Sales
  - Title: Manager, Director, VP, Vice President
  - Salesforce Role: Contains "Manager" or "Director"
- **Permissions:**
  - View and manage all team deals
  - View analytics and forecasts
  - Manage and reassign leads
  - View team performance
  - Approve discounts
  - Manage territory

### 4. **Sales Representative**
- **Triggered by:**
  - Department: Sales (without manager title)
  - Salesforce Profile/Role: Contains "Sales"
- **Permissions:**
  - View and manage own deals
  - Create and view leads
  - Create quotes and manage opportunities
  - Schedule meetings and log calls
  - View own performance metrics

### 5. **Finance Manager**
- **Triggered by:**
  - Department: Finance, Accounting
  - Title: Contains "Accountant" or "Finance"
- **Permissions:**
  - View all financial data
  - Manage invoices and payments
  - Export financial data
  - Manage budgets
  - View financial reports

### 6. **Engineering**
- **Triggered by:**
  - Department: Engineering, Technical, Design
  - Title: Contains "Engineer" or "Designer"
- **Permissions:**
  - View technical documentation
  - Manage projects
  - Access Aurora Solar integration
  - Create solar designs
  - Approve installations
  - View technical reports

### 7. **Marketing**
- **Triggered by:**
  - Department: Marketing
  - Title: Contains "Marketing"
- **Permissions:**
  - View and manage campaigns
  - View lead sources
  - Manage web forms
  - View analytics
  - Manage marketing content

### 8. **HR Manager**
- **Triggered by:**
  - Department: HR, Human Resources, People
  - Title: Contains "HR"
- **Permissions:**
  - View and manage HR records
  - View and manage employees
  - View compensation data
  - Manage time off requests
  - View HR analytics
  - Manage onboarding

### 9. **Customer Success**
- **Triggered by:**
  - Department: Customer Success, Account Management
  - Title: Contains "Customer Success" or "Account Manager"
- **Permissions:**
  - View and manage customer relationships
  - View and manage cases
  - View satisfaction scores
  - Send customer communications

### 10. **Support**
- **Triggered by:**
  - Department: Service, Support
  - Salesforce Profile: Contains "Service" or "Support"
- **Permissions:**
  - View and manage cases
  - View and manage knowledge base
  - View customers
  - Send emails
  - Escalate cases
  - View SLA metrics

### 11. **Operations**
- **Triggered by:**
  - Department: Operations
  - Salesforce Profile/Role: Contains "Operations"
  - Title: Contains "Operations"
- **Permissions:**
  - View reports
  - Manage equipment and inventory
  - Manage workflows
  - View and manage schedules
  - View logistics
  - Coordinate installations

### 12. **Installation Technician**
- **Triggered by:**
  - Department: Installation, Field
  - Title: Contains "Installer", "Technician", "Field Tech"
- **Permissions:**
  - View assigned projects
  - Update project status
  - Upload photos
  - Complete installation checklists
  - View equipment
  - Mobile access

### 13. **Warehouse Manager**
- **Triggered by:**
  - Department: Warehouse, Inventory, Logistics
  - Title: Contains "Warehouse"
- **Permissions:**
  - View and manage inventory
  - Manage equipment
  - View orders
  - Process shipments
  - View inventory reports

### 14. **Partner Portal User**
- **Triggered by:**
  - Salesforce Profile: Contains "Partner", "External", "Community", "Portal"
- **Permissions:**
  - View own leads and deals
  - Create leads
  - Submit projects
  - View partner reports
  - Access partner portal

## How to Use

1. **Navigate to Admin → User Management**
2. **Click "Sync from Salesforce"**
3. The system will:
   - Pull all active Salesforce users
   - Analyze their Profile, Role, Department, and Title
   - Automatically assign the appropriate role
   - Create their login accounts with the correct permissions

## Viewing User Assignments

After sync, each user record will show:
- **Full Name** (from Salesforce)
- **Email** (login credential)
- **Role** (automatically assigned)
- **Department** (from Salesforce)
- **Title** (from Salesforce)
- **Permissions** (based on role)

## Default Behavior

If a user doesn't match any specific criteria, they will be assigned the **Sales Representative** role as a safe default with basic permissions.
