/*
  # Field Service Management System (HouseCall Pro Clone)
  
  Complete service management platform for Service Sales Team and Service Team
  
  ## New Tables
  
  ### 1. service_customers
    - Customer profiles with enhanced service history tracking
    - Property information and service locations
    - Billing and contact details
    - Tags and custom fields
  
  ### 2. service_equipment
    - Track equipment/installations at customer properties
    - Warranty information
    - Maintenance schedules
    - Equipment history
  
  ### 3. technicians
    - Technician profiles and specialties
    - Availability and scheduling
    - Performance metrics
    - GPS tracking data
  
  ### 4. service_tickets
    - Service jobs/work orders
    - Status tracking (scheduled, in_progress, completed, cancelled)
    - Priority levels
    - Job details and requirements
  
  ### 5. service_estimates
    - Quotes for service work
    - Line items and pricing
    - Approval status
    - Convert to service tickets
  
  ### 6. service_invoices
    - Invoicing for completed work
    - Payment tracking
    - Integration with accounting
  
  ### 7. service_parts
    - Parts inventory management
    - Usage tracking
    - Stock levels and reordering
  
  ### 8. service_appointments
    - Scheduled appointments
    - Technician assignments
    - Customer notifications
  
  ### 9. time_tracking
    - Clock in/out for technicians
    - Job time tracking
    - Payroll integration
  
  ### 10. service_notes
    - Job notes and updates
    - Customer communication logs
    - Internal notes
  
  ### 11. service_attachments
    - Photos and documents
    - Before/after pictures
    - Signed agreements
  
  ### 12. price_book
    - Service catalog with standard pricing
    - Labor rates
    - Parts pricing
  
  ## Security
    - Enable RLS on all tables
    - Policies for admins, service managers, and technicians
*/

-- Service Customers Table
CREATE TABLE IF NOT EXISTS service_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_type text DEFAULT 'residential' CHECK (customer_type IN ('residential', 'commercial')),
  company_name text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  mobile_phone text,
  address text,
  city text,
  state text,
  zip_code text,
  property_type text,
  tags text[],
  preferred_contact_method text DEFAULT 'phone',
  notes text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  lead_source text,
  account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'do_not_service')),
  billing_address text,
  billing_city text,
  billing_state text,
  billing_zip_code text,
  payment_terms text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Service Equipment Table (solar panels, inverters, etc.)
CREATE TABLE IF NOT EXISTS service_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES service_customers(id) ON DELETE CASCADE,
  equipment_type text NOT NULL,
  brand text,
  model text,
  serial_number text,
  install_date date,
  warranty_expiration date,
  location_on_property text,
  system_size text,
  equipment_status text DEFAULT 'active' CHECK (equipment_status IN ('active', 'inactive', 'needs_service', 'replaced')),
  notes text,
  specs jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Technicians Table
CREATE TABLE IF NOT EXISTS technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  employee_id text UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  specialties text[],
  certification text[],
  hire_date date,
  employment_status text DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'on_leave')),
  hourly_rate numeric(10,2),
  avatar_url text,
  vehicle_info text,
  home_address text,
  gps_tracking_enabled boolean DEFAULT true,
  current_location point,
  last_location_update timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Service Tickets (Jobs/Work Orders)
CREATE TABLE IF NOT EXISTS service_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES service_customers(id),
  assigned_technician_id uuid REFERENCES technicians(id),
  service_type text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'dispatched', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  title text NOT NULL,
  description text,
  service_location text,
  scheduled_date date,
  scheduled_time_start time,
  scheduled_time_end time,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  estimated_duration interval,
  equipment_id uuid REFERENCES service_equipment(id),
  requires_parts boolean DEFAULT false,
  parts_ordered boolean DEFAULT false,
  customer_po_number text,
  billable boolean DEFAULT true,
  billing_type text CHECK (billing_type IN ('hourly', 'flat_rate', 'time_and_materials', 'warranty', 'contract')),
  estimated_cost numeric(10,2),
  actual_cost numeric(10,2),
  invoice_id uuid,
  completion_notes text,
  customer_signature text,
  photos_required boolean DEFAULT false,
  checklist_completed boolean DEFAULT false,
  tags text[],
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Service Estimates
CREATE TABLE IF NOT EXISTS service_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES service_customers(id),
  created_by uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'approved', 'declined', 'expired')),
  valid_until date,
  subtotal numeric(10,2) DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) DEFAULT 0,
  notes text,
  terms text,
  converted_to_ticket_id uuid REFERENCES service_tickets(id),
  sent_date timestamptz,
  viewed_date timestamptz,
  approved_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Estimate Line Items
