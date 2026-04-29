import React, { useState, useEffect } from 'react';
import { Calendar, ArrowLeft, Plus, Clock, MapPin, AlertCircle, CheckCircle, Phone, Mail, Video, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Technician {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  specialties: string[];
  employment_status: string;
}

interface ServiceTicket {
  id: string;
  ticket_number: string;
  title: string;
  service_type: string;
  priority: string;
  status: string;
  scheduled_date: string;
  scheduled_time_start: string;
  scheduled_time_end: string;
  service_location: string;
  estimated_cost: number;
  description: string;
  service_customers: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    address: string;
  } | null;
}

interface OutlookAppointment {
  id: string;
  subject: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  meeting_link: string;
  appointment_attendees: Array<{
    email: string;
    name: string;
  }>;
}

interface CalendarEvent {
  id: string;
  type: 'service_ticket' | 'appointment';
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  priority?: string;
  status?: string;
  data: ServiceTicket | OutlookAppointment;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
  address: string;
}

interface NewTicket {
  customer_id: string;
  service_type: string;
  title: string;
  description: string;
  scheduled_date: string;
  scheduled_time_start: string;
  scheduled_time_end: string;
  priority: string;
  service_location: string;
}

interface TechnicianScheduleViewProps {
  technician: Technician;
  onBack: () => void;
}

