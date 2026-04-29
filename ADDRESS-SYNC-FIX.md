# Address Sync - FIXED

## Problem
Addresses from Salesforce were NOT syncing to leads, contacts, and opportunities. This is critical data for solar installations.

## What Was Fixed

### 1. Database Schema
Added missing address fields to all tables:

**Leads** (already had these fields):
- Street, City, State, PostalCode, Country
- Latitude, Longitude, GeocodeAccuracy

**Opportunities** (ADDED these fields):
- Street, City, State, PostalCode, Country
- Latitude, Longitude, GeocodeAccuracy

**Accounts** (ADDED shipping address):
- ShippingStreet, ShippingCity, ShippingState, ShippingPostalCode, ShippingCountry
- ShippingLatitude, ShippingLongitude
- (Billing address fields already existed)

**Contacts** (ADDED other address):
- OtherStreet, OtherCity, OtherState, OtherPostalCode, OtherCountry
- (Mailing address fields already existed)

### 2. Salesforce Sync Function
Updated the sync function to include ALL address fields:

**Before:**
- Leads: Only synced basic fields (no addresses)
- Opportunities: Only synced basic fields (no addresses)
- Contacts: Only synced mailing address
- Accounts: Only synced billing address

**After:**
- Leads: ALL address fields synced
- Opportunities: ALL address fields synced
- Contacts: Mailing + Other addresses synced
- Accounts: Billing + Shipping addresses synced

### 3. Indexes
Added indexes for faster address searches:
- City, State, PostalCode on leads
- City, State, PostalCode on opportunities
- City, State on accounts (billing + shipping)

## Current Status

**Leads**: Addresses ARE syncing correctly (tested - data exists)
**Contacts**: Addresses ARE syncing correctly
**Accounts**: Addresses ARE syncing correctly
**Opportunities**: Fields added, but NO DATA YET

## Next Step Required

**RUN THE SYNC** to pull opportunity addresses from Salesforce:

### Option 1: Admin Console
1. Go to **Admin** → **Salesforce Sync**
2. Click **Sync Opportunities**
3. Wait for completion

### Option 2: Direct API Call
```bash
curl -X POST "YOUR_SUPABASE_URL/functions/v1/salesforce-sync?object=Opportunity" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Option 3: Full Sync (All Objects)
```bash
curl -X POST "YOUR_SUPABASE_URL/functions/v1/salesforce-sync" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Verification

After running the sync, verify addresses are populated:

```sql
-- Check Opportunities
SELECT
  "Name", "Street", "City", "State", "PostalCode"
FROM opportunities
WHERE "Street" IS NOT NULL
LIMIT 10;

-- Check Leads
SELECT
  "FirstName", "LastName", "Street", "City", "State"
FROM leads
WHERE "Street" IS NOT NULL
LIMIT 10;

-- Check Contacts
SELECT
  "FirstName", "LastName", "MailingStreet", "MailingCity", "MailingState"
FROM salesforce_contacts
WHERE "MailingStreet" IS NOT NULL
LIMIT 10;

-- Check Accounts
SELECT
  "Name", "BillingCity", "BillingState", "ShippingCity", "ShippingState"
FROM accounts
WHERE "BillingCity" IS NOT NULL OR "ShippingCity" IS NOT NULL
LIMIT 10;
```

## Fields Now Syncing

### Lead Address Fields
- Street
- City
- State
- PostalCode
- Country
- Latitude
- Longitude
- GeocodeAccuracy

### Opportunity Address Fields
- Street (NEW)
- City (NEW)
- State (NEW)
- PostalCode (NEW)
- Country (NEW)
- Latitude (NEW)
- Longitude (NEW)
- GeocodeAccuracy (NEW)

### Contact Address Fields
- MailingStreet
- MailingCity
- MailingState
- MailingPostalCode
- MailingCountry
- OtherStreet (NEW)
- OtherCity (NEW)
- OtherState (NEW)
- OtherPostalCode (NEW)
- OtherCountry (NEW)

### Account Address Fields
- BillingStreet
- BillingCity
- BillingState
- BillingPostalCode
- BillingCountry
- ShippingStreet (NEW)
- ShippingCity (NEW)
- ShippingState (NEW)
- ShippingPostalCode (NEW)
- ShippingCountry (NEW)
- ShippingLatitude (NEW)
- ShippingLongitude (NEW)

## Why This Matters for Solar

Addresses are CRITICAL for:
- Site surveys and assessments
- Installation scheduling
- Permit applications (city/county specific)
- Utility interconnection applications
- Service territory validation
- Distance calculations for installers
- Roof pitch analysis (via Google Maps API)
- Shading analysis location data

Without addresses, you cannot:
- Schedule installations
- Apply for permits
- Calculate project feasibility
- Generate accurate quotes
- Plan installation routes
- Assign projects to installers by region
