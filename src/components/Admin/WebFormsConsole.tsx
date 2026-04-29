import React, { useState, useEffect } from 'react';
import { Plus, Search, Copy, Eye, CreditCard as Edit, Trash2, Globe, Code, CheckCircle, XCircle, BarChart3, Mail, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface WebForm {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  form_key: string;
  default_lead_source: string;
  redirect_url: string | null;
  success_message: string;
  submissions_count: number;
  selected_fields: string[];
  capture_utm: boolean;
  capture_ip: boolean;
  auto_response_enabled: boolean;
  created_at: string;
  default_owner: {
    full_name: string | null;
    email: string;
  } | null;
}

const AVAILABLE_FIELDS = [
  { name: 'first_name', label: 'First Name', required: true },
  { name: 'last_name', label: 'Last Name', required: true },
  { name: 'email', label: 'Email', required: true },
  { name: 'phone', label: 'Phone', required: false },
  { name: 'mobile', label: 'Mobile', required: false },
  { name: 'company', label: 'Company', required: false },
  { name: 'title', label: 'Job Title', required: false },
  { name: 'industry', label: 'Industry', required: false },
  { name: 'website', label: 'Website', required: false },
  { name: 'description', label: 'Message', required: false },
  { name: 'street', label: 'Street Address', required: false },
  { name: 'city', label: 'City', required: false },
  { name: 'state', label: 'State', required: false },
  { name: 'zip', label: 'ZIP Code', required: false },
  { name: 'country', label: 'Country', required: false },
  { name: 'annual_revenue', label: 'Annual Revenue', required: false },
  { name: 'employee_count', label: 'Number of Employees', required: false },
  { name: 'utility', label: 'Utility Company', required: false },
  { name: 'utility_account_1', label: 'Utility Account #1', required: false },
  { name: 'annual_kwh_usage', label: 'Annual KWh Usage', required: false },
  { name: 'avg_monthly_elec_bill', label: 'Avg Monthly Electric Bill', required: false },
  { name: 'sq_ft', label: 'Square Footage', required: false },
  { name: 'referred_by', label: 'Referred By', required: false },
  { name: 'secondary_email', label: 'Secondary Email', required: false },
];

export function WebFormsConsole() {
  const [forms, setForms] = useState<WebForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewFormModal, setShowNewFormModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<WebForm | null>(null);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const { profile } = useAuth();

  useEffect(() => {
    loadForms();
    loadUsers();
  }, [profile]);

  const loadForms = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('web_forms')
        .select(`
          *,
          default_owner:user_profiles!web_forms_default_owner_id_fkey (full_name, email)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('organization_id', profile.organization_id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateForm = async () => {
    if (!profile?.id || !profile?.organization_id || !editingForm?.name) return;

    try {
      const { error } = await supabase.from('web_forms').insert({
        organization_id: profile.organization_id,
        name: editingForm.name,
        description: editingForm.description || '',
        default_owner_id: editingForm.default_owner_id || profile.id,
        default_lead_source: editingForm.default_lead_source || 'Website',
        success_message: editingForm.success_message || 'Thank you for your submission!',
        redirect_url: editingForm.redirect_url || null,
        selected_fields: editingForm.selected_fields || ['first_name', 'last_name', 'email', 'phone', 'company', 'description'],
        capture_utm: editingForm.capture_utm !== false,
        capture_ip: editingForm.capture_ip !== false,
        is_active: true,
        created_by: profile.id,
      });

      if (error) throw error;

      setShowNewFormModal(false);
      setEditingForm(null);
      loadForms();
    } catch (error) {
      console.error('Error creating form:', error);
      alert('Failed to create form');
    }
  };

  const handleToggleActive = async (form: WebForm) => {
    try {
      const { error } = await supabase
        .from('web_forms')
        .update({ is_active: !form.is_active })
        .eq('id', form.id);

      if (error) throw error;
      loadForms();
    } catch (error) {
      console.error('Error toggling form:', error);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This cannot be undone.')) return;

    try {
      const { error } = await supabase.from('web_forms').delete().eq('id', formId);

      if (error) throw error;
      loadForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      alert('Failed to delete form');
    }
  };

  const toggleFieldSelection = (fieldName: string) => {
    const requiredFields = ['first_name', 'last_name', 'email'];
    if (requiredFields.includes(fieldName)) return;

    const currentFields = editingForm?.selected_fields || ['first_name', 'last_name', 'email', 'phone', 'company', 'description'];
    const newFields = currentFields.includes(fieldName)
      ? currentFields.filter((f: string) => f !== fieldName)
      : [...currentFields, fieldName];

    setEditingForm({ ...editingForm, selected_fields: newFields });
  };

  const generateHTMLCode = (form: WebForm) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const endpoint = `${supabaseUrl}/functions/v1/web-to-lead`;
    const fields = form.selected_fields || ['first_name', 'last_name', 'email', 'phone', 'company', 'description'];

    const fieldHTML = fields.map(fieldName => {
      const field = AVAILABLE_FIELDS.find(f => f.name === fieldName);
      if (!field) return '';

      const required = field.required ? 'required' : '';
      const type = fieldName === 'email' ? 'email' : fieldName.includes('phone') ? 'tel' : fieldName === 'website' ? 'url' : 'text';

      if (fieldName === 'description') {
        return `  <div>
    <label for="${fieldName}">${field.label}${field.required ? ' *' : ''}</label>
    <textarea id="${fieldName}" name="${fieldName}" rows="4" ${required}></textarea>
  </div>`;
      }

      return `  <div>
    <label for="${fieldName}">${field.label}${field.required ? ' *' : ''}</label>
    <input type="${type}" id="${fieldName}" name="${fieldName}" ${required} />
  </div>`;
    }).join('\n\n');

    const utmScript = form.capture_utm ? `
  // Auto-capture UTM parameters
  const urlParams = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(param => {
    const value = urlParams.get(param);
    if (value) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = param;
      input.value = value;
      formElement.appendChild(input);
    }
  });
` : '';

    return `<!-- Web-to-Lead Form: ${form.name} -->
<form id="leadForm" action="${endpoint}" method="POST" style="max-width: 600px; margin: 0 auto;">
  <input type="hidden" name="form_key" value="${form.form_key}" />

${fieldHTML}

  <button type="submit" style="margin-top: 20px;">Submit</button>
</form>

<script>
(function() {
  const formElement = document.getElementById('leadForm');
${utmScript}
  formElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch('${endpoint}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message || 'Thank you for your submission!');
        e.target.reset();
        if (result.redirect_url) {
          window.location.href = result.redirect_url;
        }
      } else {
        alert('Error: ' + (result.error || 'Please try again'));
      }
    } catch (error) {
      alert('Failed to submit form. Please try again.');
    }
  });
})();
</script>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Code copied to clipboard!');
  };

  const filteredForms = forms.filter(
    (form) =>
      form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-slate-200">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Web-to-Lead Forms</h1>
          <p className="text-slate-600">Create and manage forms that capture leads from your website</p>
        </div>
        <button
          onClick={() => {
            setEditingForm({
              name: '',
              description: '',
              selected_fields: ['first_name', 'last_name', 'email', 'phone', 'company', 'description'],
              capture_utm: true,
              capture_ip: true
            });
            setShowNewFormModal(true);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Form
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredForms.map((form) => (
          <div key={form.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">{form.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      form.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {form.is_active ? (
                      <>
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 inline mr-1" />
                        Inactive
                      </>
                    )}
                  </span>
                </div>

                {form.description && (
                  <p className="text-slate-600 mb-3">{form.description}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600 mb-3">
                  <div>
                    <span className="font-medium">Lead Source:</span> {form.default_lead_source}
                  </div>
                  <div>
                    <span className="font-medium">Owner:</span>{' '}
                    {form.default_owner?.full_name || form.default_owner?.email || 'Not set'}
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    <span className="font-medium">{form.submissions_count}</span> submissions
                  </div>
                  <div>
                    <span className="font-medium">Fields:</span> {form.selected_fields?.length || 6}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {form.capture_utm && (
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">UTM Capture</span>
                  )}
                  {form.capture_ip && (
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">IP Tracking</span>
                  )}
                  {form.auto_response_enabled && (
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Auto-Response
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    setSelectedForm(form);
                    setShowPreviewModal(true);
                  }}
                  className="text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                  title="Preview form"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setSelectedForm(form);
                    setShowCodeModal(true);
                  }}
                  className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                  title="Get embed code"
                >
                  <Code className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleToggleActive(form)}
                  className={`p-2 rounded-lg transition-colors ${
                    form.is_active
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                  title={form.is_active ? 'Deactivate' : 'Activate'}
                >
                  {form.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleDeleteForm(form.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  title="Delete form"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredForms.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <Globe className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No forms found</h3>
            <p className="text-slate-600 mb-4">Create your first web-to-lead form to start capturing leads</p>
            <button
              onClick={() => {
                setEditingForm({
                  name: '',
                  description: '',
                  selected_fields: ['first_name', 'last_name', 'email', 'phone', 'company', 'description'],
                  capture_utm: true,
                  capture_ip: true
                });
                setShowNewFormModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Form
            </button>
          </div>
        )}
      </div>

      {showNewFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Web Form</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Form Name *
                  </label>
                  <input
                    type="text"
                    value={editingForm?.name || ''}
                    onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g., Contact Form, Demo Request"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingForm?.description || ''}
                    onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    rows={2}
                    placeholder="Optional description for internal use"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Default Lead Source
                  </label>
                  <input
                    type="text"
                    value={editingForm?.default_lead_source || 'Website'}
                    onChange={(e) => setEditingForm({ ...editingForm, default_lead_source: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Default Owner
                  </label>
                  <select
                    value={editingForm?.default_owner_id || profile?.id}
                    onChange={(e) => setEditingForm({ ...editingForm, default_owner_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Success Message
                  </label>
                  <input
                    type="text"
                    value={editingForm?.success_message || 'Thank you for your submission!'}
                    onChange={(e) => setEditingForm({ ...editingForm, success_message: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Redirect URL (optional)
                  </label>
                  <input
                    type="url"
                    value={editingForm?.redirect_url || ''}
                    onChange={(e) => setEditingForm({ ...editingForm, redirect_url: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="https://example.com/thank-you"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Form Fields (Select which fields to include)
                </label>
                <div className="border border-slate-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AVAILABLE_FIELDS.map((field) => {
                      const isSelected = (editingForm?.selected_fields || []).includes(field.name);
                      return (
                        <label
                          key={field.name}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-slate-50 ${
                            field.required ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={field.required}
                            onChange={() => toggleFieldSelection(field.name)}
                            className="w-4 h-4 text-amber-500 rounded focus:ring-2 focus:ring-amber-500"
                          />
                          <span className="text-sm">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">* Required fields are always included</p>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Advanced Options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingForm?.capture_utm !== false}
                      onChange={(e) => setEditingForm({ ...editingForm, capture_utm: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-700">Auto-capture UTM parameters from URL</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingForm?.capture_ip !== false}
                      onChange={(e) => setEditingForm({ ...editingForm, capture_ip: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-700">Capture submitter IP address</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateForm}
                disabled={!editingForm?.name}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-900 py-2 rounded-lg font-medium transition-colors"
              >
                Create Form
              </button>
              <button
                onClick={() => {
                  setShowNewFormModal(false);
                  setEditingForm(null);
                }}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCodeModal && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Embed Code: {selectedForm.name}</h2>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">HTML Form Code</h3>
                  <button
                    onClick={() => copyToClipboard(generateHTMLCode(selectedForm))}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs max-h-96">
                  <code>{generateHTMLCode(selectedForm)}</code>
                </pre>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Integration Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Copy the HTML code above</li>
                  <li>Paste it into your website where you want the form to appear</li>
                  <li>Customize the styling as needed for your design</li>
                  <li>The form will automatically submit leads to your CRM</li>
                  {selectedForm.capture_utm && <li>UTM parameters will be automatically captured from the URL</li>}
                </ol>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2">Form Configuration:</h4>
                <div className="space-y-1 text-sm text-amber-800">
                  <p><strong>Form Key:</strong> <code className="bg-white px-2 py-0.5 rounded">{selectedForm.form_key}</code></p>
                  <p><strong>Endpoint:</strong> <code className="bg-white px-2 py-0.5 rounded text-xs break-all">{import.meta.env.VITE_SUPABASE_URL}/functions/v1/web-to-lead</code></p>
                  <p><strong>Status:</strong> {selectedForm.is_active ? 'Active' : 'Inactive'}</p>
                  <p><strong>Fields:</strong> {selectedForm.selected_fields?.length || 0} fields configured</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  setSelectedForm(null);
                }}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Form Preview: {selectedForm.name}</h2>

            <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Get in Touch</h3>
              <p className="text-slate-600 mb-6">Fill out the form below and we'll get back to you soon.</p>

              <div className="space-y-4">
                {(selectedForm.selected_fields || []).map(fieldName => {
                  const field = AVAILABLE_FIELDS.find(f => f.name === fieldName);
                  if (!field) return null;

                  return (
                    <div key={fieldName}>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {fieldName === 'description' ? (
                        <textarea
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                          rows={4}
                          disabled
                        />
                      ) : (
                        <input
                          type={fieldName === 'email' ? 'email' : fieldName.includes('phone') ? 'tel' : 'text'}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                          disabled
                        />
                      )}
                    </div>
                  );
                })}

                <button
                  disabled
                  className="w-full bg-amber-500 text-slate-900 font-semibold py-3 px-6 rounded-lg opacity-50 cursor-not-allowed"
                >
                  Submit
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedForm(null);
                }}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 py-2 rounded-lg font-medium transition-colors"
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
