# Long Island Permit Management System - Complete Guide

## Overview

The Permit Management System is a comprehensive, interactive platform specifically designed for managing solar installation permits across all Long Island towns and municipalities. It provides town-specific requirements, document checklists, fee calculations, and complete permit tracking from submission through final approval.

## Quick Access

Navigate to: **Service Menu > Permit Management** or access from the Admin Dashboard.

## Features

### 1. Town-Specific Requirements

**15 Long Island municipalities pre-configured:**

#### Suffolk County
- Town of Babylon
- Town of Brookhaven
- Town of East Hampton
- Town of Huntington
- Town of Islip
- Town of Riverhead
- Town of Shelter Island
- Town of Smithtown
- Town of Southampton
- Town of Southold

#### Nassau County
- Town of Hempstead
- Town of North Hempstead
- Town of Oyster Bay
- City of Glen Cove
- City of Long Beach

**Each town includes:**
- Building department contact information (phone, email, address)
- Website and online portal links
- Typical review times (ranges from 20-35 days)
- Complete fee structures (base fees + per-watt fees)
- Special requirements and notes
- Inspection fee schedules

### 2. Interactive Permit Application Creation

**Step-by-step workflow:**

1. **Select Jurisdiction**
   - Search all Long Island towns
   - Filter by county (Suffolk/Nassau)
   - View summary details for each town
   - See expected review time and fees

2. **Enter Project Details**
   - Link to Salesforce opportunity (optional)
   - System size in kW (required)
   - Property address (required)
   - Property owner name (required)
   - Additional notes

3. **Automatic Fee Calculation**
   - Real-time calculation as you type
   - Shows: Base fee + Per-watt fee = Total
   - Example: Town of Babylon 8.5 kW system
     - Base: $250.00
     - Per-watt: $4,250.00 (8,500 watts × $0.50)
     - **Total: $4,500.00**

### 3. Town-Specific Document Checklists

**Automatic checklist generation based on selected town:**

#### Town of Babylon Complete Checklist:
1. Building Permit Application (Required)
2. Site Plan (Required)
3. Electrical Single Line Diagram (Required)
4. Roof Plan with Array Layout (Required)
5. Structural Engineering Letter (Required, PE-stamped)
6. Manufacturer Spec Sheets (Required)
7. Installer License (Required, NYS licensed)
8. Proof of Property Ownership (Required)
9. NYSERDA Approval Letter (Required if applicable)
10. PSEG Interconnection Application (Required)
11. HOA Approval Letter (Optional, if in HOA)
12. Historic District Approval (Optional, if applicable)

**Each document shows:**
- Required vs. Optional status
- Document type (application, technical, engineering, licensing, legal, utility)
- Detailed description of what's needed
- Upload button for adding files
- Version tracking
- Status (pending, submitted, approved, rejected)

### 4. Permit Application Tracking

**Application Statuses:**
- **Draft** - Being prepared, not yet submitted
- **Submitted** - Filed with town building department
- **Under Review** - Town is reviewing application
- **Approved** - Permit granted
- **Rejected** - Permit denied, needs correction
- **Expired** - Permit expired, needs renewal

**Visual indicators:**
- Color-coded status badges
- Status icons (checkmark for approved, X for rejected, clock for pending)
- Progress bars showing document completion

### 5. Interactive Dashboard

**Three main views:**

#### List View
- See all your permit applications
- Filter by status
- Quick view of key information
- One-click access to details

#### Town Reference
- Browse all Long Island towns
- Search by name
- Filter by county
- View detailed contact info and requirements
- Compare typical review times
- See fee structures

#### Application Detail View
- Complete application information
- Document checklist with upload status
- Calculated fees and payment status
- Expected timeline
- Town contact information
- One-click submission when ready

### 6. Real-Time Information

**Each town's entry includes:**

**Contact Information:**
- Building Department phone number (direct)
- Email address
- Physical address with directions
- Website URL (clickable)
- Online permit portal (if available)

