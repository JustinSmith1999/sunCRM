import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, User, Phone, Mail, Building2, MapPin, ArrowUpDown, FolderOpen, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ClickToCall } from '../shared/ClickToCall';
import { DateRangeFilter, DateRangeKey, getDateRange } from '../shared/DateRangeFilter';

interface Lead {
  id: string;
  Id?: string;
  FirstName: string;
  LastName: string;
  Email: string | null;
  Phone: string | null;
  Company: string | null;
  Title: string | null;
  Street: string | null;
  City: string | null;
  State: string | null;
  PostalCode: string | null;
  County__c: string | null;
  LeadSource: string | null;
  Other_Source__c: string | null;
  Status: string;
  Type_of_Installation__c: string | null;
  Salesperson__c: string | null;
  CreatedDate?: string;
  owner_id: string | null;
  created_at: string;
  egnyte_folder_url?: string | null;
  egnyte_url?: string | null;
  aurora_solar_url?: string | null;
  basecamp_url?: string | null;
  owner?: {
    full_name: string | null;
    email: string;
  };
}

export function LeadList() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [showAddressOnly, setShowAddressOnly] = useState(false);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [relatedOpportunities, setRelatedOpportunities] = useState<any[]>([]);
  const [relatedContacts, setRelatedContacts] = useState<any[]>([]);
  const [relatedNotes, setRelatedNotes] = useState<any[]>([]);
  const [relatedAttachments, setRelatedAttachments] = useState<any[]>([]);
  const [relatedEmails, setRelatedEmails] = useState<any[]>([]);
  const [relatedTasks, setRelatedTasks] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [sortField, setSortField] = useState<string>('CreatedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeKey>('ALL');
  const ITEMS_PER_PAGE = 100;
  const { profile } = useAuth();

  const [newLead, setNewLead] = useState({
    first_name: '',
    last_name: '',
    email: '',
    primary_phone: '',
    company: '',
    title: '',
    street: '',
    city: '',
    state: '',
    zip_postal_code: '',
    county: '',
    lead_source: '',
    lead_status: 'Open'
  });

  useEffect(() => {
    setCurrentPage(1);
    loadLeads(1, false);
  }, [searchTerm, selectedStatus, selectedSource, showAddressOnly, dateRange]);

  useEffect(() => {
    loadLeads();
  }, [profile]);

  const loadLeads = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .order('CreatedDate', { ascending: false, nullsFirst: false });

      const range = getDateRange(dateRange);
      if (range.start) {
        query = query.gte('CreatedDate', range.start.toISOString());
      }
      if (range.end) {
        query = query.lte('CreatedDate', range.end.toISOString());
      }

      if (showAddressOnly) {
        query = query.or('Street.not.is.null,City.not.is.null,State.not.is.null,PostalCode.not.is.null');
      }

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        query = query.or(`FirstName.ilike.%${searchLower}%,LastName.ilike.%${searchLower}%,Company.ilike.%${searchLower}%,Email.ilike.%${searchLower}%,City.ilike.%${searchLower}%`);
      }

      if (selectedStatus && selectedStatus !== 'all') {
        query = query.eq('Status', selectedStatus);
      }

      if (selectedSource && selectedSource !== 'all') {
        query = query.eq('LeadSource', selectedSource);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      if (append) {
        setLeads(prev => [...prev, ...(data || [])]);
      } else {
        setLeads(data || []);
      }
      setTotalCount(count || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.sort((a, b) => {
      let aVal: any = a[sortField as keyof Lead];
      let bVal: any = b[sortField as keyof Lead];

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [leads, sortField, sortDirection]);

  useEffect(() => {
    if (selectedLead) {
      loadRelatedRecords(selectedLead);
    } else {
      setRelatedOpportunities([]);
      setRelatedContacts([]);
      setRelatedNotes([]);
      setRelatedAttachments([]);
      setRelatedEmails([]);
      setRelatedTasks([]);
    }
  }, [selectedLead]);

  const loadRelatedRecords = async (lead: Lead) => {
    try {
      const leadSalesforceId = lead.Id;

      if (!lead.Email && !lead.Phone && !leadSalesforceId) {
        setRelatedContacts([]);
        setRelatedOpportunities([]);
        setRelatedNotes([]);
        setRelatedAttachments([]);
        setRelatedEmails([]);
        setRelatedTasks([]);
        return;
      }

      const [oppsResult, contactsResult, notesResult, attachmentsResult, emailsResult, tasksResult] = await Promise.all([
        supabase
          .from('opportunities')
          .select('Id, Name, StageName, Amount, CloseDate, AccountId')
          .or(`ContactId.eq.${leadSalesforceId}${lead.Email ? `,AccountId.in.(select Id from salesforce_contacts where Email.eq."${lead.Email}")` : ''}${lead.Phone ? `,AccountId.in.(select Id from salesforce_contacts where Phone.eq."${lead.Phone}")` : ''}`),
        (async () => {
          let query = supabase
            .from('salesforce_contacts')
            .select('*');

          const conditions = [];
          if (lead.Email) conditions.push(`Email.eq."${lead.Email}"`);
          if (lead.Phone) conditions.push(`Phone.eq."${lead.Phone}"`);

          if (conditions.length > 0) {
            query = query.or(conditions.join(','));
          }

          return query;
        })(),
        leadSalesforceId ? supabase
          .from('salesforce_notes')
          .select('Id, Title, Content, TextPreview, CreatedDate, LastModifiedDate')
          .eq('ParentId', leadSalesforceId)
          .order('CreatedDate', { ascending: false })
          .limit(10) : { data: [] },
        leadSalesforceId ? supabase
          .from('salesforce_attachments')
          .select('Id, Name, ContentType, BodyLength, CreatedDate')
          .eq('ParentId', leadSalesforceId)
          .order('CreatedDate', { ascending: false })
          .limit(10) : { data: [] },
        leadSalesforceId ? supabase
          .from('salesforce_email_messages')
          .select('Id, Subject, FromAddress, MessageDate, Incoming, TextBody')
          .eq('RelatedToId', leadSalesforceId)
          .order('MessageDate', { ascending: false })
          .limit(10) : { data: [] },
        leadSalesforceId ? supabase
          .from('salesforce_tasks')
          .select('Id, Subject, Status, Priority, ActivityDate, CreatedDate')
          .eq('WhoId', leadSalesforceId)
          .order('CreatedDate', { ascending: false })
          .limit(10) : { data: [] }
      ]);

      setRelatedOpportunities(oppsResult.data || []);
      setRelatedContacts(contactsResult.data || []);
      setRelatedNotes(notesResult.data || []);
      setRelatedAttachments(attachmentsResult.data || []);
      setRelatedEmails(emailsResult.data || []);
      setRelatedTasks(tasksResult.data || []);
    } catch (error) {
      console.error('Error loading related records:', error);
    }
  };

  const getSourceColor = (source: string | null) => {
    if (!source) return 'text-slate-600 bg-slate-100';
    switch (source.toLowerCase()) {
      case 'energysage': return 'text-green-600 bg-green-100';
      case 'three ships': return 'text-blue-600 bg-blue-100';
      case 'rocket leads': return 'text-rose-600 bg-rose-100';
      case 'sunchain energy': return 'text-amber-600 bg-amber-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'contacted': return 'text-amber-600 bg-amber-100';
      case 'qualified': return 'text-green-600 bg-green-100';
      case 'disqualified': return 'text-red-600 bg-red-100';
      case 'converted': return 'text-emerald-600 bg-emerald-100';
      case 'nurturing': return 'text-sky-600 bg-sky-100';
      case 'lost': return 'text-slate-600 bg-slate-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const formatAddress = (lead: Lead) => {
    const parts = [
      lead.Street,
      lead.City,
      lead.State,
      lead.PostalCode
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'No address';
  };


  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreateLead = async () => {
    if (!newLead.FirstName || !newLead.LastName) {
      alert('Please enter at least first name and last name');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([newLead])
        .select()
        .single();

      if (error) throw error;

      await loadLeads();
      setShowNewLeadModal(false);
      setNewLead({
        FirstName: '',
        LastName: '',
        Email: '',
        Phone: '',
        Company: '',
        Title: '',
        Street: '',
        City: '',
        State: '',
        PostalCode: '',
        County__c: '',
        LeadSource: '',
        Status: 'Open'
      });
    } catch (error: any) {
      console.error('Error creating lead:', error);
      alert(`Error creating lead: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-48"></div>
                  <div className="h-3 bg-slate-200 rounded w-32"></div>
                </div>
                <div className="h-8 bg-slate-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex flex-col gap-3 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold tracking-eyebrow uppercase text-sky-dark">Pipeline · People</div>
            <h1 className="font-display text-[28px] sm:text-[34px] leading-[40px] font-bold text-ink mt-1 tracking-tighter">Leads</h1>
            <p className="text-sm text-ink-muted mt-1">
              {totalCount.toLocaleString()} total &middot; manage and qualify
            </p>
          </div>
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="bg-sky hover:bg-sky-deep text-white px-5 h-10 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-fast ease-smooth shadow-soft press-scale self-start sm:self-end"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
        <DateRangeFilter value={dateRange} onChange={(k) => { setDateRange(k); setCurrentPage(1); }} />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="Open">Open</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Disqualified">Disqualified</option>
                <option value="Converted">Converted</option>
                <option value="Nurturing">Nurturing</option>
              </select>
            </div>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Sources</option>
              <option value="EnergySage">EnergySage</option>
              <option value="Three Ships">Three Ships</option>
              <option value="Rocket Leads">Rocket Leads</option>
              <option value="Sunchain Energy">Sunchain Energy</option>
            </select>
            <button
              onClick={() => setShowAddressOnly(!showAddressOnly)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all whitespace-nowrap ${
                showAddressOnly
                  ? 'bg-amber-500 border-amber-500 text-slate-900'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">With Address</span>
              <span className="sm:hidden">Address</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredLeads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => setSelectedLead(lead)}
            className="bg-white rounded-lg border border-slate-200 p-4 active:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">
                    {lead.FirstName} {lead.LastName}
                  </div>
                  {lead.Title && (
                    <div className="text-xs text-slate-500 truncate">{lead.Title}</div>
                  )}
                  {lead.Company && (
                    <div className="text-sm text-slate-600 truncate mt-0.5">{lead.Company}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getStatusColor(lead.Status)}`}>
                {lead.Status}
              </span>
              {lead.LeadSource && (
                <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getSourceColor(lead.LeadSource)}`}>
                  {lead.LeadSource}
                </span>
              )}
            </div>

            <div className="space-y-2 mb-3">
              {lead.Email && (
                <a
                  href={`mailto:${lead.Email}`}
                  className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-2 active:text-amber-800"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{lead.Email}</span>
                </a>
              )}
              {lead.Phone && (
                <ClickToCall phoneNumber={lead.Phone} />
              )}
              {(lead.Street || lead.City || lead.State || lead.PostalCode) && (
                <div className="text-xs text-slate-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formatAddress(lead)}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">
                    Created: {lead.CreatedDate ? new Date(lead.CreatedDate).toLocaleDateString() : new Date(lead.created_at).toLocaleDateString()}
                  </div>
                  {lead.Salesperson__c && (
                    <div className="text-xs text-slate-500 mt-1">by {lead.Salesperson__c}</div>
                  )}
                </div>
                {lead.egnyte_folder_url && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(lead.egnyte_folder_url!, '_blank');
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-xs font-medium"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Files</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('FirstName')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Name
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('Status')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Status
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('LeadSource')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Source
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Contact</th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('City')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Location
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Company</th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('CreatedDate')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Created
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {lead.FirstName} {lead.LastName}
                        </div>
                        {lead.Title && (
                          <div className="text-xs text-slate-500">{lead.Title}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getStatusColor(lead.Status)}`}>
                      {lead.Status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.LeadSource && (
                      <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getSourceColor(lead.LeadSource)}`}>
                        {lead.LeadSource}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      {lead.Email && (
                        <a
                          href={`mailto:${lead.Email}`}
                          className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          <span className="max-w-[120px] truncate">{lead.Email}</span>
                        </a>
                      )}
                      {lead.Phone && (
                        <ClickToCall phoneNumber={lead.Phone} showCopy={false} />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600">
                      {formatAddress(lead)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {lead.Company && (
                      <div className="text-sm text-slate-900">{lead.Company}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600">
                      {lead.CreatedDate ? new Date(lead.CreatedDate).toLocaleDateString() : new Date(lead.created_at).toLocaleDateString()}
                    </div>
                    {lead.Salesperson__c && (
                      <div className="text-xs text-slate-500">by {lead.Salesperson__c}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lead.egnyte_folder_url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(lead.egnyte_folder_url!, '_blank');
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-xs font-medium"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>Files</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredLeads.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <User className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">No leads found</h3>
          <p className="text-sm sm:text-base text-slate-600 mb-4 px-4">
            {searchTerm ? 'No leads match your search criteria.' : 'Get started by creating your first lead.'}
          </p>
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
      )}

      {/* Load More Button */}
      {filteredLeads.length > 0 && leads.length < totalCount && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => loadLeads(currentPage + 1, true)}
            disabled={loadingMore}
            className="bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50 px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              <>
                Load More ({(totalCount - leads.length).toLocaleString()} remaining)
              </>
            )}
          </button>
        </div>
      )}

      {/* Showing X of Y indicator */}
      {filteredLeads.length > 0 && (
        <div className="mt-4 text-center text-sm text-slate-600">
          Showing {leads.length.toLocaleString()} of {totalCount.toLocaleString()} leads
        </div>
      )}

      {showNewLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full my-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Create New Lead</h2>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLead.FirstName}
                    onChange={(e) => setNewLead({ ...newLead, FirstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLead.LastName}
                    onChange={(e) => setNewLead({ ...newLead, LastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newLead.Email}
                    onChange={(e) => setNewLead({ ...newLead, Email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newLead.Phone}
                    onChange={(e) => setNewLead({ ...newLead, Phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={newLead.Company}
                    onChange={(e) => setNewLead({ ...newLead, Company: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Acme Corp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newLead.Title}
                    onChange={(e) => setNewLead({ ...newLead, Title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="CEO"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Street</label>
                  <input
                    type="text"
                    value={newLead.Street}
                    onChange={(e) => setNewLead({ ...newLead, Street: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="123 Main St"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newLead.City}
                    onChange={(e) => setNewLead({ ...newLead, City: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={newLead.State}
                    onChange={(e) => setNewLead({ ...newLead, State: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zip Code</label>
                  <input
                    type="text"
                    value={newLead.PostalCode}
                    onChange={(e) => setNewLead({ ...newLead, PostalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="10001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">County</label>
                  <input
                    type="text"
                    value={newLead.County__c}
                    onChange={(e) => setNewLead({ ...newLead, County__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Manhattan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={newLead.LeadSource}
                    onChange={(e) => setNewLead({ ...newLead, LeadSource: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Select Source</option>
                    <option value="EnergySage">EnergySage</option>
                    <option value="Three Ships">Three Ships</option>
                    <option value="Rocket Leads">Rocket Leads</option>
                    <option value="Sunchain Energy">Sunchain Energy</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={newLead.Status}
                    onChange={(e) => setNewLead({ ...newLead, Status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="Open">Open</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Disqualified">Disqualified</option>
                    <option value="Nurturing">Nurturing</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowNewLeadModal(false);
                  setNewLead({
                    FirstName: '',
                    LastName: '',
                    Email: '',
                    Phone: '',
                    Company: '',
                    Title: '',
                    Street: '',
                    City: '',
                    State: '',
                    PostalCode: '',
                    County__c: '',
                    LeadSource: '',
                    Status: 'Open'
                  });
                }}
                disabled={saving}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLead}
                disabled={saving || !newLead.FirstName || !newLead.LastName}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Lead
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedLead && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 overflow-y-auto"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-lg p-4 sm:p-6 max-w-3xl w-full sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2
                    onClick={() => navigate(`/customer/${encodeURIComponent(selectedLead.Email || selectedLead.Phone || selectedLead.id)}`)}
                    className="text-lg sm:text-2xl font-bold text-slate-900 truncate cursor-pointer hover:text-amber-600 transition-colors"
                  >
                    {selectedLead.FirstName} {selectedLead.LastName}
                  </h2>
                  {selectedLead.Title && (
                    <p className="text-sm sm:text-base text-slate-600 truncate">{selectedLead.Title}</p>
                  )}
                  {selectedLead.Company && (
                    <p className="text-sm sm:text-base text-slate-600 flex items-center gap-1 mt-0.5 sm:mt-1 truncate">
                      <Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{selectedLead.Company}</span>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 sm:p-2 flex-shrink-0 -mr-1 sm:mr-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 sm:mb-3">Status & Source</h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm text-slate-600">Status:</span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getStatusColor(selectedLead.Status)}`}>
                        {selectedLead.Status}
                      </span>
                    </div>
                    {selectedLead.LeadSource && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm text-slate-600">Source:</span>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getSourceColor(selectedLead.LeadSource)}`}>
                          {selectedLead.LeadSource}
                        </span>
                      </div>
                    )}
                    {selectedLead.Other_Source__c && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs sm:text-sm text-slate-600 flex-shrink-0">Other Source:</span>
                        <span className="text-xs sm:text-sm text-slate-900 break-words">{selectedLead.Other_Source__c}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 sm:mb-3">Contact Information</h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    {selectedLead.Email && (
                      <a
                        href={`mailto:${selectedLead.Email}`}
                        className="flex items-center gap-2 text-amber-600 hover:text-amber-700 active:text-amber-800 min-w-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm truncate">{selectedLead.Email}</span>
                      </a>
                    )}
                    {selectedLead.Phone && (
                      <a
                        href={`tel:${selectedLead.Phone}`}
                        className="flex items-center gap-2 text-amber-600 hover:text-amber-700 active:text-amber-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">{selectedLead.Phone}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 sm:mb-3">Address</h3>
                  <div className="text-xs sm:text-sm text-slate-600 space-y-0.5 sm:space-y-1">
                    {selectedLead.Street && <p>{selectedLead.Street}</p>}
                    {(selectedLead.City || selectedLead.State || selectedLead.PostalCode) && (
                      <p>
                        {[selectedLead.City, selectedLead.State, selectedLead.PostalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    {selectedLead.County__c && <p>County: {selectedLead.County__c}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 sm:mb-3">Additional Details</h3>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    {selectedLead.Type_of_Installation__c && (
                      <div className="break-words">
                        <span className="text-slate-600">Installation Type:</span>
                        <span className="ml-2 text-slate-900">{selectedLead.Type_of_Installation__c}</span>
                      </div>
                    )}
                    {selectedLead.Salesperson__c && (
                      <div className="break-words">
                        <span className="text-slate-600">Created By:</span>
                        <span className="ml-2 text-slate-900">{selectedLead.Salesperson__c}</span>
                      </div>
                    )}
                    <div className="break-words">
                      <span className="text-slate-600">Created:</span>
                      <span className="ml-2 text-slate-900">
                        {new Date(selectedLead.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* External System Links */}
                {(selectedLead.aurora_solar_url || selectedLead.basecamp_url || selectedLead.egnyte_folder_url || selectedLead.egnyte_url) && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 sm:mb-3">Quick Links</h3>
                    <div className="space-y-2">
                      {selectedLead.aurora_solar_url && (
                        <a
                          href={selectedLead.aurora_solar_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200 rounded-lg transition-colors group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            </div>
                            <span className="text-sm font-semibold text-orange-900">Aurora Solar Design</span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-orange-600 group-hover:text-orange-700" />
                        </a>
                      )}
                      {selectedLead.basecamp_url && (
                        <a
                          href={selectedLead.basecamp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200 rounded-lg transition-colors group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            </div>
                            <span className="text-sm font-semibold text-green-900">Basecamp Project</span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-green-600 group-hover:text-green-700" />
                        </a>
                      )}
                      {(selectedLead.egnyte_folder_url || selectedLead.egnyte_url) && (
                        <a
                          href={selectedLead.egnyte_folder_url || selectedLead.egnyte_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border border-blue-200 rounded-lg transition-colors group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FolderOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-blue-900">Egnyte Files</span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {(relatedOpportunities.length > 0 || relatedContacts.length > 0 || relatedNotes.length > 0 || relatedAttachments.length > 0 || relatedEmails.length > 0 || relatedTasks.length > 0) && (
                  <div className="pt-3 sm:pt-4 border-t border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 sm:mb-3">Related Records</h3>
                    <div className="space-y-2">
                      {relatedOpportunities.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-semibold text-green-700">Opportunit{relatedOpportunities.length > 1 ? 'ies' : 'y'} ({relatedOpportunities.length})</span>
                          </div>
                          {relatedOpportunities.map(opp => (
                            <div key={opp.Id} className="mb-2 last:mb-0">
                              <p className="text-sm font-medium text-slate-900">{opp.Name}</p>
                              <p className="text-xs text-slate-600">Stage: {opp.StageName}</p>
                              {opp.Amount && <p className="text-xs text-slate-600">Amount: ${parseFloat(opp.Amount).toLocaleString()}</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {relatedContacts.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-700">Contact{relatedContacts.length > 1 ? 's' : ''} ({relatedContacts.length})</span>
                          </div>
                          {relatedContacts.map(contact => (
                            <div
                              key={contact.Id}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/customer/${encodeURIComponent(contact.Email || contact.Phone || contact.Id)}`);
                              }}
                              className="mb-2 last:mb-0 cursor-pointer hover:bg-blue-100 p-2 rounded transition-colors"
                            >
                              <p className="text-sm font-medium text-blue-900 hover:text-blue-700">{contact.FirstName} {contact.LastName}</p>
                              {contact.Email && <p className="text-xs text-slate-600">{contact.Email}</p>}
                              {contact.Phone && <p className="text-xs text-slate-600">{contact.Phone}</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {relatedTasks.length > 0 && (
                        <div className="bg-orange-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <span className="text-xs font-semibold text-orange-700">Task{relatedTasks.length > 1 ? 's' : ''} ({relatedTasks.length})</span>
                          </div>
                          {relatedTasks.map(task => (
                            <div key={task.Id} className="mb-2 last:mb-0">
                              <p className="text-sm font-medium text-slate-900">{task.Subject}</p>
                              <div className="flex gap-2 text-xs text-slate-600">
                                <span>Status: {task.Status}</span>
                                {task.Priority && <span>Priority: {task.Priority}</span>}
                              </div>
                              {task.ActivityDate && (
                                <p className="text-xs text-slate-500">
                                  Due: {new Date(task.ActivityDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {relatedNotes.length > 0 && (
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="text-xs font-semibold text-yellow-700">Note{relatedNotes.length > 1 ? 's' : ''} ({relatedNotes.length})</span>
                          </div>
                          {relatedNotes.map(note => (
                            <div key={note.Id} className="mb-2 last:mb-0">
                              <p className="text-sm font-medium text-slate-900">{note.Title}</p>
                              <p className="text-xs text-slate-600 line-clamp-2">{note.TextPreview || note.Content}</p>
                              {note.CreatedDate && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(note.CreatedDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {relatedAttachments.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="text-xs font-semibold text-slate-700">Attachment{relatedAttachments.length > 1 ? 's' : ''} ({relatedAttachments.length})</span>
                          </div>
                          {relatedAttachments.map(attachment => (
                            <div key={attachment.Id} className="mb-2 last:mb-0">
                              <p className="text-sm font-medium text-slate-900">{attachment.Name}</p>
                              <div className="flex gap-2 text-xs text-slate-600">
                                {attachment.ContentType && <span>{attachment.ContentType}</span>}
                                {attachment.BodyLength && <span>{(attachment.BodyLength / 1024).toFixed(1)} KB</span>}
                              </div>
                              {attachment.CreatedDate && (
                                <p className="text-xs text-slate-500">
                                  {new Date(attachment.CreatedDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {relatedEmails.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-700">Email{relatedEmails.length > 1 ? 's' : ''} ({relatedEmails.length})</span>
                          </div>
                          {relatedEmails.map(email => (
                            <div key={email.Id} className="mb-2 last:mb-0">
                              <p className="text-sm font-medium text-slate-900">{email.Subject}</p>
                              <p className="text-xs text-slate-600">
                                {email.Incoming ? 'From' : 'To'}: {email.FromAddress}
                              </p>
                              {email.TextBody && (
                                <p className="text-xs text-slate-600 line-clamp-2 mt-1">{email.TextBody}</p>
                              )}
                              {email.MessageDate && (
                                <p className="text-xs text-slate-500">
                                  {new Date(email.MessageDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
