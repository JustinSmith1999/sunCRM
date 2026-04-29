import React, { useState } from 'react';
import { X, Zap, DollarSign, Home, Calendar, Battery, Car } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SolarLeadIntakeFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function SolarLeadIntakeForm({ isOpen = true, onClose, onSuccess }: SolarLeadIntakeFormProps) {
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    primary_phone: '',
    street: '',
    city: '',
    state: '',
    zip_postal_code: '',
    monthly_electric_bill: '',
    average_monthly_kwh: '',
    utility_company: '',
    roof_ownership_status: 'own',
    roof_age_years: '',
    roof_condition: '',
    roof_material: '',
    shading_concerns: 'none',
    roof_direction_facing: '',
    financing_preference: 'undecided',
    timeline_urgency: 'just_exploring',
    credit_score_range: 'unknown',
    battery_storage_interest: false,
    ev_charger_interest: false,
    hoa_approval_needed: false,
    hoa_status: 'not_needed'
  });

  const calculateInterestScore = () => {
    let score = 0;

    const bill = parseFloat(formData.monthly_electric_bill) || 0;
    if (bill > 500) score += 30;
    else if (bill > 300) score += 20;
    else if (bill > 150) score += 10;

    if (formData.roof_ownership_status === 'own') score += 20;
    if (formData.roof_condition === 'excellent') score += 10;
    else if (formData.roof_condition === 'good') score += 8;

    if (formData.shading_concerns === 'none') score += 15;
    else if (formData.shading_concerns === 'minimal') score += 10;

    if (formData.timeline_urgency === 'immediate') score += 25;
    else if (formData.timeline_urgency === '1_3_months') score += 20;
    else if (formData.timeline_urgency === '3_6_months') score += 10;

    return Math.min(score, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const interestScore = calculateInterestScore();
      const qualificationStatus = interestScore >= 60 ? 'qualified' :
                                 interestScore >= 40 ? 'pending_review' : 'new';

      const { error } = await supabase
        .from('leads')
        .insert({
          ...formData,
          monthly_electric_bill: parseFloat(formData.monthly_electric_bill) || null,
          average_monthly_kwh: parseFloat(formData.average_monthly_kwh) || null,
          roof_age_years: parseInt(formData.roof_age_years) || null,
          solar_interest_score: interestScore,
          qualification_status: qualificationStatus,
          Status: 'Open',
          LeadSource: 'Website'
        });

      if (error) throw error;

      onSuccess?.();
      if (onClose) {
        onClose();
      } else {
        alert('Solar lead created successfully!');
      }

      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        primary_phone: '',
        street: '',
        city: '',
        state: '',
        zip_postal_code: '',
        monthly_electric_bill: '',
        average_monthly_kwh: '',
        utility_company: '',
        roof_ownership_status: 'own',
        roof_age_years: '',
        roof_condition: '',
        roof_material: '',
        shading_concerns: 'none',
        roof_direction_facing: '',
        financing_preference: 'undecided',
        timeline_urgency: 'just_exploring',
        credit_score_range: 'unknown',
        battery_storage_interest: false,
        ev_charger_interest: false,
        hoa_approval_needed: false,
        hoa_status: 'not_needed'
      });
      setStep(1);
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Error creating solar lead');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
        <Home className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
        Contact Information
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email *
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Phone *
        </label>
        <input
          type="tel"
          value={formData.primary_phone}
          onChange={(e) => setFormData({ ...formData, primary_phone: e.target.value })}
          className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Street Address *
        </label>
        <input
          type="text"
          value={formData.street}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          required
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
            maxLength={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ZIP *</label>
          <input
            type="text"
            value={formData.zip_postal_code}
            onChange={(e) => setFormData({ ...formData, zip_postal_code: e.target.value })}
            className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
        Electric Usage
      </h3>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Average Monthly Electric Bill ($) *
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          <input
            type="number"
            value={formData.monthly_electric_bill}
            onChange={(e) => setFormData({ ...formData, monthly_electric_bill: e.target.value })}
            className="w-full pl-10 pr-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="250"
            required
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">Check your recent utility bill</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Average Monthly Usage (kWh)
        </label>
        <input
          type="number"
          value={formData.average_monthly_kwh}
          onChange={(e) => setFormData({ ...formData, average_monthly_kwh: e.target.value })}
          className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Utility Company
        </label>
        <input
          type="text"
          value={formData.utility_company}
          onChange={(e) => setFormData({ ...formData, utility_company: e.target.value })}
          className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="e.g., PSEG, Con Edison"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
        <Home className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
        Roof & Property Details
      </h3>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Do you own or rent? *
        </label>
        <select
          value={formData.roof_ownership_status}
          onChange={(e) => setFormData({ ...formData, roof_ownership_status: e.target.value })}
          className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        >
          <option value="own">Own</option>
          <option value="rent">Rent</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Roof Age (years)
          </label>
          <input
            type="number"
            value={formData.roof_age_years}
            onChange={(e) => setFormData({ ...formData, roof_age_years: e.target.value })}
            className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="10"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Roof Condition
          </label>
          <select
            value={formData.roof_condition}
            onChange={(e) => setFormData({ ...formData, roof_condition: e.target.value })}
            className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Roof Material
          </label>
          <select
            value={formData.roof_material}
            onChange={(e) => setFormData({ ...formData, roof_material: e.target.value })}
            className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            <option value="asphalt_shingle">Asphalt Shingle</option>
            <option value="tile">Tile</option>
            <option value="metal">Metal</option>
            <option value="flat">Flat</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Roof Direction
          </label>
          <select
            value={formData.roof_direction_facing}
            onChange={(e) => setFormData({ ...formData, roof_direction_facing: e.target.value })}
            className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            <option value="south">South</option>
            <option value="southwest">Southwest</option>
            <option value="southeast">Southeast</option>
            <option value="east">East</option>
            <option value="west">West</option>
            <option value="north">North</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Shading Concerns
        </label>
        <select
          value={formData.shading_concerns}
          onChange={(e) => setFormData({ ...formData, shading_concerns: e.target.value })}
          className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        >
          <option value="none">None</option>
          <option value="minimal">Minimal</option>
          <option value="moderate">Moderate</option>
          <option value="significant">Significant</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.hoa_approval_needed}
            onChange={(e) => setFormData({ ...formData, hoa_approval_needed: e.target.checked })}
            className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
          />
          <span className="text-sm text-slate-700">Property is in an HOA</span>
        </label>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
        Timeline & Preferences
      </h3>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Installation Timeline *
        </label>
        <select
          value={formData.timeline_urgency}
          onChange={(e) => setFormData({ ...formData, timeline_urgency: e.target.value })}
          className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        >
          <option value="immediate">Immediate (ASAP)</option>
          <option value="1_3_months">1-3 months</option>
          <option value="3_6_months">3-6 months</option>
          <option value="6_12_months">6-12 months</option>
          <option value="just_exploring">Just exploring</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Financing Preference
        </label>
        <select
          value={formData.financing_preference}
          onChange={(e) => setFormData({ ...formData, financing_preference: e.target.value })}
          className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        >
          <option value="undecided">Undecided</option>
          <option value="cash">Cash</option>
          <option value="loan">Loan</option>
          <option value="lease">Lease</option>
          <option value="ppa">Power Purchase Agreement (PPA)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Credit Score Range
        </label>
        <select
          value={formData.credit_score_range}
          onChange={(e) => setFormData({ ...formData, credit_score_range: e.target.value })}
          className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        >
          <option value="unknown">Prefer not to say</option>
          <option value="excellent">Excellent (750+)</option>
          <option value="good">Good (700-749)</option>
          <option value="fair">Fair (650-699)</option>
          <option value="poor">Poor (&lt;650)</option>
        </select>
      </div>

      <div className="space-y-3">
        <label className="flex items-start sm:items-center gap-2">
          <input
            type="checkbox"
            checked={formData.battery_storage_interest}
            onChange={(e) => setFormData({ ...formData, battery_storage_interest: e.target.checked })}
            className="w-4 h-4 mt-0.5 sm:mt-0 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
          />
          <span className="text-sm text-slate-700 flex items-center gap-1">
            <Battery className="w-4 h-4 flex-shrink-0" />
            Interested in battery backup storage
          </span>
        </label>

        <label className="flex items-start sm:items-center gap-2">
          <input
            type="checkbox"
            checked={formData.ev_charger_interest}
            onChange={(e) => setFormData({ ...formData, ev_charger_interest: e.target.checked })}
            className="w-4 h-4 mt-0.5 sm:mt-0 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
          />
          <span className="text-sm text-slate-700 flex items-center gap-1">
            <Car className="w-4 h-4 flex-shrink-0" />
            Interested in EV charger installation
          </span>
        </label>
      </div>
    </div>
  );

  const isModal = !!onClose;

  const content = (
    <>
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">New Solar Lead</h2>
          <p className="text-sm text-slate-600">Step {step} of 4</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 -mr-2"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </form>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-t border-slate-200 bg-slate-50 sticky bottom-0 gap-4">
        <div className="flex gap-1 order-1 sm:order-1">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 sm:w-16 h-1 rounded-full ${
                s === step ? 'bg-amber-600' : s < step ? 'bg-amber-300' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3 justify-end order-2 sm:order-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium touch-manipulation"
            >
              Back
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium touch-manipulation"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium disabled:opacity-50 touch-manipulation"
              onClick={handleSubmit}
            >
              {saving ? 'Creating...' : 'Create Lead'}
            </button>
          )}
        </div>
      </div>
    </>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col bg-white">
      <div className="bg-white rounded-lg shadow-sm max-w-4xl mx-auto w-full h-full flex flex-col">
        {content}
      </div>
    </div>
  );
}
