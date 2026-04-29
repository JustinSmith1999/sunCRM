/*
  # Enhance IT Support with SLA Tracking

  1. Updates to it_support_tickets table
    - Add SLA-related fields for tracking response and resolution times
    - Add fields for priority-based SLA targets
    - Add escalation tracking
    
  2. New Features
    - Automatic SLA calculation based on priority
    - SLA breach warnings and alerts
    - Response time and resolution time tracking
    - Escalation management
    
  3. Indexes
    - Performance indexes for SLA queries
*/

-- Add SLA tracking fields to it_support_tickets
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'it_support_tickets' AND column_name = 'sla_response_target') THEN
    ALTER TABLE it_support_tickets ADD COLUMN sla_response_target timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'it_support_tickets' AND column_name = 'sla_resolution_target') THEN
    ALTER TABLE it_support_tickets ADD COLUMN sla_resolution_target timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'it_support_tickets' AND column_name = 'first_response_at') THEN
    ALTER TABLE it_support_tickets ADD COLUMN first_response_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'it_support_tickets' AND column_name = 'resolved_at') THEN
    ALTER TABLE it_support_tickets ADD COLUMN resolved_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'it_support_tickets' AND column_name = 'sla_response_breached') THEN
    ALTER TABLE it_support_tickets ADD COLUMN sla_response_breached boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'it_support_tickets' AND column_name = 'sla_resolution_breached') THEN
    ALTER TABLE it_support_tickets ADD COLUMN sla_resolution_breached boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'it_support_tickets' AND column_name = 'escalated') THEN
    ALTER TABLE it_support_tickets ADD COLUMN escalated boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'it_support_tickets' AND column_name = 'escalated_at') THEN
    ALTER TABLE it_support_tickets ADD COLUMN escalated_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'it_support_tickets' AND column_name = 'escalated_to') THEN
    ALTER TABLE it_support_tickets ADD COLUMN escalated_to uuid REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'it_support_tickets' AND column_name = 'tags') THEN
    ALTER TABLE it_support_tickets ADD COLUMN tags text[] DEFAULT ARRAY[]::text[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'it_support_tickets' AND column_name = 'resolution_notes') THEN
    ALTER TABLE it_support_tickets ADD COLUMN resolution_notes text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'it_support_tickets' AND column_name = 'customer_satisfaction') THEN
    ALTER TABLE it_support_tickets ADD COLUMN customer_satisfaction integer CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'it_support_tickets' AND column_name = 'customer_feedback') THEN
    ALTER TABLE it_support_tickets ADD COLUMN customer_feedback text;
  END IF;
END $$;

-- Create SLA configuration table
CREATE TABLE IF NOT EXISTS sla_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  priority text NOT NULL UNIQUE,
  response_time_minutes integer NOT NULL,
  resolution_time_minutes integer NOT NULL,
  escalation_time_minutes integer,
  business_hours_only boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_it_support_tickets_sla_response_target ON it_support_tickets(sla_response_target) WHERE status != 'closed';
CREATE INDEX IF NOT EXISTS idx_it_support_tickets_sla_resolution_target ON it_support_tickets(sla_resolution_target) WHERE status != 'closed';
CREATE INDEX IF NOT EXISTS idx_it_support_tickets_sla_response_breached ON it_support_tickets(sla_response_breached) WHERE sla_response_breached = true;
CREATE INDEX IF NOT EXISTS idx_it_support_tickets_sla_resolution_breached ON it_support_tickets(sla_resolution_breached) WHERE sla_resolution_breached = true;
CREATE INDEX IF NOT EXISTS idx_it_support_tickets_escalated ON it_support_tickets(escalated) WHERE escalated = true;
CREATE INDEX IF NOT EXISTS idx_it_support_tickets_priority_status ON it_support_tickets(priority, status);
CREATE INDEX IF NOT EXISTS idx_it_support_tickets_tags ON it_support_tickets USING gin(tags);

-- Enable RLS on new tables
ALTER TABLE sla_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SLA policies
CREATE POLICY "Anyone can view active SLA policies"
  ON sla_policies FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can manage SLA policies"
  ON sla_policies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles uor
      WHERE uor.user_id = auth.uid()
      AND uor.role = 'admin'
    )
  );

-- Insert default SLA policies
INSERT INTO sla_policies (priority, response_time_minutes, resolution_time_minutes, escalation_time_minutes) VALUES
('urgent', 15, 240, 120),
('high', 60, 480, 360),
('medium', 240, 1440, 960),
('low', 1440, 2880, NULL)
ON CONFLICT (priority) DO NOTHING;

-- Function to calculate and set SLA targets
CREATE OR REPLACE FUNCTION set_ticket_sla_targets()
RETURNS TRIGGER AS $$
DECLARE
  v_policy RECORD;
BEGIN
  SELECT * INTO v_policy
  FROM sla_policies
  WHERE priority = NEW.priority
  AND active = true;
  
  IF FOUND THEN
    NEW.sla_response_target := NEW.created_at + (v_policy.response_time_minutes || ' minutes')::interval;
    NEW.sla_resolution_target := NEW.created_at + (v_policy.resolution_time_minutes || ' minutes')::interval;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new tickets
DROP TRIGGER IF EXISTS trigger_set_ticket_sla_targets ON it_support_tickets;
CREATE TRIGGER trigger_set_ticket_sla_targets
  BEFORE INSERT ON it_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_sla_targets();

-- Function to check for SLA breaches
CREATE OR REPLACE FUNCTION check_sla_breaches()
RETURNS void AS $$
BEGIN
  UPDATE it_support_tickets
  SET sla_response_breached = true
  WHERE status NOT IN ('closed', 'resolved')
  AND first_response_at IS NULL
  AND sla_response_target < now()
  AND sla_response_breached = false;
  
  UPDATE it_support_tickets
  SET sla_resolution_breached = true
  WHERE status NOT IN ('closed', 'resolved')
  AND resolved_at IS NULL
  AND sla_resolution_target < now()
  AND sla_resolution_breached = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get SLA statistics
CREATE OR REPLACE FUNCTION get_sla_statistics(p_days integer DEFAULT 30)
RETURNS TABLE (
  total_tickets bigint,
  response_sla_met bigint,
  resolution_sla_met bigint,
  response_breach_rate numeric,
  resolution_breach_rate numeric,
  avg_response_time_minutes numeric,
  avg_resolution_time_minutes numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_tickets,
    COUNT(*) FILTER (WHERE sla_response_breached = false)::bigint as response_sla_met,
    COUNT(*) FILTER (WHERE sla_resolution_breached = false AND status IN ('closed', 'resolved'))::bigint as resolution_sla_met,
    ROUND(
      (COUNT(*) FILTER (WHERE sla_response_breached = true)::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as response_breach_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE sla_resolution_breached = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('closed', 'resolved')), 0)) * 100,
      2
    ) as resolution_breach_rate,
    ROUND(
      AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 60),
      2
    ) FILTER (WHERE first_response_at IS NOT NULL) as avg_response_time_minutes,
    ROUND(
      AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60),
      2
    ) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_time_minutes
  FROM it_support_tickets
  WHERE created_at >= now() - (p_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
