import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const generateDemoUUID = (seed: string) => {
  const hash = seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex.slice(0,8)}-${hex.slice(0,4)}-4${hex.slice(1,4)}-8${hex.slice(0,3)}-${hex.slice(0,12)}`.padEnd(36, '0');
};

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'sales_manager' | 'sales_rep' | 'support' | 'hr_manager' | 'operations' | 'partner' | 'readonly';
  role_id?: string;
  permissions?: Record<string, boolean>;
  organization_id: string;
  organization_name: string;
  title?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );

        const sessionPromise = supabase.auth.getSession();

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeout
        ]) as any;

        if (error) {
          console.error('Session error:', error);
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          try {
            if (event === 'SIGNED_OUT') {
              setUser(null);
              setProfile(null);
              setLoading(false);
              return;
            }

            setUser(session?.user ?? null);
            if (session?.user) {
              await loadUserProfile(session.user.id);
            } else {
              setProfile(null);
              setLoading(false);
            }
          } catch (error) {
            console.error('Auth state change error:', error);
            setLoading(false);
          }
        })();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      // First try to find by auth user ID
      let { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user_roles (
            name,
            permissions
          )
        `)
        .eq('id', userId)
        .maybeSingle();

      // If not found by ID, try to find by email
      if (!data && user?.email) {
        const { data: emailData, error: emailError } = await supabase
          .from('user_profiles')
          .select(`
            *,
            user_roles (
              name,
              permissions
            )
          `)
          .eq('email', user.email)
          .maybeSingle();

        data = emailData;
        error = emailError;
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Profile query error:', error);
      }

      if (data) {
        const roleName = data.user_roles?.name || 'sales_rep';
        const permissions = data.user_roles?.permissions || {
          view_leads: true,
          create_leads: true,
          view_own_deals: true,
          view_all_deals: true,
          manage_team_deals: true,
          view_analytics: true,
          view_inventory: true,
          all: true
        };

        setProfile({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          role: roleName,
          role_id: data.role_id,
          permissions: permissions,
          organization_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          organization_name: 'sunCRM',
          title: data.title,
          department: data.department
        });
      } else {
        // Create a default profile with full access for users not in user_profiles
        setProfile({
          id: userId,
          email: user?.email || '',
          full_name: user?.email?.split('@')[0] || 'User',
          avatar_url: null,
          role: 'sales_rep',
          permissions: {
            view_leads: true,
            create_leads: true,
            view_own_deals: true,
            view_all_deals: true,
            manage_team_deals: true,
            view_analytics: true,
            view_inventory: true,
            all: true
          },
          organization_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          organization_name: 'sunCRM'
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback to default profile with full access
      setProfile({
        id: userId,
        email: user?.email || '',
        full_name: user?.email?.split('@')[0] || 'User',
        avatar_url: null,
        role: 'sales_rep',
        permissions: {
          view_leads: true,
          create_leads: true,
          view_own_deals: true,
          view_all_deals: true,
          manage_team_deals: true,
          view_analytics: true,
          view_inventory: true,
          all: true
        },
        organization_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        organization_name: 'sunCRM'
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;

    if (profile.role === 'admin' || profile.permissions?.all) {
      return true;
    }

    return profile.permissions?.[permission] === true;
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        await loadUserProfile(data.user.id);
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      hasPermission,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
