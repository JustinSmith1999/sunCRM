import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Filter, MoreVertical, Megaphone, Users, TrendingUp,
  DollarSign, Calendar, Target, BarChart3, Activity, Zap, CheckCircle
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SalesforceCampaign {
  Id: string;
  Name: string | null;
  Description: string | null;
  Type: string | null;
  Status: string | null;
  StartDate: Date | null;
  EndDate: Date | null;
  BudgetedCost: number | null;
  ActualCost: number | null;
  ExpectedRevenue: number | null;
  ExpectedResponse: number | null;
  NumberSent: number | null;
  NumberOfLeads: number | null;
  NumberOfConvertedLeads: number | null;
  NumberOfContacts: number | null;
  NumberOfResponses: number | null;
  NumberOfOpportunities: number | null;
  NumberOfWonOpportunities: number | null;
  AmountAllOpportunities: number | null;
  AmountWonOpportunities: number | null;
  IsActive: boolean | null;
  CreatedDate: string | null;
}

export function Campaigns() {
  const [campaigns, setCampaigns] = useState<SalesforceCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    loadCampaigns();
  }, [profile]);

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('salesforce_campaigns')
        .select('*')
        .order('CreatedDate', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const activeCampaigns = campaigns.filter(c => c.IsActive || c.Status?.toLowerCase() === 'in progress').length;
    const totalLeads = campaigns.reduce((sum, c) => sum + (c.NumberOfLeads || 0), 0);
    const totalConverted = campaigns.reduce((sum, c) => sum + (c.NumberOfConvertedLeads || 0), 0);
    const conversionRate = totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0;
    const budgetSpent = campaigns.reduce((sum, c) => sum + (c.ActualCost || 0), 0);

    return {
      activeCampaigns,
      totalLeads,
      conversionRate,
      budgetSpent
    };
  }, [campaigns]);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.Description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || campaign.Type === selectedType;
    const matchesStatus = selectedStatus === 'all' || campaign.Status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusConfig = (status: string | null) => {
    if (!status) return { color: 'bg-slate-600', label: 'Unknown', borderColor: 'border-slate-600' };
    switch (status.toLowerCase()) {
      case 'planned':
      case 'draft':
        return { color: 'bg-slate-500', label: status, borderColor: 'border-slate-500' };
      case 'in progress':
      case 'active':
        return { color: 'bg-emerald-500', label: status, borderColor: 'border-emerald-500' };
      case 'completed':
        return { color: 'bg-blue-500', label: status, borderColor: 'border-blue-500' };
      case 'aborted':
      case 'paused':
        return { color: 'bg-amber-500', label: status, borderColor: 'border-amber-500' };
      default:
        return { color: 'bg-slate-500', label: status, borderColor: 'border-slate-500' };
    }
  };

  const getTypeIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'email': return <Megaphone className="w-5 h-5" />;
      case 'webinar': return <Users className="w-5 h-5" />;
      case 'conference': return <Calendar className="w-5 h-5" />;
      case 'advertisement': return <TrendingUp className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: Date | string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getBudgetPercentage = (campaign: SalesforceCampaign) => {
    if (!campaign.BudgetedCost || campaign.BudgetedCost === 0) return 0;
    return Math.min(((campaign.ActualCost || 0) / campaign.BudgetedCost) * 100, 100);
  };

  const getCampaignChartData = (campaign: SalesforceCampaign) => {
    return [
      { name: 'Leads', value: campaign.NumberOfLeads || 0 },
      { name: 'Converted', value: campaign.NumberOfConvertedLeads || 0 },
      { name: 'Opps', value: campaign.NumberOfOpportunities || 0 },
      { name: 'Won', value: campaign.NumberOfWonOpportunities || 0 }
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Marketing Campaigns</h1>
            <p className="text-slate-400 mt-1">Track and optimize campaign performance</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-blue-500/50">
            <Plus className="w-5 h-5" />
            New Campaign
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <Activity className="w-10 h-10 text-white/90 mb-3" />
              <div className="text-5xl font-black text-white mb-2">{stats.activeCampaigns}</div>
              <div className="text-sm text-blue-100 font-medium">Active Campaigns</div>
              <div className="mt-2 text-xs text-blue-200 bg-blue-500/20 px-2 py-1 rounded-full inline-block">
                Running Now
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <Users className="w-10 h-10 text-white/90 mb-3" />
              <div className="text-5xl font-black text-white mb-2">{stats.totalLeads.toLocaleString()}</div>
              <div className="text-sm text-emerald-100 font-medium">Total Leads Generated</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <Target className="w-10 h-10 text-white/90 mb-3" />
              <div className="text-5xl font-black text-white mb-2">{stats.conversionRate.toFixed(1)}%</div>
              <div className="text-sm text-amber-100 font-medium">Conversion Rate</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <DollarSign className="w-10 h-10 text-white/90 mb-3" />
              <div className="text-4xl font-black text-white mb-2">{formatCurrency(stats.budgetSpent)}</div>
              <div className="text-sm text-purple-100 font-medium">Budget Spent</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="Email">Email</option>
            <option value="Webinar">Webinar</option>
            <option value="Conference">Conference</option>
            <option value="Advertisement">Advertisement</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Aborted">Aborted</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => {
            const statusConfig = getStatusConfig(campaign.Status);
            const budgetPercent = getBudgetPercentage(campaign);
            const isExpanded = expandedCampaign === campaign.Id;

            return (
              <div
                key={campaign.Id}
                className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border-l-4 ${statusConfig.borderColor} hover:scale-105 transition-all duration-300 cursor-pointer ${
                  isExpanded ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setExpandedCampaign(isExpanded ? null : campaign.Id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white`}>
                      {getTypeIcon(campaign.Type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{campaign.Name || 'Untitled Campaign'}</h3>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${statusConfig.color} mt-1`}>
                        {statusConfig.label}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{campaign.Description || 'No description'}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Type:</span>
                    <span className="text-white font-medium">{campaign.Type || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Date Range:</span>
                    <span className="text-white font-medium">
                      {formatDate(campaign.StartDate)} - {formatDate(campaign.EndDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Leads:</span>
                    <span className="text-emerald-400 font-bold text-lg">{campaign.NumberOfLeads || 0}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-400">Budget</span>
                    <span className="text-white font-medium">
                      {formatCurrency(campaign.ActualCost)} / {formatCurrency(campaign.BudgetedCost)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        budgetPercent >= 90 ? 'bg-gradient-to-r from-rose-600 to-red-600' :
                        budgetPercent >= 70 ? 'bg-gradient-to-r from-amber-600 to-orange-600' :
                        'bg-gradient-to-r from-emerald-600 to-green-600'
                      }`}
                      style={{ width: `${budgetPercent}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{budgetPercent.toFixed(0)}% spent</div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      Performance
                    </h4>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={getCampaignChartData(campaign)}>
                        <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          labelStyle={{ color: '#f1f5f9' }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="bg-slate-900/50 rounded-lg p-2">
                        <div className="text-xs text-slate-400">Converted</div>
                        <div className="text-lg font-bold text-emerald-400">{campaign.NumberOfConvertedLeads || 0}</div>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-2">
                        <div className="text-xs text-slate-400">Won Opps</div>
                        <div className="text-lg font-bold text-blue-400">{campaign.NumberOfWonOpportunities || 0}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Megaphone className="w-10 h-10 text-slate-500" />
            </div>
            {campaigns.length === 0 ? (
              <>
                <h3 className="text-xl font-bold text-slate-300 mb-2">No Campaign Data Available</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  No campaign data has been imported yet. Campaign data can be imported from Salesforce.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-400 mb-2">No campaigns found</h3>
                <p className="text-slate-500">Try adjusting your search or filters</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
