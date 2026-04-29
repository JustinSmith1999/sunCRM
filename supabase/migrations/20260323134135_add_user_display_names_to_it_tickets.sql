/*
  # Add User Display Names to IT Tickets

  1. Changes
    - Add `created_by_name` column to `it_support_tickets` table
    - Add `user_name` column to `it_ticket_comments` table
    - Add function to get display name from email
    - Add function to get display name from HR records
    - Update existing records with display names

  2. Purpose
    - Display full names (e.g., "Roanne Morse") instead of emails
    - Pull names from HR records or user profiles
    - Improve user experience in IT support system
*/

-- Add display name columns
ALTER TABLE it_support_tickets
ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE it_ticket_comments
ADD COLUMN IF NOT EXISTS user_name text;

-- Create function to get user display name
CREATE OR REPLACE FUNCTION get_user_display_name(user_email text)
RETURNS text AS $$
DECLARE
  display_name text;
  first_name text;
  last_name text;
BEGIN
  -- Try to get name from HR records first
  SELECT 
    TRIM(CONCAT(first_name, ' ', last_name))
  INTO display_name
  FROM hr_records
  WHERE email = user_email
  LIMIT 1;

  -- If found in HR records, return it
  IF display_name IS NOT NULL AND display_name != '' THEN
    RETURN display_name;
  END IF;

  -- Try to get from user_profiles
  SELECT 
    TRIM(CONCAT(full_name, ''))
  INTO display_name
  FROM user_profiles
  WHERE email = user_email
  LIMIT 1;

  -- If found in profiles, return it
  IF display_name IS NOT NULL AND display_name != '' THEN
    RETURN display_name;
  END IF;

  -- If not found, try to construct from email
  -- Convert rmorse@sunation.com to "R Morse"
  IF user_email LIKE '%@%' THEN
    DECLARE
      username text;
      cleaned_name text;
    BEGIN
      username := SPLIT_PART(user_email, '@', 1);
      
      -- Try to split by common patterns (dot, underscore)
      IF username LIKE '%.%' THEN
        first_name := INITCAP(SPLIT_PART(username, '.', 1));
        last_name := INITCAP(SPLIT_PART(username, '.', 2));
        RETURN TRIM(CONCAT(first_name, ' ', last_name));
      ELSIF username LIKE '%_%' THEN
        first_name := INITCAP(SPLIT_PART(username, '_', 1));
        last_name := INITCAP(SPLIT_PART(username, '_', 2));
        RETURN TRIM(CONCAT(first_name, ' ', last_name));
      ELSE
        -- Try to extract first letter and rest as last name
        -- rmorse -> R Morse
        first_name := UPPER(LEFT(username, 1));
        last_name := INITCAP(SUBSTRING(username, 2));
        RETURN TRIM(CONCAT(first_name, ' ', last_name));
      END IF;
    END;
  END IF;

  -- Fallback to email
  RETURN user_email;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate display names on ticket creation
CREATE OR REPLACE FUNCTION set_ticket_display_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by_name IS NULL OR NEW.created_by_name = '' THEN
    NEW.created_by_name := get_user_display_name(NEW.created_by_email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_display_name
  BEFORE INSERT ON it_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_display_name();

-- Create trigger to auto-populate display names on comment creation
CREATE OR REPLACE FUNCTION set_comment_display_name()
RETURNS TRIGGER AS $$
DECLARE
  user_email_val text;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email_val
  FROM auth.users
  WHERE id = NEW.user_id;

  IF NEW.user_name IS NULL OR NEW.user_name = '' THEN
    NEW.user_name := get_user_display_name(user_email_val);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_comment_display_name
  BEFORE INSERT ON it_ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION set_comment_display_name();

-- Update existing tickets with display names
UPDATE it_support_tickets
SET created_by_name = get_user_display_name(created_by_email)
WHERE created_by_name IS NULL OR created_by_name = '';