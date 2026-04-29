import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Target, BarChart3, TrendingUp, Users, CreditCard as Edit, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardBuilder } from '../Dashboard/DashboardBuilder';

interface Dashboard {
  id: string;
  name: string;
  description: string;
  type: 'sales' | 'service' | 'marketing' | 'executive' | 'custom';
  widgets_count: number;
  last_viewed: string;
  created_by: string;
  is_public: boolean;
  view?: string;
}

export function DashboardsConsole() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDashboard, setEditingDashboard] = useState<string | null>(null);
  const [showNewDashboardModal, setShowNewDashboardModal] = useState(false);
  const [newDashboard, setNewDashboard] = useState({ name: '', description: '', type: 'custom' });
  const { profile } = useAuth();

  useEffect(() => {
    loadDashboards();
  }, [profile]);

  const loadDashboards = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data: dashboardsData, error } = await supabase
        .from('custom_dashboards')
        .select(`
          *,
          creator:user_profiles!custom_dashboards_created_by_fkey(full_name, email)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const dashboardsWithCounts = await Promise.all(
        (dashboardsData || []).map(async (dashboard) => {
          const { count } = await supabase
            .from('dashboard_widgets')
            .select('*', { count: 'exact', head: true })
            .eq('dashboard_id', dashboard.id);

          return {
            ...dashboard,
            widgets_count: count || 0,
            last_viewed: dashboard.updated_at,
            created_by: dashboard.creator?.full_name || dashboard.creator?.email || 'Unknown'
          };
        })
      );

      setDashboards(dashboardsWithCounts);
    } catch (error) {
      console.error('Error loading dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDashboard = async () => {
    if (!profile?.organization_id || !newDashboard.name) return;

    try {
      const { data, error } = await supabase
        .from('custom_dashboards')
        .insert([{
          organization_id: profile.organization_id,
          name: newDashboard.name,
          description: newDashboard.description,
          type: newDashboard.type,
          is_public: false,
          created_by: profile.id
        }])
        .select()
        .single();

      if (error) throw error;

      setEditingDashboard(data.id);
      setShowNewDashboardModal(false);
      setNewDashboard({ name: '', description: '', type: 'custom' });
    } catch (error) {
      console.error('Error creating dashboard:', error);
      alert('Failed to create dashboard');
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  if (editingDashboard) {
    return (
      <DashboardBuilder
        dashboardId={editingDashboard}
        onBack={() => {
          setEditingDashboard(null);
          loadDashboards();
        }}
      />
    );
  }

  const filteredDashboards = dashboards.filter(dashboard => {
    const matchesSearch = dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dashboard.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || dashboard.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sales': return 'text-green-600 bg-green-100';
      case 'service': return 'text-blue-600 bg-blue-100';
      case 'marketing': return 'text-pink-600 bg-pink-100';
      case 'executive': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getDashboardStats = () => {
    const total = dashboards.length;
    const public_dashboards = dashboards.filter(d => d.is_public).length;
    const totalWidgets = dashboards.reduce((sum, d) => sum + d.widgets_count, 0);

    return { total, public_dashboards, totalWidgets };
  };

  const stats = getDashboardStats();

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboards</h1>
          <p className="text-sm sm:text-base text-slate-600">Create and manage custom dashboards with drag-and-drop</p>
        </div>
        <button
          onClick={() => setShowNewDashboardModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span>New Dashboard</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Public</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.public_dashboards}</p>
            </div>
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Widgets</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats.totalWidgets}</p>
            </div>
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Avg Widgets</p>
              <p className="text-lg sm:text-2xl font-bold text-amber-600">
                {stats.total > 0 ? Math.round(stats.totalWidgets / stats.total) : 0}
              </p>
            </div>
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dashboards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            >
              <option value="all">All Types</option>
              <option value="custom">Custom</option>
              <option value="sales">Sales</option>
              <option value="service">Service</option>
              <option value="marketing">Marketing</option>
              <option value="executive">Executive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dashboard List */}
      <div className="space-y-4">
        {filteredDashboards.map((dashboard) => (
          <div
            key={dashboard.id}
            className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 sm:gap-4 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 break-words">{dashboard.name}</h3>
                    <div className="flex gap-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getTypeColor(dashboard.type)} whitespace-nowrap`}>
                      {dashboard.type}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${
                      dashboard.is_public
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {dashboard.is_public ? 'Public' : 'Private'}
                    </span>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-slate-600 mb-3 break-words">{dashboard.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600">
                    <div>
                      <span className="font-medium">Widgets:</span> {dashboard.widgets_count}
                    </div>
                    <div>
                      <span className="font-medium">By:</span> {dashboard.created_by}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span> {new Date(dashboard.last_viewed).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {dashboard.type}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setEditingDashboard(dashboard.id)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 py-1.5 rounded font-medium flex items-center gap-2 text-sm flex-shrink-0"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        ))}

        {filteredDashboards.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">No dashboards found</h3>
            <p className="text-sm sm:text-base text-slate-600 mb-4 px-4">
              {searchTerm ? 'No dashboards match your search criteria.' : 'Get started by creating your first custom dashboard.'}
            </p>
            <button
              onClick={() => setShowNewDashboardModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              New Dashboard
            </button>
          </div>
        )}
      </div>

      {/* New Dashboard Modal */}
      {showNewDashboardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Create New Dashboard</h2>
              <button
                onClick={() => {
                  setShowNewDashboardModal(false);
                  setNewDashboard({ name: '', description: '', type: 'custom' });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dashboard Name *
                </label>
                <input
                  type="text"
                  value={newDashboard.name}
                  onChange={(e) => setNewDashboard({ ...newDashboard, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g., Sales Performance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newDashboard.description}
                  onChange={(e) => setNewDashboard({ ...newDashboard, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  rows={3}
                  placeholder="Describe what this dashboard is for..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type
                </label>
                <select
                  value={newDashboard.type}
                  onChange={(e) => setNewDashboard({ ...newDashboard, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="custom">Custom</option>
                  <option value="sales">Sales</option>
                  <option value="service">Service</option>
                  <option value="marketing">Marketing</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowNewDashboardModal(false);
                  setNewDashboard({ name: '', description: '', type: 'custom' });
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={createDashboard}
                disabled={!newDashboard.name}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg font-medium disabled:opacity-50"
              >
                Create & Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
