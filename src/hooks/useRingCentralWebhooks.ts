import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CallEvent {
  eventType: string;
  body: {
    telephonySessionId: string;
    direction: 'Inbound' | 'Outbound';
    from: { phoneNumber: string; name?: string };
    to: { phoneNumber: string; name?: string };
    telephonyStatus: string;
    startTime: string;
    duration?: number;
  };
}

export function useRingCentralWebhooks() {
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile?.organization_id) return;

    // Listen for RingCentral webhook events via Supabase realtime
    const channel = supabase
      .channel('ringcentral-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ringcentral_events',
          filter: `organization_id=eq.${profile.organization_id}`
        },
        (payload) => {
          handleCallEvent(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const handleCallEvent = async (event: CallEvent) => {
    if (!profile?.organization_id) return;

    try {
      // Only process completed calls
      if (event.body.telephonyStatus !== 'CallConnected') return;

      const phoneNumber = event.body.direction === 'Inbound' 
        ? event.body.from.phoneNumber 
        : event.body.to.phoneNumber;

      // Try to find existing contact
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, account_id, accounts(name)')
        .eq('organization_id', profile.organization_id)
        .or(`phone.eq."${phoneNumber}",mobile.eq."${phoneNumber}"`);

      const contact = contacts?.[0];

      // Auto-create activity for the call
      const activityData = {
        organization_id: profile.organization_id,
        type: 'call' as const,
        subject: contact 
          ? `${event.body.direction} call with ${contact.first_name} ${contact.last_name}`
          : `${event.body.direction} call - ${phoneNumber}`,
        description: `Call duration: ${event.body.duration ? Math.round(event.body.duration / 60) : 0} minutes`,
        status: 'completed' as const,
        priority: 'normal' as const,
        due_date: event.body.startTime,
        completed_at: event.body.duration 
          ? new Date(new Date(event.body.startTime).getTime() + event.body.duration * 1000).toISOString()
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

      // Show notification
      const notification = {
        organization_id: profile.organization_id,
        user_id: profile.id,
        title: 'Call Activity Created',
        message: contact 
          ? `Call with ${contact.first_name} ${contact.last_name} logged automatically`
          : `Call with ${phoneNumber} logged automatically`,
        type: 'info' as const,
        entity_type: 'activity',
        entity_id: null // We'd need the inserted activity ID
      };

      await supabase
        .from('notifications')
        .insert(notification);

    } catch (error) {
      console.error('Error handling call event:', error);
    }
  };

  return {
    // Return any utilities needed by components
  };
}