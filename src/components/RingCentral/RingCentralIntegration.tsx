import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, MessageSquare, Users, Settings, Wifi, WifiOff, Clock, CheckCircle } from 'lucide-react';
import { ringCentralService } from '../../lib/ringcentral';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CallRecord {
  id: string;
  direction: 'Inbound' | 'Outbound';
  from: { phoneNumber: string; name?: string };
  to: { phoneNumber: string; name?: string };
  startTime: string;
  duration: number;
  result: string;
  action?: string;
}

interface RingCentralIntegrationProps {
  onCreateActivity?: (callData: CallRecord) => void;
}

export function RingCentralIntegration({ onCreateActivity }: RingCentralIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [presence, setPresence] = useState<any>(null);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    extension: ''
  });
  const [showSettings, setShowSettings] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    // Check if already authenticated
    checkAuthStatus();
    
    // Load recent call history if connected
    if (isConnected) {
      loadCallHistory();
      loadPresence();
    }
  }, [isConnected]);

  const checkAuthStatus = async () => {
    // Check if we have stored credentials or active session
    const storedAuth = localStorage.getItem('ringcentral_auth');
    if (storedAuth) {
      setIsConnected(true);
    }
  };

  const handleConnect = async () => {
    if (!credentials.username || !credentials.password) {
      alert('Please enter your RingCentral credentials');
      return;
    }

    setIsConnecting(true);
    try {
      const result = await ringCentralService.authenticate(
        credentials.username,
        credentials.password,
        credentials.extension
      );

      if (result.success) {
        setIsConnected(true);
        setShowSettings(false);
        localStorage.setItem('ringcentral_auth', 'true');
        
        // Load initial data
        await loadCallHistory();
        await loadPresence();
        
        alert('Successfully connected to RingCentral!');
      } else {
        alert('Failed to connect to RingCentral. Please check your credentials.');
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Connection failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const loadCallHistory = async () => {
    try {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const callLog = await ringCentralService.getCallLog(
        lastWeek.toISOString(),
        today.toISOString()
      );
      
      setCallHistory(callLog.records || []);
    } catch (error) {
      console.error('Error loading call history:', error);
    }
  };

  const loadPresence = async () => {
    try {
      const presenceData = await ringCentralService.getPresence();
      setPresence(presenceData);
    } catch (error) {
      console.error('Error loading presence:', error);
    }
  };

  const createActivityFromCall = async (call: CallRecord) => {
    if (!profile?.organization_id) return;

    try {
      // Try to find existing contact by phone number
      const phoneNumber = call.direction === 'Inbound' ? call.from.phoneNumber : call.to.phoneNumber;
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, account_id')
        .eq('organization_id', profile.organization_id)
        .or(`phone.eq."${phoneNumber}",mobile.eq."${phoneNumber}"`);

      const contact = contacts?.[0];

      // Create activity record
      const activityData = {
        organization_id: profile.organization_id,
        type: 'call',
        subject: `${call.direction} call - ${call.from.phoneNumber}`,
        description: `Call ${call.result.toLowerCase()} • Duration: ${Math.round(call.duration / 60)} minutes`,
        status: 'completed',
        priority: 'normal',
        due_date: call.startTime,
        completed_at: new Date(new Date(call.startTime).getTime() + call.duration * 1000).toISOString(),
        contact_id: contact?.id || null,
        account_id: contact?.account_id || null,
        assigned_to: profile.id,
        created_by: profile.id
      };

      const { error } = await supabase
        .from('activities')
        .insert(activityData);

      if (error) throw error;

      // If no contact found, suggest creating one
      if (!contact && call.direction === 'Inbound') {
        const shouldCreateContact = confirm(
          `No contact found for ${phoneNumber}. Would you like to create a new contact?`
        );
        
        if (shouldCreateContact) {
          // You could open a modal here to create a new contact
          console.log('Should create contact for:', phoneNumber);
        }
      }

      alert('Call activity created successfully!');
      
      // Callback to parent component
      onCreateActivity?.(call);
      
    } catch (error) {
      console.error('Error creating activity from call:', error);
      alert('Failed to create activity. Please try again.');
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCallResultColor = (result: string) => {
    switch (result.toLowerCase()) {
      case 'call connected': return 'text-green-600 bg-green-100';
      case 'voicemail': return 'text-amber-600 bg-amber-100';
      case 'missed': return 'text-red-600 bg-red-100';
      case 'busy': return 'text-orange-600 bg-orange-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Connect RingCentral</h3>
          <p className="text-slate-600 mb-6">
            Integrate your phone system to automatically create CRM records from calls
          </p>
          
          {!showSettings ? (
            <button
              onClick={() => setShowSettings(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Setup Integration
            </button>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Username/Phone Number
                  </label>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Extension (optional)
                  </label>
                  <input
                    type="text"
                    value={credentials.extension}
                    onChange={(e) => setCredentials({...credentials, extension: e.target.value})}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="101"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Wifi className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">RingCentral Connected</h3>
              <p className="text-sm text-slate-600">
                Status: {presence?.presenceStatus || 'Available'} • 
                Extension: {credentials.extension || 'Main'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="text-slate-400 hover:text-slate-600 p-2"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Calls */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Recent Calls</h3>
            <button
              onClick={loadCallHistory}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-slate-200">
          {callHistory.slice(0, 10).map((call, index) => (
            <div key={index} className="p-4 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    call.direction === 'Inbound' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <PhoneCall className={`w-4 h-4 ${
                      call.direction === 'Inbound' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {call.direction === 'Inbound' ? call.from.phoneNumber : call.to.phoneNumber}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getCallResultColor(call.result)}`}>
                        {call.result}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {call.direction} • {formatDuration(call.duration)} • 
                      {new Date(call.startTime).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => createActivityFromCall(call)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 py-1 rounded text-sm font-medium"
                  >
                    Create Activity
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {callHistory.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <Phone className="w-12 h-12 mx-auto mb-3 text-slate-400" />
              <p>No recent calls found</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <PhoneCall className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Make Call</span>
          </button>
          <button className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <span className="font-medium">Send SMS</span>
          </button>
          <button className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Conference</span>
          </button>
        </div>
      </div>
    </div>
  );
}