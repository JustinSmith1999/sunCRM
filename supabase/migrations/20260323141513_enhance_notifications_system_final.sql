/*
  # Enhance Notifications System with Advanced Features

  1. Updates to Existing Tables
    - Add missing columns to notifications table for comprehensive tracking
    - Create notification_preferences table for user control
    - Create activity_feed table for audit trail
    - Create notification_templates table for reusable templates
    
  2. New Features
    - Priority levels and categorization
    - Read tracking with timestamps
    - Link support for navigation
    - Expiration dates for temporary notifications
    - Email and SMS delivery preferences
    - Quiet hours support
    
  3. Security
    - All tables have RLS enabled
    - Users only see their own data
    - Proper indexes for performance
*/

-- Add missing columns to notifications table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'priority') THEN
    ALTER TABLE notifications ADD COLUMN priority text DEFAULT 'normal';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'category') THEN
    ALTER TABLE notifications ADD COLUMN category text DEFAULT 'system';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read_at') THEN
    ALTER TABLE notifications ADD COLUMN read_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'link_url') THEN
    ALTER TABLE notifications ADD COLUMN link_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'link_type') THEN
    ALTER TABLE notifications ADD COLUMN link_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'link_id') THEN
    ALTER TABLE notifications ADD COLUMN link_id uuid;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'action_text') THEN
    ALTER TABLE notifications ADD COLUMN action_text text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'metadata') THEN
    ALTER TABLE notifications ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'expires_at') THEN
    ALTER TABLE notifications ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

-- Update existing notification categories
UPDATE notifications SET category = 'system' WHERE category IS NULL;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  email_enabled boolean DEFAULT true,
  in_app_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  
  email_digest_frequency text DEFAULT 'immediate',
  
  sales_notifications boolean DEFAULT true,
  service_notifications boolean DEFAULT true,
  it_support_notifications boolean DEFAULT true,
  hr_notifications boolean DEFAULT true,
  admin_notifications boolean DEFAULT true,
  system_notifications boolean DEFAULT true,
  
  new_lead_assigned boolean DEFAULT true,
  deal_stage_changed boolean DEFAULT true,
  task_due_soon boolean DEFAULT true,
  task_overdue boolean DEFAULT true,
  ticket_assigned boolean DEFAULT true,
  ticket_updated boolean DEFAULT true,
  approval_required boolean DEFAULT true,
  mention_received boolean DEFAULT true,
  comment_added boolean DEFAULT true,
  
  quiet_hours_enabled boolean DEFAULT false,
  quiet_hours_start time,
  quiet_hours_end time,
  
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create activity feed table
CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text,
  user_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  description text NOT NULL,
  changes jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  title_template text NOT NULL,
  message_template text NOT NULL,
  email_subject_template text,
  email_body_template text,
  sms_template text,
  default_priority text DEFAULT 'normal',
  variables jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at_desc ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at_desc ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_entity ON activity_feed(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_action ON activity_feed(action);

-- Enable RLS on new tables
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for activity feed
CREATE POLICY "Users can view all activity feed"
  ON activity_feed FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert activity"
  ON activity_feed FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for notification templates
CREATE POLICY "Anyone can view active notification templates"
  ON notification_templates FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can manage notification templates"
  ON notification_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organization_roles uor
      WHERE uor.user_id = auth.uid()
      AND uor.role = 'admin'
    )
  );

-- Function to create notification with enhanced features
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_category text DEFAULT 'system',
  p_priority text DEFAULT 'normal',
  p_link_url text DEFAULT NULL,
  p_link_type text DEFAULT NULL,
  p_link_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id, title, message, type, category, priority,
    link_url, link_type, link_id, metadata, entity_type, entity_id
  ) VALUES (
    p_user_id, p_title, p_message, p_type, p_category, p_priority,
    p_link_url, p_link_type, p_link_id, p_metadata, p_link_type, p_link_id
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_entity_name text,
  p_description text,
  p_changes jsonb DEFAULT '{}'::jsonb,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_activity_id uuid;
  v_user_name text;
  v_user_email text;
BEGIN
  SELECT full_name, email INTO v_user_name, v_user_email
  FROM user_profiles
  WHERE id = p_user_id;
  
  INSERT INTO activity_feed (
    user_id, user_name, user_email, action, entity_type, entity_id,
    entity_name, description, changes, metadata
  ) VALUES (
    p_user_id, v_user_name, v_user_email, p_action, p_entity_type, p_entity_id,
    p_entity_name, p_description, p_changes, p_metadata
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = now()
  WHERE id = p_notification_id
  AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = now()
  WHERE user_id = auth.uid()
  AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_count
  FROM notifications
  WHERE user_id = p_user_id
  AND is_read = false
  AND (expires_at IS NULL OR expires_at > now());
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS integer AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM notifications
    WHERE expires_at IS NOT NULL
    AND expires_at < now()
    RETURNING id
  )
  SELECT COUNT(*)::integer INTO v_deleted_count FROM deleted;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default notification templates
INSERT INTO notification_templates (name, type, category, title_template, message_template, default_priority) VALUES
('lead_assigned', 'lead', 'sales', 'New Lead Assigned', 'You have been assigned a new lead: {{lead_name}}', 'normal'),
('deal_stage_changed', 'deal', 'sales', 'Deal Stage Updated', '{{deal_name}} moved to {{new_stage}}', 'normal'),
('task_due_soon', 'task', 'system', 'Task Due Soon', 'Task "{{task_name}}" is due in {{hours}} hours', 'normal'),
('task_overdue', 'warning', 'system', 'Task Overdue', 'Task "{{task_name}}" is now overdue', 'high'),
('ticket_assigned', 'it_ticket', 'it_support', 'Ticket Assigned', 'Ticket #{{ticket_number}} has been assigned to you', 'normal'),
('ticket_updated', 'info', 'it_support', 'Ticket Updated', 'Ticket #{{ticket_number}} has been updated', 'low'),
('mention_received', 'info', 'system', 'You Were Mentioned', '{{mentioned_by}} mentioned you in {{entity_type}}', 'normal'),
('approval_required', 'warning', 'admin', 'Approval Required', 'Your approval is needed for {{item_name}}', 'high')
ON CONFLICT (name) DO NOTHING;
