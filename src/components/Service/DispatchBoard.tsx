import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Phone, Plus, Search, Filter, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  specialties: string[];
  employment_status: string;
}

interface ServiceTicket {
  id: string;
  ticket_number: string;
  title: string;
  customer_id: string;
  assigned_technician_id: string | null;
  service_type: string;
  priority: string;
  status: string;
  scheduled_date: string;
  scheduled_time_start: string;
  scheduled_time_end: string;
  service_location: string;
  service_customers: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

export default function DispatchBoard() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);

  useEffect(() => {
    loadTechnicians();
    loadTickets();
  }, [selectedDate, selectedTech, selectedStatus, viewMode]);

  const loadTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('employment_status', 'active')
        .order('first_name');

      if (error) throw error;

      // Filter to only show field technicians (exclude office staff)
      const fieldTechs = (data || []).filter(tech => {
        if (!tech.specialties || tech.specialties.length === 0) return false;

        // specialties array is [Department, Job_Title]
        const jobTitle = tech.specialties[1]?.toLowerCase() || '';

        // Exclude office-based service roles
        if (jobTitle.includes('customer service') ||
            jobTitle.includes('service sales') ||
            jobTitle.includes('office manager') ||
            jobTitle.includes('project manager') ||
            jobTitle.includes('director')) {
          return false;
        }

        // Include only field technician roles
        return jobTitle.includes('installer') ||
               jobTitle.includes('crew lead') ||
               jobTitle.includes('foreman') ||
               jobTitle.includes('electrician') ||
               jobTitle.includes('service tech') ||
               jobTitle.includes('service helper') ||
               jobTitle.includes('roof lead') ||
               jobTitle.includes('apprentice') ||
               jobTitle.includes('carpenter') ||
               jobTitle.includes('painter');
      });

      setTechnicians(fieldTechs);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('service_tickets')
        .select(`
          *,
          service_customers(first_name, last_name, phone)
        `)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time_start', { ascending: true });

      if (viewMode === 'day') {
        const dateStr = selectedDate.toISOString().split('T')[0];
        query = query.eq('scheduled_date', dateStr);
      } else {
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        query = query
          .gte('scheduled_date', startOfWeek.toISOString().split('T')[0])
          .lte('scheduled_date', endOfWeek.toISOString().split('T')[0]);
      }

      if (selectedTech !== 'all') {
        query = query.eq('assigned_technician_id', selectedTech);
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + days);
    } else {
      newDate.setDate(newDate.getDate() + (days * 7));
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'dispatched': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'on_hold': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-4 border-l-red-500';
      case 'high': return 'border-l-4 border-l-orange-500';
      case 'normal': return 'border-l-4 border-l-blue-500';
      case 'low': return 'border-l-4 border-l-gray-500';
      default: return 'border-l-4 border-l-gray-500';
    }
  };

  const getTechTickets = (techId: string) => {
    return tickets.filter(t => t.assigned_technician_id === techId);
  };

  const getUnassignedTickets = () => {
    return tickets.filter(t => !t.assigned_technician_id);
  };

  const formatTimeRange = (start: string, end: string) => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Dispatch Board</h1>
          </div>

          <button
            onClick={() => setShowNewTicket(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center space-x-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New Service Call</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => changeDate(-1)}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                Today
              </button>
              <button
                onClick={() => changeDate(1)}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="text-sm font-semibold text-gray-900">
              {viewMode === 'day'
                ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                : `Week of ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              }
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded">
              <button
                onClick={() => setViewMode('day')}
                className={`px-2.5 py-1 text-xs rounded ${
                  viewMode === 'day' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-2.5 py-1 text-xs rounded ${
                  viewMode === 'week' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                Week
              </button>
            </div>

            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value="all">All Technicians</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>
                  {tech.first_name} {tech.last_name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="dispatched">Dispatched</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dispatch Board */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="text-gray-500">Loading schedule...</div>
          </div>
        ) : (
          <div className="p-4">
            {/* Unassigned Tickets */}
            {getUnassignedTickets().length > 0 && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">Unassigned ({getUnassignedTickets().length})</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                  {getUnassignedTickets().map(ticket => (
                    <div
                      key={ticket.id}
                      className={`p-2 border rounded-lg bg-orange-50 border-orange-200 hover:shadow-md transition-shadow cursor-pointer ${getPriorityColor(ticket.priority)}`}
                    >
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="font-medium text-sm text-gray-900">{ticket.ticket_number}</span>
                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-1">{ticket.title}</h4>
                      <div className="space-y-0.5 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{ticket.service_customers?.first_name} {ticket.service_customers?.last_name}</span>
                        </div>
                        {ticket.scheduled_time_start && ticket.scheduled_time_end && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeRange(ticket.scheduled_time_start, ticket.scheduled_time_end)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technician Schedules - Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {technicians.map(tech => {
                const techTickets = getTechTickets(tech.id);
                if (selectedTech !== 'all' && selectedTech !== tech.id) return null;

                return (
                  <div key={tech.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-700 font-semibold text-xs">
                            {tech.first_name[0]}{tech.last_name[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 truncate">
                            {tech.first_name} {tech.last_name}
                          </h3>
                          {tech.specialties && tech.specialties.length > 0 && (
                            <p className="text-xs text-gray-500 truncate">{tech.specialties.join(', ')}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">{techTickets.length} jobs</span>
                    </div>

                    {techTickets.length === 0 ? (
                      <div className="py-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded">
                        No jobs scheduled
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {techTickets.map(ticket => (
                          <div
                            key={ticket.id}
                            className={`p-2 border rounded bg-white hover:shadow-sm transition-shadow cursor-pointer ${getPriorityColor(ticket.priority)}`}
                          >
                            <div className="flex items-center space-x-1 mb-1">
                              <span className="font-medium text-xs text-gray-900">{ticket.ticket_number}</span>
                              <span className={`px-1.5 py-0.5 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                            </div>
                            <h4 className="font-semibold text-sm text-gray-900 mb-1">{ticket.title}</h4>
                            <div className="space-y-0.5 text-xs text-gray-600">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{ticket.service_customers?.first_name} {ticket.service_customers?.last_name}</span>
                              </div>
                              {ticket.scheduled_time_start && ticket.scheduled_time_end && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  <span>{formatTimeRange(ticket.scheduled_time_start, ticket.scheduled_time_end)}</span>
                                </div>
                              )}
                              {ticket.service_location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{ticket.service_location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {tickets.length === 0 && technicians.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No service calls scheduled for this period</p>
                <button
                  onClick={() => setShowNewTicket(true)}
                  className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Create your first service call
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="text-xs text-gray-500 mb-0.5">Total Jobs</div>
          <div className="text-xl font-bold text-gray-900">{tickets.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="text-xs text-gray-500 mb-0.5">In Progress</div>
          <div className="text-xl font-bold text-yellow-600">
            {tickets.filter(t => t.status === 'in_progress').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="text-xs text-gray-500 mb-0.5">Completed</div>
          <div className="text-xl font-bold text-green-600">
            {tickets.filter(t => t.status === 'completed').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="text-xs text-gray-500 mb-0.5">Unassigned</div>
          <div className="text-xl font-bold text-orange-600">
            {getUnassignedTickets().length}
          </div>
        </div>
      </div>
    </div>
  );
}