CREATE TABLE IF NOT EXISTS estimate_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid REFERENCES service_estimates(id) ON DELETE CASCADE,
  item_type text CHECK (item_type IN ('labor', 'part', 'service', 'other')),
  description text NOT NULL,
  quantity numeric(10,2) DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Service Invoices
CREATE TABLE IF NOT EXISTS service_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  ticket_id uuid REFERENCES service_tickets(id),
  customer_id uuid REFERENCES service_customers(id),
  invoice_date date DEFAULT CURRENT_DATE,
  due_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled')),
  subtotal numeric(10,2) DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) DEFAULT 0,
  amount_paid numeric(10,2) DEFAULT 0,
  balance_due numeric(10,2) DEFAULT 0,
  payment_terms text,
  notes text,
  sent_date timestamptz,
  paid_date timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES service_invoices(id) ON DELETE CASCADE,
  item_type text CHECK (item_type IN ('labor', 'part', 'service', 'trip_charge', 'other')),
  description text NOT NULL,
  quantity numeric(10,2) DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  taxable boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Invoice Payments
CREATE TABLE IF NOT EXISTS invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES service_invoices(id) ON DELETE CASCADE,
  payment_date date DEFAULT CURRENT_DATE,
  amount numeric(10,2) NOT NULL,
  payment_method text CHECK (payment_method IN ('cash', 'check', 'credit_card', 'debit_card', 'ach', 'financing', 'other')),
  reference_number text,
  notes text,
  processed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Service Parts Inventory
CREATE TABLE IF NOT EXISTS service_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number text UNIQUE NOT NULL,
  part_name text NOT NULL,
  description text,
  category text,
  manufacturer text,
  supplier text,
  quantity_on_hand integer DEFAULT 0,
  reorder_level integer DEFAULT 0,
  reorder_quantity integer DEFAULT 0,
  unit_cost numeric(10,2),
  unit_price numeric(10,2),
  location text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'out_of_stock')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Parts Usage (tracking parts used on jobs)
CREATE TABLE IF NOT EXISTS parts_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES service_tickets(id) ON DELETE CASCADE,
  part_id uuid REFERENCES service_parts(id),
  quantity_used numeric(10,2) NOT NULL,
  unit_cost numeric(10,2),
  unit_price numeric(10,2),
  total_cost numeric(10,2),
  total_price numeric(10,2),
  used_by uuid REFERENCES technicians(id),
  used_at timestamptz DEFAULT now(),
  notes text
);

-- Service Appointments
CREATE TABLE IF NOT EXISTS service_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES service_tickets(id),
  customer_id uuid REFERENCES service_customers(id),
  technician_id uuid REFERENCES technicians(id),
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration interval,
  appointment_type text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  confirmation_sent boolean DEFAULT false,
  reminder_sent boolean DEFAULT false,
  arrival_window_start time,
  arrival_window_end time,
  customer_confirmed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Time Tracking
CREATE TABLE IF NOT EXISTS service_time_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid REFERENCES technicians(id),
  ticket_id uuid REFERENCES service_tickets(id),
  clock_in_time timestamptz NOT NULL,
  clock_out_time timestamptz,
  break_duration interval DEFAULT '0 minutes',
  total_hours numeric(10,2),
  location_clock_in point,
  location_clock_out point,
  activity_type text CHECK (activity_type IN ('service_call', 'travel', 'break', 'training', 'admin')),
  notes text,
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Service Notes
CREATE TABLE IF NOT EXISTS service_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES service_tickets(id),
  customer_id uuid REFERENCES service_customers(id),
  note_type text CHECK (note_type IN ('internal', 'customer_visible', 'dispatch', 'follow_up')),
  note_text text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Service Attachments
CREATE TABLE IF NOT EXISTS service_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES service_tickets(id),
  customer_id uuid REFERENCES service_customers(id),
  equipment_id uuid REFERENCES service_equipment(id),
  file_name text NOT NULL,
  file_type text,
  file_size integer,
  file_url text NOT NULL,
  attachment_type text CHECK (attachment_type IN ('photo', 'document', 'video', 'signature', 'diagram')),
  description text,
  taken_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Price Book
