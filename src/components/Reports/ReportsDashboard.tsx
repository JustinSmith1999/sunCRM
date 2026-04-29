import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Plus, Play, CreditCard as Edit, Trash2, Folder, ChevronRight, BarChart3, Search, Grid3x3, RefreshCw, Cloud, TrendingUp, TrendingDown, DollarSign, Target, Award, Calendar, Activity, Zap } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ReportViewer } from './ReportViewer';
import { ReportBuilder } from './ReportBuilder';

interface Report {
  id: string;
  name: string;
  description: string | null;
  report_type: string;
  source_object: string;
  folder: string | null;
  is_system: boolean;
  created_at: string;
  salesforce_id?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  updated_at?: string | null;
}

interface Opportunity {
  Id: string;
  Name: string;
  Amount: string | null;
  StageName: string | null;
  CloseDate: string | null;
  IsClosed: string | null;
  IsWon: string | null;
  CreatedDate: string;
}

export function ReportsDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('90');
  const { profile, user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [reportsResult, opportunitiesResult] = await Promise.all([
        supabase
          .from('reports')
          .select('*')
          .order('folder', { ascending: true, nullsFirst: false })
          .order('name', { ascending: true }),
        supabase
          .from('opportunities')
          .select('*')
          .order('CreatedDate', { ascending: false })
          .limit(1000)
      ]);

      if (reportsResult.error) throw reportsResult.error;

      setReports(reportsResult.data || []);
      setOpportunities(opportunitiesResult.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));

    const recentOpps = opportunities.filter(opp => {
      const created = new Date(opp.CreatedDate);
      return created >= cutoffDate;
    });

    const totalRevenue = recentOpps.reduce((sum, opp) => {
      return sum + (parseFloat(opp.Amount || '0') || 0);
    }, 0);

    const closedWon = recentOpps.filter(opp => opp.IsWon === 'true' || opp.IsWon === '1');
    const closedLost = recentOpps.filter(opp => opp.IsClosed === 'true' && opp.IsWon !== 'true' && opp.IsWon !== '1');
    const totalClosed = closedWon.length + closedLost.length;
    const winRate = totalClosed > 0 ? (closedWon.length / totalClosed) * 100 : 0;

    const avgDealSize = closedWon.length > 0
      ? closedWon.reduce((sum, opp) => sum + (parseFloat(opp.Amount || '0') || 0), 0) / closedWon.length
      : 0;

    const revenueByMonth: Record<string, number> = {};
    recentOpps.forEach(opp => {
      if (opp.CloseDate) {
        const month = new Date(opp.CloseDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        revenueByMonth[month] = (revenueByMonth[month] || 0) + (parseFloat(opp.Amount || '0') || 0);
      }
    });

    const revenueData = Object.entries(revenueByMonth)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6);

    const pipelineByStage: Record<string, number> = {};
    opportunities.filter(opp => opp.IsClosed !== 'true').forEach(opp => {
      const stage = opp.StageName || 'Unknown';
      pipelineByStage[stage] = (pipelineByStage[stage] || 0) + (parseFloat(opp.Amount || '0') || 0);
    });

    const pipelineData = Object.entries(pipelineByStage)
      .map(([stage, value]) => ({ stage, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const winLossData = [
      { name: 'Won', value: closedWon.length, color: '#10b981' },
      { name: 'Lost', value: closedLost.length, color: '#f43f5e' }
    ];

    return {
      totalRevenue,
      activeDeals: opportunities.filter(opp => opp.IsClosed !== 'true').length,
      winRate,
      avgDealSize,
      revenueData,
      pipelineData,
      winLossData,
      closedWon: closedWon.length,
      closedLost: closedLost.length
    };
  }, [opportunities, dateRange]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = !searchQuery ||
        report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = !selectedFolder || report.folder === selectedFolder;
      return matchesSearch && matchesFolder;
    });
  }, [reports, searchQuery, selectedFolder]);

  const folders = useMemo(() => {
    const set = new Set(reports.map(r => r.folder).filter(Boolean));
    return Array.from(set).sort();
  }, [reports]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSyncReports = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/salesforce-reports-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Sync failed');

      await loadData();
      alert('Reports synced successfully!');
    } catch (error) {
      console.error('Error syncing reports:', error);
      alert('Failed to sync reports');
    } finally {
      setSyncing(false);
    }
  };

  const handleRunReport = (report: Report) => {
    setSelectedReport(report);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  };

  if (selectedReport) {
    return (
      <ReportViewer
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    );
  }

  if (showBuilder || editingReport) {
    return (
      <ReportBuilder
        report={editingReport || undefined}
        onClose={() => {
          setShowBuilder(false);
          setEditingReport(null);
        }}
        onSave={() => {
          setShowBuilder(false);
          setEditingReport(null);
          loadData();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-sky border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="max-w-[1800px] mx-auto space-y-6">

        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="text-[11px] font-bold tracking-eyebrow uppercase text-sky-dark">Analytics</div>
            <h1 className="font-display text-[34px] leading-[40px] font-bold text-ink mt-1 tracking-tighter">Reports &amp; Insights</h1>
            <p className="text-sm text-ink-muted mt-1">Real-time business intelligence across pipeline, revenue, and operations.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-10 px-3 bg-white border border-line rounded-full text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sky"
            >
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last year</option>
            </select>
            <button
              onClick={handleSyncReports}
              disabled={syncing}
              className="h-10 px-4 bg-sky hover:bg-sky-deep text-white rounded-full transition-all duration-fast ease-smooth flex items-center gap-2 text-sm font-semibold press-scale shadow-soft disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-line p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-court" />
            </div>
            <div className="font-display text-[28px] leading-[32px] font-bold text-ink tabular mt-2">{formatCurrency(analytics.totalRevenue)}</div>
            <div className="text-xs text-ink-muted mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-court" /> Last {dateRange} days
            </div>
          </div>

          <div className="bg-white rounded-lg border border-line p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle">Active Deals</span>
              <Target className="w-4 h-4 text-sky" />
            </div>
            <div className="font-display text-[28px] leading-[32px] font-bold text-ink tabular mt-2">{analytics.activeDeals.toLocaleString()}</div>
            <div className="text-xs text-ink-muted mt-1">Open pipeline</div>
          </div>

          <div className="bg-white rounded-lg border border-line p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle">Win Rate</span>
              <Award className="w-4 h-4 text-sun-deep" />
            </div>
            <div className="font-display text-[28px] leading-[32px] font-bold text-ink tabular mt-2">{analytics.winRate.toFixed(0)}%</div>
            <div className="text-xs text-ink-muted mt-1">
              {analytics.closedWon} won &middot; {analytics.closedLost} lost
            </div>
          </div>

          <div className="bg-white rounded-lg border border-line p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle">Avg Deal Size</span>
              <Activity className="w-4 h-4 text-ink-300" />
            </div>
            <div className="font-display text-[28px] leading-[32px] font-bold text-ink tabular mt-2">{formatCurrency(analytics.avgDealSize)}</div>
            <div className="text-xs text-ink-muted mt-1">Across pipeline</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-soft p-6 border border-line">
            <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Revenue Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  itemStyle={{ color: '#10b981' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-soft p-6 border border-line">
            <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Pipeline by Stage
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="stage" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {analytics.pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-soft p-6 border border-line">
            <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Win/Loss Analysis
            </h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.winLossData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics.winLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-ink-muted">Won: {analytics.closedWon}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-sm text-ink-muted">Lost: {analytics.closedLost}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-soft p-6 border border-line">
            <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Reports Library
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-ink-300 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-sky text-ink text-sm placeholder-ink-300"
                />
              </div>
              {filteredReports.slice(0, 8).map((report) => (
                <div
                  key={report.id}
                  onClick={() => handleRunReport(report)}
                  className="flex items-center justify-between p-3 bg-slate-900/50 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink text-sm truncate group-hover:text-sky transition-colors">
                        {report.name}
                      </div>
                      {report.folder && (
                        <div className="text-xs text-ink-subtle truncate">{report.folder}</div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-300 flex-shrink-0" />
                </div>
              ))}
              {filteredReports.length > 8 && (
                <div className="text-center text-sm text-ink-subtle pt-2">
                  +{filteredReports.length - 8} more reports
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setShowBuilder(true)}
            className="px-6 py-3 bg-sky hover:bg-sky-deep text-white rounded-full font-semibold transition-all duration-fast ease-smooth flex items-center gap-2 shadow-soft press-scale"
          >
            <Plus className="w-5 h-5" />
            Create Custom Report
          </button>
          <button
            onClick={() => setSelectedFolder(null)}
            className="px-6 py-3 bg-white hover:bg-ink-50 text-ink border border-line-strong rounded-full font-semibold transition-colors duration-fast ease-smooth flex items-center gap-2 press-scale"
          >
            <Grid3x3 className="w-5 h-5" />
            View All Reports ({reports.length})
          </button>
        </div>
      </div>
    </div>
  );
}
