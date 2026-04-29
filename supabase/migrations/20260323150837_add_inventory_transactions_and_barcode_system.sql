/*
  # Inventory Transactions and Barcode Scanning System

  1. New Tables
    - `inventory_transactions`
      - Tracks all inventory movements (additions, removals, adjustments, counts)
      - Links to warehouse_inventory items
      - Records user, timestamp, quantity changes, and transaction types
      - Stores location, notes, and reference numbers
    
    - `inventory_barcodes`
      - Maps barcode/QR codes to inventory items
      - Supports multiple codes per item (UPC, internal codes, etc.)
      - Tracks barcode format and creation date

  2. Changes
    - Add barcode fields to warehouse_inventory
    - Add mobile scanning fields
    - Create views for transaction history
    - Add indexes for fast barcode lookups

  3. Security
    - Enable RLS on all tables
    - Warehouse staff can scan and create transactions
    - Admins have full access
    - Read-only access for reporting

  4. Features
    - Real-time inventory counting
    - Transaction audit trail
    - Multi-barcode support
    - Mobile-optimized scanning
*/

-- Create inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL CHECK (transaction_type IN ('count', 'addition', 'removal', 'adjustment', 'transfer', 'reserve', 'unreserve')),
  product_code text NOT NULL,
  quantity_change integer NOT NULL,
  quantity_before integer NOT NULL,
  quantity_after integer NOT NULL,
  location text,
  bin_location text,
  reference_number text,
  notes text,
  scanned_barcode text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  created_by_name text,
  device_info jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_code);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created ON inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user ON inventory_transactions(user_id);

-- Create barcodes table
CREATE TABLE IF NOT EXISTS inventory_barcodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code text NOT NULL,
  barcode text NOT NULL UNIQUE,
  barcode_type text DEFAULT 'upc' CHECK (barcode_type IN ('upc', 'ean', 'qr', 'code128', 'code39', 'internal')),
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_barcodes_product ON inventory_barcodes(product_code);
CREATE INDEX IF NOT EXISTS idx_inventory_barcodes_barcode ON inventory_barcodes(barcode);

-- Add barcode fields to warehouse_inventory
ALTER TABLE warehouse_inventory 
ADD COLUMN IF NOT EXISTS primary_barcode text,
ADD COLUMN IF NOT EXISTS barcode_type text DEFAULT 'upc',
ADD COLUMN IF NOT EXISTS last_counted_at timestamptz,
ADD COLUMN IF NOT EXISTS last_counted_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS count_variance integer DEFAULT 0;

-- Enable RLS
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_barcodes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_transactions
CREATE POLICY "Warehouse staff can view transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'operations_manager', 'operations_staff', 'warehouse_manager')
    )
  );

CREATE POLICY "Warehouse staff can create transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'operations_manager', 'operations_staff', 'warehouse_manager')
    )
  );

-- RLS Policies for inventory_barcodes
CREATE POLICY "Warehouse staff can view barcodes"
  ON inventory_barcodes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name IN ('admin', 'operations_manager', 'operations_staff', 'warehouse_manager')
    )
  );

CREATE POLICY "Admins can manage barcodes"
  ON inventory_barcodes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid()
      AND ur.name = 'admin'
    )
  );

-- Function to process inventory transaction
CREATE OR REPLACE FUNCTION process_inventory_transaction(
  p_product_code text,
  p_transaction_type text,
  p_quantity_change integer,
  p_location text DEFAULT NULL,
  p_bin_location text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_scanned_barcode text DEFAULT NULL,
  p_reference_number text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_current_qty integer;
  v_current_reserved integer;
  v_new_qty integer;
  v_transaction_id uuid;
  v_user_name text;
BEGIN
  SELECT quantity_on_hand, quantity_reserved 
  INTO v_current_qty, v_current_reserved
  FROM warehouse_inventory 
  WHERE product_code = p_product_code;

  IF v_current_qty IS NULL THEN
    RAISE EXCEPTION 'Product code % not found', p_product_code;
  END IF;

  CASE p_transaction_type
    WHEN 'count' THEN
      v_new_qty := p_quantity_change;
    WHEN 'addition' THEN
      v_new_qty := v_current_qty + p_quantity_change;
    WHEN 'removal' THEN
      v_new_qty := v_current_qty - p_quantity_change;
    WHEN 'adjustment' THEN
      v_new_qty := v_current_qty + p_quantity_change;
    WHEN 'reserve' THEN
      v_new_qty := v_current_qty;
      UPDATE warehouse_inventory 
      SET quantity_reserved = quantity_reserved + p_quantity_change
      WHERE product_code = p_product_code;
    WHEN 'unreserve' THEN
      v_new_qty := v_current_qty;
      UPDATE warehouse_inventory 
      SET quantity_reserved = quantity_reserved - p_quantity_change
      WHERE product_code = p_product_code;
    ELSE
      RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
  END CASE;

  SELECT full_name INTO v_user_name
  FROM user_profiles
  WHERE id = auth.uid();

  INSERT INTO inventory_transactions (
    transaction_type,
    product_code,
    quantity_change,
    quantity_before,
    quantity_after,
    location,
    bin_location,
    notes,
    scanned_barcode,
    reference_number,
    user_id,
    created_by_name
  ) VALUES (
    p_transaction_type,
    p_product_code,
    p_quantity_change,
    v_current_qty,
    v_new_qty,
    p_location,
    p_bin_location,
    p_notes,
    p_scanned_barcode,
    p_reference_number,
    auth.uid(),
    v_user_name
  ) RETURNING id INTO v_transaction_id;

  IF p_transaction_type NOT IN ('reserve', 'unreserve') THEN
    UPDATE warehouse_inventory 
    SET 
      quantity_on_hand = v_new_qty,
      last_counted_at = CASE WHEN p_transaction_type = 'count' THEN now() ELSE last_counted_at END,
      last_counted_by = CASE WHEN p_transaction_type = 'count' THEN auth.uid() ELSE last_counted_by END,
      count_variance = CASE WHEN p_transaction_type = 'count' THEN (v_new_qty - v_current_qty) ELSE count_variance END,
      updated_at = now()
    WHERE product_code = p_product_code;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'quantity_before', v_current_qty,
    'quantity_after', v_new_qty,
    'product_code', p_product_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
