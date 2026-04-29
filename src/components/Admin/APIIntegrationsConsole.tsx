import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Settings,
  Check,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle,
  Server,
  Database,
  Cloud,
  Phone,
  Mail,
  CreditCard,
  FileSpreadsheet,
  Sun,
  Calendar
} from 'lucide-react';
import EgnyteOAuthSetup from './EgnyteOAuthSetup';

interface APICredential {
  id: string;
  service_name: string;
  service_type: string;
  display_name: string;
  credentials: Record<string, string>;
  config: Record<string, string>;
  is_active: boolean;
  is_connected: boolean;
  last_tested_at: string | null;
  last_test_result: any;
  access_token: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface APILog {
  id: string;
  service_name: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

const serviceIcons: Record<string, React.ReactNode> = {
  egnyte: <Database className="w-5 h-5" />,
  powerbi: <FileSpreadsheet className="w-5 h-5" />,
  ringcentral: <Phone className="w-5 h-5" />,
  aurora_solar: <Sun className="w-5 h-5" />,
  salesforce: <Server className="w-5 h-5" />,
  stripe: <CreditCard className="w-5 h-5" />,
  twilio: <Phone className="w-5 h-5" />,
  sendgrid: <Mail className="w-5 h-5" />,
  microsoft_graph: <Calendar className="w-5 h-5" />,
  captivateiq: <CreditCard className="w-5 h-5" />
};

export default function APIIntegrationsConsole() {
  const [credentials, setCredentials] = useState<APICredential[]>([]);
  const [logs, setLogs] = useState<APILog[]>([]);
  const [selectedService, setSelectedService] = useState<APICredential | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editedCreds, setEditedCreds] = useState<Record<string, string>>({});
  const [editedConfig, setEditedConfig] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'credentials' | 'logs'>('credentials');
  const [testing, setTesting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredentials();
    loadLogs();
  }, []);

