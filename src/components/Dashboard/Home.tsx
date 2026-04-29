import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, AlertCircle, Building2, DollarSign,
  Users, MapPin, FileText, Clock, ArrowUp, ArrowRight,
  Zap, CheckCircle, XCircle, BarChart2, Activity
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface HomeProps {
  onViewChange?: (view: string) => void;
}

// Brand colors
const BRAND = { sky: '#00AEEF', navy: '#1B3A6B', gold: '#F5C000' };

const fmt$ = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n.toFixed(0)}`;

const fmtFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const fmtRelative = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const classifyStage = (s: string) => {
  const l = (s || '').toLowerCase();
  if (l.includes('won')) return 'Won';
  if (l.includes('lost')) return 'Lost';
  if (l.includes('inquiry') || l.includes('initial contact') || l.includes('call only') || l.includes('future contact') || l.includes('service')) return 'Inquiry';
  if (l.includes('first sit') || l.includes('site evaluation') || l.includes('client discovery')) return 'First Sit';
  if (l.includes('proposal') || l.includes('quote') || l.includes('contract') || l.includes('presentation') || l.includes('engineering')) return 'Proposal';
  return 'Other';
};

export function Home({ onViewChange }: HomeProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);

  // KPIs
  const [kpis, setKpis] = useState({
    pipeline: 0, pipelineCount: 0,
    wonMonth: 0, wonMonthCount: 0,
    wonMTDvsPrev: 0,
    openCases: 0, openCasesUrgent: 0,
    accounts: 0,
    leadsMonth: 0, leadsWeek: 0,
    avgDeal: 0, conversionRate: 0,
    openPermits: 0, totalQuotes: 0,
  });

  // Charts
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number; deals: number }[]>([]);
  const [stageBreakdown, setStageBreakdown] = useState<{ stage: string; count: number; value: number }[]>([]);

  // Tables
  const [recentOpps, setRecentOpps] = useState<any[]>([]);
  const [topOpps, setTopOpps] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [urgentCases, setUrgentCases] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.id) load();
  }, [profile?.id]);

  const load = async () => {
    setLoading(true);
    try {
      await Promise.all([loadKPIs(), loadCharts(), loadTables()]);
    } finally {
      setLoading(false);
    }
  };

  const loadKPIs = async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

    const [oppsR, casesR, acctR, leadsMonthR, leadsWeekR, quotesR, permitsR] = await Promise.all([
      supabase.from('opportunities').select('Amount, StageName, CloseDate'),
      supabase.from('cases').select('Id, Status, Priority').neq('Status', 'Closed'),
      supabase.from('accounts').select('Id', { count: 'exact', head: true }),
      supabase.from('leads').select('Id', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('leads').select('Id', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('salesforce_quotes').select('Id', { count: 'exact', head: true }),
      supabase.from('permits').select('Id', { count: 'exact', head: true }).is('Permit_Approved__c', null),
    ]);

    const opps = oppsR.data || [];

    const pipeline = opps
      .filter(o => { const c = classifyStage(o.StageName); return c !== 'Won' && c !== 'Lost'; })
      .reduce((s, o) => s + (parseFloat(o.Amount || '0') || 0), 0);
    const pipelineCount = opps.filter(o => { const c = classifyStage(o.StageName); return c !== 'Won' && c !== 'Lost'; }).length;

    const wonMonth = opps.filter(o => classifyStage(o.StageName) === 'Won' && (o.CloseDate || '') >= monthStart);
    const wonPrev = opps.filter(o => classifyStage(o.StageName) === 'Won' && (o.CloseDate || '') >= prevMonthStart && (o.CloseDate || '') < monthStart);
    const wonMonthVal = wonMonth.reduce((s, o) => s + (parseFloat(o.Amount || '0') || 0), 0);
    const wonPrevVal = wonPrev.reduce((s, o) => s + (parseFloat(o.Amount || '0') || 0), 0);
    const wonMTDvsPrev = wonPrevVal > 0 ? ((wonMonthVal - wonPrevVal) / wonPrevVal) * 100 : 0;

    const closed = opps.filter(o => { const c = classifyStage(o.StageName); return c === 'Won' || c === 'Lost'; });
    const wonAll = closed.filter(o => classifyStage(o.StageName) === 'Won');
    const conv = closed.length > 0 ? (wonAll.length / closed.length) * 100 : 0;
    const avgDeal = wonAll.length > 0 ? wonAll.reduce((s, o) => s + (parseFloat(o.Amount || '0') || 0), 0) / wonAll.length : 0;

    const cases = casesR.data || [];
    const urgentCaseCount = cases.filter(c => c.Priority === 'High' || c.Priority === 'Critical').length;

    setKpis({
      pipeline, pipelineCount,
      wonMonth: wonMonthVal, wonMonthCount: wonMonth.length,
      wonMTDvsPrev,
      openCases: cases.length, openCasesUrgent: urgentCaseCount,
      accounts: acctR.count || 0,
      leadsMonth: leadsMonthR.count || 0, leadsWeek: leadsWeekR.count || 0,
      avgDeal, conversionRate: conv,
      openPermits: permitsR.count || 0,
      totalQuotes: quotesR.count || 0,
    });

    setUrgentCases(cases.filter(c => c.Priority === 'High' || c.Priority === 'Critical').slice(0, 5));
  };

  const loadCharts = async () => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
      return { label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), start, end };
    });

    const [stageR, ...monthRs] = await Promise.all([
      supabase.from('opportunities').select('StageName, Amount'),
      ...months.map(m =>
        supabase.from('opportunities').select('Amount, StageName').gte('CloseDate', m.start).lt('CloseDate', m.end)
      ),
    ]);

    // Stage breakdown (active only)
    const stageCounts: Record<string, { count: number; value: number }> = {};
    (stageR.data || []).forEach((o: any) => {
      const cat = classifyStage(o.StageName);
      if (cat === 'Won' || cat === 'Lost') return;
      if (!stageCounts[cat]) stageCounts[cat] = { count: 0, value: 0 };
      stageCounts[cat].count++;
      stageCounts[cat].value += parseFloat(o.Amount || '0') || 0;
    });
    setStageBreakdown(
      Object.entries(stageCounts)
        .map(([stage, d]) => ({ stage, ...d }))
        .sort((a, b) => b.value - a.value)
    );

    // Monthly won revenue
    setMonthlyRevenue(months.map((m, i) => {
      const data = monthRs[i].data || [];
      const won = data.filter((o: any) => classifyStage(o.StageName) === 'Won');
      return {
        month: m.label,
        revenue: won.reduce((s: number, o: any) => s + (parseFloat(o.Amount) || 0), 0),
        deals: won.length,
      };
    }));
  };

  const loadTables = async () => {
    const [recentR, topR, leadsR] = await Promise.all([
      supabase.from('opportunities').select('Id, Name, Amount, StageName, LastModifiedDate, CloseDate')
        .order('LastModifiedDate', { ascending: false }).limit(8),
      supabase.from('opportunities').select('Id, Name, Amount, StageName, CloseDate')
        .not('StageName', 'ilike', '%won%')
        .not('StageName', 'ilike', '%lost%')
        .order('Amount', { ascending: false, nullsFirst: false }).limit(8),
      supabase.from('leads').select('id, FirstName, LastName, Company, Status, LeadSource, created_at')
        .order('created_at', { ascending: false }).limit(8),
    ]);
    setRecentOpps(recentR.data || []);
    setTopOpps(topR.data || []);
    setRecentLeads(leadsR.data || []);
  };

  const stageDotColor: Record<string, string> = {
    Inquiry: BRAND.sky,
    'First Sit': '#64748b',
    Proposal: BRAND.gold,
    Won: '#22c55e',
    Lost: '#ef4444',
    Other: '#94a3b8',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-sky border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const prevMonthRevenue = monthlyRevenue.length >= 2 ? monthlyRevenue[monthlyRevenue.length - 2]?.revenue : 0;
  const thisMonthRevenue = monthlyRevenue.length >= 1 ? monthlyRevenue[monthlyRevenue.length - 1]?.revenue : 0;
  const revTrend = prevMonthRevenue > 0 ? ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();
  const firstName = (profile?.full_name || '').split(' ')[0] || '';

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page header — editorial hero with serif greeting */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] font-bold tracking-eyebrow text-sky-dark uppercase">SUNation Energy &middot; Executive</div>
          <h1 className="font-display text-[34px] leading-[40px] font-bold text-ink mt-1 tracking-tighter">
            {greeting}{firstName ? `, ${firstName}` : ''}.
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => onViewChange?.('reports')}
          className="flex items-center gap-2 text-sm font-semibold px-4 h-10 rounded-full border border-line-strong text-ink hover:bg-sand-pale transition-colors duration-fast ease-smooth press-scale"
        >
          <BarChart2 className="w-4 h-4" /> View Reports
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pipeline */}
        <button onClick={() => onViewChange?.('deals')} className="text-left bg-white rounded-lg border border-line p-4 hover:shadow-card hover:-translate-y-0.5 transition-all duration-base ease-smooth press-scale">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle">Active Pipeline</span>
            <DollarSign className="w-4 h-4 text-ink-300" />
          </div>
          <div className="font-display text-[28px] leading-[32px] font-bold text-ink tabular mt-2">{fmt$(kpis.pipeline)}</div>
          <div className="text-xs text-ink-muted mt-1">{kpis.pipelineCount.toLocaleString()} opportunities</div>
          <div className="mt-3 h-1 bg-ink-50 rounded-full overflow-hidden">
            <div className="h-1 bg-sky rounded-full" style={{ width: '65%' }} />
          </div>
        </button>

        {/* Won MTD */}
        <button onClick={() => onViewChange?.('deals')} className="text-left bg-white rounded-lg border border-line p-4 hover:shadow-card hover:-translate-y-0.5 transition-all duration-base ease-smooth press-scale">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle">Won This Month</span>
            <CheckCircle className="w-4 h-4 text-ink-300" />
          </div>
          <div className="font-display text-[28px] leading-[32px] font-bold text-ink tabular mt-2">{fmt$(kpis.wonMonth)}</div>
          <div className="text-xs text-ink-muted mt-1 flex items-center gap-2 flex-wrap">
            <span>{kpis.wonMonthCount} deals closed</span>
            {kpis.wonMTDvsPrev !== 0 && (
              <span className={`inline-flex items-center gap-0.5 font-medium ${kpis.wonMTDvsPrev >= 0 ? 'text-court' : 'text-danger'}`}>
                {kpis.wonMTDvsPrev >= 0 ? <ArrowUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(kpis.wonMTDvsPrev).toFixed(0)}% vs last mo
              </span>
            )}
          </div>
          <div className="mt-3 h-1 bg-ink-50 rounded-full overflow-hidden">
            <div className="h-1 bg-court rounded-full" style={{ width: `${Math.min((kpis.wonMonthCount / 50) * 100, 100)}%` }} />
          </div>
        </button>

        {/* Open Cases */}
        <button
          onClick={() => onViewChange?.('cases')}
          className={`text-left bg-white rounded-lg border p-4 hover:shadow-card hover:-translate-y-0.5 transition-all duration-base ease-smooth press-scale ${kpis.openCasesUrgent > 0 ? 'border-danger/30' : 'border-line'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle">Open Cases</span>
            <AlertCircle className={`w-4 h-4 ${kpis.openCasesUrgent > 0 ? 'text-danger' : 'text-ink-300'}`} />
          </div>
          <div className="font-display text-[28px] leading-[32px] font-bold text-ink tabular mt-2">{kpis.openCases.toLocaleString()}</div>
          <div className="text-xs mt-1">
            {kpis.openCasesUrgent > 0 ? (
              <span className="font-medium text-danger">{kpis.openCasesUrgent} high priority</span>
            ) : (
              <span className="text-ink-muted">No high-priority cases</span>
            )}
          </div>
          <div className="mt-3 h-1 bg-ink-50 rounded-full overflow-hidden">
            <div className="h-1 bg-danger rounded-full" style={{ width: `${Math.min((kpis.openCasesUrgent / Math.max(kpis.openCases, 1)) * 100, 100)}%` }} />
          </div>
        </button>

        {/* Accounts */}
        <button onClick={() => onViewChange?.('accounts')} className="text-left bg-white rounded-lg border border-line p-4 hover:shadow-card hover:-translate-y-0.5 transition-all duration-base ease-smooth press-scale">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle">Accounts</span>
            <Building2 className="w-4 h-4 text-ink-300" />
          </div>
          <div className="font-display text-[28px] leading-[32px] font-bold text-ink tabular mt-2">{kpis.accounts.toLocaleString()}</div>
          <div className="text-xs text-ink-muted mt-1">{kpis.avgDeal > 0 ? `Avg deal ${fmt$(kpis.avgDeal)}` : 'Total customer base'}</div>
          <div className="mt-3 h-1 bg-ink-50 rounded-full overflow-hidden">
            <div className="h-1 bg-ink rounded-full" style={{ width: '80%' }} />
          </div>
        </button>
      </div>

      {/* ── Secondary Metrics Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 cursor-pointer hover:border-sky-200 transition-colors" onClick={() => onViewChange?.('leads')}>
          <div className="text-xs text-gray-400 mb-1">Leads This Month</div>
          <div className="text-lg font-bold text-gray-900">{kpis.leadsMonth.toLocaleString()}</div>
          <div className="text-xs text-gray-400">{kpis.leadsWeek} this week</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 cursor-pointer hover:border-sky-200 transition-colors" onClick={() => onViewChange?.('deals')}>
          <div className="text-xs text-gray-400 mb-1">Conversion Rate</div>
          <div className="text-lg font-bold text-gray-900">{kpis.conversionRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-400">Won / (Won + Lost)</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 cursor-pointer hover:border-sky-200 transition-colors" onClick={() => onViewChange?.('permit-management')}>
          <div className="text-xs text-gray-400 mb-1">Open Permits</div>
          <div className="text-lg font-bold text-gray-900">{kpis.openPermits.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Awaiting approval</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 cursor-pointer hover:border-sky-200 transition-colors" onClick={() => onViewChange?.('quotes')}>
          <div className="text-xs text-gray-400 mb-1">Total Quotes</div>
          <div className="text-lg font-bold text-gray-900">{kpis.totalQuotes.toLocaleString()}</div>
          <div className="text-xs text-gray-400">In system</div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend — spans 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">Monthly Revenue (Won Deals)</div>
              <div className="text-xs text-gray-400 mt-0.5">Last 12 months</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">{fmt$(thisMonthRevenue)}</div>
              {revTrend !== 0 && (
                <div className={`text-xs font-medium flex items-center gap-0.5 justify-end ${revTrend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {revTrend >= 0 ? <ArrowUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(revTrend).toFixed(0)}% vs prev month
                </div>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyRevenue} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND.sky} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={BRAND.sky} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt$} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                formatter={(v: number) => [fmtFull(v), 'Revenue']}
                contentStyle={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 8 }}
              />
              <Area type="monotone" dataKey="revenue" stroke={BRAND.sky} strokeWidth={2} fill="url(#rev)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stage breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-sm font-semibold text-gray-900 mb-1">Pipeline by Stage</div>
          <div className="text-xs text-gray-400 mb-4">Active opportunities</div>
          {stageBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-36 text-gray-300 text-sm">No data</div>
          ) : (
            <div className="space-y-3">
              {stageBreakdown.map(s => {
                const maxVal = Math.max(...stageBreakdown.map(x => x.value), 1);
                const pct = (s.value / maxVal) * 100;
                return (
                  <div key={s.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stageDotColor[s.stage] || BRAND.sky }} />
                        <span className="text-xs text-gray-600">{s.stage}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{s.count}</span>
                        <span className="text-xs font-semibold text-gray-700">{fmt$(s.value)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: stageDotColor[s.stage] || BRAND.sky }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Data Tables ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recently Modified Opportunities */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-gray-400" /> Recent Activity
            </div>
            <button onClick={() => onViewChange?.('deals')} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOpps.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-300">No recent opportunities</div>
            ) : recentOpps.map(o => {
              const cat = classifyStage(o.StageName);
              return (
                <div key={o.Id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stageDotColor[cat] || '#94a3b8' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{o.Name || '—'}</div>
                    <div className="text-xs text-gray-400 truncate">{o.StageName}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-gray-800">{o.Amount ? fmt$(parseFloat(o.Amount)) : '—'}</div>
                    <div className="text-xs text-gray-400">{o.LastModifiedDate ? fmtRelative(o.LastModifiedDate) : '—'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Open Opportunities */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-gray-400" /> Top Open Opportunities
            </div>
            <button onClick={() => onViewChange?.('deals')} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {topOpps.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-300">No open opportunities</div>
            ) : topOpps.map((o, i) => {
              const cat = classifyStage(o.StageName);
              return (
                <div key={o.Id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: BRAND.navy }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{o.Name || '—'}</div>
                    <div className="text-xs text-gray-400 truncate">{o.StageName}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold" style={{ color: BRAND.navy }}>{o.Amount ? fmt$(parseFloat(o.Amount)) : '—'}</div>
                    {o.CloseDate && <div className="text-xs text-gray-400">Close {o.CloseDate}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Leads + Cases ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Leads */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-gray-400" /> Recent Leads
            </div>
            <button onClick={() => onViewChange?.('leads')} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentLeads.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-300">No recent leads</div>
            ) : recentLeads.map(l => (
              <div key={l.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: BRAND.sky }}>
                  {((l.FirstName?.[0] || '') + (l.LastName?.[0] || '')).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {[l.FirstName, l.LastName].filter(Boolean).join(' ') || '—'}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{l.Company || l.LeadSource || '—'}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{l.Status || 'New'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{l.created_at ? fmtRelative(l.created_at) : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open Cases Summary */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-gray-400" /> Case Summary
            </div>
            <button onClick={() => onViewChange?.('cases')} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-lg font-bold text-gray-900">{kpis.openCases.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Total Open</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50">
                <div className="text-lg font-bold text-red-600">{kpis.openCasesUrgent}</div>
                <div className="text-xs text-red-400">High Priority</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-lg font-bold text-gray-900">{Math.max(0, kpis.openCases - kpis.openCasesUrgent)}</div>
                <div className="text-xs text-gray-400">Normal</div>
              </div>
            </div>

            {urgentCases.length > 0 ? (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">High Priority</div>
                <div className="space-y-1.5">
                  {urgentCases.map(c => (
                    <div key={c.Id} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <span className="text-gray-700 truncate flex-1">{c.Id}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 flex-shrink-0">{c.Priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-700">No high-priority cases open</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
