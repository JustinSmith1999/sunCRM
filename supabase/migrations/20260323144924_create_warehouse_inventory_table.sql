/*
  # Warehouse Inventory System

  1. New Tables
    - `warehouse_inventory`
      - `id` (uuid, primary key)
      - `product_code` (text, unique) - SKU or part number
      - `product_name` (text) - Product description
      - `category` (text) - Product category
      - `quantity_on_hand` (integer) - Total quantity in warehouse
      - `quantity_reserved` (integer) - Quantity allocated to orders
      - `quantity_available` (integer) - Available quantity (on_hand - reserved)
      - `unit_cost` (numeric) - Cost per unit
      - `total_value` (numeric) - Total inventory value
      - `location` (text) - Warehouse location/section
      - `bin_location` (text) - Specific bin/shelf location
      - `reorder_point` (integer) - Minimum quantity before reorder
      - `reorder_quantity` (integer) - Standard reorder quantity
      - `supplier_name` (text) - Primary supplier
      - `supplier_sku` (text) - Supplier's SKU
      - `last_received_date` (timestamptz) - Last time stock received
      - `last_ordered_date` (timestamptz) - Last time order placed
      - `notes` (text) - Additional notes
      - `excel_source_file` (text) - Source Excel file path
      - `excel_row_number` (integer) - Row number in Excel
      - `synced_at` (timestamptz) - Last sync timestamp
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `warehouse_inventory` table
    - Add policies for warehouse managers and admins to manage inventory
    - Operations staff can view inventory
*/

-- Create warehouse_inventory table
CREATE TABLE IF NOT EXISTS warehouse_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code text UNIQUE NOT NULL,
  product_name text NOT NULL,
  category text,
  quantity_on_hand integer DEFAULT 0,
  quantity_reserved integer DEFAULT 0,
  quantity_available integer DEFAULT 0,
  unit_cost numeric(10, 2) DEFAULT 0,
  total_value numeric(12, 2) DEFAULT 0,
  location text,
  bin_location text,
  reorder_point integer DEFAULT 0,
  reorder_quantity integer DEFAULT 0,
  supplier_name text,
  supplier_sku text,
  last_received_date timestamptz,
  last_ordered_date timestamptz,
  notes text,
  excel_source_file text,
  excel_row_number integer,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;

-- Policies for warehouse_inventory
CREATE POLICY "Authenticated users can view warehouse inventory"
  ON warehouse_inventory
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
    )
  );

CREATE POLICY "Warehouse managers and admins can insert inventory"
  ON warehouse_inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'operations_manager', 'warehouse_manager')
    )
  );

CREATE POLICY "Warehouse managers and admins can update inventory"
  ON warehouse_inventory
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'operations_manager', 'warehouse_manager')
    )
  );

CREATE POLICY "Admins can delete inventory items"
  ON warehouse_inventory
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_product_code ON warehouse_inventory(product_code);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_category ON warehouse_inventory(category);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_location ON warehouse_inventory(location);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_synced_at ON warehouse_inventory(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_excel_row ON warehouse_inventory(excel_row_number);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_warehouse_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.quantity_available = NEW.quantity_on_hand - NEW.quantity_reserved;
  NEW.total_value = NEW.quantity_on_hand * NEW.unit_cost;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER warehouse_inventory_updated_at
  BEFORE UPDATE ON warehouse_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_warehouse_inventory_updated_at();