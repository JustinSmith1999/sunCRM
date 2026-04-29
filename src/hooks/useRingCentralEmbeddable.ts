import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CallInfo {
  sessionId: string;
  direction: 'Inbound' | 'Outbound';
  telephonyStatus: string;
  from: { phoneNumber: string; name?: string };
  to: { phoneNumber: string; name?: string };
  startTime: number;
}

interface RingCentralEmbeddable {
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
  send: (message: { type: string; [key: string]: any }) => void;
}

declare global {
  interface Window {
    RCAdapter?: RingCentralEmbeddable;
  }
}

export function useRingCentralEmbeddable() {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [currentCall, setCurrentCall] = useState<CallInfo | null>(null);
  const [showPostCallModal, setShowPostCallModal] = useState(false);
  const [lastEndedCall, setLastEndedCall] = useState<CallInfo | null>(null);
  const adapterRef = useRef<RingCentralEmbeddable | null>(null);

  useEffect(() => {
    // Wait for RingCentral adapter to be ready
    const checkAdapter = setInterval(() => {
      if (window.RCAdapter && typeof window.RCAdapter.on === 'function') {
        adapterRef.current = window.RCAdapter;
        setIsReady(true);
        clearInterval(checkAdapter);
      }
    }, 500);

    // Stop checking after 10 seconds to prevent infinite interval
    const timeout = setTimeout(() => {
      clearInterval(checkAdapter);
    }, 10000);

    return () => {
      clearInterval(checkAdapter);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!isReady || !adapterRef.current || !user) return;

    const adapter = adapterRef.current;

    // Double-check adapter has required methods
    if (typeof adapter.on !== 'function' || typeof adapter.off !== 'function') {
      console.error('RingCentral adapter is missing required methods');
      return;
    }

    // Listen for call status changes
    const handleCallRing = (call: CallInfo) => {
      console.log('Call ringing:', call);
      setCurrentCall(call);
    };

    const handleCallStart = (call: CallInfo) => {
      console.log('Call started:', call);
      setCurrentCall(call);

      // Log call start to database
      logCallEvent(call, 'started');
    };

    const handleCallEnd = async (call: CallInfo) => {
      console.log('Call ended:', call);
      setLastEndedCall(call);
      setCurrentCall(null);

      // Log call end to database
      await logCallEvent(call, 'ended');

      // Show post-call modal after a short delay
      setTimeout(() => {
        setShowPostCallModal(true);
      }, 500);
    };

    try {
      // Register event listeners
      adapter.on('call-ring', handleCallRing);
      adapter.on('call-start', handleCallStart);
      adapter.on('call-end', handleCallEnd);

      return () => {
        try {
          adapter.off('call-ring', handleCallRing);
          adapter.off('call-start', handleCallStart);
          adapter.off('call-end', handleCallEnd);
        } catch (error) {
          console.error('Error removing RingCentral event listeners:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up RingCentral event listeners:', error);
    }
  }, [isReady, user]);

  const logCallEvent = async (call: CallInfo, status: string) => {
    if (!user) return;

    try {
      const phoneNumber = call.direction === 'Inbound'
        ? call.from.phoneNumber
        : call.to.phoneNumber;

      // Try to match phone number to existing contact
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, account_id')
        .or(`phone.eq."${phoneNumber}",mobile.eq."${phoneNumber}"`)
        .maybeSingle();

      // Create event record
      const eventData = {
        user_id: user.id,
        event_type: status === 'started' ? 'call.started' : 'call.ended',
        direction: call.direction.toLowerCase(),
        from_number: call.from.phoneNumber,
        to_number: call.to.phoneNumber,
        telephony_status: call.telephonyStatus,
        session_id: call.sessionId,
        start_time: new Date(call.startTime).toISOString(),
        contact_id: contact?.id || null,
        account_id: contact?.account_id || null,
        metadata: {
          fromName: call.from.name,
          toName: call.to.name,
        }
      };

      await supabase.from('ringcentral_events').insert(eventData);
    } catch (error) {
      console.error('Error logging call event:', error);
    }
  };

  const createLeadFromCall = async (leadData: {
    firstName: string;
    lastName: string;
    company?: string;
    phone: string;
    notes?: string;
  }) => {
    if (!user || !lastEndedCall) return;

    try {
      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          first_name: leadData.firstName,
          last_name: leadData.lastName,
          company: leadData.company || 'Unknown',
          phone: leadData.phone,
          status: 'new',
          source: 'Phone Call',
          notes: leadData.notes,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Link the call to the lead
      const { data: events } = await supabase
        .from('ringcentral_events')
        .select('id')
        .eq('session_id', lastEndedCall.sessionId)
        .maybeSingle();

      if (events) {
        await supabase
          .from('ringcentral_events')
          .update({ lead_id: lead.id })
          .eq('id', events.id);

        // Log post-call action
        await supabase.from('post_call_actions').insert({
          ringcentral_event_id: events.id,
          user_id: user.id,
          action_type: 'lead_created',
          entity_id: lead.id,
          entity_type: 'lead',
          notes: leadData.notes,
        });
      }

      return lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  };

  const saveCallNotes = async (notes: string, dispositionCode?: string) => {
    if (!user || !lastEndedCall) return;

    try {
      const { data: events } = await supabase
        .from('ringcentral_events')
        .select('id')
        .eq('session_id', lastEndedCall.sessionId)
        .maybeSingle();

      if (!events) return;

      const updateData: any = { call_notes: notes };

      // Find disposition by code if provided
      if (dispositionCode) {
        const { data: disposition } = await supabase
          .from('call_dispositions')
          .select('id')
          .eq('code', dispositionCode)
          .maybeSingle();

        if (disposition) {
          updateData.disposition_id = disposition.id;
        }
      }

      await supabase
        .from('ringcentral_events')
        .update(updateData)
        .eq('id', events.id);

      // Log post-call action
      await supabase.from('post_call_actions').insert({
        ringcentral_event_id: events.id,
        user_id: user.id,
        action_type: 'note_created',
        notes,
      });
    } catch (error) {
      console.error('Error saving call notes:', error);
      throw error;
    }
  };

  const closePostCallModal = () => {
    setShowPostCallModal(false);
    setLastEndedCall(null);
  };

  return {
    isReady,
    currentCall,
    showPostCallModal,
    lastEndedCall,
    createLeadFromCall,
    saveCallNotes,
    closePostCallModal,
  };
}
