# Channel Partners URL Mapping

## Partner Form URLs

Each partner now has a dedicated web form in your CRM that creates leads with proper attribution.

### URL Format
- **Your CRM Form**: `https://[your-domain]/partner-form/{slug}`
- **SUNation Landing**: `https://www.sunation.com/{slug}/`

## All 22 Channel Partners

| Partner Name | Form URL | SUNation Page |
|-------------|----------|---------------|
| 3 Sons Energy | `/partner-form/3sonsenergy` | https://www.sunation.com/3sonsenergy/ |
| ASCC Consulting LLC | `/partner-form/ascc-consulting` | https://www.sunation.com/ascc-consulting |
| Bolo Group LLC | `/partner-form/bologroup` | https://www.sunation.com/bologroup/ |
| Clean Energy Connection LLC | `/partner-form/clean-energy-connection-llc` | https://www.sunation.com/clean-energy-connection-llc/ |
| Emerald Energy Solutions LLC | `/partner-form/emerald-energy-solutions-llc` | https://www.sunation.com/emerald-energy-solutions-llc/ |
| Galesi Enterprises | `/partner-form/galesi-enterprises` | https://www.sunation.com/galesi-enterprises/ |
| Harmony Energy | `/partner-form/harmony-energy` | https://www.sunation.com/harmony-energy/ |
| IntelliSun | `/partner-form/intellisun` | https://www.sunation.com/intellisun/ |
| LI Solar | `/partner-form/li-solar` | https://www.sunation.com/li-solar/ |
| Long Island Energy Bridge | `/partner-form/long-island-energy-bridge` | https://www.sunation.com/long-island-energy-bridge/ |
| MelCo Solar | `/partner-form/melco-solar` | https://www.sunation.com/melco-solar/ |
| Mikabella Corp | `/partner-form/mikabella-corp` | https://www.sunation.com/mikabella-corp |
| Northern Energy Collective | `/partner-form/northern-energy-collective` | https://www.sunation.com/northern-energy-collective/ |
| Planet Sun Solutions | `/partner-form/planet-sun-solutions` | https://www.sunation.com/planet-sun-solutions/ |
| Radiant Energy | `/partner-form/radiant-energy` | https://www.sunation.com/radiant-energy/ |
| Renewable Earth Inc | `/partner-form/renewable-earth-inc` | https://www.sunation.com/renewable-earth-inc/ |
| Solar Pro Roofing | `/partner-form/solarproroofing` | https://www.sunation.com/solarproroofing/ |
| South Paw Solar | `/partner-form/south-paw-solar` | https://www.sunation.com/south-paw-solar/ |
| Sunchain Energy | `/partner-form/sunchain-energy` | https://www.sunation.com/sunchain-energy/ |
| SunSolar Solutions | `/partner-form/sunsolar-solutions` | https://www.sunation.com/sunsolar-solutions/ |
| Southern Skies Solar | `/partner-form/southern-skies-solar` | https://www.sunation.com/southern-skies-solar/ |
| Energy Investors | `/partner-form/energy-investors` | https://www.sunation.com/energy-investors/ |

## Setup Instructions

### 1. Run Partner Insert Script

```bash
# In Supabase SQL Editor:
# https://husbupeealwuxyopfwwb.supabase.co/project/_/sql/new
```

Run: `setup-all-channel-partners.sql`

This creates all 22 partners with:
- Unique slugs matching SUNation URLs
- 10% default commission rate
- Active status
- Placeholder contact emails

### 2. Update Partner Contact Emails

After creation, update with real contact emails:

```sql
UPDATE channel_partners SET contact_email = 'real@email.com' WHERE slug = 'partner-slug';
```

### 3. Link Partner Contacts (Jessica, Gary, etc.)

For each partner contact person:

```sql
-- Find their user ID
SELECT id, email FROM auth.users WHERE email = 'contact@email.com';

-- Link to partner
INSERT INTO partner_contacts (partner_id, user_id, role, can_view_leads)
VALUES (
  (SELECT id FROM channel_partners WHERE slug = 'partner-slug'),
  'user-id-from-above',
  'primary',
  true
);
```

### 4. Update Commission Rates (Optional)

If partners have different rates:

```sql
UPDATE channel_partners
SET commission_rate = 15.00
WHERE slug = 'partner-slug';
```

## Migrating Existing Leads

Link existing leads to partners based on LeadSource or Partner__c fields:

```sql
-- Example: Link all 3 Sons Energy leads
UPDATE leads
SET partner_id = (SELECT id FROM channel_partners WHERE name = '3 Sons Energy')
WHERE "LeadSource" = '3 Sons Energy'
   OR "Partner__c" = '3 Sons Energy';

-- Repeat for each partner...
```

See `link-existing-partner-leads.sql` for bulk update script.

## Partner Dashboard Access

Once partners are set up and contacts linked:

1. **Admin Access**:
   - Admin → Channel Partners
   - View all partners, leads, commissions
   - Generate and copy form URLs
   - Track performance

2. **Partner Contact Access**:
   - Main Nav → Partner Portal
   - View their leads only
   - Track commissions
   - Copy referral link

3. **Public Forms**:
   - No login required
   - Direct submission
   - Auto-attribution

## Form Fields

All partner forms include:
- First Name, Last Name
- Street Address, City, State, Zip
- County (dropdown: Bronx, Kings, Nassau, NY, Queens, Richmond, Suffolk)
- Email, Phone
- Utility (dropdown: Con-Ed, National Grid, PSEG)
- Utility Account Number
- Own Residence? (YES/NO)
- Type of Installation (Residential, Add On, Fire Island, Roofing)
- New Construction (checkbox)
- Sales Notes (textarea)

## Email Notifications

When a partner submits a lead:
1. Lead created in database
2. Partner attribution added
3. Email sent (your Salesforce format)
4. Lead visible in Partner Portal
5. Lead routed to appropriate sales team

## Commission Tracking

Track partner performance:
- Total leads submitted
- Conversion rate
- Pending commissions
- Paid commissions
- Commission history

## Share Links with Partners

Once deployed, share these URLs:

**Direct Form Access** (no login):
```
https://[your-domain]/partner-form/3sonsenergy
https://[your-domain]/partner-form/melco-solar
https://[your-domain]/partner-form/intellisun
... (etc for all 22 partners)
```

**Portal Access** (with login):
```
https://[your-domain]
(Login → Partner Portal)
```

## Next Steps

1. ✅ Run `channel-partners-migration.sql` (main tables)
2. ✅ Run `setup-all-channel-partners.sql` (bulk insert)
3. ⏳ Update partner contact emails
4. ⏳ Link Jessica Grady and other contacts
5. ⏳ Set custom commission rates (if needed)
6. ⏳ Link existing leads to partners
7. ⏳ Deploy partner-webhook edge function
8. ⏳ Test form submissions
9. ⏳ Share URLs with partners
10. ⏳ Train partner contacts on portal

## Testing Example

Test with 3 Sons Energy:
```
1. Visit: https://[your-domain]/partner-form/3sonsenergy
2. Fill out form
3. Submit
4. Check Leads console for new lead
5. Verify partner_id is set
6. Log in as partner contact
7. View lead in Partner Portal
```

---

**22 Partners Ready** | **Commission Tracking Enabled** | **Portal Access Configured**
