import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Shield,
  User,
  Clock,
  Filter,
  Search,
  Download,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Key,
  Settings,
  Database,
  Link as LinkIcon,
  Calendar
} from 'lucide-react';

interface AuditLog {
  id: string;
  admin_email: string;
  admin_name: string;
  action_type: string;
  action_category: string;
  action_description: string;
  target_user_email: string;
  changes_made: any;
  before_values: any;
  after_values: any;
  ip_address: string;
  user_agent: string;
  status: string;
  error_message: string;
  created_at: string;
}

const actionTypeLabels: Record<string, string> = {
  user_created: 'User Created',
  user_updated: 'User Updated',
  user_deleted: 'User Deleted',
  user_activated: 'User Activated',
  user_deactivated: 'User Deactivated',
  password_reset: 'Password Reset',
  password_changed: 'Password Changed',
  role_changed: 'Role Changed',
  permissions_modified: 'Permissions Modified',
  login_success: 'Login Success',
  login_failed: 'Login Failed',
  account_locked: 'Account Locked',
  account_unlocked: 'Account Unlocked',
  data_accessed: 'Data Accessed',
  data_modified: 'Data Modified',
  data_deleted: 'Data Deleted',
  settings_changed: 'Settings Changed',
  api_key_created: 'API Key Created',
  api_key_revoked: 'API Key Revoked',
  export_performed: 'Export Performed',
  import_performed: 'Import Performed',
  integration_configured: 'Integration Configured',
  other: 'Other'
};

const categoryIcons: Record<string, React.ReactNode> = {
  user_management: <User className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  data_access: <Database className="w-4 h-4" />,
  system_settings: <Settings className="w-4 h-4" />,
  integrations: <LinkIcon className="w-4 h-4" />
};

const categoryColors: Record<string, string> = {
  user_management: 'bg-blue-100 text-blue-700',
  security: 'bg-red-100 text-red-700',
  data_access: 'bg-cyan-100 text-cyan-700',
  system_settings: 'bg-amber-100 text-amber-700',
  integrations: 'bg-green-100 text-green-700'
};

export default function AdminChangeLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [filters, setFilters] = useState({
    category: 'all',
    actionType: 'all',
    adminUser: 'all',
    status: 'all',
    dateRange: '7'
  });

  useEffect(() => {
    loadAuditLogs();
  }, [filters.dateRange]);

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, filters]);

  async function loadAuditLogs() {
    try {
      setLoading(true);

      const daysAgo = parseInt(filters.dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...logs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.admin_email.toLowerCase().includes(term) ||
        log.action_description.toLowerCase().includes(term) ||
        log.target_user_email?.toLowerCase().includes(term)
      );
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(log => log.action_category === filters.category);
    }

    if (filters.actionType !== 'all') {
      filtered = filtered.filter(log => log.action_type === filters.actionType);
    }

    if (filters.adminUser !== 'all') {
      filtered = filtered.filter(log => log.admin_email === filters.adminUser);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(log => log.status === filters.status);
    }

    setFilteredLogs(filtered);
  }

  function exportLogs() {
    const csv = [
      ['Date', 'Admin', 'Action', 'Category', 'Description', 'Target User', 'Status'],
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.admin_email,
        actionTypeLabels[log.action_type] || log.action_type,
        log.action_category,
        log.action_description,
        log.target_user_email || '',
        log.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  const uniqueAdmins = Array.from(new Set(logs.map(log => log.admin_email)));
  const uniqueActionTypes = Array.from(new Set(logs.map(log => log.action_type)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Change Log</h2>
          <p className="text-slate-600 mt-1">
            Complete audit trail of all administrative actions
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadAuditLogs}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Actions</p>
              <p className="text-2xl font-bold text-slate-900">{filteredLogs.length}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Successful</p>
              <p className="text-2xl font-bold text-slate-900">
                {filteredLogs.filter(l => l.status === 'success').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Failed</p>
              <p className="text-2xl font-bold text-slate-900">
                {filteredLogs.filter(l => l.status === 'failed').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Admins</p>
              <p className="text-2xl font-bold text-slate-900">{uniqueAdmins.length}</p>
            </div>
            <User className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="user_management">User Management</option>
              <option value="security">Security</option>
              <option value="data_access">Data Access</option>
              <option value="system_settings">System Settings</option>
              <option value="integrations">Integrations</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Action Type
            </label>
            <select
              value={filters.actionType}
              onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Actions</option>
              {uniqueActionTypes.map(type => (
                <option key={type} value={type}>
                  {actionTypeLabels[type] || type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Admin User
            </label>
            <select
              value={filters.adminUser}
              onChange={(e) => setFilters({ ...filters, adminUser: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Admins</option>
              {uniqueAdmins.map(admin => (
                <option key={admin} value={admin}>{admin}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Admin User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Target User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No audit logs found matching the selected filters</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        {log.admin_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${categoryColors[log.action_category]}`}>
                        {categoryIcons[log.action_category]}
                        {log.action_category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      <div className="font-medium">{actionTypeLabels[log.action_type] || log.action_type}</div>
                      <div className="text-slate-500 text-xs">{log.action_description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {log.target_user_email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          Success
                        </span>
                      ) : log.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <AlertCircle className="w-3 h-3" />
                          Partial
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Audit Log Details</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin User</label>
                  <p className="text-slate-900">{selectedLog.admin_email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Action Type</label>
                  <p className="text-slate-900">{actionTypeLabels[selectedLog.action_type]}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${categoryColors[selectedLog.action_category]}`}>
                    {categoryIcons[selectedLog.action_category]}
                    {selectedLog.action_category.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <p className="text-slate-900">{selectedLog.status}</p>
                </div>
                {selectedLog.target_user_email && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target User</label>
                    <p className="text-slate-900">{selectedLog.target_user_email}</p>
                  </div>
                )}
                {selectedLog.ip_address && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">IP Address</label>
                    <p className="text-slate-900">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <p className="text-slate-900">{selectedLog.action_description}</p>
              </div>

              {selectedLog.changes_made && Object.keys(selectedLog.changes_made).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Changes Made</label>
                  <pre className="bg-slate-50 p-4 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(selectedLog.changes_made, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.before_values && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Before Values</label>
                  <pre className="bg-slate-50 p-4 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(selectedLog.before_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.after_values && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">After Values</label>
                  <pre className="bg-slate-50 p-4 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(selectedLog.after_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.error_message && (
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Error Message</label>
                  <p className="text-red-600 bg-red-50 p-3 rounded-lg">{selectedLog.error_message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
