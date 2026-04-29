import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, DollarSign, Users, Target, BarChart3, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../../../lib/supabase';
import { DateRangeFilter, DateRangeKey, getDateRange, isInDateRange } from '../../shared/DateRangeFilter';

const STAGE_COLORS: Record<string, string> = {
  'Inquiry': '#3b82f6',
  'First Sit': '#f59e0b',
  'Proposal': '#f97316',
  'Closed Won': '#10b981',
  'Closed Lost': '#ef4444',
  'Other': '#6b7280',
};

const STAGE_ORDER = ['Inquiry', 'First Sit', 'Proposal', 'Closed Won', 'Closed Lost', 'Other'];

function classifyStage(stageName: string): string {
  const s = (stageName || '').toLowerCase();
  if (s.includes('won')) return 'Closed Won';
  if (s.includes('lost')) return 'Closed Lost';
  if (
    s.includes('inquiry') || s.includes('initial contact') || s.includes('call only') ||
    s.includes('future contact')
  ) return 'Inquiry';
  if (s === 'service') return 'Inquiry';
  if (s.includes('service')) return 'Inquiry';
  if (
    s.includes('first sit') || s.includes('site evaluation') || s.includes('client discovery')
  ) return 'First Sit';
  if (
    s.includes('proposal') || s.includes('quote') || s.includes('contract') || s.includes('presentation')
  ) return 'Proposal';
  return 'Other';
}

