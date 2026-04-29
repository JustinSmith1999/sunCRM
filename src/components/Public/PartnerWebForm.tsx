import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ChannelPartner {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export default function PartnerWebForm() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<ChannelPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    county: '',
    email: '',
    phone: '',
    utility: '',
    utility_account: '',
    own_residence: '',
    installation_type: '',
    new_construction: false,
    sales_notes: '',
  });

  useEffect(() => {
    loadPartner();
  }, [slug]);

  const loadPartner = async () => {
    if (!slug) {
      setError('Invalid partner URL');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('channel_partners')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        setError('Partner not found or inactive');
      } else {
        setPartner(data);
      }
    } catch (err) {
      console.error('Error loading partner:', err);
      setError('Failed to load partner information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/partner-webhook`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            partner_slug: slug,
            ...formData,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }

      setSubmitted(true);

      // Redirect to thank you page after 2 seconds
      setTimeout(() => {
        window.location.href = 'https://www.sunation.com/cp-thankyou/';
      }, 2000);
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Partner not found'}</p>
          <button
            onClick={() => window.location.href = 'https://www.sunation.com'}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Sunation.com
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your information has been submitted successfully. We'll be in touch soon!
          </p>
          <p className="text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SUNation Energy</h1>
            <p className="text-gray-600">Partner: {partner.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="street"
                name="street"
                required
                rows={2}
                value={formData.street}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  required
                  maxLength={2}
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="NY"
                />
              </div>

              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  required
                  maxLength={10}
                  value={formData.zip}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-1">
                County <span className="text-red-500">*</span>
              </label>
              <select
                id="county"
                name="county"
                required
                value={formData.county}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select One</option>
                <option value="Bronx">Bronx</option>
                <option value="Kings">Kings</option>
                <option value="Nassau">Nassau</option>
                <option value="New York">New York</option>
                <option value="Queens">Queens</option>
                <option value="Richmond">Richmond</option>
                <option value="Suffolk">Suffolk</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="utility" className="block text-sm font-medium text-gray-700 mb-1">
                  Utility
                </label>
                <select
                  id="utility"
                  name="utility"
                  value={formData.utility}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select One</option>
                  <option value="Con-Ed">Con-Ed</option>
                  <option value="National Grid">National Grid</option>
                  <option value="PSEG">PSEG</option>
                </select>
              </div>

              <div>
                <label htmlFor="utility_account" className="block text-sm font-medium text-gray-700 mb-1">
                  Utility Account Number
                </label>
                <input
                  type="text"
                  id="utility_account"
                  name="utility_account"
                  value={formData.utility_account}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="own_residence" className="block text-sm font-medium text-gray-700 mb-1">
                  Own Residence? <span className="text-red-500">*</span>
                </label>
                <select
                  id="own_residence"
                  name="own_residence"
                  required
                  value={formData.own_residence}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select One</option>
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              <div>
                <label htmlFor="installation_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Installation <span className="text-red-500">*</span>
                </label>
                <select
                  id="installation_type"
                  name="installation_type"
                  required
                  value={formData.installation_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select One</option>
                  <option value="Residential">Residential</option>
                  <option value="Add On">Add On</option>
                  <option value="Residential - Fire Island">Residential - Fire Island</option>
                  <option value="SUNation Roofing">SUNation Roofing</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="new_construction"
                name="new_construction"
                checked={formData.new_construction}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="new_construction" className="ml-2 block text-sm text-gray-700">
                New Construction
              </label>
            </div>

            <div>
              <label htmlFor="sales_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Sales Notes
              </label>
              <textarea
                id="sales_notes"
                name="sales_notes"
                rows={3}
                value={formData.sales_notes}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional information or notes..."
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By submitting this form, you agree to be contacted by SUNation Energy regarding solar energy solutions.
            </p>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Powered by SUNation Energy | Partner: {partner.name}
          </p>
        </div>
      </div>
    </div>
  );
}