CREATE TABLE IF NOT EXISTS service_price_book (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code text UNIQUE NOT NULL,
  item_name text NOT NULL,
  description text,
  category text,
  item_type text CHECK (item_type IN ('labor', 'service', 'part', 'package')),
  unit_price numeric(10,2) NOT NULL,
  unit_cost numeric(10,2),
  unit_of_measure text DEFAULT 'each',
  estimated_time interval,
  taxable boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Service Checklists
CREATE TABLE IF NOT EXISTS service_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  service_type text,
  checklist_items jsonb NOT NULL,
  is_template boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ticket Checklists (completed checklists for specific tickets)
CREATE TABLE IF NOT EXISTS ticket_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES service_tickets(id) ON DELETE CASCADE,
  checklist_template_id uuid REFERENCES service_checklists(id),
  completed_items jsonb NOT NULL,
  completed_by uuid REFERENCES technicians(id),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_tickets_customer ON service_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_technician ON service_tickets(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_service_tickets_scheduled_date ON service_tickets(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_service_appointments_date ON service_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_service_appointments_technician ON service_appointments(technician_id);
CREATE INDEX IF NOT EXISTS idx_service_equipment_customer ON service_equipment(customer_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_technician ON service_time_tracking(technician_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_ticket ON service_time_tracking(ticket_id);

-- Enable RLS on all tables
ALTER TABLE service_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_price_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_checklists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_customers
CREATE POLICY "Service managers and admins can view all customers"
  ON service_customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')
    )
  );

CREATE POLICY "Service staff can insert customers"
  ON service_customers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')
    )
  );

CREATE POLICY "Service staff can update customers"
  ON service_customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')
    )
  );

-- RLS Policies for service_tickets
CREATE POLICY "Service staff and techs can view tickets"
  ON service_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')
    )
  );

CREATE POLICY "Service staff can create tickets"
  ON service_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')
    )
  );

CREATE POLICY "Service staff and techs can update tickets"
  ON service_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')
    )
  );

-- RLS Policies for technicians
CREATE POLICY "Service staff can view technicians"
  ON technicians FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')
    )
  );

CREATE POLICY "Service managers can manage technicians"
  ON technicians FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')
    )
  );

-- RLS Policies for service_invoices
CREATE POLICY "Service staff can view invoices"
  ON service_invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.department IN ('Service', 'Finance') OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')
    )
  );

CREATE POLICY "Service staff can manage invoices"
  ON service_invoices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')
    )
  );

-- Apply similar policies to other tables
CREATE POLICY "Service staff can view all service data"
  ON service_equipment FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));

CREATE POLICY "Service staff can manage service data"
  ON service_equipment FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')));

CREATE POLICY "Service staff can view estimates" ON service_estimates FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')));
CREATE POLICY "Service staff can manage estimates" ON service_estimates FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')));

CREATE POLICY "Service staff can view estimate items" ON estimate_line_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')));
CREATE POLICY "Service staff can manage estimate items" ON estimate_line_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')));

CREATE POLICY "Service staff can view invoice items" ON invoice_line_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department IN ('Service', 'Finance') OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')));
CREATE POLICY "Service staff can manage invoice items" ON invoice_line_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')));

CREATE POLICY "Service staff can view payments" ON invoice_payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department IN ('Service', 'Finance') OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')));
CREATE POLICY "Service staff can manage payments" ON invoice_payments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')));

CREATE POLICY "Service staff can view parts" ON service_parts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));
CREATE POLICY "Service managers can manage parts" ON service_parts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')));

CREATE POLICY "Service staff can view parts usage" ON parts_usage FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));
CREATE POLICY "Techs and service staff can record parts usage" ON parts_usage FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));

CREATE POLICY "Service staff can view appointments" ON service_appointments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));
CREATE POLICY "Service staff can manage appointments" ON service_appointments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')));

CREATE POLICY "Service staff can view time tracking" ON service_time_tracking FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));
CREATE POLICY "Techs can track their time" ON service_time_tracking FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));

CREATE POLICY "Service staff can view notes" ON service_notes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));
CREATE POLICY "Service staff can manage notes" ON service_notes FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));

CREATE POLICY "Service staff can view attachments" ON service_attachments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));
CREATE POLICY "Service staff can manage attachments" ON service_attachments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));

CREATE POLICY "Service staff can view price book" ON service_price_book FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));
CREATE POLICY "Service managers can manage price book" ON service_price_book FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')));

CREATE POLICY "Service staff can view checklists" ON service_checklists FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));
CREATE POLICY "Service managers can manage checklists" ON service_checklists FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%')));

CREATE POLICY "Service staff can view ticket checklists" ON ticket_checklists FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));
CREATE POLICY "Techs and service staff can manage ticket checklists" ON ticket_checklists FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND (user_profiles.department = 'Service' OR user_profiles.title ILIKE '%admin%' OR user_profiles.title ILIKE '%manager%' OR user_profiles.title ILIKE '%tech%')));