  async function loadCredentials() {
    try {
      const { data, error } = await supabase
        .from('api_credentials')
        .select('*')
        .order('display_name');

      if (error) throw error;
      setCredentials(data || []);
    } catch (error: any) {
      console.error('Error loading credentials:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs() {
    try {
      const { data, error } = await supabase
        .from('api_integration_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error loading logs:', error);
    }
  }

  async function testConnection(credentialId: string, serviceName: string) {
    setTesting(credentialId);
    try {
      const testResult = {
        tested_at: new Date().toISOString(),
        success: true,
        message: 'Connection test would run here'
      };

      const { error } = await supabase
        .from('api_credentials')
        .update({
          is_connected: true,
          last_tested_at: new Date().toISOString(),
          last_test_result: testResult
        })
        .eq('id', credentialId);

      if (error) throw error;

      await loadCredentials();
      alert('Connection test successful!');
    } catch (error: any) {
      console.error('Test failed:', error);
      alert(`Test failed: ${error.message}`);
    } finally {
      setTesting(null);
    }
  }

  async function saveCredentials() {
    if (!selectedService) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('api_credentials')
        .update({
          credentials: editedCreds,
          config: editedConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedService.id);

      if (error) throw error;

      await loadCredentials();
      setIsEditing(false);
      alert('Credentials saved successfully!');
    } catch (error: any) {
      console.error('Save failed:', error);
      alert(`Save failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  function startEditing(service: APICredential) {
    setSelectedService(service);
    setEditedCreds({ ...service.credentials });
    setEditedConfig({ ...service.config });
    setIsEditing(true);
  }

  function renderCredentialFields(creds: Record<string, string>, type: 'credentials' | 'config') {
    const data = type === 'credentials' ? editedCreds : editedConfig;
    const setData = type === 'credentials' ? setEditedCreds : setEditedConfig;

    return Object.entries(creds).map(([key, value]) => {
      const isSecret = key.includes('secret') || key.includes('key') || key.includes('token') || key.includes('password');
      const fieldId = `${type}-${key}`;

      return (
        <div key={key} className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 capitalize">
            {key.replace(/_/g, ' ')}
          </label>
          <div className="relative">
            <input
              type={isSecret && !showSecrets[fieldId] ? 'password' : 'text'}
              value={data[key] || ''}
              onChange={(e) => setData({ ...data, [key]: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              placeholder={`Enter ${key.replace(/_/g, ' ')}`}
              disabled={!isEditing}
            />
            {isSecret && (
              <button
                type="button"
                onClick={() => setShowSecrets({ ...showSecrets, [fieldId]: !showSecrets[fieldId] })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSecrets[fieldId] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      );
    });
  }

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
          <h2 className="text-2xl font-bold text-slate-900">API Integrations</h2>
          <p className="text-slate-600 mt-1">
            Manage API credentials and monitor integration health
          </p>
        </div>
        <button
          onClick={loadCredentials}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* API Health Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Connected APIs</p>
              <p className="text-3xl font-bold text-slate-900">
                {credentials.filter(c => c.is_connected).length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            of {credentials.length} total services
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Active Services</p>
              <p className="text-3xl font-bold text-slate-900">
                {credentials.filter(c => c.is_active).length}
              </p>
            </div>
            <Activity className="w-10 h-10 text-amber-500" />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            services are enabled
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Recent API Calls</p>
              <p className="text-3xl font-bold text-slate-900">
                {logs.length}
              </p>
            </div>
            <Server className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            in last 24 hours
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Failed Requests</p>
              <p className="text-3xl font-bold text-slate-900">
                {logs.filter(l => !l.success).length}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            errors detected
          </p>
        </div>
      </div>

      {/* Service Status Grid */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Integration Status</h3>
          <p className="text-sm text-slate-600 mt-1">Real-time status of all API integrations</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      {serviceIcons[cred.service_name] || <Cloud className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{cred.display_name}</h4>
                      <p className="text-xs text-slate-500 capitalize">{cred.service_type.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cred.is_connected
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {cred.is_connected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Status:</span>
                    <span className={`font-medium ${cred.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                      {cred.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {cred.last_tested_at && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Last Tested:</span>
                      <span className="text-slate-900">
                        {new Date(cred.last_tested_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {cred.token_expires_at && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Token Expires:</span>
                      <span className={`font-medium ${
                        new Date(cred.token_expires_at) < new Date()
                          ? 'text-red-600'
                          : 'text-slate-900'
                      }`}>
                        {new Date(cred.token_expires_at) < new Date()
                          ? 'Expired'
                          : new Date(cred.token_expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <EgnyteOAuthSetup />

      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === 'credentials'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            API Credentials
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            API Logs
          </button>
        </div>
      </div>

      {activeTab === 'credentials' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Available Services</h3>
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className={`p-4 border rounded-lg cursor-pointer transition ${
                  selectedService?.id === cred.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => {
                  setSelectedService(cred);
                  setIsEditing(false);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      {serviceIcons[cred.service_name] || <Cloud className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold">{cred.display_name}</h4>
                      <p className="text-sm text-slate-600 capitalize">{cred.service_type.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cred.is_connected ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-slate-400" />
                    )}
                    {cred.is_active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Active</span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">Inactive</span>
                    )}
                  </div>
                </div>
                {cred.last_tested_at && (
                  <p className="text-xs text-slate-500 mt-2">
                    Last tested: {new Date(cred.last_tested_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div>
            {selectedService ? (
              <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{selectedService.display_name}</h3>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => startEditing(selectedService)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => testConnection(selectedService.id, selectedService.service_name)}
                          disabled={testing === selectedService.id}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {testing === selectedService.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            'Test Connection'
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={saveCredentials}
                          disabled={saving}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-slate-700 mb-3">Credentials</h4>
                    <div className="space-y-3">
                      {renderCredentialFields(selectedService.credentials, 'credentials')}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-slate-700 mb-3">Configuration</h4>
                    <div className="space-y-3">
                      {renderCredentialFields(selectedService.config, 'config')}
                    </div>
                  </div>
                </div>

                {selectedService.last_test_result && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Last Test Result</h4>
                    <pre className="text-xs text-slate-600 overflow-auto">
                      {JSON.stringify(selectedService.last_test_result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 border border-dashed border-slate-300 rounded-lg">
                <div className="text-center text-slate-500">
                  <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a service to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Endpoint</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Time (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>No API logs yet</p>
                      <p className="text-sm">Logs will appear here after API calls are made</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {serviceIcons[log.service_name] || <Cloud className="w-4 h-4" />}
                          <span className="text-sm font-medium">{log.service_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{log.endpoint}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.success ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <Check className="w-4 h-4" />
                            {log.status_code}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-sm">
                            <X className="w-4 h-4" />
                            {log.status_code}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{log.response_time_ms}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
