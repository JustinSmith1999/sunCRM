import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, Plus, Search, Calendar, User, DollarSign, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  actual_cost: number;
  created_at: string;
  service_customers: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  technicians: {
    first_name: string;
    last_name: string;
  };
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string;
}

interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  specialties: string[];
}

interface NewTicket {
  customer_id: string;
  assigned_technician_id: string;
  service_type: string;
  title: string;
  scheduled_date: string;
  scheduled_time_start: string;
  scheduled_time_end: string;
  description: string;
}

export default function ServiceTicketsManager() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<ServiceTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const [newTicket, setNewTicket] = useState<NewTicket>({
    customer_id: '',
    assigned_technician_id: '',
    service_type: '',
    title: '',
    scheduled_date: '',
    scheduled_time_start: '',
    scheduled_time_end: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, filterStatus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [ticketsResult, customersResult, techniciansResult] = await Promise.all([
        supabase
          .from('service_tickets')
          .select(`
            *,
            service_customers(first_name, last_name, phone, email),
            technicians(first_name, last_name)
          `)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('service_customers')
          .select('id, first_name, last_name, company_name')
          .eq('account_status', 'active')
          .order('first_name'),
        supabase
          .from('technicians')
          .select('id, first_name, last_name, specialties')
          .eq('employment_status', 'active')
          .order('first_name')
      ]);

      if (ticketsResult.error) throw ticketsResult.error;
      if (customersResult.error) throw customersResult.error;
      if (techniciansResult.error) throw techniciansResult.error;

      // Filter technicians to only show field technicians (exclude office staff)
      const serviceFieldTechs = (techniciansResult.data || []).filter(tech => {
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

      setTickets(ticketsResult.data || []);
      setCustomers(customersResult.data || []);
      setTechnicians(serviceFieldTechs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.ticket_number?.toLowerCase().includes(term) ||
        ticket.title?.toLowerCase().includes(term) ||
        ticket.service_customers?.first_name?.toLowerCase().includes(term) ||
        ticket.service_customers?.last_name?.toLowerCase().includes(term)
      );
    }

    setFilteredTickets(filtered);
  };

  const generateTicketNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SVC-${year}${month}${day}-${random}`;
  };

  const createTicket = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const ticketData = {
        ticket_number: generateTicketNumber(),
        customer_id: newTicket.customer_id,
        assigned_technician_id: newTicket.assigned_technician_id || null,
        title: newTicket.title,
        service_type: newTicket.service_type,
        description: newTicket.description || null,
        priority: 'normal',
        status: 'scheduled',
        scheduled_date: newTicket.scheduled_date || null,
        scheduled_time_start: newTicket.scheduled_time_start || null,
        scheduled_time_end: newTicket.scheduled_time_end || null,
        created_by: user.id
      };

      const { data: insertedTicket, error } = await supabase
        .from('service_tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) throw error;

      // Create calendar event if technician is assigned and date/time are set
      if (newTicket.assigned_technician_id && newTicket.scheduled_date && newTicket.scheduled_time_start) {
        try {
          // Get technician details
          const { data: technician } = await supabase
            .from('technicians')
            .select('email, first_name, last_name')
            .eq('id', newTicket.assigned_technician_id)
            .single();

          // Get customer details
          const { data: customer } = await supabase
            .from('service_customers')
            .select('first_name, last_name, address, city, state')
            .eq('id', newTicket.customer_id)
            .single();

          if (technician?.email) {
            // Create calendar event
            const startDateTime = `${newTicket.scheduled_date}T${newTicket.scheduled_time_start}`;
            const endDateTime = newTicket.scheduled_time_end
              ? `${newTicket.scheduled_date}T${newTicket.scheduled_time_end}`
              : null;

            const location = customer
              ? `${customer.address || ''}, ${customer.city || ''}, ${customer.state || ''}`.trim()
              : '';

            await supabase.functions.invoke('outlook-sync', {
              body: {
                action: 'create_event',
                event: {
                  subject: `${newTicket.title} - ${customer?.first_name} ${customer?.last_name}`,
                  body: {
                    contentType: 'Text',
                    content: newTicket.description || `Service ticket: ${insertedTicket.ticket_number}`
                  },
                  start: {
                    dateTime: startDateTime,
                    timeZone: 'America/New_York'
                  },
                  end: endDateTime ? {
                    dateTime: endDateTime,
                    timeZone: 'America/New_York'
                  } : undefined,
                  location: {
                    displayName: location
                  },
                  attendees: [{
                    emailAddress: {
                      address: technician.email,
                      name: `${technician.first_name} ${technician.last_name}`
                    },
                    type: 'required'
                  }]
                }
              }
            });
          }
        } catch (calError) {
          console.error('Error creating calendar event:', calError);
          // Don't fail the whole operation if calendar creation fails
        }
      }

      alert('Service ticket created successfully!');
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    }
  };

  const resetForm = () => {
    setShowNewTicketForm(false);
    setNewTicket({
      customer_id: '',
      assigned_technician_id: '',
      service_type: '',
      title: '',
      scheduled_date: '',
      scheduled_time_start: '',
      scheduled_time_end: '',
      description: '',
    });
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'dispatched': return 'bg-purple-100 text-purple-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'on_hold': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerSearch.toLowerCase();
    const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
    const company = customer.company_name?.toLowerCase() || '';
    return fullName.includes(searchLower) || company.includes(searchLower);
  });

  const selectCustomer = (customer: Customer) => {
    const displayName = customer.company_name || `${customer.first_name} ${customer.last_name}`;
    setCustomerSearch(displayName);
    setNewTicket({ ...newTicket, customer_id: customer.id });
    setShowCustomerDropdown(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ClipboardList className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Service Tickets</h1>
          </div>
          <button
            onClick={() => setShowNewTicketForm(true)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 font-medium shadow-sm transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* New Ticket Form */}
      {showNewTicketForm && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Create New Service Ticket</h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Customer Selection */}
            <div ref={customerDropdownRef} className="relative">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search for a customer..."
                  required
                />
              </div>

              {showCustomerDropdown && customerSearch && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-gray-500 font-medium">No customers found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {customers.length === 0 ? 'Add customers in Service Dashboard first' : 'Try a different search term'}
                      </p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {filteredCustomers.map(customer => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => selectCustomer(customer)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-semibold text-gray-900">
                            {customer.company_name || `${customer.first_name} ${customer.last_name}`}
                          </div>
                          {customer.company_name && (
                            <div className="text-sm text-gray-500 mt-0.5">
                              {customer.first_name} {customer.last_name}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                value={newTicket.service_type}
                onChange={(e) => setNewTicket({ ...newTicket, service_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select service type...</option>
                <option value="installation">Installation</option>
                <option value="repair">Repair</option>
                <option value="maintenance">Maintenance</option>
                <option value="inspection">Inspection</option>
                <option value="warranty">Warranty Service</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            {/* Title/Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Service Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Install 20-panel solar system"
                required
              />
            </div>

            {/* Technician - Service Field Only */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Assign Technician (Service Field)
              </label>
              <select
                value={newTicket.assigned_technician_id}
                onChange={(e) => setNewTicket({ ...newTicket, assigned_technician_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Assign later</option>
                {technicians.length === 0 ? (
                  <option disabled>No service field technicians available</option>
                ) : (
                  technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.first_name} {tech.last_name} {tech.specialties?.[0] ? `- ${tech.specialties[0]}` : ''}
                    </option>
                  ))
                )}
              </select>
              {technicians.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No service field technicians available.</p>
              )}
            </div>

            {/* Date and Time - Enhanced */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700">
                  Schedule Appointment
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      setNewTicket({ ...newTicket, scheduled_date: today.toISOString().split('T')[0] });
                    }}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setNewTicket({ ...newTicket, scheduled_date: tomorrow.toISOString().split('T')[0] });
                    }}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      setNewTicket({ ...newTicket, scheduled_date: nextWeek.toISOString().split('T')[0] });
                    }}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium"
                  >
                    Next Week
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newTicket.scheduled_date}
                    onChange={(e) => setNewTicket({ ...newTicket, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Start Time
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={newTicket.scheduled_time_start}
                      onChange={(e) => setNewTicket({ ...newTicket, scheduled_time_start: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newTicket.scheduled_time_end}
                    onChange={(e) => setNewTicket({ ...newTicket, scheduled_time_end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Quick Time Presets */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Quick Time Slots
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '8AM-12PM', start: '08:00', end: '12:00' },
                    { label: '9AM-12PM', start: '09:00', end: '12:00' },
                    { label: '12PM-4PM', start: '12:00', end: '16:00' },
                    { label: '1PM-5PM', start: '13:00', end: '17:00' },
                    { label: '2PM-4PM', start: '14:00', end: '16:00' }
                  ].map((slot) => (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => setNewTicket({
                        ...newTicket,
                        scheduled_time_start: slot.start,
                        scheduled_time_end: slot.end
                      })}
                      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-blue-100 hover:text-blue-700 font-medium transition-colors"
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes/Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any additional notes or details about this service call..."
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-gray-200 flex space-x-2">
            <button
              onClick={createTicket}
              disabled={!newTicket.customer_id || !newTicket.service_type || !newTicket.title}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold shadow-sm transition-colors"
            >
              Create Service Ticket
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex justify-center items-center h-64">
            <div className="text-gray-500">Loading tickets...</div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No tickets found</p>
            <p className="text-gray-400 text-sm mt-1">Create your first service ticket to get started</p>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div
              key={ticket.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs font-medium text-gray-500">{ticket.ticket_number}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{ticket.title}</h3>
                  <p className="text-sm text-gray-600 capitalize">{ticket.service_type}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>
                    {ticket.service_customers?.first_name} {ticket.service_customers?.last_name}
                  </span>
                </div>
                {ticket.technicians && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span>
                      Tech: {ticket.technicians.first_name} {ticket.technicians.last_name}
                    </span>
                  </div>
                )}
                {ticket.scheduled_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(ticket.scheduled_date).toLocaleDateString()}
                      {ticket.scheduled_time_start && ` at ${ticket.scheduled_time_start}`}
                    </span>
                  </div>
                )}
                {ticket.estimated_cost > 0 && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Est: ${ticket.estimated_cost.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                {ticket.status === 'scheduled' && (
                  <button
                    onClick={() => updateTicketStatus(ticket.id, 'dispatched')}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Dispatch
                  </button>
                )}
                {ticket.status === 'dispatched' && (
                  <button
                    onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                    className="flex-1 px-3 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                  >
                    Start Work
                  </button>
                )}
                {ticket.status === 'in_progress' && (
                  <button
                    onClick={() => updateTicketStatus(ticket.id, 'completed')}
                    className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Total Tickets</div>
          <div className="text-2xl font-bold text-gray-900">{tickets.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">In Progress</div>
          <div className="text-2xl font-bold text-yellow-600">
            {tickets.filter(t => t.status === 'in_progress').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-600">
            {tickets.filter(t => t.status === 'completed').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Scheduled</div>
          <div className="text-2xl font-bold text-blue-600">
            {tickets.filter(t => t.status === 'scheduled').length}
          </div>
        </div>
      </div>
    </div>
  );
}
