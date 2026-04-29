# Aurora Solar Integration Guide

## Overview

Aurora Solar is your solar design and proposal platform that was connected to Salesforce. This guide explains what it does, how it's integrated, and your migration options.

---

## What Aurora Solar Does

**Aurora Solar** (https://app.aurorasolar.com) is a comprehensive solar design platform that:

1. **Creates Solar Designs**
   - 3D site modeling
   - Solar panel layout optimization
   - Shading analysis
   - Energy production estimates

2. **Generates Proposals**
   - Professional PDF proposals
   - Financial modeling
   - ROI calculations
   - Financing options

3. **Manages Projects**
   - Engineering review
   - Permit package generation
   - Project tracking

---

## Current Salesforce Integration

### Connected App Details

- **Consumer Key**: `3MVG9CVKiXR7Ri5rvUHp1InBF.lBjX.n2XO8Soa.SZYz5cho1dYLVcCne0fA2TqRcg1LwCZV8R0CoIIeBPfAh`
- **Callback URL**: `https://app.aurorasolar.com/settings/integrations`
- **Support Email**: support@aurorasolar.com
- **Permissions**: Full API access (read/write) + refresh tokens

### What Aurora Syncs with Salesforce

**FROM Salesforce (Reads):**
- Leads (customer contact information)
- Accounts (company details)
- Opportunities (solar projects)
- Address data for site surveys

**TO Salesforce (Writes):**
- Aurora Design Name
- Primary Design ID
- System Size (kW)
- Annual Production (kWh)
- Proposal URLs
- Engineering status

---

## New Supabase Tables

I've created the following tables to store Aurora Solar data:

### 1. `aurora_projects` Table

Stores complete solar design data:

**Key Fields:**
- `aurora_project_id` - Unique Aurora project ID
- `aurora_design_id` - Specific design version ID
- `lead_salesforce_id` - Links to lead
- `opportunity_salesforce_id` - Links to opportunity
- `system_size_kw` - Solar system size
- `annual_production_kwhr` - Energy production estimate
- `panel_count`, `panel_model`, `panel_wattage`
- `inverter_model`, `inverter_count`
- `estimated_cost`, `cost_per_watt`
- `roof_type`, `roof_pitch`, `roof_azimuth`
- `proposal_url`, `proposal_pdf_url`
- `engineering_review_status`
- `design_data` (jsonb) - Full Aurora API response

### 2. `aurora_proposals` Table

Tracks proposals sent to customers:

**Key Fields:**
- `project_id` - Links to aurora_projects
- `proposal_url`, `proposal_pdf_url`
- `total_cost`, `incentives`, `net_cost`
- `sent_at`, `viewed_at`, `accepted_at`
- `viewed_count` - How many times customer viewed
- `status` - draft, sent, accepted, rejected

### 3. Updated Existing Tables

**Opportunities Table** - Added Aurora fields:
- `Aurora_Design__c`
- `Primary_Design__c`
- `Primary_Design_ID__c`
- `System_Size_kW__c`
- `Annual_Production_kWhr__c`

**Leads Table** - Added Aurora fields:
- `Aurora_Design__c`
- `System_Size_kW__c`
- `Annual_Production_kWhr__c`

---

## Migration Options

You have 3 paths forward:

### Option 1: Keep Aurora Connected to Salesforce (Recommended Initially)

**How it works:**
1. Aurora Solar → Salesforce (existing connection stays active)
2. Salesforce → Supabase (your sync function copies data)
3. Your team uses Supabase for CRM

**Pros:**
- Zero disruption to design workflow
- No training needed
- Aurora continues working as-is
- Immediate migration possible

**Cons:**
- Still dependent on Salesforce
- Extra sync step

**Implementation:**
```javascript
// Already done! Your Salesforce sync will automatically
// copy Aurora fields to Supabase tables
```

---

### Option 2: Direct Aurora → Supabase Integration (Long-Term Goal)

**How it works:**
1. Aurora Solar → Supabase Edge Function (direct webhook)
2. No Salesforce middleman
3. Full independence

**Pros:**
- Complete Salesforce independence
- Faster data updates
- Full control over data

**Cons:**
- Requires Aurora API access
- Need to contact Aurora support
- Development work needed

**Steps:**
1. **Contact Aurora Solar:**
   ```
   Email: support@aurorasolar.com

   Subject: Custom CRM Integration - API Access

   Hi Aurora Team,

   We're migrating from Salesforce to a custom CRM. Can you help us with:
   1. Does Aurora support webhook endpoints for custom integrations?
   2. Can we access Aurora's REST API programmatically?
   3. Do you have API documentation available?
   4. What's required to connect Aurora to our custom system?

   Current Salesforce Consumer Key: 3MVG9CVKiXR7Ri5rvUHp1InBF.lBjX...

   Thanks!
   ```

2. **Once you get API docs, I'll build:**
   - Edge function to receive Aurora webhooks
   - OAuth flow for Aurora API authentication
   - Sync service to pull/push Aurora data

---

### Option 3: Manual Export/Import (Temporary)

**How it works:**
1. Export designs from Aurora manually
2. Import CSV into Supabase

**Pros:**
- Simple, no code
- Good for testing

**Cons:**
- Not scalable
- No real-time sync
- Manual process

---

## Using Aurora Data in Your App

### Query Aurora Projects

```typescript
import { supabase } from './lib/supabase';

// Get all Aurora projects for an opportunity
const { data: projects } = await supabase
  .from('aurora_projects')
  .select(`
    *,
    proposals:aurora_proposals(*)
  `)
  .eq('opportunity_salesforce_id', opportunityId);

// Get project with full design data
const { data: project } = await supabase
  .from('aurora_projects')
  .select('*')
  .eq('aurora_project_id', 'AUR-12345')
  .single();

console.log(project.system_size_kw); // 8.5
console.log(project.annual_production_kwhr); // 12450
console.log(project.proposal_url); // https://aurora...
```

### Display Solar Design Info

```typescript
// In your Opportunity detail component
const { data: opportunity } = await supabase
  .from('opportunities')
  .select(`
    *,
    aurora_projects(
      system_size_kw,
      annual_production_kwhr,
      estimated_cost,
      proposal_url
    )
  `)
  .eq('Id', opportunityId)
  .single();

return (
  <div>
    <h2>{opportunity.Name}</h2>

    {opportunity.aurora_projects?.[0] && (
      <div className="solar-design-panel">
        <h3>Solar System Design</h3>
        <p>System Size: {opportunity.aurora_projects[0].system_size_kw} kW</p>
        <p>Annual Production: {opportunity.aurora_projects[0].annual_production_kwhr} kWh</p>
        <p>Estimated Cost: ${opportunity.aurora_projects[0].estimated_cost}</p>
        <a href={opportunity.aurora_projects[0].proposal_url}>View Proposal</a>
      </div>
    )}
  </div>
);
```

---

## Data Migration from Salesforce

### Sync Aurora Fields from Existing Opportunities

If you have historical Aurora data in Salesforce, run this to sync:

```javascript
// This will be automatically handled by your Salesforce sync
// The new Aurora fields will be copied when you sync opportunities
```

### Check Your Data

```sql
-- See how many opportunities have Aurora designs
SELECT
  COUNT(*) as total_opportunities,
  COUNT("Aurora_Design__c") as with_aurora_design,
  COUNT("System_Size_kW__c") as with_system_size
FROM opportunities;

-- Get all opportunities with Aurora data
SELECT
  "Name",
  "Aurora_Design__c",
  "System_Size_kW__c",
  "Annual_Production_kWhr__c",
  "Primary_Design_ID__c"
FROM opportunities
WHERE "Aurora_Design__c" IS NOT NULL;
```

---

## Next Steps

### Immediate Actions:

1. **Contact Aurora Solar**
   - Email: support@aurorasolar.com
   - Ask about API access and custom integrations
   - Request API documentation

2. **Check Your Aurora Dashboard**
   - Login: https://app.aurorasolar.com/settings/integrations
   - Review current Salesforce connection settings
   - Document which objects are syncing

3. **Test Current Setup**
   - Verify Aurora data is syncing to Salesforce
   - Check that your Salesforce sync brings Aurora fields to Supabase

### Once You Have Aurora API Info:

Share with me and I'll build:
1. **Aurora webhook endpoint** (Edge Function)
2. **Aurora OAuth integration**
3. **Bi-directional sync** (Supabase ↔ Aurora)
4. **UI components** to display solar designs
5. **Proposal tracking dashboard**

---

## Security & Permissions

**Row Level Security (RLS) is enabled:**

- **View**: Users can see projects they own or if they have admin/manager role
- **Create**: Any authenticated user can create projects
- **Update**: Project owners and managers can update
- **Delete**: Only admins can delete

**Roles with access:**
- `admin` - Full access
- `manager` - Full access
- `rep` - Own projects only

---

## Troubleshooting

### Aurora Data Not Syncing?

1. Check Salesforce Connected App is still active
2. Verify Aurora hasn't revoked OAuth token
3. Re-authenticate if needed at: https://app.aurorasolar.com/settings/integrations

### Missing Fields?

Aurora may have custom fields specific to your setup. Check:
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'opportunities'
AND column_name LIKE '%Aurora%';
```

---

## Support Contacts

**Aurora Solar:**
- Email: support@aurorasolar.com
- Dashboard: https://app.aurorasolar.com

**Your Connected App:**
- Consumer Key: 3MVG9CVKiXR7Ri5rvUHp1InBF.lBjX.n2XO8Soa.SZYz5cho1dYLVcCne0fA2TqRcg1LwCZV8R0CoIIeBPfAh
- Callback: https://app.aurorasolar.com/settings/integrations

---

## Summary

Aurora Solar is a powerful solar design tool that's currently connected to Salesforce. I've set up Supabase tables to store all Aurora data, so your Salesforce sync will automatically bring Aurora designs into Supabase.

**For now:** Keep Aurora connected to Salesforce, and your sync will handle everything.

**Long-term:** Contact Aurora about direct API integration for full Salesforce independence.

Let me know what Aurora Solar tells you about their API, and I'll build the direct integration!
