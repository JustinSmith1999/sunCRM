import React, { useState, useEffect } from 'react';
import { Phone, Wifi, WifiOff, Settings, LogOut, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ringCentralAPI } from '../../lib/ringCentralAPI';
import { OAuthCallback } from './OAuthCallback';

export function RingCentralSettings() {
  const { profile } = useAuth();
  const [credentials, setCredentials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCallback, setShowCallback] = useState(false);

  useEffect(() => {
    loadCredentials();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('code') && window.location.pathname.includes('ringcentral')) {
      setShowCallback(true);
    }
  }, [profile]);

  const loadCredentials = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const creds = await ringCentralAPI.getUserCredentials(profile.id);
      setCredentials(creds);
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (!profile) return;

    ringCentralAPI.setUser(profile.id, profile.organization_id);
    const loginUrl = ringCentralAPI.getLoginUrl();
    window.location.href = loginUrl;
  };

  const handleDisconnect = async () => {
    if (!profile || !confirm('Are you sure you want to disconnect RingCentral?')) return;

    try {
      await ringCentralAPI.disconnect(profile.id);
      setCredentials(null);
      alert('Disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect');
    }
  };

  if (showCallback) {
    return (
      <OAuthCallback
        onComplete={() => {
          setShowCallback(false);
          loadCredentials();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!credentials || !credentials.is_active) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Connect Your RingCentral Account</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Integrate your personal RingCentral account to automatically log calls,
            make calls directly from the CRM, and create leads and opportunities after calls.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto text-left">
            <h4 className="font-semibold text-blue-900 mb-2">What You'll Get:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Automatic call logging with contact matching</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Post-call workflow to create leads, notes, and opportunities</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Click-to-call from any CRM record</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>SMS messaging integration</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
          >
            <Phone className="w-5 h-5" />
            Connect RingCentral Account
          </button>

          <p className="text-xs text-slate-500 mt-4">
            You'll be redirected to RingCentral to authorize access
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Wifi className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">RingCentral Connected</h3>
              <p className="text-sm text-slate-600">
                Extension: {credentials.extension_number || 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="text-sm text-slate-600">Extension Number</p>
            <p className="font-medium text-slate-900">{credentials.extension_number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Phone Number</p>
            <p className="font-medium text-slate-900">{credentials.phone_number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Status</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Active
            </span>
          </div>
          <div>
            <p className="text-sm text-slate-600">Last Synced</p>
            <p className="font-medium text-slate-900">
              {credentials.last_sync_at
                ? new Date(credentials.last_sync_at).toLocaleString()
                : 'Never'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Integration Features
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-slate-900">Automatic Call Logging</span>
            </div>
            <span className="text-sm text-green-600">Enabled</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-slate-900">Post-Call Workflow</span>
            </div>
            <span className="text-sm text-green-600">Enabled</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-slate-900">Click-to-Call</span>
            </div>
            <span className="text-sm text-green-600">Enabled</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-slate-900">SMS Integration</span>
            </div>
            <span className="text-sm text-green-600">Enabled</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
        <p className="text-sm text-blue-800 mb-3">
          View the RingCentral integration documentation for setup instructions and troubleshooting.
        </p>
        <a
          href="https://developers.ringcentral.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
        >
          RingCentral Developer Portal
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
