import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Cloud, RefreshCw, CheckCircle, XCircle, Play, Webhook, Copy, ArrowLeftRight } from 'lucide-react';

export function SalesforceSync() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [syncJobs, setSyncJobs] = useState<any[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/salesforce-webhook`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(type);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  useEffect(() => {
    autoConnect();
  }, [profile]);

  const autoConnect = async () => {
    try {
      const { data: existingConfig } = await supabase
        .from('salesforce_sync_config')
        .select('*')
        .maybeSingle();

      if (!existingConfig) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/salesforce-auth?action=connect`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          console.log('Auto-connected to Salesforce');
        }
      }
    } catch (error) {
      console.error('Auto-connect error:', error);
    } finally {
      loadConfig();
      loadSyncJobs();
    }
  };

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('salesforce_sync_config')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading config:', error);
      }
      setConfig(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('salesforce_sync_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSyncJobs(data || []);
    } catch (error) {
      console.error('Error loading sync jobs:', error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/salesforce-auth?action=connect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        await loadConfig();
        await loadSyncJobs();
      } else {
        alert(data.error || 'Failed to connect to Salesforce. Check that credentials are configured in Supabase.');
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      alert(error?.message || 'Failed to connect to Salesforce');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (objectName: string, fullSync = false) => {
    setSyncing(true);
    try {
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/salesforce-sync`);
      url.searchParams.append('object', objectName);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sync failed with status:', response.status, errorText);
        alert(`Sync failed (${response.status}): ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log('Sync response:', data);

      if (data.success) {
        const objectResult = data.objects[objectName];
        if (objectResult) {
          alert(`Successfully synced ${objectName}:\n- Imported: ${objectResult.imported}\n- Total: ${objectResult.total}\n- Errors: ${objectResult.errors?.length || 0}`);
        } else {
          alert(`Sync completed for ${objectName}`);
        }
        loadSyncJobs();
      } else {
        const errorMessage = data.error || data.details || 'Unknown error';
        console.error('Sync failed:', data);
        alert(`Sync failed: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      alert(`Failed to sync data: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/salesforce-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sync failed with status:', response.status, errorText);
        alert(`Sync failed (${response.status}): ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log('Sync all response:', data);

      if (data.success) {
        alert(`Sync completed:\n- Total Imported: ${data.totalImported}\n- Total Updated: ${data.totalUpdated}\n- Errors: ${data.totalErrors}`);
        loadSyncJobs();
      } else {
        const errorMessage = data.error || data.details || 'Unknown error';
        console.error('Sync failed:', data);
        alert(`Sync failed: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      alert(`Failed to sync all objects: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-64 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Cloud className="w-7 h-7" />
            Salesforce Bidirectional Sync
          </h1>
          <p className="text-slate-600 mt-1">
            Two-way sync: Pull data from Salesforce and receive real-time webhook pushes
          </p>
        </div>
      </div>

      {!config ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <RefreshCw className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Connecting to Salesforce...
          </h2>
          <p className="text-slate-600 mb-6">
            Automatically establishing connection using configured credentials
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            <Cloud className="w-5 h-5" />
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">Connected</h3>
                  <p className="text-sm text-slate-600">{config.salesforce_instance_url}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSyncAll}
                  disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  Sync All Objects
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowLeftRight className="w-5 h-5 text-slate-700" />
              <h3 className="font-semibold text-slate-900">Bidirectional Sync</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h4 className="font-medium text-slate-900">Pull Sync</h4>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Active</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">
                  Supabase pulls data FROM Salesforce (manual or scheduled)
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h4 className="font-medium text-slate-900">Push Sync (Webhook)</h4>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Setup Required</span>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Salesforce pushes changes TO Supabase in real-time
                </p>

                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Platform Events (Recommended)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${webhookUrl}?type=platform_event`}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm font-mono bg-white"
                      />
                      <button
                        onClick={() => copyToClipboard(`${webhookUrl}?type=platform_event`, 'platform')}
                        className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedUrl === 'platform' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Outbound Messages (Legacy)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${webhookUrl}?type=outbound_message`}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm font-mono bg-white"
                      />
                      <button
                        onClick={() => copyToClipboard(`${webhookUrl}?type=outbound_message`, 'outbound')}
                        className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedUrl === 'outbound' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Change Data Capture</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${webhookUrl}?type=change_data_capture`}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm font-mono bg-white"
                      />
                      <button
                        onClick={() => copyToClipboard(`${webhookUrl}?type=change_data_capture`, 'cdc')}
                        className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded text-sm"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedUrl === 'cdc' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <a
                      href="/SALESFORCE-BIDIRECTIONAL-SYNC.md"
                      target="_blank"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Webhook className="w-4 h-4" />
                      View Setup Instructions
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">Salesforce Objects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {['Lead', 'Account', 'Contact', 'Opportunity', 'User'].map((obj) => {
                const pluralMap: Record<string, string> = {
                  'Lead': 'Leads',
                  'Account': 'Accounts',
                  'Contact': 'Contacts',
                  'Opportunity': 'Opportunities',
                  'User': 'Users'
                };
                return (
                  <div key={obj} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <span className="font-medium text-slate-900">{pluralMap[obj]}</span>
                    <button
                      onClick={() => handleSync(obj)}
                      disabled={syncing}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" />
                      Sync
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Recent Sync Jobs</h3>
            <div className="space-y-2">
              {syncJobs.length === 0 ? (
                <p className="text-slate-600 text-center py-8">No sync jobs yet</p>
              ) : (
                syncJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      {job.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {job.status === 'failed' && <XCircle className="w-5 h-5 text-red-600" />}
                      {job.status === 'running' && <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />}
                      <div>
                        <p className="font-medium text-slate-900 capitalize">{job.job_type} Sync</p>
                        <p className="text-sm text-slate-600">
                          {new Date(job.started_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">{job.total_records_synced} records</p>
                      <p className="text-sm text-slate-600">{job.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
