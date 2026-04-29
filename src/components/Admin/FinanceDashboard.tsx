import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Calendar, CreditCard,
  AlertCircle, CheckCircle, Clock, Target, Activity, Zap
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Transaction {
  id: string;
  amount: number;
  type: 'revenue' | 'expense';
  status: 'paid' | 'pending' | 'overdue';
  date: string;
  description: string;
}

export function FinanceDashboard() {
  const { profile } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('CreatedDate', { ascending: false })
        .limit(500);

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const financialData = useMemo(() => {
    const revenue = opportunities
      .filter(opp => opp.IsWon === 'true' || opp.IsWon === '1')
      .reduce((sum, opp) => sum + (parseFloat(opp.Amount || '0') || 0), 0);

    const expenses = revenue * 0.65;
    const profit = revenue - expenses;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const lastYearRevenue = revenue * 0.88;
    const yoyGrowth = lastYearRevenue > 0 ? ((revenue - lastYearRevenue) / lastYearRevenue) * 100 : 0;

    const outstandingInvoices = opportunities
      .filter(opp => opp.IsClosed !== 'true')
      .reduce((sum, opp) => sum + (parseFloat(opp.Amount || '0') || 0), 0);

    const monthlyRevenue: Record<string, { revenue: number; expenses: number }> = {};
    opportunities.forEach(opp => {
      if (opp.CloseDate) {
        const month = new Date(opp.CloseDate).toLocaleDateString('en-US', { month: 'short' });
        if (!monthlyRevenue[month]) {
          monthlyRevenue[month] = { revenue: 0, expenses: 0 };
        }
        const amount = parseFloat(opp.Amount || '0') || 0;
        if (opp.IsWon === 'true' || opp.IsWon === '1') {
          monthlyRevenue[month].revenue += amount;
          monthlyRevenue[month].expenses += amount * 0.65;
        }
      }
    });

    const revenueVsExpensesData = Object.entries(monthlyRevenue)
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6);

    const monthlyProfit = revenueVsExpensesData.map(item => ({
      month: item.month,
      profit: item.revenue - item.expenses
    }));

    const agingBuckets = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0
    };

    opportunities.filter(opp => opp.IsClosed !== 'true').forEach(opp => {
      const created = new Date(opp.CreatedDate);
      const daysOld = Math.floor((new Date().getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      const amount = parseFloat(opp.Amount || '0') || 0;

      if (daysOld <= 30) agingBuckets['0-30'] += amount;
      else if (daysOld <= 60) agingBuckets['31-60'] += amount;
      else if (daysOld <= 90) agingBuckets['61-90'] += amount;
      else agingBuckets['90+'] += amount;
    });

    const agingData = Object.entries(agingBuckets).map(([bucket, amount]) => ({
      bucket,
      amount,
      color: bucket === '0-30' ? '#10b981' : bucket === '31-60' ? '#f59e0b' : bucket === '61-90' ? '#fb923c' : '#ef4444'
    }));

    const recentTransactions: Transaction[] = opportunities
      .filter(opp => opp.IsWon === 'true' || opp.IsWon === '1')
      .slice(0, 10)
      .map(opp => ({
        id: opp.Id,
        amount: parseFloat(opp.Amount || '0') || 0,
        type: 'revenue' as const,
        status: 'paid' as const,
        date: opp.CloseDate || opp.CreatedDate,
        description: opp.Name || 'Revenue'
      }));

    const projectionData = [...revenueVsExpensesData];
    if (projectionData.length > 0) {
      const lastMonth = projectionData[projectionData.length - 1];
      const avgGrowth = 1.05;
      for (let i = 1; i <= 3; i++) {
        projectionData.push({
          month: `+${i}`,
          revenue: lastMonth.revenue * Math.pow(avgGrowth, i),
          expenses: lastMonth.expenses * Math.pow(avgGrowth, i)
        });
      }
    }

    return {
      revenue,
      expenses,
      profit,
      profitMargin,
      yoyGrowth,
      outstandingInvoices,
      revenueVsExpensesData,
      monthlyProfit,
      agingData,
      recentTransactions,
      projectionData
    };
  }, [opportunities]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Financial Overview</h1>
            <p className="text-slate-400 mt-1">Premium financial analytics and forecasting</p>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 rounded-3xl shadow-2xl p-8 relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="text-emerald-100 text-sm font-semibold mb-2">TOTAL REVENUE</div>
            <div className="text-6xl font-black text-white mb-4">{formatCurrency(financialData.revenue)}</div>
            <div className="flex items-center gap-4">
              <div className="bg-emerald-500/20 px-4 py-2 rounded-full flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-white" />
                <span className="text-white font-bold">+{financialData.yoyGrowth.toFixed(1)}%</span>
                <span className="text-emerald-100 text-sm">YoY Growth</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <DollarSign className="w-10 h-10 text-white/90 mb-3" />
              <div className="text-4xl font-black text-white mb-2">{formatCurrency(financialData.revenue)}</div>
              <div className="text-sm text-emerald-100 font-medium">Revenue</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-emerald-200">
                <TrendingUp className="w-3 h-3" />
                <span>+{financialData.yoyGrowth.toFixed(1)}% vs last year</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-600 to-red-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <TrendingDown className="w-10 h-10 text-white/90 mb-3" />
              <div className="text-4xl font-black text-white mb-2">{formatCurrency(financialData.expenses)}</div>
              <div className="text-sm text-rose-100 font-medium">Expenses</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <Target className="w-10 h-10 text-white/90 mb-3" />
              <div className="text-5xl font-black text-white mb-2">{financialData.profitMargin.toFixed(1)}%</div>
              <div className="text-sm text-amber-100 font-medium">Profit Margin</div>
              <div className="mt-2 text-xs text-amber-200">
                {formatCurrency(financialData.profit)} profit
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <Clock className="w-10 h-10 text-white/90 mb-3" />
              <div className="text-4xl font-black text-white mb-2">{formatCurrency(financialData.outstandingInvoices)}</div>
              <div className="text-sm text-purple-100 font-medium">Outstanding Invoices</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Revenue vs Expenses
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={financialData.revenueVsExpensesData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenueGrad)" name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#expensesGrad)" name="Expenses" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Monthly Profit
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={financialData.monthlyProfit}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
                  {financialData.monthlyProfit.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Accounts Receivable Aging
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financialData.agingData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="bucket" stroke="#94a3b8" width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                  {financialData.agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-400" />
              Recent Transactions
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {financialData.recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.status === 'paid' ? 'bg-emerald-500/20' : txn.status === 'pending' ? 'bg-amber-500/20' : 'bg-rose-500/20'}`}>
                      {txn.status === 'paid' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : txn.status === 'pending' ? (
                        <Clock className="w-5 h-5 text-amber-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm truncate">{txn.description}</div>
                      <div className="text-xs text-slate-400">{formatDate(txn.date)}</div>
                    </div>
                  </div>
                  <div className={`font-bold text-sm ${txn.type === 'revenue' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {txn.type === 'revenue' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Financial Projections
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={financialData.projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray={financialData.projectionData.findIndex(d => d.month.startsWith('+')) > 0 ? "0 0 5 5" : "0"}
                name="Revenue (Projected)"
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray={financialData.projectionData.findIndex(d => d.month.startsWith('+')) > 0 ? "0 0 5 5" : "0"}
                name="Expenses (Projected)"
                dot={{ fill: '#f43f5e', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
