# Account Lockout Security Feature

## Overview
Your application now includes robust account lockout protection to prevent brute force password attacks. After 3 failed login attempts, accounts are automatically locked for 30 minutes.

## How It Works

### For Users

**Failed Login Attempts**
- Users have 3 attempts to enter the correct password
- After each failed attempt, they see how many attempts remain
- Example: "Invalid credentials. 2 attempts remaining before account lockout."

**Account Lockout**
- After 3 failed attempts, the account is locked for 30 minutes
- A clear message displays: "Account locked due to too many failed login attempts. Please try again in X minutes."
- The login button is disabled and shows "Account Locked"
- Users cannot attempt to log in until the lockout period expires

**Automatic Unlock**
- Lockouts automatically expire after 30 minutes
- Users can then attempt to log in again with a fresh 3 attempts
- Successful login immediately resets all failed attempt counters

### For Administrators

**View Locked Accounts**
In the **Admin** > **User Management** section, locked accounts display:
- A red lock icon with warning banner
- Number of failed attempts
- Lockout expiration time
- Example: "3 failed attempts - Locked until 2:30 PM"

**Manual Unlock**
Admins can unlock accounts before the 30-minute period expires:
1. Go to **Admin** > **User Management**
2. Find the locked user account (marked with lock icon)
3. Click the **Unlock** button (orange unlock icon)
4. Confirm the unlock action
5. Account is immediately unlocked and counters reset

## Security Benefits

1. **Prevents Brute Force Attacks**
   - Limits attackers to only 3 password guesses
   - 30-minute delay makes automated attacks impractical

2. **Protects User Accounts**
   - Alerts users to potential unauthorized access attempts
   - Gives clear feedback about security status

3. **Automatic Recovery**
   - Temporary lockouts prevent permanent account lockout
   - No user intervention required for legitimate users

4. **Admin Control**
   - Admins can help users who forgot their password
   - Quick unlock for legitimate lockout situations

## Technical Details

### Database Fields
Three new fields track lockout status in `user_profiles`:
- `failed_login_attempts` - Counter (0-3)
- `locked_until` - Timestamp when lockout expires
- `last_failed_attempt` - Timestamp of most recent failed login

### Database Functions
Four PostgreSQL functions handle lockout logic:
- `is_account_locked(email)` - Check if account is currently locked
- `record_failed_login(email)` - Increment counter and lock if needed
- `reset_failed_login_attempts(email)` - Reset on successful login
- `unlock_user_account(email)` - Admin manual unlock

### Login Flow
1. User enters credentials
2. System checks if account is already locked
3. If locked, show lockout message and disable login
4. If not locked, attempt authentication
5. On failure: record failed attempt, show remaining attempts
6. On 3rd failure: lock account for 30 minutes
7. On success: reset all counters and allow access

## Configuration

The lockout settings are hardcoded for security:
- **Failed Attempts Threshold**: 3 attempts
- **Lockout Duration**: 30 minutes
- **Auto-unlock**: Yes, after lockout duration expires

These settings provide strong security without being overly restrictive for legitimate users.

## Best Practices

### For Users
- Use a password manager to avoid failed attempts
- Contact your administrator if you're locked out
- Don't repeatedly try to guess passwords

### For Administrators
- Review locked accounts regularly for suspicious activity
- Verify user identity before unlocking accounts
- Consider additional security measures for repeatedly locked accounts
- Educate users about the lockout policy

## Monitoring

Administrators can monitor security by:
- Checking User Management for locked accounts
- Reviewing failed login attempts in user profiles
- Looking for patterns of repeated lockouts (potential attacks)

## Support

If a user is locked out:
1. Verify their identity through another channel
2. Go to Admin > User Management
3. Click the unlock button next to their account
4. Help them reset their password if they've forgotten it
5. Advise them to use a password manager

## Security Notes

- Lockouts are per-account, not per IP address
- Failed attempts are recorded immediately
- Lockout time is calculated server-side (can't be manipulated)
- All lockout actions are logged for audit purposes
- Database functions run with SECURITY DEFINER for reliability
