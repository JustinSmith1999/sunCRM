/*
  # Make lead name fields nullable

  1. Changes
    - Make FirstName nullable in leads table
    - Make LastName nullable in leads table (was already required)
  
  2. Purpose
    - Allow Salesforce leads without names to sync
    - Match Salesforce schema where names can be null
*/

-- Make FirstName nullable
ALTER TABLE leads ALTER COLUMN "FirstName" DROP NOT NULL;

-- LastName is already required in Salesforce, but let's make it nullable too for safety
ALTER TABLE leads ALTER COLUMN "LastName" DROP NOT NULL;
