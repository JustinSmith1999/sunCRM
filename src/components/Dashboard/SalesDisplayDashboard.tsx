import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, Target, Award, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SalesforceOpportunity {
  Id: string;
  OwnerId: string | null;
  Name: string;
  Amount: string | null;
  CloseDate: string | null;
  StageName: string | null;
  Probability: string | null;
  IsClosed: string | null;
  IsWon: string | null;
  CreatedDate: string | null;
  First_Sit_Date__c: string | null;
  LastStageChangeDate: string | null;
}

interface SalesforceUser {
  Id: string;
  Name: string;
}

interface SalesTarget {
  year: number;
  target_amount: number;
}

export function SalesDisplayDashboard() {
  const [opportunities, setOpportunities] = useState<SalesforceOpportunity[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [salesTarget, setSalesTarget] = useState<SalesTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, [profile]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading Salesforce dashboard data');

      // Load opportunities and users from Salesforce tables
      const [oppsResult, usersResult, targetResult] = await Promise.all([
        supabase
          .from('opportunities')
          .select('*'),
        supabase
          .from('users')
          .select('Id, Name'),
        supabase
          .from('sales_targets')
          .select('*')
          .eq('year', new Date().getFullYear())
          .maybeSingle()
      ]);

      console.log('Opportunities loaded:', oppsResult.data?.length || 0);
      console.log('Users loaded:', usersResult.data?.length || 0);

      if (oppsResult.error) {
        console.error('Opportunities error:', oppsResult.error);
      }
      if (usersResult.error) {
        console.error('Users error:', usersResult.error);
      }
      if (targetResult.error) {
        console.error('Target error:', targetResult.error);
      }

      setOpportunities(oppsResult.data || []);

      // Create user ID to name mapping
      const userMap: Record<string, string> = {};
      (usersResult.data || []).forEach((user: any) => {
        userMap[user.Id] = user.Name;
      });
      setUsers(userMap);

      setSalesTarget(targetResult.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWattageMetrics = () => {
    const currentYear = new Date().getFullYear();
    const yearOpps = opportunities.filter(opp => {
      if (!opp.CloseDate) return false;
      const closeDate = new Date(opp.CloseDate);
      return closeDate.getFullYear() === currentYear;
    });

    const totalSold = yearOpps
      .filter(opp => opp.StageName === 'Closed Won')
      .reduce((sum, opp) => sum + (parseFloat(opp.Amount || '0') || 0), 0);

    const targetAmount = salesTarget?.target_amount || 8000000;
    const percentage = Math.round((totalSold / targetAmount) * 100);

    return { totalSold, targetAmount, percentage };
  };

  const getFirstSitComplete = () => {
    const currentYear = new Date().getFullYear();
    return opportunities.filter(opp => {
      if (!opp.First_Sit_Date__c) return false;
      const sitDate = new Date(opp.First_Sit_Date__c);
      return sitDate.getFullYear() === currentYear;
    }).length;
  };

  const getClosedWonCurrentMonth = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return opportunities.filter(opp => {
      if (opp.StageName !== 'Closed Won' || !opp.CloseDate) return false;
      const closedDate = new Date(opp.CloseDate);
      return closedDate.getMonth() === currentMonth && closedDate.getFullYear() === currentYear;
    }).length;
  };

  const getLastMonthsClosedWon = () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const month = lastMonth.getMonth();
    const year = lastMonth.getFullYear();

    return opportunities.filter(opp => {
      if (opp.StageName !== 'Closed Won' || !opp.CloseDate) return false;
      const closedDate = new Date(opp.CloseDate);
      return closedDate.getMonth() === month && closedDate.getFullYear() === year;
    }).length;
  };

  const getQuarterClosedWon = () => {
    const byOwnerAndQuarter: Record<string, Record<string, number>> = {};

    opportunities.forEach(opp => {
      if (opp.StageName !== 'Closed Won' || !opp.OwnerId || !opp.CloseDate) return;

      const ownerName = users[opp.OwnerId] || 'Unknown';
      const closeDate = new Date(opp.CloseDate);
      const quarter = `Q${Math.floor(closeDate.getMonth() / 3) + 1}`;
      const amount = parseFloat(opp.Amount || '0') || 0;

      if (!byOwnerAndQuarter[ownerName]) {
        byOwnerAndQuarter[ownerName] = {};
      }

      byOwnerAndQuarter[ownerName][quarter] = (byOwnerAndQuarter[ownerName][quarter] || 0) + amount;
    });

    return byOwnerAndQuarter;
  };

  const getClosedWonCurrentYear = () => {
    const currentYear = new Date().getFullYear();

    const byOwner: Record<string, number> = {};

    opportunities.forEach(opp => {
      if (opp.StageName !== 'Closed Won' || !opp.CloseDate) return;

      const closedDate = new Date(opp.CloseDate);
      if (closedDate.getFullYear() !== currentYear) return;

      const ownerName = users[opp.OwnerId || ''] || 'Unknown';
      const amount = parseFloat(opp.Amount || '0') || 0;
      byOwner[ownerName] = (byOwner[ownerName] || 0) + amount;
    });

    return Object.entries(byOwner)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
  };

  const getMonthlyClosedRevenue = () => {
    const monthlyData: Record<string, number> = {};

    opportunities.forEach(opp => {
      if (opp.StageName !== 'Closed Won' || !opp.CloseDate) return;

      const closeDate = new Date(opp.CloseDate);
      const monthKey = `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, '0')}-01`;
      const amount = parseFloat(opp.Amount || '0') || 0;

      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + amount;
    });

    return Object.entries(monthlyData)
      .map(([date, revenue]) => ({ month_date: date, expected_revenue: revenue }))
      .sort((a, b) => b.month_date.localeCompare(a.month_date))
      .slice(0, 12);
  };

  const wattageMetrics = calculateWattageMetrics();
  const quarterClosedWon = getQuarterClosedWon();
  const yearClosedWon = getClosedWonCurrentYear();
  const monthlyRevenue = getMonthlyClosedRevenue();

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}m`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value}`;
  };

  const getGaugeColor = (percentage: number) => {
    if (percentage >= 75) return 'from-teal-500 to-emerald-500';
    if (percentage >= 50) return 'from-amber-500 to-yellow-500';
    return 'from-red-500 to-orange-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Sales Display Dashboard</h1>
        <p className="text-slate-600">Real-time sales performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Wattage - Year Total</h2>
            <Target className="w-5 h-5 text-slate-400" />
          </div>

          <div className="relative w-48 h-48 mx-auto mb-4">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="#e2e8f0"
                strokeWidth="16"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="url(#gauge-gradient)"
                strokeWidth="16"
                fill="none"
                strokeDasharray={`${(wattageMetrics.percentage / 100) * 502.4} 502.4`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" className="text-red-500" stopColor="currentColor" />
                  <stop offset="50%" className="text-amber-500" stopColor="currentColor" />
                  <stop offset="100%" className="text-emerald-500" stopColor="currentColor" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-slate-900">
                {formatCurrency(wattageMetrics.totalSold)}
              </div>
              <div className="text-sm text-slate-600">({wattageMetrics.percentage}%)</div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-600">Target: {formatCurrency(wattageMetrics.targetAmount)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">First Sit Complete</h2>
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>

          <div className="flex items-center justify-center h-48">
            <div className="text-8xl font-bold text-teal-600">
              {getFirstSitComplete()}
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-slate-600">This Year</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Closed Won Current Month</h2>
            <Award className="w-5 h-5 text-slate-400" />
          </div>

          <div className="flex items-center justify-center h-48">
            <div className="text-8xl font-bold text-amber-600">
              {getClosedWonCurrentMonth()}
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-slate-600">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Month Closes</h2>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {monthlyRevenue.slice(0, 10).map((month) => {
              const date = new Date(month.month_date);
              const monthLabel = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
              const maxRevenue = Math.max(...monthlyRevenue.map(m => m.expected_revenue), 1);
              const percentage = (month.expected_revenue / maxRevenue) * 100;

              return (
                <div key={month.month_date} className="flex items-center gap-2">
                  <div className="w-24 text-xs text-slate-600 flex-shrink-0">{monthLabel}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                      <span className="text-xs font-semibold text-white drop-shadow">
                        {formatCurrency(month.expected_revenue)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Last Months Closed Won Total</h2>
            <DollarSign className="w-5 h-5 text-slate-400" />
          </div>

          <div className="flex items-center justify-center h-48">
            <div className="text-8xl font-bold text-red-600">
              {getLastMonthsClosedWon()}
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-slate-600">
              {new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Q-Closed Won</h2>
            <Users className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(quarterClosedWon).slice(0, 10).map(([owner, quarters]) => (
              <div key={owner} className="border-b border-slate-100 pb-3">
                <div className="font-medium text-sm text-slate-900 mb-2">{owner}</div>
                <div className="grid grid-cols-4 gap-2">
                  {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                    <div key={q} className="text-center">
                      <div className="text-xs text-slate-500 mb-1">{q}</div>
                      <div className="bg-blue-100 rounded px-2 py-1">
                        <span className="text-xs font-semibold text-blue-700">
                          {quarters[q] ? formatCurrency(quarters[q]) : '$0'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Closed Won Current Year</h2>
            <Award className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {yearClosedWon.map(([owner, amount]) => {
              const maxAmount = yearClosedWon[0]?.[1] || 1;
              const percentage = (amount / maxAmount) * 100;

              return (
                <div key={owner} className="flex items-center gap-2">
                  <div className="w-32 text-xs text-slate-600 truncate flex-shrink-0" title={owner}>
                    {owner}
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                      <span className="text-xs font-semibold text-white drop-shadow">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
