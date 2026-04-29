import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, XCircle, Clock, TrendingUp, Database, Zap, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ApplicationError {
  id: string;
  error_type: string;
  error_message: string;
  error_stack: string | null;
  component_name: string | null;
  user_email: string | null;
  url: string | null;
  http_status: number | null;
  severity: string;
  resolved: boolean;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
}

interface SystemHealthCheck {
  id: string;
  component_name: string;
  check_type: string;
  status: string;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string;
}

interface ComponentHealth {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  lastCheck: string;
  errorCount: number;
}

export default function SystemHealthDashboard() {
  const [errors, setErrors] = useState<ApplicationError[]>([]);
  const [healthChecks, setHealthChecks] = useState<SystemHealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ApplicationError | null>(null);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);

      let errorQuery = supabase
        .from('application_errors')
        .select('*')
        .order('last_seen_at', { ascending: false })
        .limit(100);

      if (filter === 'unresolved') {
        errorQuery = errorQuery.eq('resolved', false);
      }

      const [errorsResult, healthResult] = await Promise.all([
        errorQuery,
        supabase
          .from('system_health_checks')
          .select('*')
          .order('checked_at', { ascending: false })
          .limit(50)
      ]);

      if (errorsResult.error) throw errorsResult.error;
      if (healthResult.error) throw healthResult.error;

      setErrors(errorsResult.data || []);
      setHealthChecks(healthResult.data || []);
    } catch (error) {
      console.error('Error loading system health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveError = async (errorId: string) => {
    try {
      const { error } = await supabase
        .from('application_errors')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', errorId);

      if (error) throw error;
      await loadData();
      setSelectedError(null);
    } catch (error) {
      console.error('Error resolving error:', error);
      alert('Failed to resolve error');
    }
  };

  const runHealthCheck = async (componentName: string) => {
    try {
      const startTime = Date.now();
      let status = 'healthy';
      let errorMessage = null;

      const { error } = await supabase
        .from(componentName)
        .select('id')
        .limit(1);

      if (error) {
        status = 'error';
        errorMessage = error.message;
      }

      const responseTime = Date.now() - startTime;

      await supabase
        .from('system_health_checks')
        .insert({
          component_name: componentName,
          check_type: 'connectivity',
          status,
          response_time_ms: responseTime,
          error_message: errorMessage
        });

      await loadData();
    } catch (error) {
      console.error('Error running health check:', error);
    }
  };

  const getComponentHealth = (): ComponentHealth[] => {
    const components = [
      'leads',
      'accounts',
      'contacts',
      'opportunities',
      'user_profiles',
      'warehouse_inventory',
      'service_parts'
    ];

    return components.map(name => {
      const recentChecks = healthChecks.filter(h => h.component_name === name);
      const recentErrors = errors.filter(e => e.component_name?.includes(name));
      const latestCheck = recentChecks[0];

      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      if (recentErrors.filter(e => !e.resolved).length > 5) {
        status = 'error';
      } else if (recentErrors.filter(e => !e.resolved).length > 0) {
        status = 'warning';
      }

      return {
        name,
        status,
        lastCheck: latestCheck?.checked_at || 'Never',
        errorCount: recentErrors.filter(e => !e.resolved).length
      };
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const componentHealth = getComponentHealth();
  const unresolvedErrors = errors.filter(e => !e.resolved);
  const criticalErrors = unresolvedErrors.filter(e => e.severity === 'critical');
  const avgResponseTime = healthChecks.length > 0
    ? Math.round(healthChecks.reduce((sum, h) => sum + (h.response_time_ms || 0), 0) / healthChecks.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
              <p className="text-sm text-gray-500 mt-1">Monitor errors and component status</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Critical Errors</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{criticalErrors.length}</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Unresolved Errors</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{unresolvedErrors.length}</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Healthy Components</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {componentHealth.filter(c => c.status === 'healthy').length}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Avg Response</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{avgResponseTime}ms</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Component Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {componentHealth.map((component) => (
            <div
              key={component.name}
              className={`p-4 rounded-lg border-2 ${
                component.status === 'healthy'
                  ? 'bg-green-50 border-green-200'
                  : component.status === 'warning'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-gray-700" />
                  <span className="font-medium text-gray-900">{component.name}</span>
                </div>
                {getStatusIcon(component.status)}
              </div>
              <div className="text-sm text-gray-600">
                <div>Errors: {component.errorCount}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Last check: {component.lastCheck === 'Never' ? 'Never' : new Date(component.lastCheck).toLocaleTimeString()}
                </div>
              </div>
              <button
                onClick={() => runHealthCheck(component.name)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Run Check
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Application Errors</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('unresolved')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'unresolved'
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Unresolved
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading errors...</div>
        ) : errors.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-500">No errors found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {errors.map((error) => (
              <div
                key={error.id}
                className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                  error.resolved ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                }`}
                onClick={() => setSelectedError(error)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(error.severity)}`}>
                        {error.severity}
                      </span>
                      {error.component_name && (
                        <span className="text-xs text-gray-500">{error.component_name}</span>
                      )}
                      {error.occurrence_count > 1 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {error.occurrence_count}x
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-gray-900">{error.error_type}</div>
                    <div className="text-sm text-gray-600 mt-1">{error.error_message}</div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>First: {new Date(error.first_seen_at).toLocaleString()}</span>
                      <span>Last: {new Date(error.last_seen_at).toLocaleString()}</span>
                      {error.user_email && <span>User: {error.user_email}</span>}
                    </div>
                  </div>
                  {!error.resolved && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resolveError(error.id);
                      }}
                      className="ml-4 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Error Details</h3>
                <button
                  onClick={() => setSelectedError(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Error Type</label>
                  <div className="text-gray-900">{selectedError.error_type}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <div className="text-gray-900">{selectedError.error_message}</div>
                </div>
                {selectedError.error_stack && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Stack Trace</label>
                    <pre className="mt-1 p-4 bg-gray-50 rounded text-xs overflow-x-auto">
                      {selectedError.error_stack}
                    </pre>
                  </div>
                )}
                {selectedError.url && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">URL</label>
                    <div className="text-gray-900">{selectedError.url}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">First Seen</label>
                    <div className="text-gray-900">{new Date(selectedError.first_seen_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Seen</label>
                    <div className="text-gray-900">{new Date(selectedError.last_seen_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Occurrences</label>
                    <div className="text-gray-900">{selectedError.occurrence_count}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Severity</label>
                    <div className="text-gray-900">{selectedError.severity}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                {!selectedError.resolved && (
                  <button
                    onClick={() => resolveError(selectedError.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Mark as Resolved
                  </button>
                )}
                <button
                  onClick={() => setSelectedError(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
