import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';

export default function EgnyteOAuthSetup() {
  const [setupMode, setSetupMode] = useState<'choose' | 'oauth' | 'apikey'>('choose');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [domain, setDomain] = useState('sunation');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [existingConfig, setExistingConfig] = useState<any>(null);

  useEffect(() => {
    checkExistingConfig();

    // Check if we're returning from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      handleOAuthCallback(code);
    }
  }, []);

  async function checkExistingConfig() {
    const { data } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('service_name', 'egnyte')
      .maybeSingle();

    if (data) {
      setExistingConfig(data);
      const creds = typeof data.credentials === 'string'
        ? JSON.parse(data.credentials)
        : data.credentials;

      if (creds.client_id) setClientId(creds.client_id);
      if (creds.domain) setDomain(creds.domain.replace('.egnyte.com', ''));
    }
  }

  async function connectWithAPIKey() {
    if (!apiKey || !apiSecret || !domain) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setStatus('connecting');
    setErrorMessage('');

    try {
      // Test the API key first
      const testResponse = await fetch(
        `https://${domain}.egnyte.com/pubapi/v1/userinfo`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      if (!testResponse.ok) {
        throw new Error('Invalid API key or Egnyte returned an error');
      }

      // Save credentials
      await supabase.from('api_credentials').upsert({
        service_name: 'egnyte',
        credentials: {
          api_key: apiKey,
          api_secret: apiSecret,
          domain: `${domain}.egnyte.com`,
          auth_type: 'api_key'
        },
        config: {
          base_path: '/Shared/CRM'
        },
        access_token: apiKey,
        is_active: true,
        last_sync: new Date().toISOString()
      });

      setStatus('success');
      setTimeout(() => window.location.reload(), 1500);

    } catch (error: any) {
      console.error('API Key connection error:', error);
      setErrorMessage(error.message);
      setStatus('error');
    }
  }

  async function startOAuthFlow() {
    if (!clientId || !clientSecret || !domain) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setStatus('connecting');
    setErrorMessage('');

    try {
      const redirectUri = `${window.location.origin}/admin`;

      // Save credentials first
      await supabase.from('api_credentials').upsert({
        service_name: 'egnyte',
        credentials: {
          client_id: clientId,
          client_secret: clientSecret,
          domain: `${domain}.egnyte.com`
        },
        config: {
          base_path: '/Shared/CRM',
          redirect_uri: redirectUri
        },
        is_active: false // Will activate after OAuth completes
      });

      // Get auth URL from edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/egnyte-oauth/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            clientId,
            domain,
            redirectUri
          })
        }
      );

      const { authUrl } = await response.json();

      // Redirect to Egnyte
      window.location.href = authUrl;

    } catch (error: any) {
      console.error('OAuth start error:', error);
      setErrorMessage(error.message);
      setStatus('error');
    }
  }

  async function handleOAuthCallback(code: string) {
    setStatus('connecting');

    try {
      // Get stored credentials
      const { data: creds } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('service_name', 'egnyte')
        .single();

      if (!creds) {
        throw new Error('No credentials found');
      }

      const credentials = typeof creds.credentials === 'string'
        ? JSON.parse(creds.credentials)
        : creds.credentials;

      const config = typeof creds.config === 'string'
        ? JSON.parse(creds.config)
        : creds.config;

      // Exchange code for token
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/egnyte-oauth/callback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            code,
            clientId: credentials.client_id,
            clientSecret: credentials.client_secret,
            domain: credentials.domain.replace('.egnyte.com', ''),
            redirectUri: config.redirect_uri
          })
        }
      );

      const tokens = await response.json();

      if (tokens.error) {
        throw new Error(tokens.error);
      }

      // Save tokens
      await supabase
        .from('api_credentials')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          is_active: true,
          last_sync: new Date().toISOString()
        })
        .eq('service_name', 'egnyte');

      setStatus('success');

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);

      // Reload to show connected state
      setTimeout(() => window.location.reload(), 2000);

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      setErrorMessage(error.message);
      setStatus('error');
    }
  }

  async function testConnection() {
    try {
      const { data } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('service_name', 'egnyte')
        .single();

      const response = await fetch(
        `https://${domain}.egnyte.com/pubapi/v1/userinfo`,
        {
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        }
      );

      if (response.ok) {
        alert('✅ Connection successful!');
      } else {
        alert('❌ Connection failed - token may be expired');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  }

  if (existingConfig?.access_token) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="text-green-500" size={24} />
          <div>
            <h3 className="text-lg font-semibold">Egnyte Connected</h3>
            <p className="text-sm text-gray-600">
              Domain: {domain}.egnyte.com
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={testConnection}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Connection
          </button>
          <button
            onClick={() => setExistingConfig(null)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  if (setupMode === 'choose') {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Connect Egnyte</h3>
        <p className="text-gray-600 mb-6">Choose how you want to connect:</p>

        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => setSetupMode('apikey')}
            className="p-6 border-2 border-green-200 bg-green-50 rounded-lg hover:border-green-400 text-left group"
          >
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">API Key (Recommended)</h4>
                <p className="text-sm text-gray-600">Works immediately - no waiting for approval</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>✓ Instant setup</div>
              <div>✓ No redirect URI needed</div>
              <div>✓ Perfect for testing</div>
            </div>
          </button>

          <button
            onClick={() => setSetupMode('oauth')}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-gray-400 text-left"
          >
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">OAuth</h4>
                <p className="text-sm text-gray-600">Requires approval from Egnyte</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Needs redirect URI</div>
              <div>• Wait for approval</div>
              <div>• More secure for production</div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (setupMode === 'apikey') {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Connect with API Key</h3>
          <button
            onClick={() => setSetupMode('choose')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Egnyte Domain
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="sunation"
                className="flex-1 px-3 py-2 border rounded"
              />
              <span className="text-gray-500">.egnyte.com</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="The long Key value from your screenshot"
              className="w-full px-3 py-2 border rounded font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Secret
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="The Secret value from your screenshot"
              className="w-full px-3 py-2 border rounded font-mono text-sm"
            />
          </div>
        </div>

        {status === 'success' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded flex items-start gap-2">
            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
            <span className="text-sm text-green-700">Connected successfully!</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <span className="text-sm text-red-700">{errorMessage}</span>
          </div>
        )}

        <button
          onClick={connectWithAPIKey}
          disabled={status === 'connecting'}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          {status === 'connecting' ? 'Connecting...' : 'Connect Now'}
        </button>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="font-medium mb-2">From your screenshot, copy:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-700">
            <li>The long <strong>Key</strong> string (starts with 8qNJ...)</li>
            <li>The long <strong>Secret</strong> string (starts with gaT0...)</li>
            <li>Paste them above and click Connect</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Connect Egnyte (OAuth)</h3>
        <button
          onClick={() => setSetupMode('choose')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Egnyte Domain
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="sunation"
              className="flex-1 px-3 py-2 border rounded"
            />
            <span className="text-gray-500">.egnyte.com</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client ID
          </label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="From Egnyte Developer Portal"
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client Secret
          </label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="From Egnyte Developer Portal"
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <span className="text-sm text-red-700">{errorMessage}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={startOAuthFlow}
          disabled={status === 'connecting'}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {status === 'connecting' ? (
            'Connecting...'
          ) : (
            <>
              <ExternalLink size={18} />
              Connect to Egnyte
            </>
          )}
        </button>

        <a
          href="https://developers.egnyte.com/member/register"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Get Egnyte Developer Account
        </a>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
        <p className="font-medium mb-2">Setup Instructions:</p>
        <ol className="list-decimal list-inside space-y-1 text-gray-700">
          <li>Create an app in Egnyte Developer Portal</li>
          <li>Set redirect URI to: <code className="bg-white px-1">{window.location.origin}/admin</code></li>
          <li>Copy Client ID and Client Secret above</li>
          <li>Click "Connect to Egnyte"</li>
        </ol>
      </div>
    </div>
  );
}
