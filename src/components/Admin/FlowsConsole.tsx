import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
  Users,
  GitBranch,
  Activity,
  Download,
  Upload
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { importAllFlows, getTotalFlowCount } from '../../utils/importFlows';

interface Flow {
  id: string;
  name: string;
  api_name: string;
  description: string;
  flow_type: string;
  triggered_object: string;
  status: string;
  version_number: number;
  last_modified_by: any;
  created_at: string;
  updated_at: string;
  activated_at: string | null;
}

interface FlowExecution {
  id: string;
  flow_id: string;
  status: string;
  started_at: string;
  completed_at: string;
  execution_time_ms: number;
  actions_executed: number;
  error_message: string;
}

export function FlowsConsole() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [executions, setExecutions] = useState<FlowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [view, setView] = useState<'list' | 'executions'>('list');
  const { profile } = useAuth();

  useEffect(() => {
    loadFlows();
  }, [profile]);

  const loadFlows = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { data: orgData } = await supabase
        .from('user_organization_roles')
        .select('organization_id')
        .eq('user_id', profile.id)
        .single();

      if (!orgData) return;

      const { data, error } = await supabase
        .from('flows')
        .select(`
          *,
          last_modified_by:user_profiles!flows_last_modified_by_fkey(full_name, email)
        `)
        .eq('organization_id', orgData.organization_id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setFlows(data || []);
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async (flowId: string) => {
    try {
      const { data, error } = await supabase
        .from('flow_executions')
        .select('*')
        .eq('flow_id', flowId)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setExecutions(data || []);
    } catch (error) {
      console.error('Error loading executions:', error);
    }
  };

  const handleActivateFlow = async (flowId: string) => {
    try {
      const { error } = await supabase
        .from('flows')
        .update({
          status: 'activated',
          activated_at: new Date().toISOString()
        })
        .eq('id', flowId);

      if (error) throw error;
      loadFlows();
    } catch (error) {
      console.error('Error activating flow:', error);
    }
  };

  const handleDeactivateFlow = async (flowId: string) => {
    try {
      const { error } = await supabase
        .from('flows')
        .update({ status: 'canceled' })
        .eq('id', flowId);

      if (error) throw error;
      loadFlows();
    } catch (error) {
      console.error('Error deactivating flow:', error);
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm('Are you sure you want to delete this flow?')) return;

    try {
      const { error } = await supabase
        .from('flows')
        .delete()
        .eq('id', flowId);

      if (error) throw error;
      loadFlows();
    } catch (error) {
      console.error('Error deleting flow:', error);
    }
  };

  const handleBulkImport = async () => {
    if (!profile?.id) return;

    const confirmed = confirm(
      `This will import ${getTotalFlowCount()} Salesforce flows into your database. Continue?`
    );
    if (!confirmed) return;

    setImporting(true);
    try {
      const { data: orgData } = await supabase
        .from('user_organization_roles')
        .select('organization_id')
        .eq('user_id', profile.id)
        .single();

      if (!orgData) {
        alert('Organization not found');
        return;
      }

      const result = await importAllFlows(orgData.organization_id, profile.id);
      alert(`Import complete!\nSuccess: ${result.success}\nFailed: ${result.failed}`);
      loadFlows();
    } catch (error) {
      console.error('Error importing flows:', error);
      alert('Error importing flows. Check console for details.');
    } finally {
      setImporting(false);
    }
  };

  const getFlowTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      record_triggered_before_save: 'Record-Triggered Before Save Flow',
      record_triggered_after_save: 'Record-Triggered After Save Flow',
      record_triggered_before_delete: 'Record-Triggered Before Delete Flow',
      schedule_triggered: 'Schedule-Triggered Flow',
      screen_flow: 'Screen Flow',
      autolaunched: 'Autolaunched No Trigger Flow',
      routing_flow: 'Routing Autolaunched Flow',
      approval_flow: 'Autolaunched Flow Approval Process',
      field_service_mobile: 'Field Service Mobile Screen Flow',
      template_triggered_prompt: 'Template-Triggered Prompt Flow'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      activated: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activated' },
      draft: { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Draft' },
      canceled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Canceled' }
    };
    const c = config[status as keyof typeof config] || config.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const getExecutionStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-600" />;
    }
  };

  const filteredFlows = flows.filter((flow) => {
    const matchesSearch =
      flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.api_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || flow.flow_type === filterType;
    const matchesStatus = filterStatus === 'all' || flow.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: flows.length,
    activated: flows.filter(f => f.status === 'activated').length,
    draft: flows.filter(f => f.status === 'draft').length,
    recordTriggered: flows.filter(f => f.flow_type.includes('record_triggered')).length,
    scheduled: flows.filter(f => f.flow_type === 'schedule_triggered').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-8 h-8 text-blue-600" />
              Automation Flows
            </h1>
            <p className="text-slate-600 mt-1">
              {filteredFlows.length} flows • Sorted by Last Modified
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkImport}
              disabled={importing}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
            >
              {importing ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Import All Flows ({getTotalFlowCount()})
                </>
              )}
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors">
              <Plus className="w-5 h-5" />
              New Flow
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Flows</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <GitBranch className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Activated</p>
                <p className="text-2xl font-bold text-green-600">{stats.activated}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Draft</p>
                <p className="text-2xl font-bold text-slate-600">{stats.draft}</p>
              </div>
              <Edit className="w-8 h-8 text-slate-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Record-Triggered</p>
                <p className="text-2xl font-bold text-blue-600">{stats.recordTriggered}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Scheduled</p>
                <p className="text-2xl font-bold text-purple-600">{stats.scheduled}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search flows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="record_triggered_after_save">Record-Triggered After Save</option>
            <option value="record_triggered_before_save">Record-Triggered Before Save</option>
            <option value="record_triggered_before_delete">Record-Triggered Before Delete</option>
            <option value="schedule_triggered">Schedule-Triggered</option>
            <option value="screen_flow">Screen Flow</option>
            <option value="autolaunched">Autolaunched</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="activated">Activated</option>
            <option value="draft">Draft</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Flow Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Flow Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Object
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Last Modified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFlows.map((flow) => (
                <tr key={flow.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-900">{flow.name}</div>
                      {flow.description && (
                        <div className="text-sm text-slate-500 mt-1">{flow.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">
                      {getFlowTypeLabel(flow.flow_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(flow.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">
                      {flow.triggered_object || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">
                      {new Date(flow.updated_at).toLocaleDateString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {flow.last_modified_by?.full_name || flow.last_modified_by?.email || 'System'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {flow.status === 'draft' || flow.status === 'canceled' ? (
                        <button
                          onClick={() => handleActivateFlow(flow.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Activate"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeactivateFlow(flow.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deactivate"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedFlow(flow);
                          loadExecutions(flow.id);
                          setView('executions');
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Executions"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Clone"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFlow(flow.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFlows.length === 0 && (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No flows found</h3>
            <p className="text-slate-600">Create your first automation flow to get started.</p>
          </div>
        )}
      </div>

      {view === 'executions' && selectedFlow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedFlow.name}</h2>
                  <p className="text-sm text-slate-600 mt-1">Execution History</p>
                </div>
                <button
                  onClick={() => setView('list')}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {executions.length > 0 ? (
                <div className="space-y-4">
                  {executions.map((execution) => (
                    <div key={execution.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getExecutionStatusIcon(execution.status)}
                          <div>
                            <div className="font-medium text-slate-900">
                              {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                            </div>
                            <div className="text-sm text-slate-600 mt-1">
                              Started: {new Date(execution.started_at).toLocaleString()}
                            </div>
                            {execution.completed_at && (
                              <div className="text-sm text-slate-600">
                                Duration: {execution.execution_time_ms}ms
                              </div>
                            )}
                            {execution.error_message && (
                              <div className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                                {execution.error_message}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-slate-600">
                          {execution.actions_executed} actions
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No executions yet</h3>
                  <p className="text-slate-600">This flow hasn't been executed yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
