import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, Clock, User, Building2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CallEvent {
  id: string;
  direction: string;
  from_number: string;
  to_number: string;
  status: string;
  start_time: string;
  duration: number | null;
  processed: boolean;
  created_at: string;
}

interface CallHistoryWidgetProps {
  onCreateActivity?: (callEvent: CallEvent) => void;
}

export function CallHistoryWidget({ onCreateActivity }: CallHistoryWidgetProps) {
  const [callEvents, setCallEvents] = useState<CallEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    loadCallEvents();
    
    // Subscribe to real-time call events
    const channel = supabase
      .channel('call-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ringcentral_events',
          filter: `organization_id=eq.${profile?.organization_id}`
        },
        (payload) => {
          setCallEvents(prev => [payload.new as CallEvent, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const loadCallEvents = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('ringcentral_events')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setCallEvents(data || []);
    } catch (error) {
      console.error('Error loading call events:', error);
    } finally {
      setLoading(false);
    }
  };

  const createActivityFromCall = async (callEvent: CallEvent) => {
    if (!profile?.organization_id) return;

    try {
      // Try to find existing contact by phone number
      const phoneNumber = callEvent.direction === 'Inbound' ? callEvent.from_number : callEvent.to_number;
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
        subject: contact 
          ? `${callEvent.direction} call with ${contact.first_name} ${contact.last_name}`
          : `${callEvent.direction} call - ${phoneNumber}`,
        description: `Call duration: ${callEvent.duration ? Math.round(callEvent.duration / 60) : 0} minutes • Status: ${callEvent.status}`,
        status: 'completed',
        priority: 'normal',
        due_date: callEvent.start_time,
        completed_at: callEvent.duration 
          ? new Date(new Date(callEvent.start_time).getTime() + callEvent.duration * 1000).toISOString()
          : new Date().toISOString(),
        contact_id: contact?.id || null,
        account_id: contact?.account_id || null,
        assigned_to: profile.id,
        created_by: profile.id
      };

      const { error } = await supabase
        .from('activities')
        .insert(activityData);

      if (error) throw error;

      // Mark call event as processed
      await supabase
        .from('ringcentral_events')
        .update({ processed: true })
        .eq('id', callEvent.id);

      // Update local state
      setCallEvents(prev => 
        prev.map(event => 
          event.id === callEvent.id 
            ? { ...event, processed: true }
            : event
        )
      );

      alert('Call activity created successfully!');
      onCreateActivity?.(callEvent);
      
    } catch (error) {
      console.error('Error creating activity from call:', error);
      alert('Failed to create activity. Please try again.');
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCallIcon = (direction: string) => {
    return direction === 'Inbound' ? (
      <PhoneCall className="w-4 h-4 text-blue-600" />
    ) : (
      <Phone className="w-4 h-4 text-green-600" />
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-slate-200 rounded w-32"></div>
                <div className="h-2 bg-slate-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Recent Calls</h3>
          <button
            onClick={loadCallEvents}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
        {callEvents.map((call) => (
          <div key={call.id} className="p-4 hover:bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  {getCallIcon(call.direction)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {call.direction === 'Inbound' ? call.from_number : call.to_number}
                    </span>
                    <span className="text-xs text-slate-500">
                      {call.direction}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    {formatDuration(call.duration)} • 
                    {new Date(call.start_time).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {!call.processed && (
                <button
                  onClick={() => createActivityFromCall(call)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Log
                </button>
              )}
            </div>
          </div>
        ))}
        
        {callEvents.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <Phone className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p>No recent calls</p>
            <p className="text-sm">Connect RingCentral to see call history</p>
          </div>
        )}
      </div>
    </div>
  );
}