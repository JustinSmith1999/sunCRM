# Salesforce Bidirectional Sync Setup Guide

This guide covers setting up **two-way synchronization** between Salesforce and your Supabase CRM:
1. **Pull Sync**: Supabase pulls data from Salesforce (scheduled)
2. **Push Sync**: Salesforce pushes changes to Supabase (real-time)

---

## Prerequisites

- Salesforce account (Production or Sandbox)
- Connected App created in Salesforce (see SALESFORCE-SIMPLE-SETUP.md)
- Your Supabase project URL

---

## Part 1: Pull Sync (Supabase → Salesforce)

This pulls data FROM Salesforce TO Supabase on a schedule.

### Your Webhook URL

```
https://[your-project-id].supabase.co/functions/v1/salesforce-webhook?type=platform_event
```

Replace `[your-project-id]` with your actual Supabase project ID.

### Already Configured

The pull sync is already set up in your system:
- Edge function: `salesforce-sync`
- Pulls Leads, Accounts, Contacts, Opportunities
- Runs on demand or scheduled

---

## Part 2: Push Sync (Salesforce → Supabase)

This pushes changes FROM Salesforce TO Supabase in real-time when records change.

### Option A: Using Platform Events (Recommended)

Platform Events are the modern, scalable way to push data from Salesforce.

#### Step 1: Create a Platform Event

1. In Salesforce Setup, search for **"Platform Events"**
2. Click **"New Platform Event"**
3. Configure:
   - **Label**: `CRM Sync Event`
   - **Plural Label**: `CRM Sync Events`
   - **Object Name**: `CRM_Sync_Event`

4. Add these custom fields:

| Field Label | API Name | Type | Length | Required |
|------------|----------|------|--------|----------|
| Object Type | ObjectType__c | Text | 50 | Yes |
| Record ID | RecordId__c | Text | 18 | Yes |
| Operation Type | OperationType__c | Text | 20 | Yes |
| Record Data | RecordData__c | Long Text Area | 32000 | No |
| Organization ID | OrganizationId__c | Text | 18 | No |

5. Click **"Save"**

#### Step 2: Create an Apex Trigger

Create triggers for each object you want to sync. Here's an example for Leads:

```apex
trigger LeadCRMSync on Lead (after insert, after update, after delete) {
    List<CRM_Sync_Event__e> events = new List<CRM_Sync_Event__e>();

    if (Trigger.isInsert || Trigger.isUpdate) {
        for (Lead lead : Trigger.new) {
            CRM_Sync_Event__e event = new CRM_Sync_Event__e();
            event.ObjectType__c = 'Lead';
            event.RecordId__c = lead.Id;
            event.OperationType__c = Trigger.isInsert ? 'create' : 'update';
            event.RecordData__c = JSON.serialize(lead);
            event.OrganizationId__c = UserInfo.getOrganizationId();
            events.add(event);
        }
    } else if (Trigger.isDelete) {
        for (Lead lead : Trigger.old) {
            CRM_Sync_Event__e event = new CRM_Sync_Event__e();
            event.ObjectType__c = 'Lead';
            event.RecordId__c = lead.Id;
            event.OperationType__c = 'delete';
            event.OrganizationId__c = UserInfo.getOrganizationId();
            events.add(event);
        }
    }

    if (!events.isEmpty()) {
        EventBus.publish(events);
    }
}
```

**Create similar triggers for:**
- Account
- Contact
- Opportunity
- Case

#### Step 3: Create a Platform Event Subscription

1. In Setup, search for **"Flows"**
2. Click **"New Flow"** → **"Platform Event-Triggered Flow"**
3. Configure:
   - **Object**: `CRM Sync Event`
   - **Trigger**: When a platform event message is received
4. Add an **HTTP Callout** action:
   - **URL**: `https://[your-project-id].supabase.co/functions/v1/salesforce-webhook?type=platform_event`
   - **Method**: POST
   - **Body**:
   ```json
   {
     "event": {
       "type": "CRM_Sync_Event__e",
       "createdDate": "{!$Flow.CurrentDateTime}"
     },
     "data": {
       "payload": {
         "ObjectType__c": "{!$Record.ObjectType__c}",
         "RecordId__c": "{!$Record.RecordId__c}",
         "OperationType__c": "{!$Record.OperationType__c}",
         "RecordData__c": "{!$Record.RecordData__c}",
         "OrganizationId__c": "{!$Record.OrganizationId__c}"
       }
     }
   }
   ```
5. **Activate** the flow

---

### Option B: Using Outbound Messages (Legacy)

Outbound Messages are simpler but less flexible than Platform Events.

#### Step 1: Create a Workflow Rule

1. In Setup, search for **"Workflow Rules"**
2. Click **"New Rule"**
3. Select **"Lead"** (or other object)
4. Configure:
   - **Rule Name**: `Lead to Supabase Sync`
   - **Evaluation Criteria**: Created, and every time it's edited
   - **Rule Criteria**: Formula evaluates to true: `TRUE`
5. Click **"Save & Next"**

#### Step 2: Add Outbound Message Action

