import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  TrendingUp,
  Users,
  DollarSign,
  Award,
  ExternalLink,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  Phone as PhoneIcon,
  MapPin,
  Building2,
  Calendar,
  Search,
  ArrowUpDown,
  X,
  FileText,
  Edit,
  Save
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  slug: string;
  commission_rate: number;
  commission_type: string;
}

interface Lead {
  id: string;
  Name: string;
  Email: string;
  Phone: string;
  Status: string;
  City: string;
  State: string;
  CreatedDate: string;
  Sales_Notes__c: string | null;
  Company: string;
  LeadSource: string;
  partner_name?: string;
  Street?: string;
  PostalCode?: string;
}

interface Commission {
  id: string;
  commission_amount: number;
  status: string;
  created_at: string;
  lead_id: string;
}

export default function PartnerPortal() {
  const { user } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'leads' | 'commissions'>('leads');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedLead, setEditedLead] = useState<Lead | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const ITEMS_PER_PAGE = 100;

  useEffect(() => {
    if (user) {
      loadPartnerData();
    }
  }, [user]);

  const loadPartnerData = async () => {
    try {
      console.log('Loading partner data for user:', user?.email);

      // Check if user is admin - check both profile and database
      const { data: roleData } = await supabase
        .from('user_organization_roles')
        .select('role')
        .eq('user_id', user?.id)
        .maybeSingle();

      console.log('Role data:', roleData);

      // Also check email - all @sunation.com emails and admin@company.com are admins
      const isAdminByEmail = user?.email?.includes('@sunation.com') || user?.email === 'admin@company.com' || false;
      const isAdminByRole = roleData?.role === 'admin';
      const userIsAdmin = isAdminByEmail || isAdminByRole;

      console.log('Admin check - byEmail:', isAdminByEmail, 'byRole:', isAdminByRole, 'final:', userIsAdmin);

      setIsAdmin(userIsAdmin);

      if (userIsAdmin) {
        console.log('User is admin, setting admin partner');
        // Admins see all data
        setPartner({
          id: 'admin',
          name: 'Admin Access - All Partners',
          slug: 'admin',
          commission_rate: 0,
          commission_type: 'percentage'
        });
        await loadLeads(null); // null means load all
        await loadCommissions(null);
        setLoading(false);
        return;
      }

      console.log('User is not admin, checking partner_contacts');

      // Regular partner flow
      const { data: partnerContact, error: contactError } = await supabase
        .from('partner_contacts')
        .select('partner_id, can_view_leads')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (contactError || !partnerContact) {
        console.error('Not a partner contact:', contactError);
        setLoading(false);
        return;
      }

      const { data: partnerData, error: partnerError } = await supabase
        .from('channel_partners')
        .select('*')
        .eq('id', partnerContact.partner_id)
        .maybeSingle();

      if (partnerError || !partnerData) {
        console.error('Partner not found:', partnerError);
        setLoading(false);
        return;
      }

      setPartner(partnerData);

      if (partnerContact.can_view_leads) {
        await loadLeads(partnerData.id);
        await loadCommissions(partnerData.id);
      }
    } catch (error) {
      console.error('Error loading partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async (partnerId: string | null, page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('leads')
        .select(`
          *,
          channel_partners!partner_id (
            name
          )
        `, { count: 'exact' })
        .order('CreatedDate', { ascending: false })
        .range(from, to);

      if (partnerId) {
        query = query.eq('partner_id', partnerId);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform the data to flatten the partner name
      const transformedData = (data || []).map((lead: any) => ({
        ...lead,
        partner_name: lead.channel_partners?.name || 'Unknown Partner'
      }));

      if (append) {
        setLeads(prev => [...prev, ...transformedData]);
      } else {
        setLeads(transformedData);
      }

      setTotalCount(count || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadCommissions = async (partnerId: string | null) => {
    try {
      let query = supabase
        .from('partner_commissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (partnerId) {
        query = query.eq('partner_id', partnerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCommissions(data || []);
    } catch (error) {
      console.error('Error loading commissions:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'converted':
      case 'closed won':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'working':
      case 'open':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'lost':
      case 'closed lost':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const handleEditLead = () => {
    if (selectedLead) {
      setEditedLead({ ...selectedLead });
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedLead(null);
  };

  const handleSaveLead = async () => {
    if (!editedLead) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('leads')
        .update({
          Name: editedLead.Name,
          Email: editedLead.Email,
          Phone: editedLead.Phone,
          Company: editedLead.Company,
          Status: editedLead.Status,
          Street: editedLead.Street,
          City: editedLead.City,
          State: editedLead.State,
          PostalCode: editedLead.PostalCode,
          Sales_Notes__c: editedLead.Sales_Notes__c,
          LeadSource: editedLead.LeadSource,
        })
        .eq('id', editedLead.id);

      if (error) throw error;

      setLeads(leads.map(lead =>
        lead.id === editedLead.id ? editedLead : lead
      ));
      setSelectedLead(editedLead);
      setIsEditMode(false);
      setEditedLead(null);

      alert('Lead updated successfully!');
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Failed to save lead. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof Lead, value: string) => {
    if (editedLead) {
      setEditedLead({
        ...editedLead,
        [field]: value,
      });
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.Company?.toLowerCase().includes(searchLower) ||
      lead.Name?.toLowerCase().includes(searchLower) ||
      lead.Email?.toLowerCase().includes(searchLower) ||
      lead.Phone?.toLowerCase().includes(searchLower) ||
      lead.City?.toLowerCase().includes(searchLower) ||
      lead.partner_name?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    totalLeads: totalCount,
    convertedLeads: leads.filter(l => l.Status?.toLowerCase().includes('converted')).length,
    totalCommissions: commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0),
    pendingCommissions: commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0),
    paidCommissions: commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading partner portal...</div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Not a Partner Contact</h3>
        <p className="text-gray-500 mb-4">
          Your account is not associated with any channel partner.
        </p>
        <p className="text-sm text-gray-400">
          Logged in as: {user?.email}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          If you're a Sunation employee, please log out and log back in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Partner Portal</h1>
        <p className="text-slate-200 text-lg">{partner.name}</p>
        {!isAdmin && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-200">
            <Award className="h-5 w-5" />
            <span>
              Commission Rate: {partner.commission_rate}
              {partner.commission_type === 'percentage' ? '%' : '$'}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Conversions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.convertedLeads}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Commissions</p>
              <p className="text-3xl font-bold text-gray-900">
                ${stats.pendingCommissions.toFixed(2)}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Paid Commissions</p>
              <p className="text-3xl font-bold text-gray-900">
                ${stats.paidCommissions.toFixed(2)}
              </p>
            </div>
            <div className="bg-emerald-100 rounded-full p-3">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setSelectedTab('leads')}
              className={`px-6 py-3 font-medium text-sm ${
                selectedTab === 'leads'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Leads ({leads.length})
            </button>
            <button
              onClick={() => setSelectedTab('commissions')}
              className={`px-6 py-3 font-medium text-sm ${
                selectedTab === 'commissions'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Commissions ({commissions.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {selectedTab === 'leads' && (
            <div>
              <div className="mb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">All Leads ({totalCount.toLocaleString()})</h3>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by company, name, email, phone, location, or partner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {filteredLeads.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>No leads found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Company/Name</th>
                          {isAdmin && (
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Partner</th>
                          )}
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Contact</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Location</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredLeads.map((lead) => (
                          <tr
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">
                                {lead.Company || lead.Name || 'Unknown'}
                              </div>
                              {lead.Company && lead.Name && (
                                <div className="text-xs text-gray-500">{lead.Name}</div>
                              )}
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-800">
                                  <Building2 className="h-3 w-3" />
                                  {lead.partner_name}
                                </span>
                              </td>
                            )}
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                                lead.Status === 'Opportunity' ? 'bg-blue-100 text-blue-800' :
                                lead.Status === 'Open' ? 'bg-green-100 text-green-800' :
                                lead.Status === 'Future Contact' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {lead.Status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                {lead.Email && (
                                  <a
                                    href={`mailto:${lead.Email}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                  >
                                    <Mail className="w-3 h-3" />
                                    <span className="max-w-[150px] truncate">{lead.Email}</span>
                                  </a>
                                )}
                                {lead.Phone && (
                                  <a
                                    href={`tel:${lead.Phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                  >
                                    <PhoneIcon className="w-3 h-3" />
                                    {lead.Phone}
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs text-gray-600">
                                {lead.City && lead.State ? `${lead.City}, ${lead.State}` : lead.City || lead.State || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs text-gray-600">
                                {new Date(lead.CreatedDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Load More Button */}
                  {leads.length < totalCount && (
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => loadLeads(partner?.id === 'admin' ? null : partner?.id || null, currentPage + 1, true)}
                        disabled={loadingMore}
                        className="bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingMore ? (
                          <>
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
                  <div className="mt-4 text-center text-sm text-gray-600">
                    Showing {leads.length.toLocaleString()} of {totalCount.toLocaleString()} leads
                  </div>
                </>
              )}
            </div>
          )}

          {selectedTab === 'commissions' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-semibold text-gray-900">
                          ${Number(commission.commission_amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            commission.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : commission.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {commission.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {commissions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No commissions yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6" />
                <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Lead' : 'Lead Details'}</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedLead(null);
                  setIsEditMode(false);
                  setEditedLead(null);
                }}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedLead?.Name || ''}
                        onChange={(e) => handleFieldChange('Name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{selectedLead.Name || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Company</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedLead?.Company || ''}
                        onChange={(e) => handleFieldChange('Company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{selectedLead.Company || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    {isEditMode ? (
                      <input
                        type="email"
                        value={editedLead?.Email || ''}
                        onChange={(e) => handleFieldChange('Email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <a href={`mailto:${selectedLead.Email}`} className="text-blue-600 hover:text-blue-700">
                        {selectedLead.Email || 'N/A'}
                      </a>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                    {isEditMode ? (
                      <input
                        type="tel"
                        value={editedLead?.Phone || ''}
                        onChange={(e) => handleFieldChange('Phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <a href={`tel:${selectedLead.Phone}`} className="text-blue-600 hover:text-blue-700">
                        {selectedLead.Phone || 'N/A'}
                      </a>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                    {isEditMode ? (
                      <select
                        value={editedLead?.Status || ''}
                        onChange={(e) => handleFieldChange('Status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Open">Open</option>
                        <option value="Opportunity">Opportunity</option>
                        <option value="Future Contact">Future Contact</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Unqualified">Unqualified</option>
                        <option value="Converted">Converted</option>
                        <option value="Closed Won">Closed Won</option>
                        <option value="Closed Lost">Closed Lost</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                        selectedLead.Status === 'Opportunity' ? 'bg-blue-100 text-blue-800' :
                        selectedLead.Status === 'Open' ? 'bg-green-100 text-green-800' :
                        selectedLead.Status === 'Future Contact' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedLead.Status}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Lead Source</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedLead?.LeadSource || ''}
                        onChange={(e) => handleFieldChange('LeadSource', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{selectedLead.LeadSource || 'N/A'}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Partner</label>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-800">
                        <Building2 className="h-3 w-3" />
                        {selectedLead.partner_name}
                      </span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Created Date</label>
                    <p className="text-gray-900">
                      {new Date(selectedLead.CreatedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Street</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedLead?.Street || ''}
                        onChange={(e) => handleFieldChange('Street', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{selectedLead.Street || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">City</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedLead?.City || ''}
                        onChange={(e) => handleFieldChange('City', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{selectedLead.City || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">State</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedLead?.State || ''}
                        onChange={(e) => handleFieldChange('State', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{selectedLead.State || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Postal Code</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedLead?.PostalCode || ''}
                        onChange={(e) => handleFieldChange('PostalCode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{selectedLead.PostalCode || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sales Notes Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Sales Notes</h3>
                {isEditMode ? (
                  <textarea
                    value={editedLead?.Sales_Notes__c || ''}
                    onChange={(e) => handleFieldChange('Sales_Notes__c', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter sales notes..."
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedLead.Sales_Notes__c || 'No notes'}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                {isEditMode ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveLead}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setSelectedLead(null);
                        setIsEditMode(false);
                        setEditedLead(null);
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleEditLead}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Lead
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
