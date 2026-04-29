# Channel Partners Portal - Complete Setup Guide

Your Partner Portal is now fully functional! Here's everything you need to know.

---

## ✅ What's Working Now

### 1. **Admin Dashboard - Channel Partners Console**
Admins can now:
- View all 5 active channel partners
- See comprehensive statistics:
  - Total Partners: 5
  - Partner Leads: 100+
  - Active Partners: 5
  - Average Commission Rate: 12.0%

- **Two Main Views:**
  - **Partners Tab**: Manage individual partners, view their stats, contacts, and web form URLs
  - **All Partner Leads Tab**: See ALL leads submitted by ALL partners in one comprehensive table

### 2. **Partner Portal (For Partners)**
Partners can:
- Log in with their accounts
- View their own dashboard with:
  - Total leads submitted
  - Conversion statistics
  - Pending and paid commissions
  - Recent lead activity
- Copy their unique referral link
- See detailed lead information

### 3. **Partner Web Forms**
Each partner has a unique form URL:
- `https://your-site.com/partner-form/3-brothers`
- `https://your-site.com/partner-form/aurora-solar`
- `https://your-site.com/partner-form/green-energy`
- `https://your-site.com/partner-form/premier-contractors`
- `https://your-site.com/partner-form/sunpower-network`

---

## 🎯 Current Active Partners

| Partner Name | Slug | Commission | Form URL |
|-------------|------|-----------|----------|
| **3 Brothers** | 3-brothers | 15% | `/partner-form/3-brothers` |
| **Aurora Solar Partners** | aurora-solar | 12% | `/partner-form/aurora-solar` |
| **Green Energy Solutions** | green-energy | 10% | `/partner-form/green-energy` |
| **Premier Contractors** | premier-contractors | 15% | `/partner-form/premier-contractors` |
| **SunPower Network** | sunpower-network | 8% | `/partner-form/sunpower-network` |

---

## 📊 Admin Access - How to See Everything

### Navigate to: **Admin Dashboard → Channel Partners**

You'll see:

**Top Section:**
- 4 metric cards showing overview stats

**Tabs:**
1. **Partners Tab**
   - List of all partners on the left
   - Click any partner to see:
     - Lead count
     - Commission totals (total, pending, paid)
     - Web form URL (click to copy)
     - Contact information
     - Partner contacts/users

2. **All Partner Leads Tab**
   - Comprehensive table showing:
     - Lead name
     - Which partner submitted them
     - Contact info (email, phone)
     - Location
     - Status
     - Date submitted
   - Currently showing 100 leads across all partners

---

## 🔗 How Partner Forms Work

### Step 1: Partner Gets Their Link
When you create a partner in the Channel Partners Console, they automatically get:
- A unique slug (e.g., `3-brothers`)
- A web form URL: `https://your-site.com/partner-form/3-brothers`

### Step 2: Partner Shares Link
Partners share their link with potential customers via:
- Email signatures
- Website
- Social media
- Business cards
- Marketing materials

### Step 3: Customer Fills Out Form
The form collects:
- Name, address, contact info
- Utility information
- Property details
- Installation type
- Sales notes

### Step 4: Lead is Created
When submitted:
- Lead is automatically created in your CRM
- Lead is linked to the partner (via `partner_id`)
- Partner can see it in their dashboard
- Admin can see it in "All Partner Leads"

### Step 5: Tracking & Commissions
- All leads are tracked by partner
- You can see which partner submitted which leads
- Set up commission tracking based on conversions

---

## 👥 Setting Up Partner Access

### To give a partner access to view their leads:

```sql
-- 1. Create a user account for the partner contact
-- (This is done through the User Management console)

-- 2. Link the user to the partner
INSERT INTO partner_contacts (partner_id, user_id, role, can_view_leads)
VALUES (
  'partner-id-here',  -- Get this from channel_partners table
  'user-id-here',     -- Get this from auth.users
  'primary_contact',
  true
);
```