**Processing Details:**
- Typical review time in days
- Pre-application meeting requirements
- Online submission availability
- HOA approval requirements
- Special requirements and notes

**Fees:**
- Base permit fee
- Per-watt additional fee
- Inspection fees (rough, final, electrical, re-inspection)
- Expedited processing options (where available)

## Example: Town of Babylon Permitting Process

### Town Details
- **County:** Suffolk
- **Phone:** 631-957-3077
- **Email:** buildingdept@townofbabylon.com
- **Address:** 200 East Sunrise Highway, Lindenhurst, NY 11757
- **Review Time:** ~21 days
- **Online Submission:** Yes
- **Base Fee:** $250.00
- **Per-Watt Fee:** $0.50

### Special Requirements
- Requires NYSERDA approval before permit submission
- HOA approval needed for properties in Lindenhurst and West Babylon
- Fire marshal review may be required for commercial installations

### Complete Workflow

**1. Create Application**
- Select "Town of Babylon" from jurisdiction list
- Enter project details:
  - System size: 8.5 kW
  - Address: 123 Main St, Babylon, NY 11702
  - Owner: John Smith
- System calculates: $250 + (8,500 watts × $0.50) = $4,500 total fee

**2. Gather Documents**
The system displays 12 required/optional documents:
- Upload each document using the upload button
- System tracks which documents are complete
- See real-time progress: "8 of 10 required documents uploaded"

**3. Review and Submit**
- Verify all information is correct
- Ensure all required documents are uploaded
- Click "Submit Application to Town of Babylon"
- System changes status to "Submitted"
- Records submission date for tracking

**4. Track Progress**
- Monitor application status
- Record town-assigned application number when received
- Update status as town reviews
- Schedule inspections when approved

## Fee Calculator Examples

### Town of Smithtown (10 kW System)
- Base Fee: $240.00
- Per-Watt: 10,000 watts × $0.52 = $5,200.00
- **Total: $5,440.00**
- Review Time: ~20 days (fastest on Long Island)

### Town of East Hampton (12 kW System)
- Base Fee: $400.00
- Per-Watt: 12,000 watts × $0.65 = $7,800.00
- **Total: $8,200.00**
- Review Time: ~35 days
- Note: Requires architectural review board approval

### Town of Hempstead (9 kW System)
- Base Fee: $320.00
- Per-Watt: 9,000 watts × $0.58 = $5,220.00
- **Total: $5,540.00**
- Review Time: ~30 days
- Note: Requires PSEG approval letter

## Database Tables

### permit_jurisdictions
Master list of all towns with complete details

**Key Information Stored:**
- Town name, county, state
- Building department contact info
- Website URLs and online portals
- Review times and processing details
- Fee structures (base + per-watt)
- Special requirements (JSON)
- Inspection fees (JSON)

### permit_document_requirements
Required documents for each town (customizable per jurisdiction)

**Fields:**
- Document name and type
- Required vs. optional flag
- Description and instructions
- Template URL if available
- Sort order for display

### permit_applications
Your permit applications with full tracking

**Tracks:**
- Which opportunity this is for
- Selected jurisdiction
- Application status
- Town-assigned application number
- Important dates (submitted, approved, expires)
- Fee calculation and payment status
- Assigned coordinator
- Notes and special instructions

### permit_application_documents
Uploaded documents linked to requirements

**Manages:**
- Which document fulfills which requirement
- File storage location (Egnyte)
- Upload date and version
- Document status
- Rejection reasons if not accepted

### permit_inspections
Inspection scheduling and results

**Tracks:**
- Inspection type (rough, final, electrical, structural)
- Scheduled date and time
- Inspector name
- Pass/fail status
- Failed items requiring correction
- Re-inspection needs

### permit_timeline_events
Complete audit trail of all permit activities

**Records:**
- Every action taken
- Who performed it
- When it happened
- Description and metadata

