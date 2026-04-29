import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Check, X, RefreshCw, Link as LinkIcon, Unlink, Plus, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OutlookConnection {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  last_sync_at: string;
}

interface Appointment {
  id: string;
  subject: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  status: string;
  synced_to_outlook: boolean;
  appointment_attendees: Array<{
    email: string;
    name: string;
    response_status: string;
  }>;
}

type ViewMode = 'today' | 'week' | 'month' | 'all';

export default function OutlookCalendarSync() {
  const [connection, setConnection] = useState<OutlookConnection | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [newAppointment, setNewAppointment] = useState({
    subject: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    attendees: '',
  });

  useEffect(() => {
    loadConnection();
    loadAppointments();

    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const email = urlParams.get('email');
    const error = urlParams.get('error');

    if (connected === 'true' && email) {
      alert(`Successfully connected Outlook Calendar for ${email}`);
      // Clean up URL
      window.history.replaceState({}, '', '/calendar');
      loadConnection();
      // Close popup if this is running in popup context
      if (window.opener) {
        window.close();
      }
    } else if (error) {
      alert('Failed to connect Outlook Calendar. Please try again.');
      window.history.replaceState({}, '', '/calendar');
      if (window.opener) {
        window.close();
      }
    }

    // Auto-sync every 15 minutes if connected
    const autoSyncInterval = setInterval(async () => {
      const { data } = await supabase
        .from('outlook_connections')
        .select('id')
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        // Silently sync in background
        syncFromOutlook(true);
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(autoSyncInterval);
  }, []);

  const loadConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('outlook_connections')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setConnection(data);
    } catch (error) {
      console.error('Error loading connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_attendees(*)
        `)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(20);

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const connectOutlook = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outlook-oauth?action=authorize`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      const result = await response.json();
      if (result.authUrl) {
        // Open in popup instead of redirecting entire page
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          result.authUrl,
          'Microsoft Login',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        // Poll for popup completion
        const checkPopup = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(checkPopup);
            setLoading(false);
            // Check if connection was successful
            setTimeout(() => {
              loadConnection();
              loadAppointments();
            }, 1000);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error connecting Outlook:', error);
      alert('Failed to connect Outlook. Please try again.');
      setLoading(false);
    }
  };

  const disconnectOutlook = async () => {
    if (!confirm('Are you sure you want to disconnect Outlook Calendar?')) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outlook-oauth?action=disconnect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        setConnection(null);
        alert('Outlook Calendar disconnected successfully');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const syncFromOutlook = async (silent = false) => {
    try {
      setSyncing(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outlook-sync?action=sync`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        if (!silent) {
          alert(result.message);
        }
        loadAppointments();
        loadConnection();
      }
    } catch (error) {
      console.error('Error syncing:', error);
      if (!silent) {
        alert('Failed to sync from Outlook. Please try again.');
      }
    } finally {
      setSyncing(false);
    }
  };

  const createAppointment = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create appointment
      const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          subject: newAppointment.subject,
          description: newAppointment.description,
          location: newAppointment.location,
          start_time: newAppointment.start_time,
          end_time: newAppointment.end_time,
          status: 'scheduled',
        })
        .select()
        .single();

      if (apptError) throw apptError;

      // Add attendees if provided
      if (newAppointment.attendees) {
        const attendeeEmails = newAppointment.attendees.split(',').map(e => e.trim());
        const attendeeData = attendeeEmails.map(email => ({
          appointment_id: appointment.id,
          email,
          name: email.split('@')[0],
        }));

        await supabase.from('appointment_attendees').insert(attendeeData);
      }

      // Sync to Outlook if connected
      if (connection) {
        const { data: { session } } = await supabase.auth.getSession();

        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outlook-sync?action=create`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ appointmentId: appointment.id }),
          }
        );
      }

      alert('Appointment created successfully!');
      setShowNewAppointment(false);
      setNewAppointment({
        subject: '',
        description: '',
        location: '',
        start_time: '',
        end_time: '',
        attendees: '',
      });
      loadAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to create appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outlook-sync?action=delete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ appointmentId }),
        }
      );

      alert('Appointment deleted successfully');
      loadAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment. Please try again.');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getFilteredAppointments = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const monthFromNow = new Date(today);
    monthFromNow.setMonth(monthFromNow.getMonth() + 1);

    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);

      switch (viewMode) {
        case 'today':
          return aptDate.toDateString() === today.toDateString();
        case 'week':
          return aptDate >= today && aptDate < weekFromNow;
        case 'month':
          return aptDate >= today && aptDate < monthFromNow;
        case 'all':
        default:
          return true;
      }
    });
  };

  const groupAppointmentsByDate = (appointments: Appointment[]) => {
    const grouped: { [key: string]: Appointment[] } = {};

    appointments.forEach(apt => {
      const dateKey = new Date(apt.start_time).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(apt);
    });

    return Object.entries(grouped).sort(([dateA], [dateB]) =>
      new Date(dateA).getTime() - new Date(dateB).getTime()
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const filteredAppointments = getFilteredAppointments();
  const groupedAppointments = groupAppointmentsByDate(filteredAppointments);

  return (
    <div className="space-y-4">
      {/* Header with Connection Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Calendar</h2>
              </div>

              {connection ? (
                <div className="flex items-center space-x-3 text-sm">
                  <div className="flex items-center space-x-1.5 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">{connection.email}</span>
                  </div>
                  {connection.last_sync_at && (
                    <span className="text-gray-500">
                      Synced {new Date(connection.last_sync_at).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  Not connected
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {connection && (
                <button
                  onClick={syncFromOutlook}
                  disabled={syncing}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-1.5"
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing...' : 'Sync'}</span>
                </button>
              )}
              <button
                onClick={() => setShowNewAppointment(!showNewAppointment)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </button>
              {connection ? (
                <button
                  onClick={disconnectOutlook}
                  className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-1.5"
                >
                  <Unlink className="h-4 w-4" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  onClick={connectOutlook}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1.5"
                >
                  <LinkIcon className="h-4 w-4" />
                  <span>Connect Outlook</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Appointment Form */}
      {showNewAppointment && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Appointment</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={newAppointment.subject}
                onChange={(e) => setNewAppointment({ ...newAppointment, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Meeting subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newAppointment.description}
                onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Meeting details"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={newAppointment.start_time}
                  onChange={(e) => setNewAppointment({ ...newAppointment, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={newAppointment.end_time}
                  onChange={(e) => setNewAppointment({ ...newAppointment, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={newAppointment.location}
                onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Meeting location or online meeting link"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attendees</label>
              <input
                type="text"
                value={newAppointment.attendees}
                onChange={(e) => setNewAppointment({ ...newAppointment, attendees: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="email1@example.com, email2@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
            </div>
            <button
              onClick={createAppointment}
              disabled={!newAppointment.subject || !newAppointment.start_time || !newAppointment.end_time}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Create Appointment
            </button>
          </div>
        </div>
      )}

      {/* View Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="flex space-x-1">
              {[
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' },
                { key: 'all', label: 'All' },
              ].map(view => (
                <button
                  key={view.key}
                  onClick={() => setViewMode(view.key as ViewMode)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    viewMode === view.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-6">
        {groupedAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No appointments for this period</p>
            <button
              onClick={() => setShowNewAppointment(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Create your first appointment
            </button>
          </div>
        ) : (
          groupedAppointments.map(([dateKey, dayAppointments]) => (
            <div key={dateKey} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  {formatDate(dateKey)}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {dayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center space-x-2 text-sm font-medium text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                          </div>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{appointment.subject}</h4>
                        {appointment.description && (
                          <p className="text-sm text-gray-600 mb-2">{appointment.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {appointment.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{appointment.location}</span>
                            </div>
                          )}
                          {appointment.appointment_attendees && appointment.appointment_attendees.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-3.5 w-3.5" />
                              <span>{appointment.appointment_attendees.length} attendees</span>
                            </div>
                          )}
                          {appointment.synced_to_outlook && (
                            <span className="flex items-center space-x-1 text-green-600">
                              <Check className="h-3.5 w-3.5" />
                              <span>Synced</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteAppointment(appointment.id)}
                        className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
