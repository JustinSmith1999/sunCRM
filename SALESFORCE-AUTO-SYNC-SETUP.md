# Salesforce Automatic Sync Setup

Your Salesforce data is now fully synced! Here's what we pulled:

## Current Data (as of sync)
- **41,355 Leads**
- **8,686 Accounts**
- **6,637 Contacts**
- **21,986 Opportunities**
- **30 Campaigns**
- **752 Campaign Members**
- **5,568 Cases**
- **85,788 Tasks**
- **8,981 Events**

---

## 🔄 Setting Up Automatic Syncing

You have **3 options** to keep data synced automatically:

### Option 1: Manual Trigger (Current Setup)
Run the sync anytime you want:
```bash
node sync-all-salesforce.mjs
```

This syncs all Salesforce objects sequentially.

---

### Option 2: Scheduled Cron Job (Recommended)

Set up a cron job to run the sync automatically:

**Every Hour:**
```bash
0 * * * * cd /path/to/project && node sync-all-salesforce.mjs >> sync.log 2>&1
```

**Every 30 Minutes:**
```bash
*/30 * * * * cd /path/to/project && node sync-all-salesforce.mjs >> sync.log 2>&1
```

**Every 15 Minutes:**
```bash
*/15 * * * * cd /path/to/project && node sync-all-salesforce.mjs >> sync.log 2>&1
```

To set this up:
1. Run `crontab -e` on your server
2. Add one of the lines above (adjust the path)
3. Save and exit

---

### Option 3: External Cron Service

Use a service like **cron-job.org** or **EasyCron** to trigger the sync:

**URL to call:**
```
https://husbupeealwuxyopfwwb.supabase.co/functions/v1/scheduled-sync
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1c2J1cGVlYWx3dXh5b3Bmd3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTE3ODMsImV4cCI6MjA3NDUyNzc4M30.ERC3k2pHFZ0MOmrbcSAgS1FwTIMpMh0fKbgzLuMXP6s
```

**Method:** POST

**Schedule:** Every 30 minutes (or whatever you prefer)

---

### Option 4: Real-Time Sync (Advanced)

Set up Salesforce webhooks to push changes in real-time:

1. Go to Salesforce Setup → Platform Events or Outbound Messages
2. Create webhooks for each object (Lead, Account, Contact, etc.)
3. Point them to:
   ```
   https://husbupeealwuxyopfwwb.supabase.co/functions/v1/salesforce-webhook
   ```

This gives you instant updates when records change in Salesforce.

---

## 📊 Monitoring Sync Status

Check sync logs in your database:
```sql
SELECT * FROM salesforce_sync_logs
ORDER BY created_at DESC
LIMIT 20;
```

Or view in your Admin Dashboard → Salesforce Sync section.

---

## ⚡ Quick Sync Commands

**Sync specific objects:**
```bash
# Leads only
curl -X POST "https://husbupeealwuxyopfwwb.supabase.co/functions/v1/salesforce-sync?object=Lead" \
  -H "Authorization: Bearer YOUR_KEY"

# Accounts only
curl -X POST "https://husbupeealwuxyopfwwb.supabase.co/functions/v1/salesforce-sync?object=Account" \
  -H "Authorization: Bearer YOUR_KEY"
```

**Full sync (all objects):**
```bash
curl -X POST "https://husbupeealwuxyopfwwb.supabase.co/functions/v1/scheduled-sync" \
  -H "Authorization: Bearer YOUR_KEY"
```

---

## 🎯 Recommended Setup

For most businesses, we recommend:

1. **Full sync every hour** using the scheduled-sync function
2. **Real-time webhooks** for critical objects like Leads and Opportunities
3. **Manual sync** when you need to force a refresh

This gives you the best balance of up-to-date data without overwhelming your system.
