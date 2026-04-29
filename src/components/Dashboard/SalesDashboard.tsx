import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { RefreshCw, CreditCard as Edit, Share2, TrendingUp, DollarSign, Target, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardData {
  wattageTotal: number;
  wattageGoal: number;
  monthlyCloses: any[];
  quarterlyClosedWon: any[];
  closedWonCurrentMonth: any[];
  closedWonCurrentYear: any[];
  firstSitComplete: number;
  pipelineValue: number;
  conversionRate: number;
  averageDealSize: number;
}

export function SalesDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, [profile]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('Loading opportunities from Salesforce data');

      // Query opportunities from Salesforce (opportunities table)
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('CreatedDate', { ascending: false });

      console.log('Opportunities query result:', { count: opportunities?.length, error });

      // Get user names for owner mapping
      const { data: users } = await supabase
        .from('users')
        .select('Id, Name, FirstName, LastName');

      const userMap = new Map();
      users?.forEach(user => {
        const displayName = user.Name || `${user.FirstName || ''} ${user.LastName || ''}`.trim() || 'Unknown';
        userMap.set(user.Id, displayName);
      });

      console.log('User mapping created:', userMap.size, 'users');

      if (error) {
        console.error('Error loading opportunities:', error);
        throw error;
      }

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Parse Amount values (they're stored as strings from Salesforce)
      const parseAmount = (amountStr: string | null): number => {
        if (!amountStr) return 0;
        const parsed = parseFloat(amountStr);
        return isNaN(parsed) ? 0 : parsed;
      };

      // Filter for closed won deals (IsWon = true or StageName contains "Closed Won")
      const closedWon = opportunities?.filter((opp) =>
        opp.IsWon === 'true' || opp.IsWon === true ||
        (opp.StageName && opp.StageName.toLowerCase().includes('closed won'))
      ) || [];

      const closedWonThisMonth = closedWon.filter((opp) => {
        if (!opp.CloseDate) return false;
        const closeDate = new Date(opp.CloseDate);
        return closeDate.getMonth() === currentMonth && closeDate.getFullYear() === currentYear;
      });

      const closedWonThisYear = closedWon.filter((opp) => {
        if (!opp.CloseDate) return false;
        const closeDate = new Date(opp.CloseDate);
        return closeDate.getFullYear() === currentYear;
      });

      const monthlyData = generateMonthlyCloses(closedWon, parseAmount);
      const quarterlyData = generateQuarterlyData(closedWon, currentYear, parseAmount, userMap);
      const monthlyByOwner = generateOwnerData(closedWonThisMonth, parseAmount, userMap);
      const yearlyByOwner = generateOwnerData(closedWonThisYear, parseAmount, userMap);

      const totalRevenue = closedWon.reduce((sum, opp) => sum + parseAmount(opp.Amount), 0);
      const revenueGoal = 10000000; // $10M goal

      // Query leads from Salesforce (leads table)
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*');

      console.log('Leads query result:', { count: leads?.length, error: leadsError });

      // Check for converted leads (IsConverted = true)
      const convertedLeads = leads?.filter((lead) =>
        lead.IsConverted === true || lead.IsConverted === 'true'
      ) || [];
      const conversionRate = leads && leads.length > 0 ? (convertedLeads.length / leads.length) * 100 : 0;

      const avgDealSize = closedWon.length > 0 ? totalRevenue / closedWon.length : 0;

      // Pipeline = all open opportunities (not closed won or closed lost)
      const pipelineOpps = opportunities?.filter((opp) =>
        opp.IsClosed !== 'true' && opp.IsClosed !== true
      ) || [];
      const pipelineValue = pipelineOpps.reduce((sum, opp) => sum + parseAmount(opp.Amount), 0);

      const dashboardData = {
        wattageTotal: totalRevenue,
        wattageGoal: revenueGoal,
        monthlyCloses: monthlyData,
        quarterlyClosedWon: quarterlyData,
        closedWonCurrentMonth: monthlyByOwner,
        closedWonCurrentYear: yearlyByOwner,
        firstSitComplete: closedWonThisYear.length,
        pipelineValue,
        conversionRate,
        averageDealSize: avgDealSize,
      };

      console.log('Dashboard data calculated:', dashboardData);
      console.log('Opportunities count:', opportunities?.length || 0);
      console.log('Closed won count:', closedWon.length);
      console.log('Total revenue:', totalRevenue);

      setData(dashboardData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyCloses = (opportunities: any[], parseAmount: (val: string | null) => number) => {
    const currentYear = new Date().getFullYear();
    const months = [
      '1/1/' + currentYear, '2/1/' + currentYear, '3/1/' + currentYear, '4/1/' + currentYear,
      '5/1/' + currentYear, '6/1/' + currentYear, '7/1/' + currentYear, '8/1/' + currentYear,
      '9/1/' + currentYear, '10/1/' + currentYear, '11/1/' + currentYear, '12/1/' + currentYear
    ];

    return months.map((month, index) => {
      const monthOpps = opportunities.filter((opp) => {
        if (!opp.CloseDate) return false;
        const closeDate = new Date(opp.CloseDate);
        return closeDate.getMonth() === index && closeDate.getFullYear() === currentYear;
      });

      const revenue = monthOpps.reduce((sum, opp) => sum + parseAmount(opp.Amount), 0);
      return {
        month,
        revenue,
        count: monthOpps.length,
      };
    });
  };

  const generateQuarterlyData = (opportunities: any[], year: number, parseAmount: (val: string | null) => number, userMap: Map<string, string>) => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

    // Get unique owners from OwnerId (Salesforce user IDs)
    const ownerIds = [...new Set(opportunities.map((opp) => opp.OwnerId || 'Unassigned'))];

    const result: any[] = [];

    ownerIds.forEach((ownerId) => {
      quarters.forEach((quarter, qIndex) => {
        const startMonth = qIndex * 3;
        const endMonth = startMonth + 3;

        const quarterOpps = opportunities.filter((opp) => {
          if ((opp.OwnerId || 'Unassigned') !== ownerId) return false;
          if (!opp.CloseDate) return false;

          const closeDate = new Date(opp.CloseDate);
          const month = closeDate.getMonth();
          return closeDate.getFullYear() === year && month >= startMonth && month < endMonth;
        });

        const revenue = quarterOpps.reduce((sum, opp) => sum + parseAmount(opp.Amount), 0);

        if (quarterOpps.length > 0) {
          const ownerName = ownerId === 'Unassigned' ? 'Unassigned' :
                           (userMap.get(ownerId) || ownerId.substring(0, 8));
          result.push({
            owner: ownerName,
            quarter,
            revenue,
            count: quarterOpps.length,
          });
        }
      });
    });

    return result;
  };

  const generateOwnerData = (opportunities: any[], parseAmount: (val: string | null) => number, userMap: Map<string, string>) => {
    const ownerRevMap = new Map<string, number>();

    opportunities.forEach((opp) => {
      const ownerId = opp.OwnerId || 'Unassigned';
      const current = ownerRevMap.get(ownerId) || 0;
      ownerRevMap.set(ownerId, current + parseAmount(opp.Amount));
    });

    return Array.from(ownerRevMap.entries())
      .map(([ownerId, amount]) => ({
        name: ownerId === 'Unassigned' ? 'Unassigned' :
              (userMap.get(ownerId) || ownerId.substring(0, 8)),
        amount
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatPercentage = (value: number, total: number) => {
    return Math.round((value / total) * 100);
  };

  const getGaugeColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    if (percentage >= 40) return '#ef4444';
    return '#dc2626';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-slate-600">
        No data available
      </div>
    );
  }

  const wattagePercentage = formatPercentage(data.wattageTotal, data.wattageGoal);
  const gaugeData = [
    { name: 'Complete', value: data.wattageTotal, color: getGaugeColor(wattagePercentage) },
    { name: 'Remaining', value: Math.max(0, data.wattageGoal - data.wattageTotal), color: '#e5e7eb' },
  ];

  return (
    <div className="p-6 bg-slate-50">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Display Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">
            As of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })},{' '}
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium">
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium">
            <Share2 className="w-4 h-4" />
            Subscribe
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Revenue - Year Total</h3>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-full max-w-sm">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="80%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius="60%"
                    outerRadius="80%"
                    dataKey="value"
                    stroke="none"
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {formatCurrency(data.wattageTotal)}
                </div>
                <div className="text-sm text-slate-600">({wattagePercentage}%)</div>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-slate-600">
            Goal: {formatCurrency(data.wattageGoal)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Monthly Revenue Forecast</h3>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.monthlyCloses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]}>
                {data.monthlyCloses.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.revenue > 0 ? '#2563eb' : '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Deals Closed - By Quarter</h3>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.quarterlyClosedWon}
              layout="vertical"
              margin={{ left: 60, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(value) => formatCurrency(value)} />
              <YAxis type="category" dataKey="owner" tick={{ fontSize: 11 }} width={50} />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="revenue" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Closed Won - Current Month</h3>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.closedWonCurrentMonth}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Closed Won - Current Year</h3>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.closedWonCurrentYear}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Deals Closed This Year</h3>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-8xl font-bold text-blue-600 mb-4">
                {data.firstSitComplete}
              </div>
              <div className="text-lg text-slate-600">Total Closed Won</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{formatCurrency(data.wattageTotal)}</div>
          <div className="text-blue-100 text-sm">Total Revenue</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{formatCurrency(data.pipelineValue)}</div>
          <div className="text-green-100 text-sm">Pipeline Value</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{data.conversionRate.toFixed(1)}%</div>
          <div className="text-purple-100 text-sm">Conversion Rate</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{formatCurrency(data.averageDealSize)}</div>
          <div className="text-orange-100 text-sm">Avg Deal Size</div>
        </div>
      </div>
    </div>
  );
}
