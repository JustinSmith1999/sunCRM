import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, X, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMessage, setLockoutMessage] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const { signIn, user } = useAuth();

  const passwordRequirements = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  useEffect(() => {
    const checkPasswordChangeRequired = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('password_change_required')
          .eq('id', user.id)
          .single();

        if (profile?.password_change_required) {
          setShowPasswordChange(true);
        }
      }
    };

    checkPasswordChangeRequired();
  }, [user]);

  const checkAccountLock = async (userEmail: string): Promise<boolean> => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('locked_until, failed_login_attempts')
        .eq('email', userEmail)
        .maybeSingle();

      if (!profile) {
        return false;
      }

      if (profile.locked_until) {
        const lockUntil = new Date(profile.locked_until);
        const now = new Date();

        if (lockUntil > now) {
          const minutesRemaining = Math.ceil((lockUntil.getTime() - now.getTime()) / 60000);
          setLockoutMessage(
            `Account is locked due to too many failed login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`
          );
          setIsLocked(true);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking account lock:', error);
      return false;
    }
  };

  const recordFailedAttempt = async (userEmail: string) => {
    try {
      const { data, error } = await supabase.rpc('record_failed_login', {
        user_email: userEmail
      });

      if (error) {
        console.error('Error recording failed attempt:', error);
        return;
      }

      if (data?.locked) {
        setIsLocked(true);
        setLockoutMessage(
          'Account locked due to too many failed login attempts. Please try again in 30 minutes.'
        );
        setRemainingAttempts(null);
      } else if (data?.remaining_attempts !== undefined) {
        setRemainingAttempts(data.remaining_attempts);
        setError(`Invalid credentials. ${data.remaining_attempts} attempt${data.remaining_attempts !== 1 ? 's' : ''} remaining before account lockout.`);
      }
    } catch (error) {
      console.error('Error recording failed attempt:', error);
    }
  };

  const resetFailedAttempts = async (userEmail: string) => {
    try {
      await supabase.rpc('reset_failed_login_attempts', {
        user_email: userEmail
      });
    } catch (error) {
      console.error('Error resetting failed attempts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLockoutMessage('');
    setRemainingAttempts(null);

    const isAccountLocked = await checkAccountLock(email);

    if (isAccountLocked) {
      setLoading(false);
      return;
    }

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      await recordFailedAttempt(email);
    } else {
      await resetFailedAttempts(email);
    }

    setLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!allRequirementsMet) {
      setPasswordError('Please meet all password requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      setPasswordError(updateError.message);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        password_change_required: false,
        last_password_change: new Date().toISOString()
      })
      .eq('id', user?.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    setLoading(false);
    setShowPasswordChange(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-10 lg:p-12 w-full max-w-md border border-slate-200/50">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="https://husbupeealwuxyopfwwb.supabase.co/storage/v1/object/public/logos/03018223-ac24-400d-acbc-2c1480a05441.webp"
            alt="Logo"
            className="w-36 h-36 sm:w-44 sm:h-44 object-contain mx-auto drop-shadow-xl"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-6 mb-2">Welcome Back</h1>
          <p className="text-slate-500">Sign in to access your dashboard</p>
        </div>

        {/* Lockout Message */}
        {isLocked && lockoutMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-orange-50/50 border border-orange-300 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Shield className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-900 text-sm font-semibold mb-1">Account Locked</p>
              <p className="text-orange-800 text-sm leading-relaxed">{lockoutMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !isLocked && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 text-sm leading-relaxed">{error}</p>
              {remainingAttempts !== null && remainingAttempts > 0 && (
                <div className="mt-2 pt-2 border-t border-red-200">
                  <p className="text-red-700 text-xs font-medium">
                    Warning: {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining before 30-minute lockout
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="group">
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 text-slate-900 placeholder:text-slate-400 bg-white/50"
              placeholder="you@company.com"
            />
          </div>

          <div className="group">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 text-slate-900 placeholder:text-slate-400 bg-white/50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-300 disabled:to-slate-300 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:shadow-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : isLocked ? (
              'Account Locked'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer decoration */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-center text-xs text-slate-400">
            Secure authentication powered by advanced encryption
          </p>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-200 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Set Your Password</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              For security, please create a new password for your account.
            </p>

            {passwordError && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm leading-relaxed">{passwordError}</p>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label htmlFor="new-password" className="block text-sm font-semibold text-slate-700 mb-2">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 text-slate-900 placeholder:text-slate-400"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-5 space-y-2.5 border border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-3">Password Requirements:</p>
                <RequirementItem met={passwordRequirements.minLength} text="At least 8 characters" />
                <RequirementItem met={passwordRequirements.hasUppercase} text="One uppercase letter" />
                <RequirementItem met={passwordRequirements.hasLowercase} text="One lowercase letter" />
                <RequirementItem met={passwordRequirements.hasNumber} text="One number" />
                <RequirementItem met={passwordRequirements.hasSpecial} text="One special character" />
              </div>

              <button
                type="submit"
                disabled={loading || !allRequirementsMet}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-300 disabled:to-slate-300 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:shadow-none"
              >
                {loading ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
        met
          ? 'bg-green-100 border-2 border-green-500'
          : 'bg-slate-100 border-2 border-slate-300'
      }`}>
        {met ? (
          <Check className="w-3 h-3 text-green-600" />
        ) : (
          <X className="w-3 h-3 text-slate-400" />
        )}
      </div>
      <span className={`transition-colors duration-200 ${met ? 'text-green-700 font-medium' : 'text-slate-600'}`}>
        {text}
      </span>
    </div>
  );
}