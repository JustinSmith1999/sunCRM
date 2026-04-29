/*
  # Create Company Equipment Table

  1. New Tables
    - company_equipment
      - id (uuid, primary key)
      - name (text)
      - record_type_id (text)
      - employee_hr (text)
      - computer_name (text)
      - computer_user_name (text)
      - computer_make (text)
      - computer_model (text)
      - computer_serial_number (text)
      - computer_os (text)
      - phone_number (text)
      - phone_extension (text)
      - phone_imei (text)
      - phone_make (text)
      - phone_model (text)
      - phone_carrier (text)
      - sim_card_number (text)
      - mac_address (text)
      - ip_address (text)
      - purchase_date (date)
      - warranty_expiration (date)
      - status (text)
      - location (text)
      - department (text)
      - notes (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on company_equipment table
    - Add policies for authenticated users to manage equipment records

  3. Indexes
    - Index on employee_hr for faster lookups
    - Index on computer_serial_number for device searches
    - Index on phone_number for phone lookups
    - Index on status for filtering
*/

CREATE TABLE IF NOT EXISTS company_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  record_type_id text,
  employee_hr text,
  computer_name text,
  computer_user_name text,
  computer_make text,
  computer_model text,
  computer_serial_number text,
  computer_os text,
  phone_number text,
  phone_extension text,
  phone_imei text,
  phone_make text,
  phone_model text,
  phone_carrier text,
  sim_card_number text,
  mac_address text,
  ip_address text,
  purchase_date date,
  warranty_expiration date,
  status text DEFAULT 'active',
  location text,
  department text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company equipment"
  ON company_equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert company equipment"
  ON company_equipment FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update company equipment"
  ON company_equipment FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete company equipment"
  ON company_equipment FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_company_equipment_employee ON company_equipment(employee_hr);
CREATE INDEX IF NOT EXISTS idx_company_equipment_serial ON company_equipment(computer_serial_number);
CREATE INDEX IF NOT EXISTS idx_company_equipment_phone ON company_equipment(phone_number);
CREATE INDEX IF NOT EXISTS idx_company_equipment_status ON company_equipment(status);
