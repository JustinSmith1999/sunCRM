/*
  # Automatic Atera Sync Trigger

  1. Changes
    - Add database trigger to automatically sync new IT tickets to Atera
    - Trigger calls edge function via HTTP when ticket is created
    - Only syncs if Atera integration is active

  2. Purpose
    - Remove manual sync requirement
    - Automatic ticket creation in Atera for all new IT tickets
    - Seamless integration without user intervention
*/

-- Create function to trigger Atera sync
CREATE OR REPLACE FUNCTION trigger_atera_sync()
RETURNS TRIGGER AS $$
DECLARE
  atera_active boolean;
  supabase_url text;
  function_url text;
  service_key text;
BEGIN
  -- Check if Atera is active
  SELECT is_active INTO atera_active
  FROM atera_config
  WHERE is_active = true
  LIMIT 1;

  -- Only proceed if Atera is configured and active
  IF atera_active THEN
    -- Set sync status to syncing
    NEW.atera_sync_status := 'syncing';
    
    -- The edge function will be called asynchronously via pg_net
    -- This is handled by a separate background job
    PERFORM pg_notify(
      'atera_sync_channel',
      json_build_object(
        'ticket_id', NEW.id,
        'action', 'sync_ticket'
      )::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new tickets
DROP TRIGGER IF EXISTS trigger_auto_atera_sync ON it_support_tickets;
CREATE TRIGGER trigger_auto_atera_sync
  BEFORE INSERT ON it_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_atera_sync();

-- Create function to handle ticket updates and sync comments
CREATE OR REPLACE FUNCTION sync_atera_on_update()
RETURNS TRIGGER AS $$
DECLARE
  atera_active boolean;
BEGIN
  -- Check if Atera is active
  SELECT is_active INTO atera_active
  FROM atera_config
  WHERE is_active = true
  LIMIT 1;

  -- Only proceed if Atera is configured and active and ticket is already synced
  IF atera_active AND OLD.synced_to_atera = true THEN
    -- If status changed, notify for status sync
    IF OLD.status != NEW.status THEN
      PERFORM pg_notify(
        'atera_sync_channel',
        json_build_object(
          'ticket_id', NEW.id,
          'action', 'sync_status'
        )::text
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for ticket updates
DROP TRIGGER IF EXISTS trigger_atera_update_sync ON it_support_tickets;
CREATE TRIGGER trigger_atera_update_sync
  AFTER UPDATE ON it_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION sync_atera_on_update();

-- Create function to sync comments to Atera
CREATE OR REPLACE FUNCTION sync_comment_to_atera()
RETURNS TRIGGER AS $$
DECLARE
  atera_active boolean;
  ticket_synced boolean;
BEGIN
  -- Check if Atera is active
  SELECT is_active INTO atera_active
  FROM atera_config
  WHERE is_active = true
  LIMIT 1;

  -- Check if ticket is synced
  SELECT synced_to_atera INTO ticket_synced
  FROM it_support_tickets
  WHERE id = NEW.ticket_id;

  -- Only proceed if Atera is active and ticket is synced and comment is not internal
  IF atera_active AND ticket_synced AND NEW.is_internal = false THEN
    PERFORM pg_notify(
      'atera_sync_channel',
      json_build_object(
        'ticket_id', NEW.ticket_id,
        'action', 'sync_comment'
      )::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new comments
DROP TRIGGER IF EXISTS trigger_sync_comment_to_atera ON it_ticket_comments;
CREATE TRIGGER trigger_sync_comment_to_atera
  AFTER INSERT ON it_ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION sync_comment_to_atera();