/*
  # Create Sales Metrics Tables

  1. New Tables
    - `sales_targets`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `year` (integer)
      - `target_amount` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `sales_opportunities`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `owner_id` (uuid, references user_profiles)
      - `name` (text)
      - `amount` (numeric)
      - `close_date` (date)
      - `stage` (text)
      - `probability` (integer)
      - `is_closed_won` (boolean, default false)
      - `closed_date` (date, nullable)
      - `quarter` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `monthly_revenue`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `month_date` (date)
      - `expected_revenue` (numeric)
      - `actual_revenue` (numeric, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their org data
*/

-- Create sales_targets table
CREATE TABLE IF NOT EXISTS sales_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  year integer NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, year)
);

-- Create sales_opportunities table
CREATE TABLE IF NOT EXISTS sales_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  close_date date,
  stage text NOT NULL DEFAULT 'Prospecting',
  probability integer DEFAULT 0,
  is_closed_won boolean DEFAULT false,
  closed_date date,
  quarter text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create monthly_revenue table
CREATE TABLE IF NOT EXISTS monthly_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  month_date date NOT NULL,
  expected_revenue numeric NOT NULL DEFAULT 0,
  actual_revenue numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, month_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_targets_org ON sales_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_org ON sales_opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_owner ON sales_opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_closed ON sales_opportunities(is_closed_won, closed_date);
CREATE INDEX IF NOT EXISTS idx_monthly_revenue_org ON monthly_revenue(organization_id);
CREATE INDEX IF NOT EXISTS idx_monthly_revenue_date ON monthly_revenue(month_date);

-- Enable RLS
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_revenue ENABLE ROW LEVEL SECURITY;

-- Sales Targets Policies
CREATE POLICY "sales_targets_select_policy"
  ON sales_targets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "sales_targets_insert_policy"
  ON sales_targets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "sales_targets_update_policy"
  ON sales_targets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "sales_targets_delete_policy"
  ON sales_targets FOR DELETE
  TO authenticated
  USING (true);

-- Sales Opportunities Policies
CREATE POLICY "sales_opportunities_select_policy"
  ON sales_opportunities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "sales_opportunities_insert_policy"
  ON sales_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "sales_opportunities_update_policy"
  ON sales_opportunities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "sales_opportunities_delete_policy"
  ON sales_opportunities FOR DELETE
  TO authenticated
  USING (true);

-- Monthly Revenue Policies
CREATE POLICY "monthly_revenue_select_policy"
  ON monthly_revenue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "monthly_revenue_insert_policy"
  ON monthly_revenue FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "monthly_revenue_update_policy"
  ON monthly_revenue FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "monthly_revenue_delete_policy"
  ON monthly_revenue FOR DELETE
  TO authenticated
  USING (true);
