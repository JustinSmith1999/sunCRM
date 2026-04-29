import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database types (these would normally be generated)
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          settings: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          type: string;
          industry: string | null;
          website: string | null;
          phone: string | null;
          annual_revenue: number | null;
          employee_count: number | null;
          owner_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
      };
      opportunities: {
        Row: {
          id: string;
          organization_id: string;
          account_id: string;
          name: string;
          amount: number | null;
          stage: 'prospecting' | 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
          probability: number;
          close_date: string | null;
          owner_id: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
      };
      activities: {
        Row: {
          id: string;
          organization_id: string;
          type: 'task' | 'call' | 'email' | 'meeting' | 'note';
          subject: string;
          description: string | null;
          status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
          priority: 'low' | 'normal' | 'high' | 'urgent';
          due_date: string | null;
          assigned_to: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};