export default function TechnicianScheduleView({ technician, onBack }: TechnicianScheduleViewProps) {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [appointments, setAppointments] = useState<OutlookAppointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hasOutlookConnection, setHasOutlookConnection] = useState(false);

  const [newTicket, setNewTicket] = useState<NewTicket>({
    customer_id: '',
    service_type: '',
    title: '',
    description: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time_start: '09:00',
    scheduled_time_end: '10:00',
    priority: 'normal',
    service_location: ''
  });

  useEffect(() => {
    loadTickets();
    loadOutlookAppointments();
    loadCustomers();
  }, [technician.id]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_tickets')
        .select(`
          *,
          service_customers (
            first_name,
            last_name,
            phone,
            email,
            address
          )
        `)
        .eq('assigned_technician_id', technician.id)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time_start', { ascending: true });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOutlookAppointments = async () => {
    try {
      // Find user by matching technician email
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', technician.email)
        .maybeSingle();

      if (!userData?.user_id) {
        console.log('No user account found for technician email:', technician.email);
        return;
      }

      // Check if user has Outlook connection
      const { data: outlookConnection } = await supabase
        .from('outlook_connections')
        .select('id')
        .eq('user_id', userData.user_id)
        .eq('is_active', true)
        .maybeSingle();

      setHasOutlookConnection(!!outlookConnection);

      if (!outlookConnection) {
        console.log('No active Outlook connection for this technician');
        return;
      }

      // Load appointments for this user
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_attendees(email, name)
        `)
        .eq('user_id', userData.user_id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error loading Outlook appointments:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('service_customers')
        .select('id, first_name, last_name, company_name, phone, address')
        .eq('account_status', 'active')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const generateTicketNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TKT-${year}${month}-${random}`;
  };

  const createTicket = async () => {
    if (!newTicket.customer_id || !newTicket.title || !newTicket.service_type) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const ticketData = {
        ticket_number: generateTicketNumber(),
        customer_id: newTicket.customer_id,
        assigned_technician_id: technician.id,
        service_type: newTicket.service_type,
        title: newTicket.title,
        description: newTicket.description,
        scheduled_date: newTicket.scheduled_date,
        scheduled_time_start: newTicket.scheduled_time_start,
        scheduled_time_end: newTicket.scheduled_time_end,
        priority: newTicket.priority,
        service_location: newTicket.service_location,
        status: 'scheduled'
      };

      const { error } = await supabase
        .from('service_tickets')
        .insert(ticketData);

      if (error) throw error;

      alert('Service call added to schedule!');
      setShowNewTicketForm(false);
      setNewTicket({
        customer_id: '',
        service_type: '',
        title: '',
        description: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time_start: '09:00',
        scheduled_time_end: '10:00',
        priority: 'normal',
        service_location: ''
      });
      loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create service call');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'dispatched': return 'bg-purple-100 text-purple-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'on_hold': return 'bg-orange-100 text-orange-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const combineEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    // Add service tickets
    tickets.forEach(ticket => {
      events.push({
        id: ticket.id,
        type: 'service_ticket',
        title: ticket.title,
        date: ticket.scheduled_date || 'Unscheduled',
        startTime: ticket.scheduled_time_start || '',
        endTime: ticket.scheduled_time_end || '',
        location: ticket.service_location || '',
        description: ticket.description || '',
        priority: ticket.priority,
        status: ticket.status,
        data: ticket
      });
    });

    // Add Outlook appointments
    appointments.forEach(appointment => {
      const startDate = new Date(appointment.start_time);
      const dateStr = startDate.toISOString().split('T')[0];

      events.push({
        id: appointment.id,
        type: 'appointment',
        title: appointment.subject,
        date: dateStr,
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: new Date(appointment.end_time).toTimeString().slice(0, 5),
        location: appointment.location || '',
        description: appointment.description || '',
        data: appointment
      });
    });

    return events;
  };

  const groupEventsByDate = () => {
    const events = combineEvents();
    const grouped: { [key: string]: CalendarEvent[] } = {};

    events.forEach(event => {
      const date = event.date || 'Unscheduled';
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    // Sort events within each date by start time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime.localeCompare(b.startTime);
      });
    });

    return grouped;
  };

  const formatDate = (dateString: string) => {
    if (dateString === 'Unscheduled') return 'Unscheduled';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const groupedEvents = groupEventsByDate();
  const totalEvents = tickets.length + appointments.length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-semibold text-xl">
                  {technician.first_name[0]}{technician.last_name[0]}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {technician.first_name} {technician.last_name}
                </h1>
                <p className="text-sm text-gray-500">{technician.employee_id}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowNewTicketForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Service Call</span>
          </button>
        </div>

        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
          {technician.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>{technician.phone}</span>
            </div>
          )}
          {technician.email && (
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>{technician.email}</span>
            </div>
          )}
        </div>
      </div>

      {showNewTicketForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Service Call</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select
                value={newTicket.customer_id}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === e.target.value);
                  setNewTicket({
                    ...newTicket,
                    customer_id: e.target.value,
                    service_location: customer?.address || ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name || `${customer.first_name} ${customer.last_name}`} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                <select
                  value={newTicket.service_type}
                  onChange={(e) => setNewTicket({ ...newTicket, service_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="installation">Installation</option>
                  <option value="repair">Repair</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Inspection</option>
                  <option value="emergency">Emergency</option>
                  <option value="consultation">Consultation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Solar panel maintenance"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Service details..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Location</label>
              <input
                type="text"
                value={newTicket.service_location}
                onChange={(e) => setNewTicket({ ...newTicket, service_location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Address"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={newTicket.scheduled_date}
                  onChange={(e) => setNewTicket({ ...newTicket, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                <input
                  type="time"
                  value={newTicket.scheduled_time_start}
                  onChange={(e) => setNewTicket({ ...newTicket, scheduled_time_start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                <input
                  type="time"
                  value={newTicket.scheduled_time_end}
                  onChange={(e) => setNewTicket({ ...newTicket, scheduled_time_end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex space-x-2">
            <button
              onClick={createTicket}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Add to Schedule
            </button>
            <button
              onClick={() => setShowNewTicketForm(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Schedule</h2>
          </div>
          <div className="flex items-center space-x-3">
            {hasOutlookConnection && (
              <div className="flex items-center space-x-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <CheckCircle className="h-3 w-3" />
                <span>Outlook Connected</span>
              </div>
            )}
            <span className="text-sm text-gray-500">
              {totalEvents} {totalEvents === 1 ? 'event' : 'events'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading schedule...</div>
          </div>
        ) : Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No scheduled events</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).sort(([dateA], [dateB]) => {
              if (dateA === 'Unscheduled') return 1;
              if (dateB === 'Unscheduled') return -1;
              return new Date(dateA).getTime() - new Date(dateB).getTime();
            }).map(([date, dateEvents]) => (
              <div key={date}>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(date)}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({dateEvents.length} {dateEvents.length === 1 ? 'event' : 'events'})
                  </span>
                </h3>
                <div className="space-y-3">
                  {dateEvents.map(event => (
                    <div
                      key={event.id}
                      className={`rounded-lg p-4 border-2 hover:shadow-md transition-all ${
                        event.type === 'service_ticket'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      {event.type === 'service_ticket' ? (
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-200 rounded">
                                  SERVICE CALL
                                </span>
                                <span className="font-semibold text-gray-900">{event.title}</span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(event.status!)}`}>
                                  {event.status?.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{(event.data as ServiceTicket).ticket_number}</p>
                            </div>
                            <AlertCircle className={`h-5 w-5 ${getPriorityColor(event.priority!)}`} />
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            {event.startTime && (
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>{event.startTime} - {event.endTime}</span>
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>

                          {(event.data as ServiceTicket).service_customers && (
                            <div className="bg-white rounded p-3 border border-gray-200">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  {(event.data as ServiceTicket).service_customers!.first_name} {(event.data as ServiceTicket).service_customers!.last_name}
                                </div>
                                <div className="text-gray-600 flex items-center space-x-4 mt-1">
                                  {(event.data as ServiceTicket).service_customers!.phone && (
                                    <span className="flex items-center">
                                      <Phone className="h-3 w-3 mr-1" />
                                      {(event.data as ServiceTicket).service_customers!.phone}
                                    </span>
                                  )}
                                  {(event.data as ServiceTicket).service_customers!.email && (
                                    <span className="flex items-center">
                                      <Mail className="h-3 w-3 mr-1" />
                                      {(event.data as ServiceTicket).service_customers!.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {event.description && (
                            <p className="text-sm text-gray-600 mt-3">{event.description}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-200 rounded">
                                  OUTLOOK CALENDAR
                                </span>
                                <span className="font-semibold text-gray-900">{event.title}</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            {event.startTime && (
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>{event.startTime} - {event.endTime}</span>
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>

                          {(event.data as OutlookAppointment).meeting_link && (
                            <div className="bg-white rounded p-3 border border-gray-200 mb-2">
                              <div className="flex items-center space-x-2 text-sm">
                                <Video className="h-4 w-4 text-blue-600" />
                                <a
                                  href={(event.data as OutlookAppointment).meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Join Meeting
                                </a>
                              </div>
                            </div>
                          )}

                          {(event.data as OutlookAppointment).appointment_attendees && (event.data as OutlookAppointment).appointment_attendees.length > 0 && (
                            <div className="bg-white rounded p-3 border border-gray-200 mb-2">
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                <Users className="h-4 w-4" />
                                <span className="font-medium">Attendees ({(event.data as OutlookAppointment).appointment_attendees.length})</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(event.data as OutlookAppointment).appointment_attendees.map((attendee, idx) => (
                                  <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {attendee.name || attendee.email}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {event.description && (
                            <p className="text-sm text-gray-600 mt-3">{event.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
