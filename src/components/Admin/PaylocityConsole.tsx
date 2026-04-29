import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, CheckCircle, XCircle, Users, DollarSign, Calendar, AlertCircle, Database } from 'lucide-react';

interface PaylocityCredentials {
  id: string;
  service_name: string;
  display_name: string;
  is_active: boolean;
  is_connected: boolean;
  last_tested_at: string | null;
  credentials: {
    client_id: string;
    client_secret: string;
    company_id: string;
    api_url: string;
  };
  config: {
    sync_frequency: string;
    sync_employees: boolean;
    sync_payroll: boolean;
    sync_benefits: boolean;
    sync_time_off: boolean;
  };
}

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

interface PaylocityEmployee {
  id: string;
  paylocity_employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_number: string;
  employment_status: string;
  job_title: string;
  department: string;
  hire_date: string;
  annual_salary: number;
  last_synced_at: string;
  hr_record_salesforce_id: string | null;
}

export default function PaylocityConsole() {
  const [credentials, setCredentials] = useState<PaylocityCredentials | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [employees, setEmployees] = useState<PaylocityEmployee[]>([]);
  const [stats, setStats] = useState({
    total_employees: 0,
    active_employees: 0,
    linked_to_hr: 0,
    last_sync: null as string | null
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'employees' | 'logs'>('config');

  const [formData, setFormData] = useState({
    client_id: '',
    client_secret: '',
    company_id: '',
    api_url: 'https://api.paylocity.com/api/v2',
    is_active: false,
    sync_employees: true,
    sync_payroll: true,
    sync_benefits: true,
    sync_time_off: true
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: creds } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('service_name', 'paylocity')
        .maybeSingle();

      if (creds) {
        setCredentials(creds);
        setFormData({
          client_id: creds.credentials.client_id || '',
          client_secret: creds.credentials.client_secret || '',
          company_id: creds.credentials.company_id || '',
          api_url: creds.credentials.api_url || 'https://api.paylocity.com/api/v2',
          is_active: creds.is_active || false,
          sync_employees: creds.config.sync_employees ?? true,
          sync_payroll: creds.config.sync_payroll ?? true,
          sync_benefits: creds.config.sync_benefits ?? true,
          sync_time_off: creds.config.sync_time_off ?? true
        });
      }

      const { data: logs } = await supabase
        .from('paylocity_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (logs) setSyncLogs(logs);

      const { data: emps } = await supabase
        .from('paylocity_employees')
        .select('*')
        .order('last_synced_at', { ascending: false })
        .limit(100);

      if (emps) {
        setEmployees(emps);
        const active = emps.filter(e => e.employment_status === 'Active' || e.employment_status === 'active').length;
        const linked = emps.filter(e => e.hr_record_salesforce_id).length;
        const lastSync = logs?.[0]?.completed_at || null;

        setStats({
          total_employees: emps.length,
          active_employees: active,
          linked_to_hr: linked,
          last_sync: lastSync
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  }

  async function saveCredentials() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('api_credentials')
        .update({
          credentials: {
            client_id: formData.client_id,
            client_secret: formData.client_secret,
            company_id: formData.company_id,
            api_url: formData.api_url
          },
          config: {
            sync_employees: formData.sync_employees,
            sync_payroll: formData.sync_payroll,
            sync_benefits: formData.sync_benefits,
            sync_time_off: formData.sync_time_off
          },
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('service_name', 'paylocity');

      if (error) throw error;

      alert('Paylocity credentials saved successfully!');
      await loadData();
    } catch (error: any) {
      alert(`Error saving credentials: ${error.message}`);
    }
    setSaving(false);
  }

  async function testConnection() {
    if (!formData.client_id || !formData.client_secret || !formData.company_id) {
      alert('Please fill in all required fields');
      return;
    }

    setTesting(true);
    try {
      await saveCredentials();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paylocity-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        alert(`Connection successful! Found ${result.total_employees} employees.`);
        await loadData();
      } else {
        alert(`Connection failed: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Test failed: ${error.message}`);
    }
    setTesting(false);
  }

  async function syncEmployees() {
    setSyncing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paylocity-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        alert(`Sync complete! Synced ${result.employees_synced} employees. Failed: ${result.employees_failed}`);
        await loadData();
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Sync failed: ${error.message}`);
    }
    setSyncing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Paylocity Integration</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage HR and payroll data synchronization with Paylocity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {credentials?.is_connected && (
            <span className="flex items-center text-sm text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              Connected
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_employees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active_employees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Database className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Linked to HR</p>
              <p className="text-2xl font-bold text-gray-900">{stats.linked_to_hr}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Last Sync</p>
              <p className="text-sm font-bold text-gray-900">
                {stats.last_sync ? new Date(stats.last_sync).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('config')}
              className={`${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              Configuration
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`${
                activeTab === 'employees'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              Employees ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              Sync Logs
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client ID</label>
                  <input
                    type="text"
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter Paylocity Client ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Secret</label>
                  <input
                    type="password"
                    value={formData.client_secret}
                    onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter Paylocity Client Secret"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Company ID</label>
                  <input
                    type="text"
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter Paylocity Company ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">API URL</label>
                  <input
                    type="text"
                    value={formData.api_url}
                    onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Paylocity Integration</span>
                </label>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Sync Options</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sync_employees}
                      onChange={(e) => setFormData({ ...formData, sync_employees: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Sync Employee Data</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sync_payroll}
                      onChange={(e) => setFormData({ ...formData, sync_payroll: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Sync Payroll Data</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sync_benefits}
                      onChange={(e) => setFormData({ ...formData, sync_benefits: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Sync Benefits Data</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sync_time_off}
                      onChange={(e) => setFormData({ ...formData, sync_time_off: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Sync Time Off Data</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={saveCredentials}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
                <button
                  onClick={testConnection}
                  disabled={testing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={syncEmployees}
                  disabled={syncing || !credentials?.is_active}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
                >
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linked</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((emp) => (
                    <tr key={emp.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {emp.first_name} {emp.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.job_title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            emp.employment_status === 'Active' || emp.employment_status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {emp.employment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {emp.hr_record_salesforce_id ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              {syncLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {log.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : log.status === 'failed' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.sync_type} - {log.status}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(log.started_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Processed: {log.records_processed} | Created: {log.records_created} | Failed: {log.records_failed}
                      </p>
                    </div>
                  </div>
                  {log.error_message && (
                    <div className="mt-2 flex items-start space-x-2 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{log.error_message}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
