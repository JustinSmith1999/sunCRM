import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ringCentralAPI } from '../../lib/ringCentralAPI';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

interface OAuthCallbackProps {
  onComplete: () => void;
}

export function OAuthCallback({ onComplete }: OAuthCallbackProps) {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting to RingCentral...');
  const { profile } = useAuth();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Authentication failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        return;
      }

      if (!profile) {
        setStatus('error');
        setMessage('User profile not loaded');
        return;
      }

      ringCentralAPI.setUser(profile.id, profile.organization_id);
      await ringCentralAPI.handleCallback(code);

      setStatus('success');
      setMessage('Successfully connected to RingCentral!');

      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage('Failed to connect. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Connecting...</h3>
              <p className="text-slate-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Success!</h3>
              <p className="text-slate-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Connection Failed</h3>
              <p className="text-slate-600 mb-4">{message}</p>
              <button
                onClick={onComplete}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