export function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [allOpportunities, setAllOpportunities] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeKey>('ALL');
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);

  useEffect(() => {
    loadData();
    loadMonthlyRevenue();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const PAGE_SIZE = 1000;
      let allOpps: any[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from('opportunities')
          .select('Id, Name, Amount, StageName, IsClosed, IsWon, CloseDate, CreatedDate, AccountId, OwnerId')
          .range(offset, offset + PAGE_SIZE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allOpps = allOpps.concat(data);
        if (data.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }
      setAllOpportunities(allOpps);
    } catch (error) {
      console.error('Error loading executive dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyRevenue = async () => {
    try {
      setRevenueLoading(true);
      const now = new Date();
      const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        return { start, end, label };
      });

      const results = await Promise.all(
        months.map(async ({ start, end, label }) => {
          const { data, error } = await supabase
            .from('opportunities')
            .select('Amount, StageName')
            .gte('CloseDate', start)
            .lt('CloseDate', end);
          if (error) {
            console.error(`Error loading month ${label}:`, error);
            return { month: label, revenue: 0 };
          }
          const revenue = (data || []).reduce((sum, o) => {
            if (classifyStage(o.StageName || '') === 'Closed Won') {
              return sum + (parseFloat(o.Amount) || 0);
            }
            return sum;
          }, 0);
          return { month: label, revenue };
        })
      );

      setMonthlyRevenue(results);
    } catch (error) {
      console.error('Error loading monthly revenue:', error);
    } finally {
      setRevenueLoading(false);
    }
  };

  const opportunities = useMemo(() => {
    const range = getDateRange(dateRange);
    if (!range.start && !range.end) return allOpportunities;
    return allOpportunities.filter(o => isInDateRange(o.CloseDate || o.CreatedDate, range));
  }, [allOpportunities, dateRange]);

  const stats = useMemo(() => {
    const closedWon = opportunities.filter(o => classifyStage(o.StageName || '') === 'Closed Won');
    const ytdRevenue = closedWon.reduce((sum, o) => sum + (parseFloat(o.Amount || '0') || 0), 0);
    const activeDeals = opportunities.filter(o => classifyStage(o.StageName || '') !== 'Closed Won' && classifyStage(o.StageName || '') !== 'Closed Lost').length;
    const pipelineValue = opportunities
      .filter(o => classifyStage(o.StageName || '') !== 'Closed Won' && classifyStage(o.StageName || '') !== 'Closed Lost')
      .reduce((sum, o) => sum + (parseFloat(o.Amount || '0') || 0), 0);
    const closedDeals = opportunities.filter(o => classifyStage(o.StageName || '') === 'Closed Won' || classifyStage(o.StageName || '') === 'Closed Lost');
    const winRate = closedDeals.length > 0 ? (closedWon.length / closedDeals.length) * 100 : 0;
    const avgDealSize = closedWon.length > 0 ? ytdRevenue / closedWon.length : 0;
    return { ytdRevenue, ytdGrowth: 18, activeDeals, pipelineValue, winRate, avgDealSize };
  }, [opportunities]);

  const pipelineData = useMemo(() => {
    const groups: Record<string, { count: number; value: number }> = {
      'Inquiry': { count: 0, value: 0 },
      'First Sit': { count: 0, value: 0 },
      'Proposal': { count: 0, value: 0 },
      'Closed Won': { count: 0, value: 0 },
      'Closed Lost': { count: 0, value: 0 },
      'Other': { count: 0, value: 0 },
    };
    opportunities.forEach(o => {
      const cat = classifyStage(o.StageName || '');
      groups[cat].count += 1;
      groups[cat].value += parseFloat(o.Amount || '0') || 0;
    });
    return STAGE_ORDER
      .map(name => ({ name, count: groups[name].count, value: groups[name].value }))
      .filter(g => g.count > 0);
  }, [opportunities]);

  const topOpportunities = useMemo(() => {
    return opportunities
      .filter(o => {
        const cat = classifyStage(o.StageName || '');
        return cat !== 'Closed Won' && cat !== 'Closed Lost';
      })
      .sort((a, b) => (parseFloat(b.Amount || '0') || 0) - (parseFloat(a.Amount || '0') || 0))
      .slice(0, 10)
      .map(o => ({
        id: o.Id,
        name: o.Name || 'Untitled',
        account: o.AccountId || 'Unknown',
        stage: o.StageName || 'Unknown',
        amount: parseFloat(o.Amount || '0') || 0,
        closeDate: o.CloseDate ? new Date(o.CloseDate).toLocaleDateString() : 'Not set'
      }));
  }, [opportunities]);

  const formatRevenueTick = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
  };

  const formatRevenueTooltip = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
  };

  const getStageColor = (stage: string) => {
    const cat = classifyStage(stage);
    if (cat === 'Closed Won') return 'bg-green-100 text-green-800';
    if (cat === 'Proposal') return 'bg-blue-100 text-blue-800';
    if (cat === 'First Sit') return 'bg-amber-100 text-amber-800';
    if (cat === 'Inquiry') return 'bg-cyan-100 text-cyan-800';
    return 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-200 rounded-lg h-24"></div>
          ))}
        </div>
        <div className="bg-slate-200 rounded-lg h-96"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Executive Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Overview of key business metrics</p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Revenue</h3>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${(stats.ytdRevenue / 1000000).toFixed(2)}M
          </p>
          <p className="text-xs text-green-600 mt-1">
            {stats.ytdGrowth > 0 ? '↑' : '↓'} {Math.abs(stats.ytdGrowth)}% vs last year
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Active Deals</h3>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.activeDeals}</p>
          <p className="text-xs text-blue-600 mt-1">
            ${(stats.pipelineValue / 1000000).toFixed(1)}M in pipeline
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Win Rate</h3>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.winRate.toFixed(0)}%</p>
          <p className="text-xs text-slate-500 mt-1">Based on closed deals</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Avg Deal Size</h3>
            <BarChart3 className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${(stats.avgDealSize / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-slate-500 mt-1">Average won deal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Monthly Revenue Trend (Last 12 Months)</h3>
          {revenueLoading ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              Loading revenue data...
            </div>
          ) : monthlyRevenue.some(d => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis
                  tickFormatter={formatRevenueTick}
                  tick={{ fontSize: 11 }}
                  width={62}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [formatRevenueTooltip(Number(value)), 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="#f59e0b" name="Closed Won Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              No revenue data available
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Pipeline by Stage</h3>
          {pipelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                  tick={{ fontSize: 11 }}
                  width={52}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#94a3b8' } }}
                />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'count') return [value.toLocaleString(), 'Opportunities'];
                    return [`$${(Number(value) / 1000).toFixed(0)}K`, 'Pipeline Value'];
                  }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="count" name="count" radius={[4, 4, 0, 0]}>
                  {pipelineData.map((entry) => (
                    <Cell key={entry.name} fill={STAGE_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              No pipeline data in selected range
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Top Opportunities</h3>
        {topOpportunities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Opportunity</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Account</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Stage</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-slate-600">Amount</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-slate-600">Close Date</th>
                </tr>
              </thead>
              <tbody>
                {topOpportunities.map((opp) => (
                  <tr key={opp.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-3 text-sm text-slate-900 font-medium">{opp.name}</td>
                    <td className="py-3 px-3 text-sm text-slate-600">{opp.account}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-1 rounded text-xs ${getStageColor(opp.stage)}`}>
                        {opp.stage}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-sm text-slate-900 text-right font-medium">
                      ${opp.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-sm text-slate-600 text-right">{opp.closeDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            No opportunities in selected range
          </div>
        )}
      </div>
    </div>
  );
}
