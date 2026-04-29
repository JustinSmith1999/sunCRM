# Egnyte Integration Guide

## Overview

Your CRM now has **limited, controlled access** to Egnyte for managing solar business documents. This integration links specific files to CRM records (Leads, Opportunities, Projects) without exposing full Egnyte access.

## What It Does

### Document Categories
- **Proposals** - Solar proposals and quotes (PDF, DOCX)
- **Contracts** - Signed agreements (PDF only)
- **Site Photos** - Property photos (JPG, PNG, HEIC)
- **Permits** - Applications and approvals (PDF, JPG, PNG)
- **Installation** - Installation docs and photos
- **Utility Docs** - Interconnection documents
- **Warranties** - Warranty documents and specs
- **Technical** - Datasheets and specs
- **Customer Comm** - Customer correspondence
- **Inspections** - Inspection reports

### Security Features
- **Role-Based Access**: Only authorized users can view/upload
- **Limited Scope**: Access only to CRM-linked documents
- **Audit Trail**: All document actions are logged
- **Visibility Control**: Documents can be private, team, or customer-facing

## Setup Instructions

### Step 1: Get Egnyte API Token

1. Log in to your Egnyte account
2. Go to **Settings** → **Integrations** → **API Tokens**
3. Create a new API token named "CRM Integration"
4. Set permissions:
   - ✅ Read files
   - ✅ Create files
   - ✅ Create links
   - ❌ Delete files (optional)
5. Copy the API token

### Step 2: Configure in CRM

1. Log in as **Admin**
2. Go to **Admin** → **System Settings**
3. Find **Egnyte Configuration**
4. Enter:
   - **Domain**: Your Egnyte domain (e.g., "yourcompany")
   - **API Token**: Paste the token from Step 1
   - **Base Folder**: `/Shared/CRM` (default, or customize)
5. Click **Save Configuration**

### Step 3: Organize Egnyte Folders

Create this folder structure in Egnyte:

```
/Shared/CRM/
├── Proposals/
├── Contracts/
├── Photos/
│   └── Site/
├── Permits/
├── Installation/
├── Utility/
├── Warranties/
├── Technical/
├── Communications/
└── Inspections/
```

## How to Use

### Upload Documents

**From a Lead/Opportunity:**
1. Open the Lead or Opportunity
2. Click **Documents** tab
3. Click **Upload Document**
4. Choose file and category
5. File uploads to Egnyte and links to record

**Bulk Upload (Egnyte):**
1. Upload files directly to Egnyte folders
2. Use CRM to link existing files to records

### View Documents

- Click **Documents** in any Lead/Opportunity
- All linked files appear with preview links
- Click to view in Egnyte web viewer
- Download directly from CRM

### Search & Filter

- Search by filename
- Filter by category
- Filter by date uploaded
- View access logs

## Access Control

### By Role

**Admin**
- Upload, view, delete all documents
- Configure Egnyte settings
- View audit logs

**Manager**
- Upload and view team documents
- Cannot delete

**Sales Rep**
- Upload documents to their leads
- View team-shared documents

**Support**
- View customer-facing documents only

**Read-Only**
- View public documents only

### By Visibility

- **Private**: Only uploader + admins
- **Team**: All authenticated users
- **Public**: Anyone with link
- **Customer**: Portal-accessible

## Best Practices

### Document Naming
```
[Date]-[Type]-[Customer]-[Description]
2026-01-13-Proposal-Smith-Solar-Design.pdf
2026-01-13-Contract-Jones-Installation-Agreement.pdf
```

### Folder Organization
- Keep proposals in `/Proposals`
- Signed contracts in `/Contracts`
- Site photos in `/Photos/Site`
- Use subfolders by year if needed: `/Proposals/2026/`

### Security
- Never share API tokens
- Use team visibility for internal docs
- Use customer visibility for client-facing docs
- Review access logs monthly

### Storage Management
- Archive old projects annually
- Delete drafts after final version uploaded
- Compress large photo files

## API Integration

### Link File to Lead
```typescript
import { linkFileToRecord } from '@/lib/egnyte';

await linkFileToRecord(
  '/Shared/CRM/Proposals/proposal.pdf',
  'proposal.pdf',
  1024000,
  {
    leadId: 'lead-123',
    categoryId: 'proposals-category-id',
    title: 'Solar Proposal - Smith Residence',
    visibility: 'customer'
  }
);
```

### Upload File
```typescript
import { egnyteClient } from '@/lib/egnyte';

const filePath = await egnyteClient.uploadFile(
  file,
  '/Proposals',
  (progress) => console.log(progress)
);
```

## Troubleshooting

### "Egnyte not configured"
- Verify API token in Admin settings
- Check token hasn't expired
- Ensure token has correct permissions

### "Upload failed"
- Check file size (max 100MB recommended)
- Verify folder exists in Egnyte
- Check file type is allowed for category

### "Access denied"
- Verify user has correct role
- Check document visibility setting
- Ensure user is authenticated

### Files not appearing
- Refresh the page
- Check category filter
- Verify file was successfully linked

## Support

For Egnyte API issues, see: https://developers.egnyte.com/docs

For CRM integration issues, contact your admin.
