import React, { useState, useEffect } from 'react';
import { X, Phone, Clock, User, Building2, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CallInfo {
  sessionId: string;
  direction: 'Inbound' | 'Outbound';
  from: { phoneNumber: string; name?: string };
  to: { phoneNumber: string; name?: string };
  startTime: number;
}

interface PostCallModalProps {
  call: CallInfo;
  onClose: () => void;
  onCreateLead: (data: {
    firstName: string;
    lastName: string;
    company?: string;
    phone: string;
    notes?: string;
  }) => Promise<void>;
  onSaveNotes: (notes: string, disposition?: string) => Promise<void>;
}

interface CallDisposition {
  id: string;
  name: string;
  code: string;
  requires_follow_up: boolean;
}

export function EmbeddablePostCallModal({ call, onClose, onCreateLead, onSaveNotes }: PostCallModalProps) {
  const [tab, setTab] = useState<'notes' | 'lead'>('notes');
  const [notes, setNotes] = useState('');
  const [disposition, setDisposition] = useState('');
  const [dispositions, setDispositions] = useState<CallDisposition[]>([]);
  const [loading, setLoading] = useState(false);

  // Lead form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');

  const phoneNumber = call.direction === 'Inbound'
    ? call.from.phoneNumber
    : call.to.phoneNumber;

  const callerName = call.direction === 'Inbound'
    ? call.from.name || 'Unknown Caller'
    : call.to.name || phoneNumber;

  useEffect(() => {
    loadDispositions();
  }, []);

  const loadDispositions = async () => {
    const { data } = await supabase
      .from('call_dispositions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (data) {
      setDispositions(data);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      await onSaveNotes(notes, disposition);
      onClose();
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save call notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async () => {
    if (!firstName || !lastName) {
      alert('Please enter first and last name');
      return;
    }

    setLoading(true);
    try {
      await onCreateLead({
        firstName,
        lastName,
        company,
        phone: phoneNumber,
        notes,
      });
      onClose();
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Call Summary</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span className="opacity-90">Direction:</span>
              <span className="font-semibold">{call.direction}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="opacity-90">Contact:</span>
              <span className="font-semibold">{callerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span className="opacity-90">Number:</span>
              <span className="font-semibold">{phoneNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="opacity-90">Time:</span>
              <span className="font-semibold">
                {new Date(call.startTime).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setTab('notes')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                tab === 'notes'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Add Notes
            </button>
            <button
              onClick={() => setTab('lead')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                tab === 'lead'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Create Lead
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 300px)' }}>
          {tab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call Disposition
                </label>
                <select
                  value={disposition}
                  onChange={(e) => setDisposition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select outcome...</option>
                  {dispositions.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter call notes, follow-up actions, or important details..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {tab === 'lead' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  Create a new lead for <strong>{phoneNumber}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional information about this lead..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Skip
          </button>
          {tab === 'notes' ? (
            <button
              onClick={handleSaveNotes}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Notes'}
            </button>
          ) : (
            <button
              onClick={handleCreateLead}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Lead'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
