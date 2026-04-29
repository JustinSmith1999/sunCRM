import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface WebToLeadFormProps {
  formKey: string;
  supabaseUrl: string;
  title?: string;
  subtitle?: string;
  fields?: string[];
  submitButtonText?: string;
  className?: string;
}

interface FormData {
  [key: string]: string;
}

export function WebToLeadForm({
  formKey,
  supabaseUrl,
  title = 'Get in Touch',
  subtitle = 'Fill out the form below and we\'ll get back to you soon.',
  fields = ['first_name', 'last_name', 'email', 'phone', 'company', 'description'],
  submitButtonText = 'Submit',
  className = '',
}: WebToLeadFormProps) {
  const [formData, setFormData] = useState<FormData>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fieldLabels: { [key: string]: string } = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    mobile: 'Mobile',
    company: 'Company',
    title: 'Job Title',
    industry: 'Industry',
    website: 'Website',
    description: 'Message',
    street: 'Street Address',
    city: 'City',
    state: 'State',
    zip: 'ZIP Code',
    country: 'Country',
    annual_revenue: 'Annual Revenue',
    employee_count: 'Number of Employees',
    additional_information: 'Additional Information',
    age_of_roof: 'Age of Roof',
    age_of_structure: 'Age of Structure',
    annual_kwh_usage: 'Annual KWh Usage',
    avg_monthly_elec_bill: 'Avg Monthly Electric Bill',
    bankruptcy: 'Bankruptcy Status',
    county: 'County',
    credit_score: 'Credit Score',
    customer_expectations: 'Customer Expectations',
    financing: 'Financing Options',
    floors: 'Number of Floors',
    language_preference: 'Language Preference',
    lead_channel: 'Lead Channel',
    meter_1: 'Meter #1',
    meter_2: 'Meter #2',
    meter_3: 'Meter #3',
    meter_4: 'Meter #4',
    name_on_utility_account: 'Name on Utility Account',
    orientation_of_roofs: 'Roof Orientation',
    other_source: 'Other Source',
    own_residence: 'Own Residence?',
    partner: 'Partner',
    profession: 'Profession',
    program_name: 'Program Name',
    ps_rating: 'Project Sunroof Rating',
    ps_score: 'Project Sunroof Score',
    referred_by: 'Referred By',
    roof_pitch: 'Roof Pitch',
    roof_style: 'Roof Style/Composition',
    secondary_email: 'Secondary Email',
    shading_issues: 'Shading Issues',
    sq_ft: 'Square Footage',
    taxable_income: 'Taxable Income',
    type_of_structure: 'Type of Structure',
    utility: 'Utility Company',
    utility_account_1: 'Utility Account #1',
    utility_account_2: 'Utility Account #2',
    utility_account_3: 'Utility Account #3',
    utility_account_4: 'Utility Account #4',
    utm_campaign: 'UTM Campaign',
    utm_content: 'UTM Content',
    utm_medium: 'UTM Medium',
    utm_source: 'UTM Source',
    utm_term: 'UTM Term',
    vts_phone: 'VTS Phone',
  };

  const fieldTypes: { [key: string]: string } = {
    email: 'email',
    phone: 'tel',
    mobile: 'tel',
    website: 'url',
    annual_revenue: 'number',
    employee_count: 'number',
    description: 'textarea',
  };

  const requiredFields = ['first_name', 'last_name', 'email'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = `${supabaseUrl}/functions/v1/web-to-lead`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          form_key: formKey,
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit form');
      }

      setSuccessMessage(result.message || 'Thank you for your submission!');
      setSubmitted(true);
      setFormData({});

      if (result.redirect_url) {
        setTimeout(() => {
          window.location.href = result.redirect_url;
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg ${className}`}>
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Success!</h2>
          <p className="text-slate-600">{successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg ${className}`}>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-600">{subtitle}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field) => {
            const isRequired = requiredFields.includes(field);
            const fieldType = fieldTypes[field] || 'text';
            const label = fieldLabels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            if (fieldType === 'textarea') {
              return (
                <div key={field} className="md:col-span-2">
                  <label htmlFor={field} className="block text-sm font-medium text-slate-700 mb-2">
                    {label}
                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <textarea
                    id={field}
                    name={field}
                    value={formData[field] || ''}
                    onChange={handleChange}
                    required={isRequired}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              );
            }

            return (
              <div key={field} className={field === 'description' ? 'md:col-span-2' : ''}>
                <label htmlFor={field} className="block text-sm font-medium text-slate-700 mb-2">
                  {label}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type={fieldType}
                  id={field}
                  name={field}
                  value={formData[field] || ''}
                  onChange={handleChange}
                  required={isRequired}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-900 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {submitButtonText}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