## Special Features by Town

### Town of Babylon
- **Fast Track:** No pre-application required
- **Online Portal:** Yes - preferred method
- **Key Requirement:** NYSERDA approval letter mandatory
- **Villages:** Check HOA requirements in Lindenhurst, West Babylon

### Town of Smithtown
- **Fastest Review:** 20 days average
- **Walk-in Only:** In-person submission required
- **Same-Day Review:** Available for simple residential
- **No Online:** Must visit building department

### Town of East Hampton
- **Strictest Requirements:** Most thorough review
- **Pre-Application:** Meeting strongly recommended
- **Architectural Review:** Often required in historic areas
- **Design Guidelines:** Strict aesthetic requirements
- **Highest Fees:** Most expensive on Long Island

### Town of Brookhaven
- **Expedited Option:** Available for additional $500
- **Expedited Time:** 10 days instead of 28
- **Online Preferred:** Has modern portal system
- **Large Territory:** Different requirements by hamlet

### City of Long Beach
- **Coastal Requirements:** Enhanced wind load calculations
- **Flood Zones:** Additional structural review
- **City Jurisdiction:** Different rules than towns
- **Quick Turnaround:** 26 days average

## Best Practices

### 1. Start Early
- Begin permit process as soon as deal is won
- Don't wait for all documents - create application first
- Review town-specific requirements immediately

### 2. Check Special Requirements
- Read special requirements section carefully
- Some towns require pre-application meetings
- HOA approval can take weeks - start early
- Historic district approval adds significant time

### 3. Document Organization
- Upload documents as you receive them
- Use clear, descriptive file names
- Keep documents current and up-to-date
- Track document versions if revisions needed

### 4. Communication
- Call town building department with questions
- Use provided phone numbers and emails
- Reference your application number once assigned
- Be professional and courteous

### 5. Timeline Planning
- Add review time to project schedule
- Factor in potential revisions
- Schedule inspections in advance
- Don't schedule installation until permit approved

## Common Issues and Solutions

### Missing Documents
**Problem:** Application incomplete, can't submit
**Solution:** Review checklist, upload all required documents marked as "Required"

### Incorrect Fees
**Problem:** Town charges different fee than calculated
**Solution:** Fee calculator is estimated - actual town fee may vary slightly based on additional factors

### Rejected Application
**Problem:** Town rejects application due to missing/incorrect information
**Solution:** Check rejection reason in document status, correct issue, re-upload, update status

### Expired Permit
**Problem:** Permit expires before installation complete
**Solution:** Contact town for renewal, usually requires fee payment but not full re-application

### Multiple Jurisdictions
**Problem:** Property on border, unclear which town has jurisdiction
**Solution:** Call both town building departments, confirm jurisdiction before filing

## Integration with Other Systems

### Salesforce Opportunities
- Link permits to specific opportunities
- Track permit status within deal flow
- Automatic folder creation in Egnyte

### Egnyte Document Storage
- All permit documents stored in organized folders
- Path: `/Shared/Solar Projects/[Project Name]/Permits/[Town Name]`
- Automatic version control

### Process Automation
- Permit application creation can trigger workflows
- Automatic task creation for document collection
- Notifications when status changes

## Support and Training

### Getting Help
1. Hover over info icons for field-specific help
2. Review this guide for detailed instructions
3. Contact operations manager for complex issues
4. Check town websites for official requirements

### Training Materials
- This complete guide
- Video tutorials (coming soon)
- Town-specific quick reference sheets
- Document template library

## Future Enhancements

### Planned Features
- Email notifications for status changes
- Document templates for common forms
- Integration with town online portals (where available)
- Mobile app for field access
- Inspection scheduling integration
- Automatic PSEG interconnection tracking

The Permit Management System eliminates confusion, reduces errors, and ensures nothing falls through the cracks in the complex solar permitting process across Long Island's diverse municipalities.
