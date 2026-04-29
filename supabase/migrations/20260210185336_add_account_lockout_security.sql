/*
  # Account Lockout Security Feature

  1. Changes to user_profiles table
    - Add `failed_login_attempts` - Counter for consecutive failed login attempts
    - Add `locked_until` - Timestamp when account will be unlocked
    - Add `last_failed_attempt` - Timestamp of last failed login
    
  2. Security
    - After 3 failed attempts, account is locked for 30 minutes
    - Failed attempts reset on successful login
    - Lockout automatically expires after timeout period
    
  3. Purpose
    - Prevent brute force password attacks
    - Provide security without permanent lockouts
    - Track suspicious login activity
*/

-- Add lockout tracking fields to user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'failed_login_attempts'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN failed_login_attempts integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'locked_until'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN locked_until timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'last_failed_attempt'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_failed_attempt timestamptz;
  END IF;
END $$;

-- Create index for faster lockout checks
CREATE INDEX IF NOT EXISTS idx_user_profiles_locked_until ON user_profiles(locked_until) WHERE locked_until IS NOT NULL;

-- Create function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(user_email text)
RETURNS boolean AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT locked_until INTO profile_record
  FROM user_profiles
  WHERE email = user_email;
  
  IF profile_record IS NULL THEN
    RETURN false;
  END IF;
  
  IF profile_record.locked_until IS NULL THEN
    RETURN false;
  END IF;
  
  IF profile_record.locked_until > NOW() THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record failed login attempt
CREATE OR REPLACE FUNCTION record_failed_login(user_email text)
RETURNS json AS $$
DECLARE
  current_attempts integer;
  lockout_time timestamptz;
  result json;
BEGIN
  -- Get current failed attempts
  SELECT failed_login_attempts INTO current_attempts
  FROM user_profiles
  WHERE email = user_email;
  
  IF current_attempts IS NULL THEN
    current_attempts := 0;
  END IF;
  
  -- Increment failed attempts
  current_attempts := current_attempts + 1;
  
  -- Lock account after 3 failed attempts
  IF current_attempts >= 3 THEN
    lockout_time := NOW() + INTERVAL '30 minutes';
    
    UPDATE user_profiles
    SET 
      failed_login_attempts = current_attempts,
      locked_until = lockout_time,
      last_failed_attempt = NOW()
    WHERE email = user_email;
    
    result := json_build_object(
      'locked', true,
      'attempts', current_attempts,
      'locked_until', lockout_time
    );
  ELSE
    UPDATE user_profiles
    SET 
      failed_login_attempts = current_attempts,
      last_failed_attempt = NOW()
    WHERE email = user_email;
    
    result := json_build_object(
      'locked', false,
      'attempts', current_attempts,
      'remaining_attempts', 3 - current_attempts
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset failed attempts on successful login
CREATE OR REPLACE FUNCTION reset_failed_login_attempts(user_email text)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET 
    failed_login_attempts = 0,
    locked_until = NULL,
    last_failed_attempt = NULL
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to manually unlock account (for admins)
CREATE OR REPLACE FUNCTION unlock_user_account(user_email text)
RETURNS boolean AS $$
BEGIN
  UPDATE user_profiles
  SET 
    failed_login_attempts = 0,
    locked_until = NULL,
    last_failed_attempt = NULL
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
