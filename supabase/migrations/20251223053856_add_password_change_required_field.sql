/*
  # Add Password Change Required Field
  
  1. Changes to user_profiles
    - Add `password_change_required` (boolean) - Forces password change on first login
    - Add `temporary_password` (text) - Stores initial password hint (not the actual password)
    - Add `last_password_change` (timestamptz) - Tracks when password was last changed
  
  2. Purpose
    - Enable first-time login password setup
    - Track password changes for security
*/

-- Add password management fields to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' AND column_name = 'password_change_required') THEN
    ALTER TABLE user_profiles ADD COLUMN password_change_required boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' AND column_name = 'temporary_password') THEN
    ALTER TABLE user_profiles ADD COLUMN temporary_password text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' AND column_name = 'last_password_change') THEN
    ALTER TABLE user_profiles ADD COLUMN last_password_change timestamptz;
  END IF;
END $$;

-- Update existing users to require password change
UPDATE user_profiles 
SET password_change_required = true
WHERE password_change_required IS NULL;