1. Click **"Add Workflow Action"** → **"New Outbound Message"**
2. Configure:
   - **Name**: `Send Lead to Supabase`
   - **Endpoint URL**: `https://[your-project-id].supabase.co/functions/v1/salesforce-webhook?type=outbound_message`
   - **User to Send As**: (select a user)
   - **Fields to Send**: Select all fields you want to sync
3. Click **"Save"**
4. **Activate** the workflow rule

**Repeat for other objects**: Account, Contact, Opportunity, Case

---

### Option C: Using Change Data Capture (Advanced)

CDC provides near real-time change notifications for standard and custom objects.

#### Step 1: Enable CDC for Objects

1. In Setup, search for **"Change Data Capture"**
2. Select the objects you want to track:
   - Lead
   - Account
   - Contact
   - Opportunity
   - Case
3. Click **"Save"**

#### Step 2: Subscribe to CDC Events

You'll need to create a Flow or use the Streaming API to subscribe to CDC events and forward them to your webhook.

**Flow Setup:**
1. Create a new **Platform Event-Triggered Flow**
2. Select **"ChangeEvent"** for the object (e.g., `LeadChangeEvent`)
3. Add HTTP Callout to: `https://[your-project-id].supabase.co/functions/v1/salesforce-webhook?type=change_data_capture`

---

## Part 3: Testing the Setup

### Test Pull Sync (Supabase pulling from Salesforce)

1. Go to your CRM admin panel
2. Navigate to **"Salesforce Sync"** section
3. Click **"Connect to Salesforce"**
4. Once connected, click **"Sync Now"**
5. Monitor the sync logs

### Test Push Sync (Salesforce pushing to Supabase)

1. Create or update a Lead in Salesforce
2. Wait 5-10 seconds
3. Check your Supabase CRM to see if the change appears
4. Check the `salesforce_sync_logs` table for confirmation

---

## Part 4: Monitoring & Troubleshooting

### View Sync Logs

Query the logs in Supabase:

```sql
SELECT * FROM salesforce_sync_logs
ORDER BY created_at DESC
LIMIT 50;
```

### Check Platform Event Delivery

In Salesforce:
1. Setup → **"Event Delivery"**
2. View delivery status and retry failed events

### Check Outbound Message Queue

In Salesforce:
1. Setup → **"Outbound Messages"**
2. Click on your message
3. View **"Delivery Status"** and retry failed messages

### Common Issues

**Issue**: Changes in Salesforce don't appear in Supabase
- Check Platform Event or Workflow Rule is activated
- Verify the webhook URL is correct
- Check Salesforce event delivery logs
- Review Supabase edge function logs

**Issue**: Pull sync fails
- Verify Salesforce credentials are correct
- Check token hasn't expired
- Ensure API version is compatible (v60.0)
- Review `salesforce_sync_logs` table

**Issue**: Duplicate records
- Verify the `Id` field is being mapped correctly
- Check upsert conflicts settings in the sync code

---

## Part 5: Sync Configuration

### Supported Objects

Both pull and push sync support:
- Leads
- Accounts
- Contacts
- Opportunities
- Cases

### Sync Frequency

**Pull Sync**: Can be scheduled (e.g., every 15 minutes, hourly, daily)
**Push Sync**: Real-time (within seconds of change in Salesforce)

### Field Mapping

By default, all fields are synced. To customize:
1. Modify the `salesforce_object_mappings` table
2. Add field mapping rules
3. Update the sync functions to respect field mappings

---

## Part 6: Security Best Practices

1. **Use HTTPS Only**: All webhook URLs must use HTTPS
2. **Validate Webhook Signatures**: Verify requests come from Salesforce
3. **Restrict API Access**: Use IP restrictions in Salesforce Connected App
4. **Rotate Tokens**: Regularly refresh OAuth tokens
5. **Monitor Logs**: Set up alerts for sync failures
6. **Limit Field Access**: Only sync necessary fields

---

## Architecture Diagram

```
Salesforce                          Supabase CRM
-----------                         --------------

[Lead Created] ─────────┐
                        │
[Account Updated] ──────┤
                        ├──→ [Platform Event] ──→ [Webhook] ──→ [Edge Function] ──→ [Database]
[Opportunity Changed] ──┤
                        │
[Contact Deleted] ──────┘


                        ┌──← [Edge Function] ←──← [Scheduler] ←──← [Admin Trigger]
                        │
                        ├──→ [Salesforce API]
                        │
                        └──→ [Database]
```

---

## Next Steps

1. Choose your push sync method (Platform Events recommended)
2. Create the necessary Salesforce components (triggers, flows, or workflows)
3. Test with a single object first (e.g., Lead)
4. Monitor logs and verify data sync
5. Roll out to remaining objects
6. Set up scheduled pull sync as backup
7. Configure alerts for sync failures

---

## Support

For issues:
1. Check Salesforce Debug Logs
2. Review Supabase Edge Function logs
3. Examine `salesforce_sync_logs` table
4. Verify network connectivity between Salesforce and Supabase

Your webhook endpoint:
```
https://[your-project-id].supabase.co/functions/v1/salesforce-webhook
```

Available webhook types:
- `?type=platform_event` (recommended)
- `?type=outbound_message` (legacy)
- `?type=change_data_capture` (advanced)
