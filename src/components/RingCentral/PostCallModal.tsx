import React, { useState, useEffect } from 'react';
import { X, Phone, User, Building2, DollarSign, FileText, CheckCircle, AlertCircle, Wrench } from 'lucide-react';
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
  contact_id?: string | null;
  account_id?: string | null;
  lead_id?: string | null;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_id: string | null;
  accounts?: {
    name: string;
  };
}

interface CallDisposition {
  id: string;
  name: string;
  code: string;
  requires_follow_up: boolean;
}

interface PostCallModalProps {
  callEvent: CallEvent;
  onClose: () => void;
  onActionComplete?: () => void;
}

export function PostCallModal({ callEvent, onClose, onActionComplete }: PostCallModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<Contact | null>(null);
  const [dispositions, setDispositions] = useState<CallDisposition[]>([]);
  const [selectedDisposition, setSelectedDisposition] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  const [showServiceTicketForm, setShowServiceTicketForm] = useState(false);
  const [serviceCustomers, setServiceCustomers] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [leadData, setLeadData] = useState({
    first_name: '',
    last_name: '',
    company: '',
    phone: callEvent.direction === 'Inbound' ? callEvent.from_number : callEvent.to_number,
    email: '',
    status: 'new',
    rating: 'warm'
  });
  const [opportunityData, setOpportunityData] = useState({
    name: '',
    amount: '',
    stage: 'prospecting',
    close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [serviceTicketData, setServiceTicketData] = useState({
    customer_id: '',
    service_type: 'repair',
    title: '',
    description: callNotes,
    priority: 'medium',
    assigned_technician_id: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time_start: '09:00',
    scheduled_time_end: '12:00'
  });

  useEffect(() => {
    loadContactInfo();
    loadDispositions();
    if (isServiceOfficeUser()) {
      loadServiceCustomers();
      loadTechnicians();
    }
  }, [callEvent]);

  useEffect(() => {
    setServiceTicketData(prev => ({ ...prev, description: callNotes }));
  }, [callNotes]);

  const isServiceOfficeUser = () => {
    if (!profile?.department) return false;
    const dept = profile.department.toLowerCase();
    return dept.includes('service') || dept.includes('support');
  };

  const loadContactInfo = async () => {
    if (!profile?.organization_id) return;

    const phoneNumber = callEvent.direction === 'Inbound' ? callEvent.from_number : callEvent.to_number;

    const { data } = await supabase
      .from('contacts')
      .select('*, accounts(name)')
      .eq('organization_id', profile.organization_id)
      .or(`phone.eq."${phoneNumber}",mobile.eq."${phoneNumber}"`)
      .maybeSingle();

    if (data) {
      setContact(data);
    }
  };

  const loadDispositions = async () => {
    if (!profile?.organization_id) return;

    const { data } = await supabase
      .from('call_dispositions')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .order('sort_order');

    if (data) {
      setDispositions(data);
    }
  };

  const loadServiceCustomers = async () => {
    const { data } = await supabase
      .from('service_customers')
      .select('id, first_name, last_name, phone, company_name')
      .eq('account_status', 'active')
      .order('first_name')
      .limit(100);

    if (data) {
      setServiceCustomers(data);
    }
  };

  const loadTechnicians = async () => {
    const { data: techsData } = await supabase
      .from('technicians')
      .select('id, first_name, last_name, specialties')
      .eq('employment_status', 'active')
      .order('first_name');

    if (techsData) {
      // Filter to only show field technicians (exclude office staff)
      const serviceFieldTechs = techsData.filter(tech => {
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
      setTechnicians(serviceFieldTechs);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const handleSaveDisposition = async () => {
    if (!profile?.organization_id || !selectedDisposition) return;

    setLoading(true);
    try {
      await supabase
        .from('ringcentral_events')
        .update({
          disposition_id: selectedDisposition,
          call_notes: callNotes,
          processed: true
        })
        .eq('id', callEvent.id);

      await supabase
        .from('activities')
        .insert({
          organization_id: profile.organization_id,
          type: 'call',
          subject: `${callEvent.direction} call - ${formatPhoneNumber(callEvent.direction === 'Inbound' ? callEvent.from_number : callEvent.to_number)}`,
          description: callNotes || `Call duration: ${formatDuration(callEvent.duration)}`,
          status: 'completed',
          priority: 'normal',
          due_date: callEvent.start_time,
          completed_at: new Date().toISOString(),
          contact_id: contact?.id || null,
          account_id: contact?.account_id || null,
          assigned_to: profile.id,
          created_by: profile.id
        });

      await supabase
        .from('post_call_actions')
        .insert({
          organization_id: profile.organization_id,
          ringcentral_event_id: callEvent.id,
          user_id: profile.id,
          action_type: 'note_created',
          notes: callNotes
        });

      onActionComplete?.();
      onClose();
    } catch (error) {
      console.error('Error saving disposition:', error);
      alert('Failed to save call disposition');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async () => {
    if (!profile?.organization_id) return;

    setLoading(true);
    try {
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert({
          organization_id: profile.organization_id,
          first_name: leadData.first_name,
          last_name: leadData.last_name,
          company: leadData.company,
          phone: leadData.phone,
          email: leadData.email,
          status: leadData.status,
          rating: leadData.rating,
          lead_source: 'Phone Call',
          description: callNotes || `Lead created from ${callEvent.direction} call`,
          owner_id: profile.id,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('ringcentral_events')
        .update({
          lead_id: newLead.id,
          disposition_id: selectedDisposition || null,
          call_notes: callNotes,
          processed: true
        })
        .eq('id', callEvent.id);

      await supabase
        .from('post_call_actions')
        .insert({
          organization_id: profile.organization_id,
          ringcentral_event_id: callEvent.id,
          user_id: profile.id,
          action_type: 'lead_created',
          entity_id: newLead.id,
          entity_type: 'lead',
          notes: callNotes
        });

      alert('Lead created successfully!');
      onActionComplete?.();
      onClose();
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpportunity = async () => {
    if (!profile?.organization_id || !contact) return;

    setLoading(true);
    try {
      const { data: newOpp, error } = await supabase
        .from('opportunities')
        .insert({
          organization_id: profile.organization_id,
          account_id: contact.account_id!,
          name: opportunityData.name,
          amount: parseFloat(opportunityData.amount) || null,
          stage: opportunityData.stage,
          close_date: opportunityData.close_date,
          lead_source: 'Phone Call',
          description: callNotes || `Opportunity created from ${callEvent.direction} call`,
          owner_id: profile.id,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('ringcentral_events')
        .update({
          disposition_id: selectedDisposition || null,
          call_notes: callNotes,
          processed: true
        })
        .eq('id', callEvent.id);

      await supabase
        .from('post_call_actions')
        .insert({
          organization_id: profile.organization_id,
          ringcentral_event_id: callEvent.id,
          user_id: profile.id,
          action_type: 'opportunity_created',
          entity_id: newOpp.id,
          entity_type: 'opportunity',
          notes: callNotes
        });

      alert('Opportunity created successfully!');
      onActionComplete?.();
      onClose();
    } catch (error) {
      console.error('Error creating opportunity:', error);
      alert('Failed to create opportunity');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServiceTicket = async () => {
    if (!serviceTicketData.customer_id || !serviceTicketData.title) {
      alert('Please select a customer and enter a service description');
      return;
    }

    setLoading(true);
    try {
      const { data: newTicket, error } = await supabase
        .from('service_tickets')
        .insert({
          customer_id: serviceTicketData.customer_id,
          service_type: serviceTicketData.service_type,
          title: serviceTicketData.title,
          description: serviceTicketData.description || `Service ticket created from ${callEvent.direction} call`,
          priority: serviceTicketData.priority,
          status: 'scheduled',
          assigned_technician_id: serviceTicketData.assigned_technician_id || null,
          scheduled_date: serviceTicketData.scheduled_date || null,
          scheduled_time_start: serviceTicketData.scheduled_time_start || null,
          scheduled_time_end: serviceTicketData.scheduled_time_end || null,
          ringcentral_call_id: callEvent.id
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('ringcentral_events')
        .update({
          disposition_id: selectedDisposition || null,
          call_notes: callNotes,
          processed: true
        })
        .eq('id', callEvent.id);

      await supabase
        .from('post_call_actions')
        .insert({
          organization_id: profile?.organization_id || null,
          ringcentral_event_id: callEvent.id,
          user_id: profile?.id || null,
          action_type: 'service_ticket_created',
          entity_id: newTicket.id,
          entity_type: 'service_ticket',
          notes: callNotes
        });

      alert('Service ticket created successfully!');
      onActionComplete?.();
      onClose();
    } catch (error) {
      console.error('Error creating service ticket:', error);
      alert('Failed to create service ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Call Completed</h2>
              <p className="text-sm text-slate-600">
                {callEvent.direction} • {formatDuration(callEvent.duration)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {contact ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Contact Found</h3>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-slate-700">
                  <User className="w-4 h-4 inline mr-2" />
                  {contact.first_name} {contact.last_name}
                </p>
                {contact.accounts && (
                  <p className="text-slate-700">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    {contact.accounts.name}
                  </p>
                )}
                <p className="text-slate-600">{contact.email}</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900">No Contact Found</h3>
              </div>
              <p className="text-sm text-amber-700">
                {formatPhoneNumber(callEvent.direction === 'Inbound' ? callEvent.from_number : callEvent.to_number)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Call Disposition
            </label>
            <select
              value={selectedDisposition}
              onChange={(e) => setSelectedDisposition(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select outcome...</option>
              {dispositions.map((disp) => (
                <option key={disp.id} value={disp.id}>
                  {disp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Call Notes
            </label>
            <textarea
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add notes about this call..."
            />
          </div>

          {!contact && !showLeadForm && (
            <button
              onClick={() => setShowLeadForm(true)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <User className="w-5 h-5" />
              Create Lead from Call
            </button>
          )}

          {showLeadForm && (
            <div className="border border-slate-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                New Lead
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={leadData.first_name}
                  onChange={(e) => setLeadData({ ...leadData, first_name: e.target.value })}
                  className="border border-slate-300 rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={leadData.last_name}
                  onChange={(e) => setLeadData({ ...leadData, last_name: e.target.value })}
                  className="border border-slate-300 rounded px-3 py-2"
                />
              </div>
              <input
                type="text"
                placeholder="Company"
                value={leadData.company}
                onChange={(e) => setLeadData({ ...leadData, company: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
              <input
                type="email"
                placeholder="Email"
                value={leadData.email}
                onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
              <button
                onClick={handleCreateLead}
                disabled={loading || !leadData.first_name || !leadData.last_name}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Lead'}
              </button>
            </div>
          )}

          {contact && contact.account_id && !showOpportunityForm && (
            <button
              onClick={() => setShowOpportunityForm(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              Create Opportunity
            </button>
          )}

          {showOpportunityForm && (
            <div className="border border-slate-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                New Opportunity
              </h3>
              <input
                type="text"
                placeholder="Opportunity Name"
                value={opportunityData.name}
                onChange={(e) => setOpportunityData({ ...opportunityData, name: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Amount"
                value={opportunityData.amount}
                onChange={(e) => setOpportunityData({ ...opportunityData, amount: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
              <input
                type="date"
                value={opportunityData.close_date}
                onChange={(e) => setOpportunityData({ ...opportunityData, close_date: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
              <button
                onClick={handleCreateOpportunity}
                disabled={loading || !opportunityData.name}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Opportunity'}
              </button>
            </div>
          )}

          {isServiceOfficeUser() && !showServiceTicketForm && (
            <button
              onClick={() => setShowServiceTicketForm(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Wrench className="w-5 h-5" />
              Create Service Ticket
            </button>
          )}

          {isServiceOfficeUser() && showServiceTicketForm && (
            <div className="border border-blue-200 rounded-lg p-4 space-y-4 bg-blue-50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                New Service Ticket
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={serviceTicketData.customer_id}
                  onChange={(e) => setServiceTicketData({ ...serviceTicketData, customer_id: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                  required
                >
                  <option value="">Select customer...</option>
                  {serviceCustomers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company_name || `${customer.first_name} ${customer.last_name}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={serviceTicketData.service_type}
                  onChange={(e) => setServiceTicketData({ ...serviceTicketData, service_type: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                >
                  <option value="installation">Installation</option>
                  <option value="repair">Repair</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Inspection</option>
                  <option value="warranty">Warranty Service</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Service Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Brief description of service needed"
                  value={serviceTicketData.title}
                  onChange={(e) => setServiceTicketData({ ...serviceTicketData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={serviceTicketData.priority}
                  onChange={(e) => setServiceTicketData({ ...serviceTicketData, priority: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Assign Technician
                </label>
                <select
                  value={serviceTicketData.assigned_technician_id}
                  onChange={(e) => setServiceTicketData({ ...serviceTicketData, assigned_technician_id: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                >
                  <option value="">Assign later</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.first_name} {tech.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Schedule
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setServiceTicketData({
                      ...serviceTicketData,
                      scheduled_date: new Date().toISOString().split('T')[0]
                    })}
                    className="px-2 py-1 text-xs bg-white text-blue-700 border border-blue-300 rounded hover:bg-blue-50 font-medium"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setServiceTicketData({
                        ...serviceTicketData,
                        scheduled_date: tomorrow.toISOString().split('T')[0]
                      });
                    }}
                    className="px-2 py-1 text-xs bg-white text-blue-700 border border-blue-300 rounded hover:bg-blue-50 font-medium"
                  >
                    Tomorrow
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="date"
                    value={serviceTicketData.scheduled_date}
                    onChange={(e) => setServiceTicketData({ ...serviceTicketData, scheduled_date: e.target.value })}
                    className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                  />
                  <input
                    type="time"
                    value={serviceTicketData.scheduled_time_start}
                    onChange={(e) => setServiceTicketData({ ...serviceTicketData, scheduled_time_start: e.target.value })}
                    className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                  />
                  <input
                    type="time"
                    value={serviceTicketData.scheduled_time_end}
                    onChange={(e) => setServiceTicketData({ ...serviceTicketData, scheduled_time_end: e.target.value })}
                    className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  {[
                    { label: '8-12', start: '08:00', end: '12:00' },
                    { label: '9-12', start: '09:00', end: '12:00' },
                    { label: '12-4', start: '12:00', end: '16:00' },
                    { label: '1-5', start: '13:00', end: '17:00' }
                  ].map((slot) => (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => setServiceTicketData({
                        ...serviceTicketData,
                        scheduled_time_start: slot.start,
                        scheduled_time_end: slot.end
                      })}
                      className="px-2 py-1 text-xs bg-white text-gray-700 border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 font-medium"
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateServiceTicket}
                disabled={loading || !serviceTicketData.customer_id || !serviceTicketData.title}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Wrench className="w-4 h-4" />
                {loading ? 'Creating...' : 'Create Service Ticket'}
              </button>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-100"
          >
            Skip
          </button>
          <button
            onClick={handleSaveDisposition}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
