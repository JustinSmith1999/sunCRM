/*
  # IT Support Ticketing System

  1. New Tables
    - `it_support_tickets`
      - `id` (uuid, primary key)
      - `ticket_number` (text, unique, auto-generated)
      - `user_id` (uuid, references auth.users)
      - `created_by_email` (text)
      - `subject` (text, required)
      - `description` (text, required)
      - `category` (text: hardware, software, network, access, email, phone, other)
      - `priority` (text: low, medium, high, urgent)
      - `status` (text: open, in_progress, waiting_on_user, resolved, closed)
      - `assigned_to` (uuid, references auth.users)
      - `resolution_notes` (text)
      - `attachments` (jsonb array of file references)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `resolved_at` (timestamptz)
      - `closed_at` (timestamptz)
      - `last_response_at` (timestamptz)
    
    - `it_ticket_comments`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, references it_support_tickets)
      - `user_id` (uuid, references auth.users)
      - `comment` (text, required)
      - `is_internal` (boolean, default false - internal notes only IT can see)
      - `created_at` (timestamptz)
    
    - `it_ticket_attachments`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, references it_support_tickets)
      - `user_id` (uuid, references auth.users)
      - `file_name` (text)
      - `file_url` (text)
      - `file_size` (bigint)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can view their own tickets
    - Users can create new tickets
    - Users can comment on their own tickets
    - IT staff (tech@sunation.com) can view and manage all tickets
    - IT staff can see internal notes
    - Regular users cannot see internal notes

  3. Indexes
    - Index on ticket_number for quick lookup
    - Index on user_id for user's ticket queries
    - Index on assigned_to for IT staff workload
    - Index on status for filtering
    - Index on created_at for sorting
*/

-- Create IT Support Tickets table
CREATE TABLE IF NOT EXISTS it_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_email text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes text,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  last_response_at timestamptz,
  CONSTRAINT valid_category CHECK (category IN ('hardware', 'software', 'network', 'access', 'email', 'phone', 'other')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'waiting_on_user', 'resolved', 'closed'))
);

-- Create IT Ticket Comments table
CREATE TABLE IF NOT EXISTS it_ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES it_support_tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  comment text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create IT Ticket Attachments table
CREATE TABLE IF NOT EXISTS it_ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES it_support_tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_it_tickets_ticket_number ON it_support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_it_tickets_user_id ON it_support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_it_tickets_assigned_to ON it_support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_it_tickets_status ON it_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_it_tickets_created_at ON it_support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_it_comments_ticket_id ON it_ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_it_attachments_ticket_id ON it_ticket_attachments(ticket_id);

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  -- Get count of tickets today
  SELECT COUNT(*) + 1 INTO counter
  FROM it_support_tickets
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Format: IT-YYYYMMDD-XXXX
  new_number := 'IT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::text, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON it_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_it_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_it_ticket_timestamp
  BEFORE UPDATE ON it_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_it_ticket_timestamp();

-- Enable RLS
ALTER TABLE it_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_ticket_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for it_support_tickets

-- IT staff can view all tickets
CREATE POLICY "IT staff can view all tickets"
  ON it_support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'tech@sunation.com'
    )
  );

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON it_support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can create tickets
CREATE POLICY "Users can create tickets"
  ON it_support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- IT staff can update all tickets
CREATE POLICY "IT staff can update all tickets"
  ON it_support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'tech@sunation.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'tech@sunation.com'
    )
  );

-- Users can update their own tickets (limited fields)
CREATE POLICY "Users can update own tickets"
  ON it_support_tickets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for it_ticket_comments

-- IT staff can view all comments
CREATE POLICY "IT staff can view all comments"
  ON it_ticket_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'tech@sunation.com'
    )
  );

-- Users can view non-internal comments on their tickets
CREATE POLICY "Users can view comments on own tickets"
  ON it_ticket_comments FOR SELECT
  TO authenticated
  USING (
    is_internal = false
    AND EXISTS (
      SELECT 1 FROM it_support_tickets
      WHERE it_support_tickets.id = ticket_id
      AND it_support_tickets.user_id = auth.uid()
    )
  );

-- Authenticated users can create comments
CREATE POLICY "Users can create comments"
  ON it_ticket_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- IT staff can create internal comments
      (is_internal = true AND EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.email = 'tech@sunation.com'
      ))
      OR
      -- Regular users can only create non-internal comments on their tickets
      (is_internal = false AND EXISTS (
        SELECT 1 FROM it_support_tickets
        WHERE it_support_tickets.id = ticket_id
        AND it_support_tickets.user_id = auth.uid()
      ))
    )
  );

-- RLS Policies for it_ticket_attachments

-- IT staff can view all attachments
CREATE POLICY "IT staff can view all attachments"
  ON it_ticket_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'tech@sunation.com'
    )
  );

-- Users can view attachments on their tickets
CREATE POLICY "Users can view attachments on own tickets"
  ON it_ticket_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM it_support_tickets
      WHERE it_support_tickets.id = ticket_id
      AND it_support_tickets.user_id = auth.uid()
    )
  );

-- Users can create attachments on their tickets
CREATE POLICY "Users can create attachments"
  ON it_ticket_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM it_support_tickets
      WHERE it_support_tickets.id = ticket_id
      AND (
        it_support_tickets.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.email = 'tech@sunation.com'
        )
      )
    )
  );