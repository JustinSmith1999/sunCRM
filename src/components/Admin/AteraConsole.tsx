import React, { useState, useEffect } from 'react';
import { Settings, Check, X, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AteraConfig {
  id: string;
  api_key: string;
  api_url: string;
  is_active: boolean;
  last_sync_at: string | null;
}

export default function AteraConsole() {
  const [config, setConfig] = useState<AteraConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState({
    api_key: '',
    api_url: 'https://app.atera.com/api/v3',
    is_active: false,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('atera_config')
        .select('*')
        .single();

      if (data) {
        setConfig(data);
        setFormData({
          api_key: data.api_key,
          api_url: data.api_url,
          is_active: data.is_active,
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      if (config) {
        // Update existing
        const { error } = await supabase
          .from('atera_config')
          .update(formData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('atera_config')
          .insert([formData]);

        if (error) throw error;
      }

      await fetchConfig();
      setTestResult({ success: true, message: 'Configuration saved successfully' });
    } catch (error) {
      console.error('Error saving config:', error);
      setTestResult({ success: false, message: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      // Test API connection
      const response = await fetch(`${formData.api_url}/agents`, {
        headers: {
          'X-API-KEY': formData.api_key,
        },
      });

      if (response.ok) {
        setTestResult({ success: true, message: 'Successfully connected to Atera API' });
      } else {
        setTestResult({ success: false, message: `API returned status ${response.status}` });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to connect to Atera API' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atera Integration</h1>
          <p className="text-gray-600 mt-1">Configure Atera PSA integration for IT support tickets</p>
        </div>
        <a
          href="https://app.atera.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <span>Open Atera</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* API Configuration */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key *
                </label>
                <input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  required
                  placeholder="Enter your Atera API key"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from Atera Admin → API → Generate New API Key
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API URL *
                </label>
                <input
                  type="url"
                  value={formData.api_url}
                  onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                  required
                  placeholder="https://app.atera.com/api/v3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Enable Atera sync for new tickets
                </label>
              </div>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-4 rounded-lg flex items-center space-x-3 ${
                testResult.success
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {testResult.success ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !formData.api_key}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-2">How Atera Integration Works</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>New IT support tickets are automatically synced to Atera</li>
              <li>Ticket status updates are reflected in both systems</li>
              <li>Comments are synced to keep all information in one place</li>
              <li>Users see their tickets in the portal, techs manage them in Atera</li>
              <li>All sync activity is logged for troubleshooting</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Instructions</h3>
        <ol className="space-y-3 text-sm text-gray-700">
          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <div>
              <strong>Get Your API Key:</strong> Log into Atera, go to Admin → API → Generate New API Key
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <div>
              <strong>Enter Configuration:</strong> Paste your API key above and verify the API URL
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <div>
              <strong>Test Connection:</strong> Click "Test Connection" to verify the integration
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <div>
              <strong>Enable Sync:</strong> Check "Enable Atera sync" and save configuration
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
            <div>
              <strong>Done!</strong> New IT tickets will automatically sync to Atera
            </div>
          </li>
        </ol>
      </div>

      {/* Current Status */}
      {config && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className="text-base font-semibold text-gray-900 mt-1">
                {config.is_active ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-gray-600">Inactive</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Last Sync</div>
              <div className="text-base font-semibold text-gray-900 mt-1">
                {config.last_sync_at
                  ? new Date(config.last_sync_at).toLocaleString()
                  : 'Never'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
