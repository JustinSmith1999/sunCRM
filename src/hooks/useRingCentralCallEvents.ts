import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CallEvent {
  id: string;
  direction: string;
  from_number: string;
  to_number: string;
  status: string;
  start_time: string;
  duration: number | null;
  processed: boolean;
  contact_id?: string | null;
  account_id?: string | null;
  lead_id?: string | null;
  user_id?: string | null;
}

export function useRingCentralCallEvents() {
  const { profile } = useAuth();
  const [pendingCallEvent, setPendingCallEvent] = useState<CallEvent | null>(null);
  const [showPostCallModal, setShowPostCallModal] = useState(false);

  useEffect(() => {
    if (!profile?.organization_id) return;

    const channel = supabase
      .channel('ringcentral-call-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ringcentral_events',
          filter: `organization_id=eq.${profile.organization_id}`
        },
        async (payload) => {
          const callEvent = payload.new as CallEvent;

          if (callEvent.status === 'CallConnected' || callEvent.status === 'Disconnected') {
            if (callEvent.user_id === profile.id && !callEvent.processed) {
              await matchContact(callEvent);

              setPendingCallEvent(callEvent);
              setShowPostCallModal(true);
            }
          }
        }
      )
      .subscribe();

    loadUnprocessedCalls();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const matchContact = async (callEvent: CallEvent) => {
    if (!profile?.organization_id) return;

    const phoneNumber = callEvent.direction === 'Inbound'
      ? callEvent.from_number
      : callEvent.to_number;

    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, account_id')
      .eq('organization_id', profile.organization_id)
      .or(`phone.eq."${phoneNumber}",mobile.eq."${phoneNumber}"`)
      .maybeSingle();

    if (contacts) {
      await supabase
        .from('ringcentral_events')
        .update({
          contact_id: contacts.id,
          account_id: contacts.account_id
        })
        .eq('id', callEvent.id);

      if (pendingCallEvent?.id === callEvent.id) {
        setPendingCallEvent({
          ...callEvent,
          contact_id: contacts.id,
          account_id: contacts.account_id
        });
      }
    }
  };

  const loadUnprocessedCalls = async () => {
    if (!profile?.organization_id || !profile?.id) return;

    const { data } = await supabase
      .from('ringcentral_events')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('user_id', profile.id)
      .eq('processed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setPendingCallEvent(data);
      setShowPostCallModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowPostCallModal(false);
    setPendingCallEvent(null);
  };

  const handleActionComplete = () => {
    setShowPostCallModal(false);
    setPendingCallEvent(null);
  };

  return {
    pendingCallEvent,
    showPostCallModal,
    handleCloseModal,
    handleActionComplete
  };
}
