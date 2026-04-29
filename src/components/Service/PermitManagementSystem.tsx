import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, CheckCircle, AlertCircle, Clock, Upload, Download, MapPin, Phone, Mail, Globe, DollarSign, Calendar, Building2, ClipboardCheck, XCircle, Search, Filter, Plus, Eye, CreditCard as Edit, Send, CheckSquare, Square, ExternalLink, Info } from 'lucide-react';
import PermitEmailTracker from './PermitEmailTracker';

interface Jurisdiction {
  id: string;
  name: string;
  county: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  department_address: string;
  website_url: string;
  permit_portal_url: string;
  typical_review_days: number;
  requires_pre_application: boolean;
  allows_online_submission: boolean;
  base_permit_fee: number;
  per_watt_fee: number;
  special_requirements: any;
  inspection_fees: any;
}

interface DocumentRequirement {
  id: string;
  document_name: string;
  document_type: string;
  is_required: boolean;
  description: string;
  template_url: string;
  sort_order: number;
}

interface PermitApplication {
  id: string;
  opportunity_id: string;
  jurisdiction_id: string;
  application_status: string;
  application_number: string;
  submitted_date: string;
  approval_date: string;
  permit_fee_total: number;
  fee_paid: boolean;
  assigned_coordinator: string;
  town_reviewer_name: string;
  notes: string;
  created_at: string;
}

interface ApplicationDocument {
  id: string;
  requirement_id: string;
  document_name: string;
  status: string;
  uploaded_date: string;
  version: number;
}

