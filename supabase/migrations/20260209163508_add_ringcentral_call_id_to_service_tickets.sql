/*
  # Add RingCentral Call ID to Service Tickets

  Link service tickets to RingCentral call events for full workflow tracking
  from call to ticket creation.

  ## Changes
    - Add ringcentral_call_id column to service_tickets table
    - Add index for quick lookups
*/

-- Add ringcentral_call_id column to service_tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_tickets' AND column_name = 'ringcentral_call_id'
  ) THEN
    ALTER TABLE service_tickets ADD COLUMN ringcentral_call_id text;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_service_tickets_ringcentral_call_id
  ON service_tickets(ringcentral_call_id);
