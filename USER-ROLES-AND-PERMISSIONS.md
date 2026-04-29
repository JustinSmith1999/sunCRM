# User Roles and Permissions Guide

## Overview

All 147 Sunation employees are assigned roles based on their departments. Each role determines what features and data they can access in the system.

## Login Credentials

**Default Password for All Users**: `sunation9454`

**Email Format**: `firstinitial` + `lastname` + `@sunation.com`

Examples:
- Scott Maskin → smaskin@sunation.com
- James Pisseri → jpisseri@sunation.com
- Michael Dellarocca → mdellarocca@sunation.com

---

## Role Breakdown by User Count

| Role | Display Name | User Count | Departments |
|------|--------------|------------|-------------|
| **admin** | Administrator | 23 users | Finance, Engineering, Executive, IT |
| **sales_manager** | Sales Manager | 12 users | Lead Qualification, Sales Admin, Operations Management |
| **sales_rep** | Sales Representative | 13 users | Residential & Commercial Sales |
| **operations** | Operations User | 89 users | Installers, Office Staff, Field Service, Roofing, Warehouse |
| **support** | Support User | 7 users | Service Office Coordinators |
| **hr_manager** | HR Manager | 3 users | Human Resources |

---

## Detailed Permissions by Role

### 1. Administrator (23 users)

**Who has this role:**
- Finance administrators (Michael Dellarocca, Richard Gutkind, Sandra Rivera, etc.)
- Engineering administrators (Sean Beattie, Julianna Cicero, John Ferrara, James Pisseri, etc.)
- Executives (Kristin Hlavka, Scott Maskin, James Brennan)
- IT managers (Michael Stegmeier, Cory Carrara, Regina Yau)

**Full Access Includes:**
- ✓ **All system features and data**
- ✓ Manage users and permissions
- ✓ Configure system settings
- ✓ View all analytics and reports
- ✓ Manage Salesforce integration
- ✓ Access admin console
- ✓ View all leads, deals, accounts, contacts
- ✓ Manage company equipment
- ✓ View HR records
- ✓ Configure automation flows
- ✓ Manage web forms and email templates

**Dashboard Access:**
- Home Dashboard
- Admin Dashboard
- Sales Dashboard
- Finance Dashboard
- Reports Dashboard
- All specialized consoles (HR, Equipment, Automation, etc.)

---

### 2. Sales Manager (12 users)

**Who has this role:**
- Lead Qualification Managers (Maria Martin, Lynn Vita, Patricia Kemesies, Brandon Evans)
- Sales Administrators (Gary Roffman, Brian Bennett, Alexa Papa, Jessica Grady, Richard Gearhart)
- Residential Operations Managers (Brian Karp, John Mucci)
- Marketing Administrator (Richard Murdocco)

**Permissions:**
- ✓ View all deals and opportunities
- ✓ Manage their team's deals
- ✓ View sales analytics and metrics
- ✓ Manage leads (create, edit, assign)
- ✓ View team performance reports
- ✓ Access sales dashboards
- ✓ View contact and account information
- ✓ Create and manage campaigns

**Dashboard Access:**
- Home Dashboard
- Sales Dashboard
- My Day Dashboard
- Reports Dashboard (sales metrics)
- Lead Management
- Deals Kanban Board

**Cannot Access:**
- System settings
- User management
- HR records
- Financial data (unless also admin)
- Engineering requests

---

### 3. Sales Representative (13 users)

**Who has this role:**
- Residential Sales (John Leach, John Liberatore, Kevin Stafford, Chandradat Phagu, Cameron Augienello, Brian Murphy, Marques Bloxon, Kevin Jaramillo, Christopher Johnson)
- Commercial Sales (James Keane, Andrew Figueroa)
- Service Sales (Frank Struffolino, Sean Stafford)

**Permissions:**
- ✓ View their own deals and opportunities
- ✓ Manage their own deals
- ✓ Create new leads
- ✓ View assigned leads
- ✓ View contact information
- ✓ Update deal stages
- ✓ Log activities and notes
- ✓ View product catalog

**Dashboard Access:**
- Home Dashboard
- My Day Dashboard
- Their own sales metrics
- Lead List (assigned to them)
- Deals Kanban (their deals)

**Cannot Access:**
- Other reps' deals (unless shared)
- Team analytics
- Admin functions
- System settings
- HR records
- Company equipment management

---

### 4. Operations User (89 users)

