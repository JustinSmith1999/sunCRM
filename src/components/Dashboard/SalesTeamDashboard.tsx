import React, { useState, useEffect } from 'react';
import {
  Users, DollarSign, TrendingUp, Target, Award, RefreshCw,
  Phone, Mail, Briefcase, Trophy, PieChart as PieChartIcon, BarChart3, Database
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCompanyMetrics, syncData } from '../../lib/captivateiq';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DateRangeFilter, DateRangeKey, getDateRange, isInDateRange } from '../shared/DateRangeFilter';

interface SalesTeamMember {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  totalOpportunities: number;
  closedWon: number;
  pipelineValue: number;
  closedRevenue: number;
  winRate: number;
}

interface SalesMetrics {
  totalRevenue: number;
  pipelineValue: number;
  totalOpportunities: number;
  closedWon: number;
  closedLost: number;
  winRate: number;
  avgDealSize: number;
}

export function SalesTeamDashboard() {
  const [teamMembers, setTeamMembers] = useState<SalesTeamMember[]>([]);
  const [metrics, setMetrics] = useState<SalesMetrics>({
    totalRevenue: 0,
    pipelineValue: 0,
    totalOpportunities: 0,
    closedWon: 0,
    closedLost: 0,
    winRate: 0,
    avgDealSize: 0
  });
  const [loading, setLoading] = useState(true);
  const [stageData, setStageData] = useState<any[]>([]);
  const [wattageData, setWattageData] = useState<any[]>([]);
  const [dataSource, setDataSource] = useState<'captivateiq' | 'salesforce'>('captivateiq');
  const [syncing, setSyncing] = useState(false);
  const [useCaptivateIQ, setUseCaptivateIQ] = useState(true);
  const [allOpps, setAllOpps] = useState<any[]>([]);
  const [allSalesTeamRaw, setAllSalesTeamRaw] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeKey>('ALL');

  useEffect(() => {
    loadSalesData();
  }, [useCaptivateIQ]);

  useEffect(() => {
    if (allOpps.length > 0) {
      computeMetrics(allOpps, allSalesTeamRaw);
    }
  }, [dateRange, allOpps]);

  const handleSyncCaptivateIQ = async () => {
    setSyncing(true);
    try {
      await syncData('sync_all');
      alert('CaptivateIQ data synced successfully!');
      await loadSalesData();
    } catch (error: any) {
      console.error('Sync error:', error);
      alert(`Sync failed: ${error.message || 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const computeMetrics = (rawOpps: any[], sfUsersRaw: any[]) => {
    const range = getDateRange(dateRange);
    const opps = range.start || range.end
      ? rawOpps.filter(o => isInDateRange(o.CloseDate, range))
      : rawOpps;

    const closedWonOpps = opps.filter(o => o.StageName === 'Closed Won');
    const totalRevenue = closedWonOpps.reduce((sum, o) => sum + (parseFloat(o.Amount) || 0), 0);

    const pipelineOpps = opps.filter(o => o.StageName && !o.StageName.includes('Closed'));
    const pipelineValue = pipelineOpps.reduce((sum, o) => sum + (parseFloat(o.Amount) || 0), 0);

    const closedLostOpps = opps.filter(o => o.StageName === 'Closed Lost');
    const totalClosed = closedWonOpps.length + closedLostOpps.length;
    const winRate = totalClosed > 0 ? (closedWonOpps.length / totalClosed) * 100 : 0;
    const avgDealSize = closedWonOpps.length > 0 ? totalRevenue / closedWonOpps.length : 0;

    const stageCounts = new Map<string, { count: number; value: number }>();
    opps.forEach(o => {
      const stage = o.StageName || 'Unknown';
      const current = stageCounts.get(stage) || { count: 0, value: 0 };
      stageCounts.set(stage, { count: current.count + 1, value: current.value + (parseFloat(o.Amount) || 0) });
    });
    setStageData(
      Array.from(stageCounts.entries())
        .map(([name, data]) => ({ name, count: data.count, value: data.value }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    );

    const closedWonWithWattage = opps.filter(o => o.StageName === 'Closed Won' && parseFloat(o.Wattage_Sold__c) > 0);
    const resiWattage = closedWonWithWattage
      .filter(o => { const t = (o.Type_of_Installation__c || '').toLowerCase(); return t.includes('residential') || t === 'add-on'; })
      .reduce((sum, o) => sum + (parseFloat(o.Wattage_Sold__c) || 0), 0);
    const commWattage = closedWonWithWattage
      .filter(o => { const t = (o.Type_of_Installation__c || '').toLowerCase(); return t.includes('commercial') || t.includes('municipal'); })
      .reduce((sum, o) => sum + (parseFloat(o.Wattage_Sold__c) || 0), 0);
    const otherWattage = closedWonWithWattage
      .filter(o => { const t = (o.Type_of_Installation__c || '').toLowerCase(); return !t.includes('residential') && !t.includes('commercial') && !t.includes('municipal') && t !== 'add-on'; })
      .reduce((sum, o) => sum + (parseFloat(o.Wattage_Sold__c) || 0), 0);
    const wattageEntries = [
      { name: 'Residential', value: resiWattage, displayValue: `${(resiWattage / 1000).toFixed(1)}kW` },
      { name: 'Commercial', value: commWattage, displayValue: `${(commWattage / 1000).toFixed(1)}kW` },
    ];
    if (otherWattage > 0) wattageEntries.push({ name: 'Other', value: otherWattage, displayValue: `${(otherWattage / 1000).toFixed(1)}kW` });
    setWattageData(wattageEntries.filter(e => e.value > 0));

    const managerGroups = new Map<string, { opps: any[]; name: string }>();
    opps.forEach(o => {
      const managerName: string = o.Manager__c
        ? String(o.Manager__c)
        : (o.Team_Leader__c ? String(o.Team_Leader__c) : 'Unassigned');
      if (!managerGroups.has(managerName)) {
        managerGroups.set(managerName, { opps: [], name: managerName });
      }
      managerGroups.get(managerName)!.opps.push(o);
    });

    const teamData: SalesTeamMember[] = Array.from(managerGroups.entries())
      .map(([managerName, group]) => {
        const ownerId = managerName;
        const memberOpps = group.opps;
        const memberClosedWon = memberOpps.filter(o => o.StageName === 'Closed Won');
        const memberClosedLost = memberOpps.filter(o => o.StageName === 'Closed Lost');
        const memberPipelineOpps = memberOpps.filter(o => o.StageName && !o.StageName.includes('Closed'));
        const memberRevenue = memberClosedWon.reduce((sum, o) => sum + (parseFloat(o.Amount) || 0), 0);
        const memberPipeline = memberPipelineOpps.reduce((sum, o) => sum + (parseFloat(o.Amount) || 0), 0);
        const memberTotalClosed = memberClosedWon.length + memberClosedLost.length;
        const memberWinRate = memberTotalClosed > 0 ? (memberClosedWon.length / memberTotalClosed) * 100 : 0;
        return {
          id: ownerId,
          name: group.name,
          title: 'Sales Manager',
          email: '',
          phone: '',
          totalOpportunities: memberOpps.length,
          closedWon: memberClosedWon.length,
          pipelineValue: memberPipeline,
          closedRevenue: memberRevenue,
          winRate: memberWinRate,
        };
      })
      .sort((a, b) => b.closedRevenue - a.closedRevenue);

    setTeamMembers(teamData);
    setMetrics({ totalRevenue, pipelineValue, totalOpportunities: opps.length, closedWon: closedWonOpps.length, closedLost: closedLostOpps.length, winRate, avgDealSize });
  };

  const fetchAllOpportunities = async (): Promise<any[]> => {
    const PAGE_SIZE = 1000;
    let allRows: any[] = [];
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from('opportunities')
        .select('Id, Name, Amount, StageName, OwnerId, CloseDate, Type_of_Installation__c, Wattage_Sold__c, Team_Leader__c, Director__c, Manager__c')
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allRows = allRows.concat(data);
      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
    return allRows;
  };

  const loadSalesData = async () => {
    setLoading(true);
    try {
      if (useCaptivateIQ) {
        const captivateIQMetrics = await getCompanyMetrics('monthly');

        if (captivateIQMetrics && captivateIQMetrics.revenue > 0) {
          setDataSource('captivateiq');
          setMetrics({
            totalRevenue: captivateIQMetrics.revenue,
            pipelineValue: captivateIQMetrics.pipeline,
            totalOpportunities: captivateIQMetrics.deals_closed,
            closedWon: captivateIQMetrics.deals_closed,
            closedLost: 0,
            winRate: captivateIQMetrics.quota_attainment,
            avgDealSize: captivateIQMetrics.deals_closed > 0
              ? captivateIQMetrics.revenue / captivateIQMetrics.deals_closed
              : 0
          });

          const rawOpps = await fetchAllOpportunities();
          const { data: sfUsers } = await supabase.from('salesforce_users').select('Id, Name, Email');
          const sfUserMap: Record<string, { name: string; email: string }> = {};
          (sfUsers || []).forEach((u: any) => { sfUserMap[u.Id] = { name: u.Name || 'Unknown', email: u.Email || '' }; });

          setAllOpps(rawOpps);
          setAllSalesTeamRaw(sfUsers || []);
          computeMetrics(rawOpps, sfUsers || []);
          setLoading(false);
          return;
        }
      }

      setDataSource('salesforce');
      const rawOpps = await fetchAllOpportunities();

      const { data: sfUsers, error: sfError } = await supabase
        .from('salesforce_users')
        .select('Id, Name, Email, IsActive');

      if (sfError) console.error('Error loading salesforce_users:', sfError);

      const rawSfUsers = sfUsers || [];
      setAllOpps(rawOpps);
      setAllSalesTeamRaw(rawSfUsers);
      computeMetrics(rawOpps, rawSfUsers);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const topPerformers = [...teamMembers]
    .sort((a, b) => b.closedRevenue - a.closedRevenue)
    .slice(0, 5);

  return (
    <div className="w-full space-y-6 p-6 bg-gray-50">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Team Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            {dataSource === 'captivateiq'
              ? 'Commission data from CaptivateIQ'
              : 'Sales performance from Salesforce opportunities'}
          </p>
          <div className="mt-3">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setUseCaptivateIQ(!useCaptivateIQ)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              useCaptivateIQ
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Database className="w-4 h-4" />
            {useCaptivateIQ ? 'Using CaptivateIQ' : 'Using Salesforce'}
          </button>
          {dataSource === 'captivateiq' && (
            <button
              onClick={handleSyncCaptivateIQ}
              disabled={syncing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync CaptivateIQ'}
            </button>
          )}
          <button
            onClick={loadSalesData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</div>
          <div className="text-sm text-gray-600">Total Revenue (Closed Won)</div>
          <div className="text-xs text-green-600 mt-1">{metrics.closedWon} deals</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.pipelineValue)}</div>
          <div className="text-sm text-gray-600">Pipeline Value</div>
          <div className="text-xs text-blue-600 mt-1">{metrics.totalOpportunities - metrics.closedWon - metrics.closedLost} open opps</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.winRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Team Win Rate</div>
          <div className="text-xs text-purple-600 mt-1">{metrics.closedWon}W / {metrics.closedLost}L</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.avgDealSize)}</div>
          <div className="text-sm text-gray-600">Average Deal Size</div>
          <div className="text-xs text-orange-600 mt-1">{metrics.totalOpportunities} total opps</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers by Revenue */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Revenue by Sales Manager
            </h2>
          </div>
          {topPerformers.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPerformers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="closedRevenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              Add sales team members in HR Console
            </div>
          )}
        </div>

        {/* Pipeline by Stage */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
              Opportunities by Stage
            </h2>
          </div>
          {stageData.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={stageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ count }) => count}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} opportunities (${formatCurrency(props.payload.value)})`,
                      props.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Custom Legend Grid */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-200">
                {stageData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-gray-700 truncate" title={entry.name}>
                      {entry.name}:
                    </span>
                    <span className="font-semibold text-gray-900 ml-auto">
                      {entry.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No opportunity data available
            </div>
          )}
        </div>

        {/* Total Wattage Sold - RESI vs COMM Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            Total Wattage Sold (RESI vs COMM)
          </h2>
          {wattageData.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={wattageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Kilowatts (kW)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    formatter={(value: number) => [`${(value / 1000).toFixed(1)} kW`, 'Wattage']}
                  />
                  <Bar dataKey="value" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">{wattageData.find(d => d.name === 'Residential')?.displayValue ?? '0.0kW'}</div>
                  <div className="text-sm text-gray-600 mt-1">Residential Wattage</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{wattageData.find(d => d.name === 'Commercial')?.displayValue ?? '0.0kW'}</div>
                  <div className="text-sm text-gray-600 mt-1">Commercial Wattage</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <BarChart3 className="w-16 h-16 mb-3 text-gray-300" />
              <p className="text-lg font-medium">No Wattage Data Available</p>
              <p className="text-sm mt-2 text-center max-w-md">
                Wattage data will appear here once Salesforce opportunities include Wattage_Sold__c or Proposed_Wattage__c values.
                Data is categorized by opportunity name or type containing "RESI" or "COMM".
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Sales Team Members ({teamMembers.length})
          </h2>
          <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Showing {teamMembers.length} active sales team members
          </span>
        </div>

        {teamMembers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200 p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {getInitials(member.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate text-lg">{member.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{member.title}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{member.email || 'No email'}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="text-xl font-bold text-green-600">{formatCurrency(member.closedRevenue)}</div>
                    <div className="text-xs text-gray-600 mt-1">Revenue</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="text-xl font-bold text-blue-600">{formatCurrency(member.pipelineValue)}</div>
                    <div className="text-xs text-gray-600 mt-1">Pipeline</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="text-xl font-bold text-purple-600">{member.closedWon}</div>
                    <div className="text-xs text-gray-600 mt-1">Closed Won</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="text-xl font-bold text-orange-600">{member.winRate.toFixed(0)}%</div>
                    <div className="text-xs text-gray-600 mt-1">Win Rate</div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No sales team members found</p>
            <p className="text-sm mt-1">Add sales team members in the HR Console</p>
            <p className="text-xs text-gray-400 mt-3">
              Using {metrics.totalOpportunities.toLocaleString()} opportunities from Salesforce
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Data synced from Salesforce: <strong>{metrics.totalOpportunities.toLocaleString()} opportunities</strong></span>
          </div>
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}
