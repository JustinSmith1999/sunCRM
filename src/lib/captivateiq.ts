import { supabase } from './supabase';

export interface CaptivateIQMetric {
  id: string;
  metric_type: 'revenue' | 'pipeline' | 'commission' | 'quota_attainment';
  value: number;
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all_time';
  period_start: string;
  period_end: string;
  rep_id?: string;
  rep_name?: string;
  rep_email?: string;
  team_name?: string;
  metadata: Record<string, any>;
  synced_at: string;
  created_at: string;
}

export interface CaptivateIQCommission {
  id: string;
  captivateiq_id?: string;
  rep_name: string;
  rep_email: string;
  rep_id?: string;
  period_name: string;
  period_start: string;
  period_end: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'disputed';
  plan_name?: string;
  quota_amount: number;
  quota_attainment: number;
  total_revenue: number;
  deals_closed: number;
  metadata: Record<string, any>;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface CaptivateIQConfig {
  id: string;
  api_key?: string;
  base_url: string;
  webhook_secret?: string;
  last_sync_at?: string;
  sync_enabled: boolean;
  sync_frequency_hours: number;
  created_at: string;
  updated_at: string;
}

export interface PeriodMetrics {
  revenue: number;
  pipeline: number;
  commission: number;
  quota_attainment: number;
  deals_closed: number;
}

export async function getConfig(): Promise<CaptivateIQConfig | null> {
  const { data, error } = await supabase
    .from('captivateiq_config')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching CaptivateIQ config:', error);
    return null;
  }

  return data;
}

export async function updateConfig(updates: Partial<CaptivateIQConfig>): Promise<boolean> {
  const { error } = await supabase
    .from('captivateiq_config')
    .update(updates)
    .eq('id', '00000000-0000-0000-0000-000000000001');

  if (error) {
    console.error('Error updating CaptivateIQ config:', error);
    return false;
  }

  return true;
}

export async function syncData(action: 'sync_metrics' | 'sync_commissions' | 'sync_all'): Promise<any> {
  try {
    const config = await getConfig();
    if (!config?.api_key) {
      throw new Error('CaptivateIQ API key not configured');
    }

    const response = await supabase.functions.invoke('captivateiq-sync', {
      body: { action }
    });

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error) {
    console.error('Error syncing CaptivateIQ data:', error);
    throw error;
  }
}

export async function getMetrics(
  period_type: 'monthly' | 'quarterly' | 'yearly' | 'all_time' = 'monthly',
  rep_email?: string
): Promise<PeriodMetrics> {
  try {
    let query = supabase
      .from('captivateiq_metrics')
      .select('*')
      .eq('period_type', period_type)
      .order('period_start', { ascending: false });

    if (rep_email) {
      query = query.eq('rep_email', rep_email);
    } else {
      query = query.is('rep_id', null);
    }

    const { data, error } = await query.limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        revenue: 0,
        pipeline: 0,
        commission: 0,
        quota_attainment: 0,
        deals_closed: 0
      };
    }

    const metrics = data.reduce((acc, metric) => {
      if (metric.metric_type === 'revenue') acc.revenue = metric.value;
      if (metric.metric_type === 'pipeline') acc.pipeline = metric.value;
      if (metric.metric_type === 'commission') acc.commission = metric.value;
      if (metric.metric_type === 'quota_attainment') acc.quota_attainment = metric.value;
      return acc;
    }, {
      revenue: 0,
      pipeline: 0,
      commission: 0,
      quota_attainment: 0,
      deals_closed: 0
    } as PeriodMetrics);

    return metrics;
  } catch (error) {
    console.error('Error fetching CaptivateIQ metrics:', error);
    return {
      revenue: 0,
      pipeline: 0,
      commission: 0,
      quota_attainment: 0,
      deals_closed: 0
    };
  }
}

export async function getCommissions(
  status?: 'pending' | 'approved' | 'paid' | 'disputed',
  rep_email?: string
): Promise<CaptivateIQCommission[]> {
  try {
    let query = supabase
      .from('captivateiq_commissions')
      .select('*')
      .order('period_start', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (rep_email) {
      query = query.eq('rep_email', rep_email);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching CaptivateIQ commissions:', error);
    return [];
  }
}

export async function getRepMetrics(rep_email: string): Promise<PeriodMetrics> {
  return getMetrics('monthly', rep_email);
}

export async function getCompanyMetrics(period_type: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): Promise<PeriodMetrics> {
  return getMetrics(period_type);
}