### Partner Login:
- Partners log in at your main URL
- They're automatically redirected to the Partner Portal
- They see only THEIR data (not other partners' data)

---

## 🔧 Adding New Partners

### Via Admin Console (Recommended):

1. Go to **Admin → Channel Partners**
2. Click **"Add Partner"**
3. Fill in:
   - Partner Name (e.g., "ABC Solar")
   - URL Slug (e.g., "abc-solar") - auto-formatted
   - Contact Email
   - Phone
   - Commission Rate (e.g., 10.00)
   - Commission Type (percentage or flat fee)
   - Notes
4. Click **"Create Partner"**

The system automatically:
- Creates the partner record
- Generates the unique form URL
- Sets status to "active"

### Partner Form URL:
Immediately available at: `https://your-site.com/partner-form/abc-solar`

---

## 📈 Tracking Partner Performance

### In Channel Partners Console:

**For Individual Partner:**
1. Click on the partner in the left sidebar
2. View their metrics:
   - Total Leads
   - Total Commissions
   - Pending Commissions
   - Paid Commissions

**For All Partners:**
1. Click "All Partner Leads" tab
2. See all leads with partner attribution
3. Filter/search by partner name

### In Database:
```sql
-- Get partner performance summary
SELECT
  cp.name,
  COUNT(l.id) as total_leads,
  COUNT(CASE WHEN l."Status" LIKE '%Converted%' THEN 1 END) as converted_leads
FROM channel_partners cp
LEFT JOIN leads l ON l.partner_id = cp.id
GROUP BY cp.name
ORDER BY total_leads DESC;
```

---

## 🎨 Customizing Partner Forms

Each partner form includes:
- Partner branding (shows partner name)
- SUNation Energy logo/header
- All required fields for lead capture
- Success message after submission
- Automatic redirect to thank you page

To customize for a specific partner:
- Forms are standardized for consistency
- Partner name is displayed prominently
- All leads are tagged with partner ID

---

## 🔒 Security & Permissions

### Admin Users:
- See ALL partners
- See ALL partner leads
- Can create/edit partners
- Can manage partner contacts

### Partner Users:
- See only THEIR data
- View their own leads
- View their commissions
- Copy their referral link
- Cannot see other partners' data

### Public (Web Forms):
- No login required
- Form validates partner slug
- Only active partners can receive leads
- Submissions go through edge function for security

---

## 🚀 Quick Start Checklist

- [x] 5 Active partners created
- [x] 100+ leads linked to partners for testing
- [x] Admin can see all partners and leads
- [x] Partner portal displays data correctly
- [x] Web forms are working and secured
- [x] Statistics and metrics are accurate
- [ ] Create partner user accounts (if needed)
- [ ] Set up partner contacts (if needed)
- [ ] Configure commission tracking automation (optional)

---

## 📞 Partner URLs Quick Reference

Share these URLs with your partners:

```
3 Brothers:
https://your-site.com/partner-form/3-brothers

Aurora Solar Partners:
https://your-site.com/partner-form/aurora-solar

Green Energy Solutions:
https://your-site.com/partner-form/green-energy

Premier Contractors:
https://your-site.com/partner-form/premier-contractors

SunPower Network:
https://your-site.com/partner-form/sunpower-network
```

---

## 💡 Best Practices

1. **Regular Monitoring**
   - Check "All Partner Leads" tab weekly
   - Review partner performance monthly
   - Follow up on new leads within 24 hours

2. **Partner Communication**
   - Send monthly performance reports
   - Share success stories
   - Provide marketing materials

3. **Lead Quality**
   - Track conversion rates by partner
   - Identify top-performing partners
   - Provide feedback to improve lead quality

4. **Commission Management**
   - Set clear commission terms
   - Pay commissions promptly
   - Keep detailed records in `partner_commissions` table

---

## 🆘 Troubleshooting

**Partner can't see leads:**
- Check if they have a user account
- Verify `partner_contacts` entry exists
- Ensure `can_view_leads` is set to `true`

**Web form not working:**
- Verify partner status is "active"
- Check slug matches exactly (case-sensitive)
- Confirm partner-webhook edge function is deployed

**Admin can't see partner leads:**
- Check user has admin role in `user_organization_roles`
- Verify leads have `partner_id` populated
- Refresh the page to reload data

---

Your Channel Partners system is now fully operational! 🎉
