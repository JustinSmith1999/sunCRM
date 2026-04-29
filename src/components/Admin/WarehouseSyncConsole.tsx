import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Download, Database } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SyncHistory {
  id: string;
  sync_started_at: string;
  sync_completed_at: string | null;
  status: string;
  file_name: string;
  file_path: string;
  records_processed: number;
  records_added: number;
  records_updated: number;
  records_skipped: number;
  error_message: string | null;
  sync_mode: string;
}

export default function WarehouseSyncConsole() {
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncHistory | null>(null);

  useEffect(() => {
    loadSyncHistory();
  }, []);

  const loadSyncHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('warehouse_sync_history')
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setSyncHistory(data || []);
      if (data && data.length > 0) {
        setLastSync(data[0]);
      }
    } catch (error) {
      console.error('Error loading sync history:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    try {
      setSyncing(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to sync warehouse data');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/warehouse-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        alert(`Sync completed successfully!\n\nRecords Processed: ${result.recordsProcessed}\nAdded: ${result.recordsAdded}\nUpdated: ${result.recordsUpdated}\nSkipped: ${result.recordsSkipped}`);
        loadSyncHistory();
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('Failed to trigger sync. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'In progress...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Warehouse Sync</h1>
              <p className="text-sm text-gray-500 mt-1">Sync inventory from Egnyte Excel file to database</p>
            </div>
          </div>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Sync Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Last Sync Status */}
      {lastSync && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Last Sync Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Last Synced</span>
              </div>
              <div className="text-sm text-gray-900">{formatDate(lastSync.sync_started_at)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Records Processed</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{lastSync.records_processed}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Added/Updated</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {lastSync.records_added + lastSync.records_updated}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Skipped</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{lastSync.records_skipped}</div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">How Warehouse Sync Works</h3>
            <p className="text-sm text-blue-700 mt-1">
              This system syncs inventory data from your Excel file on Egnyte
              (<strong>/Shared/Warehouse/Warehouse Pull Spreadsheet V28.xlsm</strong>) to the database.
              The Excel file is the master source. Any changes made in the database will be overwritten
              on the next sync.
            </p>
            <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
              <li>Click "Sync Now" to pull the latest data from Egnyte</li>
              <li>The sync automatically maps Excel columns to database fields</li>
              <li>Existing records are updated, new records are added</li>
              <li>All sync operations are logged in the history below</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sync History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Sync History</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading sync history...</div>
            </div>
          ) : syncHistory.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No sync history yet</p>
              <p className="text-sm text-gray-400 mt-1">Click "Sync Now" to start your first sync</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skipped</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {syncHistory.map((sync) => (
                  <tr key={sync.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(sync.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(sync.status)}`}>
                          {sync.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(sync.sync_started_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDuration(sync.sync_started_at, sync.sync_completed_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {sync.records_processed}
                    </td>
                    <td className="px-6 py-4 text-sm text-green-600 font-medium">
                      {sync.records_added}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 font-medium">
                      {sync.records_updated}
                    </td>
                    <td className="px-6 py-4 text-sm text-orange-600 font-medium">
                      {sync.records_skipped}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sync.file_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
