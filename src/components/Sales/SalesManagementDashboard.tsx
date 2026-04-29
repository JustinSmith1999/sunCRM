import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Target,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Filter,
  Search,
  AlertCircle
} from 'lucide-react';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  lead_source: string;
  city: string;
  state: string;
  assigned_to?: string;
  created_date: string;
  estimated_value?: number;
}

interface SalesRep {
  id: string;
  full_name: string;
  email: string;
  role_name: string;
  role_display_name: string;
  assigned_leads_count: number;
  closed_deals_count: number;
  total_revenue: number;
}

export function SalesManagementDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unassigned' | 'new'>('unassigned');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Real-time subscription for new leads
    const leadsSubscription = supabase
      .channel('sales-leads-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => loadData()
      )
      .subscribe();

    return () => {
      leadsSubscription.unsubscribe();
    };
  }, [selectedFilter, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Direct query with proper filtering (skip RPC entirely)
      const { data: repsData, error: repsError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          full_name,
          is_active,
          user_roles!inner (
            name,
            display_name
          )
        `)
        .in('user_roles.name', ['sales_rep', 'sales_manager', 'inside_sales', 'outside_sales'])
        .eq('is_active', true)
        .order('full_name');

      if (repsError) {
        console.error('Error loading sales reps:', repsError);
        throw repsError;
      }

      const salesRepsData = repsData || [];

      // Calculate stats for each rep
      const repsWithStats = await Promise.all(salesRepsData.map(async (rep: any) => {
        const { count: assignedCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', rep.id);

        const { count: closedCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', rep.id)
          .ilike('status', 'Closed%Won');

        const { data: revenueData } = await supabase
          .from('leads')
          .select('estimated_value')
          .eq('assigned_to', rep.id)
          .ilike('status', 'Closed%Won');

        const totalRevenue = revenueData?.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0) || 0;

        return {
          id: rep.id,
          full_name: rep.full_name || rep.email,
          email: rep.email,
          role_name: rep.user_roles?.name || '',
          role_display_name: rep.user_roles?.display_name || '',
          assigned_leads_count: assignedCount || 0,
          closed_deals_count: closedCount || 0,
          total_revenue: totalRevenue
        };
      }));

      setSalesReps(repsWithStats);

      // Load leads based on filter
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_date', { ascending: false });

      if (selectedFilter === 'unassigned') {
        query = query.is('assigned_to', null);
      } else if (selectedFilter === 'new') {
        query = query.gte('created_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      }

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data: leadsData, error: leadsError } = await query;

      if (leadsError) {
        console.error('Error loading leads:', leadsError);
        throw leadsError;
      }

      console.log('Loaded leads:', leadsData?.length || 0);
      setLeads(leadsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const assignLead = async (leadId: string, repId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ assigned_to: repId })
        .eq('id', leadId);

      if (error) throw error;

      // Update local state
      setLeads(leads.map(lead =>
        lead.id === leadId ? { ...lead, assigned_to: repId } : lead
      ));
      setSelectedLead(null);
    } catch (error) {
      console.error('Error assigning lead:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'New': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'Qualified': 'bg-teal-100 text-teal-800',
      'Proposal': 'bg-orange-100 text-orange-800',
      'Negotiation': 'bg-pink-100 text-pink-800',
      'Closed - Won': 'bg-green-100 text-green-800',
      'Closed - Lost': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const unassignedCount = leads.filter(l => !l.assigned_to).length;
  const newTodayCount = leads.filter(l =>
    new Date(l.created_date) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Sales Management</h1>
        <p className="text-gray-600 text-sm">Manage leads and sales team assignments</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unassigned</p>
              <p className="text-2xl font-bold text-orange-600">{unassignedCount}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Today</p>
              <p className="text-2xl font-bold text-green-600">{newTodayCount}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sales Team</p>
              <p className="text-2xl font-bold text-gray-900">{salesReps.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Team Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Sales Team
              </h2>
            </div>
            <div className="p-4 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
              {salesReps.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{rep.full_name}</h3>
                      <p className="text-sm text-gray-600">{rep.email}</p>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mt-1">
                        {rep.role_display_name || rep.role_name?.replace('_', ' ').toUpperCase() || 'SALES'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-600">Assigned</p>
                      <p className="text-lg font-bold text-gray-900">{rep.assigned_leads_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Closed</p>
                      <p className="text-lg font-bold text-green-600">{rep.closed_deals_count}</p>
                    </div>
                  </div>

                  {rep.total_revenue > 0 && (
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span className="font-semibold">{rep.total_revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leads Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Lead Queue</h2>
              </div>

              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedFilter('unassigned')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedFilter === 'unassigned'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Unassigned
                  </button>
                  <button
                    onClick={() => setSelectedFilter('new')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedFilter === 'new'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    New Today
                  </button>
                </div>
              </div>
            </div>

            {/* Leads List */}
            <div className="divide-y divide-gray-200 max-h-[calc(100vh-400px)] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading leads...</div>
              ) : leads.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No leads found</div>
              ) : (
                leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                          {!lead.assigned_to && (
                            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                              Unassigned
                            </span>
                          )}
                        </div>

                        {lead.company && (
                          <p className="text-sm text-gray-600 mb-1">{lead.company}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {lead.email && (
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {lead.email}
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {lead.phone}
                            </div>
                          )}
                          {(lead.city || lead.state) && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {lead.city}{lead.city && lead.state ? ', ' : ''}{lead.state}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(lead.created_date).toLocaleDateString()}
                          </div>
                          {lead.lead_source && (
                            <div>Source: {lead.lead_source}</div>
                          )}
                          {lead.estimated_value && (
                            <div className="flex items-center font-semibold text-green-600">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {lead.estimated_value.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Assign Lead
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedLead.first_name} {selectedLead.last_name} - {selectedLead.company}
              </p>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">Select a sales representative:</p>
              <div className="space-y-2">
                {salesReps.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => assignLead(selectedLead.id, rep.id)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{rep.full_name}</p>
                        <p className="text-sm text-gray-600">{rep.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{rep.assigned_leads_count} leads</p>
                        <p className="text-xs text-gray-500">{rep.closed_deals_count} closed</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