const PermitManagementSystem: React.FC = () => {
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | null>(null);
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  const [applications, setApplications] = useState<PermitApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<ApplicationDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCounty, setFilterCounty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // Form state for new application
  const [newApplication, setNewApplication] = useState({
    opportunity_id: '',
    system_size_kw: '',
    property_address: '',
    property_owner: '',
    notes: '',
  });

  useEffect(() => {
    loadJurisdictions();
    loadApplications();
  }, []);

  useEffect(() => {
    if (selectedJurisdiction) {
      loadDocumentRequirements(selectedJurisdiction.id);
    }
  }, [selectedJurisdiction]);

  useEffect(() => {
    if (selectedApplication) {
      loadUploadedDocuments(selectedApplication.id);
    }
  }, [selectedApplication]);

  const loadJurisdictions = async () => {
    const { data, error } = await supabase
      .from('permit_jurisdictions')
      .select('*')
      .order('name');

    if (!error && data) {
      setJurisdictions(data);
    }
    setLoading(false);
  };

  const loadDocumentRequirements = async (jurisdictionId: string) => {
    const { data, error } = await supabase
      .from('permit_document_requirements')
      .select('*')
      .eq('jurisdiction_id', jurisdictionId)
      .order('sort_order');

    if (!error && data) {
      setDocumentRequirements(data);
    }
  };

  const loadApplications = async () => {
    const { data, error } = await supabase
      .from('permit_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApplications(data);
    }
  };

  const loadUploadedDocuments = async (applicationId: string) => {
    const { data, error } = await supabase
      .from('permit_application_documents')
      .select('*')
      .eq('application_id', applicationId);

    if (!error && data) {
      setUploadedDocuments(data);
    }
  };

  const calculatePermitFee = (systemSizeKw: number) => {
    if (!selectedJurisdiction) return 0;
    const baseFee = selectedJurisdiction.base_permit_fee || 0;
    const perWattFee = (selectedJurisdiction.per_watt_fee || 0) * systemSizeKw * 1000;
    return baseFee + perWattFee;
  };

  const createApplication = async () => {
    if (!selectedJurisdiction) {
      alert('Please select a jurisdiction first');
      return;
    }

    const systemSize = parseFloat(newApplication.system_size_kw);
    const permitFee = calculatePermitFee(systemSize);

    const { data, error } = await supabase
      .from('permit_applications')
      .insert([
        {
          opportunity_id: newApplication.opportunity_id,
          jurisdiction_id: selectedJurisdiction.id,
          application_status: 'draft',
          permit_fee_total: permitFee,
          notes: `Property: ${newApplication.property_address}\nOwner: ${newApplication.property_owner}\nSystem Size: ${systemSize} kW\n\n${newApplication.notes}`,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      // Create timeline event
      await supabase.from('permit_timeline_events').insert([
        {
          application_id: data.id,
          event_type: 'created',
          description: `Permit application created for ${selectedJurisdiction.name}`,
          metadata: { system_size_kw: systemSize },
        },
      ]);

      alert('Permit application created successfully!');
      setView('list');
      loadApplications();
      setNewApplication({
        opportunity_id: '',
        system_size_kw: '',
        property_address: '',
        property_owner: '',
        notes: '',
      });
    } else {
      alert('Error creating application: ' + error.message);
    }
  };

  const submitApplication = async (applicationId: string) => {
    const { error } = await supabase
      .from('permit_applications')
      .update({
        application_status: 'submitted',
        submitted_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', applicationId);

    if (!error) {
      await supabase.from('permit_timeline_events').insert([
        {
          application_id: applicationId,
          event_type: 'submitted',
          description: 'Application submitted to jurisdiction',
        },
      ]);

      alert('Application submitted successfully!');
      loadApplications();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'under_review':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredJurisdictions = jurisdictions.filter((j) => {
    const matchesSearch = j.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCounty = filterCounty === 'all' || j.county === filterCounty;
    return matchesSearch && matchesCounty;
  });

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = filterStatus === 'all' || app.application_status === filterStatus;
    return matchesStatus;
  });

  const isDocumentUploaded = (requirementId: string) => {
    return uploadedDocuments.some((doc) => doc.requirement_id === requirementId);
  };

  const getDocumentStatus = (requirementId: string) => {
    const doc = uploadedDocuments.find((d) => d.requirement_id === requirementId);
    return doc ? doc.status : 'missing';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permit Management System</h1>
          <p className="text-gray-600 mt-2">
            Manage solar permits for all Long Island municipalities
          </p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => setView('create')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span>New Permit Application</span>
          </button>
        )}
        {view !== 'list' && (
          <button
            onClick={() => {
              setView('list');
              setSelectedJurisdiction(null);
              setSelectedApplication(null);
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to List
          </button>
        )}
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-6">
          {/* Applications List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Permit Applications</h2>
              <div className="mt-4 flex space-x-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredApplications.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No permit applications found</p>
                  <button
                    onClick={() => setView('create')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Your First Application
                  </button>
                </div>
              ) : (
                filteredApplications.map((app) => {
                  const jurisdiction = jurisdictions.find((j) => j.id === app.jurisdiction_id);
                  return (
                    <div
                      key={app.id}
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedApplication(app);
                        setSelectedJurisdiction(jurisdiction || null);
                        setView('detail');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(app.application_status)}
                            <div>
                              <h3 className="text-lg font-semibold">
                                {jurisdiction?.name || 'Unknown Jurisdiction'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {app.application_number || 'No application number yet'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Created: {new Date(app.created_at).toLocaleDateString()}
                              </span>
                            </span>
                            {app.submitted_date && (
                              <span className="flex items-center space-x-1">
                                <Send className="w-4 h-4" />
                                <span>
                                  Submitted: {new Date(app.submitted_date).toLocaleDateString()}
                                </span>
                              </span>
                            )}
                            <span className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>${app.permit_fee_total?.toFixed(2) || '0.00'}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                              app.application_status
                            )}`}
                          >
                            {app.application_status.replace('_', ' ').toUpperCase()}
                          </span>
                          <Eye className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Towns Reference */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Town Requirements Reference</h2>
              <div className="mt-4 flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search towns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <select
                  value={filterCounty}
                  onChange={(e) => setFilterCounty(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Counties</option>
                  <option value="Suffolk">Suffolk County</option>
                  <option value="Nassau">Nassau County</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredJurisdictions.map((jurisdiction) => (
                <div key={jurisdiction.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        <div>
                          <h3 className="text-lg font-semibold">{jurisdiction.name}</h3>
                          <p className="text-sm text-gray-600">{jurisdiction.county} County</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2">Contact Info</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span>{jurisdiction.contact_phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4" />
                              <span>{jurisdiction.contact_email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>{jurisdiction.department_address}</span>
                            </div>
                            {jurisdiction.website_url && (
                              <a
                                href={jurisdiction.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                              >
                                <Globe className="w-4 h-4" />
                                <span>Visit Website</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2">
                            Permit Details
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>Review Time: ~{jurisdiction.typical_review_days} days</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4" />
                              <span>
                                Base Fee: ${jurisdiction.base_permit_fee?.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4" />
                              <span>
                                Per Watt: ${jurisdiction.per_watt_fee?.toFixed(4)}
                              </span>
                            </div>
                            {jurisdiction.allows_online_submission && (
                              <div className="flex items-center space-x-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Online Submission Available</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {jurisdiction.special_requirements?.notes && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                            <p className="text-sm text-blue-900">
                              {jurisdiction.special_requirements.notes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create New Application View */}
      {view === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step 1: Select Jurisdiction */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Step 1: Select Jurisdiction</h2>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search towns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredJurisdictions.map((jurisdiction) => (
                  <div
                    key={jurisdiction.id}
                    onClick={() => setSelectedJurisdiction(jurisdiction)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedJurisdiction?.id === jurisdiction.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{jurisdiction.name}</h3>
                        <p className="text-sm text-gray-600">{jurisdiction.county} County</p>
                        <div className="mt-1 flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>~{jurisdiction.typical_review_days} days</span>
                        </div>
                      </div>
                      {selectedJurisdiction?.id === jurisdiction.id && (
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: Enter Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Step 2: Enter Project Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opportunity ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={newApplication.opportunity_id}
                    onChange={(e) =>
                      setNewApplication({ ...newApplication, opportunity_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Link to Salesforce opportunity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Size (kW) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newApplication.system_size_kw}
                    onChange={(e) =>
                      setNewApplication({ ...newApplication, system_size_kw: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="8.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Address *
                  </label>
                  <input
                    type="text"
                    value={newApplication.property_address}
                    onChange={(e) =>
                      setNewApplication({ ...newApplication, property_address: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="123 Main St, Town, NY 11111"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Owner *
                  </label>
                  <input
                    type="text"
                    value={newApplication.property_owner}
                    onChange={(e) =>
                      setNewApplication({ ...newApplication, property_owner: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={newApplication.notes}
                    onChange={(e) =>
                      setNewApplication({ ...newApplication, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Any special requirements or notes..."
                  />
                </div>
              </div>
            </div>

            {/* Estimated Fee */}
            {selectedJurisdiction && newApplication.system_size_kw && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-900 mb-2">Estimated Permit Fee</h3>
                <div className="text-3xl font-bold text-green-900">
                  ${calculatePermitFee(parseFloat(newApplication.system_size_kw)).toFixed(2)}
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Base fee: ${selectedJurisdiction.base_permit_fee?.toFixed(2)} + Per-watt fee:{' '}
                  ${(
                    selectedJurisdiction.per_watt_fee *
                    parseFloat(newApplication.system_size_kw) *
                    1000
                  ).toFixed(2)}
                </p>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={createApplication}
              disabled={
                !selectedJurisdiction ||
                !newApplication.system_size_kw ||
                !newApplication.property_address ||
                !newApplication.property_owner
              }
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
            >
              Create Permit Application
            </button>
          </div>
        </div>
      )}

      {/* Application Detail View */}
      {view === 'detail' && selectedApplication && selectedJurisdiction && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {getStatusIcon(selectedApplication.application_status)}
                <div>
                  <h2 className="text-2xl font-bold">{selectedJurisdiction.name}</h2>
                  <p className="text-gray-600">
                    {selectedApplication.application_number || 'Draft Application'}
                  </p>
                </div>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                  selectedApplication.application_status
                )}`}
              >
                {selectedApplication.application_status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Permit Fee</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${selectedApplication.permit_fee_total?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Expected Review Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedJurisdiction.typical_review_days} days
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedApplication.fee_paid ? 'Paid' : 'Unpaid'}
                </p>
              </div>
            </div>

            {selectedApplication.application_status === 'draft' && (
              <div className="mt-6">
                <button
                  onClick={() => submitApplication(selectedApplication.id)}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Submit Application to {selectedJurisdiction.name}</span>
                </button>
              </div>
            )}
          </div>

          {/* Document Checklist */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Required Documents Checklist</h3>
            <div className="space-y-3">
              {documentRequirements.map((req) => {
                const uploaded = isDocumentUploaded(req.id);
                const status = getDocumentStatus(req.id);

                return (
                  <div
                    key={req.id}
                    className={`p-4 border-2 rounded-lg ${
                      uploaded ? 'border-green-300 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {uploaded ? (
                          <CheckSquare className="w-6 h-6 text-green-600 mt-0.5" />
                        ) : (
                          <Square className="w-6 h-6 text-gray-400 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{req.document_name}</h4>
                            {req.is_required && (
                              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                                Required
                              </span>
                            )}
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                              {req.document_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                          {uploaded && (
                            <p className="text-sm text-green-600 mt-2">
                              Uploaded - Status: {status}
                            </p>
                          )}
                        </div>
                      </div>
                      <button className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Upload className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Progress:</strong>{' '}
                {uploadedDocuments.filter((d) => d.status === 'submitted').length} of{' '}
                {documentRequirements.filter((r) => r.is_required).length} required documents
                uploaded
              </p>
            </div>
          </div>

          {/* Town Contact Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">
              {selectedJurisdiction.name} Building Department
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <span>{selectedJurisdiction.contact_phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span>{selectedJurisdiction.contact_email}</span>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-600 mt-1" />
                  <span>{selectedJurisdiction.department_address}</span>
                </div>
              </div>
              <div className="space-y-3">
                {selectedJurisdiction.website_url && (
                  <a
                    href={selectedJurisdiction.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 text-blue-600 hover:text-blue-700"
                  >
                    <Globe className="w-5 h-5" />
                    <span>Visit Building Department Website</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {selectedJurisdiction.permit_portal_url && (
                  <a
                    href={selectedJurisdiction.permit_portal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 text-blue-600 hover:text-blue-700"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Online Permit Portal</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {selectedJurisdiction.special_requirements?.notes && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
                <p className="text-sm text-yellow-800">
                  {selectedJurisdiction.special_requirements.notes}
                </p>
              </div>
            )}
          </div>

          {/* Email Correspondence Tracker */}
          <PermitEmailTracker
            permitReference={selectedApplication.application_number}
            townName={selectedJurisdiction.name}
          />
        </div>
      )}
    </div>
  );
};

export default PermitManagementSystem;
