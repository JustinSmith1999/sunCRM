import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users,
  Plus,
  Edit2,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Link as LinkIcon
} from 'lucide-react';

interface ChannelPartner {
  id: string;
  name: string;
  slug: string;
  webhook_url: string | null;
  contact_email: string | null;
  phone: string | null;
  status: string;
  commission_rate: number;
  commission_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PartnerContact {
  id: string;
  partner_id: string;
  user_id: string;
  role: string;
  can_view_leads: boolean;
  email?: string;
  name?: string;
}

interface PartnerStats {
  total_leads: number;
  total_commissions: number;
  pending_commissions: number;
  paid_commissions: number;
}

interface PartnerLead {
  id: string;
  Name: string;
  Email: string;
  Phone: string;
  Status: string;
  City: string;
  State: string;
  CreatedDate: string;
  partner_id: string;
  partner_name: string;
}

export default function ChannelPartnersConsole() {
  const [partners, setPartners] = useState<ChannelPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ChannelPartner | null>(null);
  const [partnerContacts, setPartnerContacts] = useState<PartnerContact[]>([]);
  const [partnerStats, setPartnerStats] = useState<PartnerStats | null>(null);
  const [allPartnerLeads, setAllPartnerLeads] = useState<PartnerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'partners' | 'allLeads'>('partners');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    phone: '',
    commission_rate: 10,
    commission_type: 'percentage',
    notes: ''
  });

  useEffect(() => {
    loadPartners();
    loadAllPartnerLeads();
  }, []);

  useEffect(() => {
    if (selectedPartner) {
      loadPartnerContacts(selectedPartner.id);
      loadPartnerStats(selectedPartner.id);
    }
  }, [selectedPartner]);

  const loadPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('channel_partners')
        .select('*')
        .order('name');

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPartnerContacts = async (partnerId: string) => {
    try {
      const { data, error } = await supabase
        .from('partner_contacts')
        .select('*')
        .eq('partner_id', partnerId);

      if (error) throw error;
      setPartnerContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadAllPartnerLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          Name,
          Email,
          Phone,
          Status,
          City,
          State,
          CreatedDate,
          partner_id,
          channel_partners!inner(name)
        `)
        .not('partner_id', 'is', null)
        .order('CreatedDate', { ascending: false })
        .limit(200);

      if (error) throw error;

      const formattedLeads = (data || []).map((lead: any) => ({
        ...lead,
        partner_name: lead.channel_partners?.name || 'Unknown Partner'
      }));

      setAllPartnerLeads(formattedLeads);
    } catch (error) {
      console.error('Error loading all partner leads:', error);
    }
  };

  const loadPartnerStats = async (partnerId: string) => {
    try {
      const [leadsRes, commissionsRes] = await Promise.all([
        supabase
          .from('leads')
          .select('id', { count: 'exact' })
          .eq('partner_id', partnerId),
        supabase
          .from('partner_commissions')
          .select('commission_amount, status')
          .eq('partner_id', partnerId)
      ]);

      const totalLeads = leadsRes.count || 0;
      const commissions = commissionsRes.data || [];

      const stats = {
        total_leads: totalLeads,
        total_commissions: commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0),
        pending_commissions: commissions
          .filter(c => c.status === 'pending')
          .reduce((sum, c) => sum + Number(c.commission_amount), 0),
        paid_commissions: commissions
          .filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + Number(c.commission_amount), 0)
      };

      setPartnerStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (showEditForm && selectedPartner) {
        const { error } = await supabase
          .from('channel_partners')
          .update(formData)
          .eq('id', selectedPartner.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('channel_partners')
          .insert([formData]);

        if (error) throw error;
      }

      setShowAddForm(false);
      setShowEditForm(false);
      setFormData({
        name: '',
        slug: '',
        contact_email: '',
        phone: '',
        commission_rate: 10,
        commission_type: 'percentage',
        notes: ''
      });
      loadPartners();
    } catch (error) {
      console.error('Error saving partner:', error);
      alert('Error saving partner. Please try again.');
    }
  };

  const handleEdit = (partner: ChannelPartner) => {
    setSelectedPartner(partner);
    setFormData({
      name: partner.name,
      slug: partner.slug,
      contact_email: partner.contact_email || '',
      phone: partner.phone || '',
      commission_rate: partner.commission_rate,
      commission_type: partner.commission_type,
      notes: partner.notes || ''
    });
    setShowEditForm(true);
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Webhook URL copied to clipboard!');
  };

  const getWebFormUrl = (slug: string) => {
    return `${window.location.origin}/partner-form/${slug}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading partners...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Channel Partners</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage partner relationships, webhook forms, and commissions
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Partner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Partners</p>
              <p className="text-3xl font-bold text-gray-900">{partners.length}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Partner Leads</p>
              <p className="text-3xl font-bold text-gray-900">{allPartnerLeads.length}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Partners</p>
              <p className="text-3xl font-bold text-gray-900">
                {partners.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Commission Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {partners.length > 0
                  ? (partners.reduce((sum, p) => sum + p.commission_rate, 0) / partners.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('partners')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'partners'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Partners ({partners.length})
            </button>
            <button
              onClick={() => setActiveTab('allLeads')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'allLeads'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              All Partner Leads ({allPartnerLeads.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'allLeads' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">All Partner-Submitted Leads</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allPartnerLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{lead.Name || 'Unnamed Lead'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm font-medium text-blue-600">{lead.partner_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.Email || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{lead.Phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {lead.City && lead.State ? `${lead.City}, ${lead.State}` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          lead.Status?.toLowerCase().includes('converted') || lead.Status?.toLowerCase().includes('won')
                            ? 'bg-green-100 text-green-800'
                            : lead.Status?.toLowerCase().includes('working') || lead.Status?.toLowerCase().includes('qualified')
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.Status || 'New'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.CreatedDate ? new Date(lead.CreatedDate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allPartnerLeads.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium">No partner leads yet</p>
                  <p className="text-sm mt-1">Leads submitted through partner forms will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'partners' && (showAddForm || showEditForm) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">
            {showEditForm ? 'Edit Partner' : 'Add New Partner'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="3 Brothers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="3-brothers"
                />
                <p className="text-xs text-gray-500 mt-1">Used in webhook form URL</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@partner.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Rate *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Type *
                </label>
                <select
                  value={formData.commission_type}
                  onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="flat_fee">Flat Fee</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional partner information..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {showEditForm ? 'Update Partner' : 'Create Partner'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setShowEditForm(false);
                  setFormData({
                    name: '',
                    slug: '',
                    contact_email: '',
                    phone: '',
                    commission_rate: 10,
                    commission_type: 'percentage',
                    notes: ''
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'partners' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Partners ({partners.length})</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  onClick={() => setSelectedPartner(partner)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedPartner?.id === partner.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{partner.name}</div>
                      <div className="text-sm text-gray-500 mt-1">/{partner.slug}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          partner.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {partner.status === 'active' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {partner.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {partner.commission_rate}
                          {partner.commission_type === 'percentage' ? '%' : '$'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(partner);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedPartner ? (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">{selectedPartner.name}</h3>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {partnerStats?.total_leads || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Total Leads</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      ${partnerStats?.total_commissions.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Total Commissions</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600">
                      ${partnerStats?.pending_commissions.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Pending</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      ${partnerStats?.paid_commissions.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Paid</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Web Form URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getWebFormUrl(selectedPartner.slug)}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm"
                      />
                      <button
                        onClick={() => copyWebhookUrl(getWebFormUrl(selectedPartner.slug))}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                      <a
                        href={getWebFormUrl(selectedPartner.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  {selectedPartner.contact_email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {selectedPartner.contact_email}
                    </div>
                  )}

                  {selectedPartner.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {selectedPartner.phone}
                    </div>
                  )}

                  {selectedPartner.notes && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                      <div className="text-sm font-medium text-gray-700 mb-1">Notes</div>
                      <div className="text-sm text-gray-600">{selectedPartner.notes}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Partner Contacts ({partnerContacts.length})</h3>
                {partnerContacts.length > 0 ? (
                  <div className="space-y-2">
                    {partnerContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <div className="font-medium text-gray-900">{contact.email || contact.user_id}</div>
                          <div className="text-sm text-gray-500 capitalize">{contact.role}</div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {contact.can_view_leads ? 'Can view leads' : 'No lead access'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No contacts assigned to this partner yet.
                    <div className="mt-2 text-sm">
                      Use the SQL in CHANNEL-PARTNERS-SETUP.md to link users.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Partner</h3>
              <p className="text-gray-500">
                Choose a partner from the list to view details and manage settings
              </p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
