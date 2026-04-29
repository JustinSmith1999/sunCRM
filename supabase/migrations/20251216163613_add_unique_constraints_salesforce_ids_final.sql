/*
  # Add unique constraints for Salesforce IDs

  1. Changes
    - Add unique constraint on "Id" column in leads table
    - Add unique constraint on "Id" column in accounts table
    - Add unique constraint on "Id" column in opportunities table
  
  2. Purpose
    - Enable upsert operations during Salesforce sync
    - Prevent duplicate Salesforce records
*/

-- Add unique constraint to leads."Id"
ALTER TABLE leads ADD CONSTRAINT leads_salesforce_id_unique UNIQUE ("Id");

-- Add unique constraint to accounts."Id"  
ALTER TABLE accounts ADD CONSTRAINT accounts_salesforce_id_unique UNIQUE ("Id");

-- Add unique constraint to opportunities."Id"
ALTER TABLE opportunities ADD CONSTRAINT opportunities_salesforce_id_unique UNIQUE ("Id");