**Who has this role:**
- Commercial Installers (Jeffrey Karpowich, Frank Capone, Nicholas Henneborn, etc.)
- Residential Installers (Chris Allgaier, Joseph Picinich, Michael Krebs, etc.)
- Commercial Office Staff (Scott Sousa, Tara DelBianco, Rachel Sauve, etc.)
- Field Service Technicians (Stephen Cascio, Peter Bartolomeo, Kris Cruciani, etc.)
- Roofing Specialists (Scott Morrison, Gregory Morrison, Juan Cartagena, etc.)
- Warehouse Staff (Christina Etienne, Williams Segura)
- Processing Administrators (Tammy Lea, Jessica Vandenburgh, Gina Cicero, etc.)
- Maintenance (David Strickland)

**Permissions:**
- ✓ View operational reports
- ✓ Manage equipment assignments
- ✓ View inventory
- ✓ Access task dashboard
- ✓ View their assigned work orders
- ✓ Update job status
- ✓ View installation schedules

**Dashboard Access:**
- Home Dashboard
- My Day Dashboard
- Task Dashboard
- Equipment tracking
- Work order list

**Cannot Access:**
- Sales data
- Lead management
- Financial reports
- Admin functions
- HR records
- System settings

---

### 5. Support User (7 users)

**Who has this role:**
- Service Office Coordinators (Harry Belechto, Antoinette Hemberger, Christopher Sauve, Glenn Dachinger, Michael Castillo, Alyssa Smith, Donna Trott)

**Permissions:**
- ✓ View customer cases
- ✓ Manage support cases
- ✓ View knowledge base articles
- ✓ Manage knowledge base
- ✓ Create support tickets
- ✓ View customer contact information
- ✓ Access service dashboard

**Dashboard Access:**
- Home Dashboard
- Service Dashboard
- Cases List
- Knowledge Base
- My Day Dashboard

**Cannot Access:**
- Sales opportunities
- Lead management
- Admin functions
- HR records
- Equipment management
- Financial data

---

### 6. HR Manager (3 users)

**Who has this role:**
- HR Team (Maria Diaz, Melissa Johnson, Erin MacGrady)

**Permissions:**
- ✓ View all HR records
- ✓ Manage HR records (add, edit, archive)
- ✓ View all employee information
- ✓ Manage employee data
- ✓ Access HR console
- ✓ Generate HR reports
- ✓ View org charts

**Dashboard Access:**
- Home Dashboard
- HR Console
- Employee Directory
- HR Reports
- My Day Dashboard

**Cannot Access:**
- Sales data (unless shared)
- Engineering requests
- System settings (unless also admin)
- Salesforce admin functions

---

## First-Time Login Process

### All Users Must:

1. **Login** with email and password `sunation9454`
2. **Change Password** - System will prompt for new password
3. **Password Requirements**:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character (!@#$%^&*)
4. **Access Granted** - Full system access based on role

### After Password Change:

- Password change requirement flag is cleared
- User can access all features assigned to their role
- Can update profile information
- Can change password again from settings

---

## Security Features

### Row Level Security (RLS)

All data tables have RLS enabled with policies that:
- Users can view their own profile
- Users can view other active profiles (for collaboration)
- Users can only update their own profile
- Admins have full access to all data

### Data Access Control

- **Leads**: Sales roles can view/manage based on ownership and team
- **Deals**: Sales roles see own deals; managers see team deals; admins see all
- **Cases**: Support users see all cases; others see related to own accounts
- **HR Records**: Only HR managers and admins can access
- **Equipment**: Operations and admins can manage
- **Reports**: Access based on role and department

### Permission Enforcement

Permissions are:
- Stored in `user_roles` table as JSON
- Synced to user metadata automatically
- Checked on every API request
- Enforced by database RLS policies
- Validated in the frontend (UI elements hidden/disabled)

---

## Common Questions

**Q: Can a user have multiple roles?**
A: Currently, each user has one primary role. Admins have all permissions.

**Q: Can roles be changed?**
A: Yes, admins can update a user's role in the user management system.

**Q: What if someone needs access outside their role?**
A: Contact an administrator to adjust permissions or change roles.

**Q: How do I know what role I have?**
A: Your role is displayed on your profile page and in the user menu.

**Q: Can I see who else has admin access?**
A: Yes, users with admin or HR manager roles can view all user profiles and roles.

---

## Support

For questions about permissions or access issues:
- Contact your manager
- Email IT support
- Contact an Administrator:
  - Scott Maskin (smaskin@sunation.com) - CEO
  - James Pisseri (jpisseri@sunation.com) - VP
  - Michael Stegmeier (mstegmeier@sunation.com) - IT Manager
