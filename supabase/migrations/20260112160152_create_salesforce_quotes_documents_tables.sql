/*
  # Create Salesforce-specific Quotes and Documents tables
  
  1. New Tables
    - salesforce_quotes: Stores all Salesforce Quote data
    - salesforce_documents: Stores all Salesforce Document data
    
  2. Purpose
    - Avoid naming conflicts with existing tables
    - Store complete Salesforce data structure
    - Enable proper sync from Salesforce
    
  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated access
*/

-- Create salesforce_quotes table
CREATE TABLE IF NOT EXISTS salesforce_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesforce_id text UNIQUE NOT NULL,
  name text,
  opportunityid text,
  status text,
  expirationdate date,
  totalprice numeric(15,2),
  subtotal numeric(15,2),
  tax numeric(15,2),
  grandtotal numeric(15,2),
  billingstreet text,
  billingcity text,
  billingstate text,
  billingpostalcode text,
  billingcountry text,
  shippingstreet text,
  shippingcity text,
  shippingstate text,
  shippingpostalcode text,
  shippingcountry text,
  quotenumber text,
  description text,
  lineitemcount integer,
  issyncing boolean,
  createddate timestamp with time zone,
  lastmodifieddate timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create salesforce_documents table
CREATE TABLE IF NOT EXISTS salesforce_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesforce_id text UNIQUE NOT NULL,
  name text,
  type text,
  folderid text,
  description text,
  keywords text,
  url text,
  createddate timestamp with time zone,
  lastmodifieddate timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE salesforce_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesforce_documents ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Authenticated users can read quotes"
  ON salesforce_quotes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert quotes"
  ON salesforce_quotes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update quotes"
  ON salesforce_quotes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read documents"
  ON salesforce_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON salesforce_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
  ON salesforce_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);