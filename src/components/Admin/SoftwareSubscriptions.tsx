import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Heart, DollarSign, Calendar, AlertTriangle, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Subscription {
  Id: string;
  Name: string;
  Employee_Name__c: string | null;
  Price__c: string | null;
  Subscription_type__c: string | null;
  Username__c: string | null;
  Password__c: string | null;
  Shared__c: boolean | null;
  Shared_with_1__c: string | null;
  Shared_with_2__c: string | null;
  Shared_with_3__c: string | null;
  Shared_with_4__c: string | null;
  Shared_with_5__c: string | null;
  Installed_on_1__c: string | null;
  Installed_on_2__c: string | null;
  Installed_on_3__c: string | null;
  Installed_on_4__c: string | null;
  Installed_on_5__c: string | null;
  Subscription_Notes__c: string | null;
  CreatedDate: string;
}

export function SoftwareSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<Subscription | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_software_subscriptions');

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');

  const handleEditRecord = (record: Subscription) => {
    setEditingRecord({ ...record });
    setShowEditModal(true);
  };

  const handleSaveRecord = async () => {
    if (!editingRecord) return;

    try {
      const { error } = await supabase.rpc('update_software_subscription', {
        subscription_id: editingRecord.Id,
        subscription_name: editingRecord.Name,
        employee_name: editingRecord.Employee_Name__c,
        price: editingRecord.Price__c,
        subscription_type: editingRecord.Subscription_type__c,
        username: editingRecord.Username__c,
        password: editingRecord.Password__c,
        shared: editingRecord.Shared__c,
        shared_with_1: editingRecord.Shared_with_1__c,
        shared_with_2: editingRecord.Shared_with_2__c,
        shared_with_3: editingRecord.Shared_with_3__c,
        shared_with_4: editingRecord.Shared_with_4__c,
        shared_with_5: editingRecord.Shared_with_5__c,
        installed_on_1: editingRecord.Installed_on_1__c,
        installed_on_2: editingRecord.Installed_on_2__c,
        installed_on_3: editingRecord.Installed_on_3__c,
        installed_on_4: editingRecord.Installed_on_4__c,
        installed_on_5: editingRecord.Installed_on_5__c,
        subscription_notes: editingRecord.Subscription_Notes__c
      });

      if (error) throw error;

      await loadSubscriptions();
      setShowEditModal(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription. Check console for details.');
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingRecord(null);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.Employee_Name__c?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.Subscription_type__c?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalMonthlyCost = subscriptions.reduce((sum, sub) => {
    const price = parseFloat(sub.Price__c || '0');
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Software & Subscriptions</h1>
          <p className="text-slate-600">Manage company software licenses and subscriptions</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Subscriptions</p>
              <p className="text-2xl font-bold text-slate-900">{subscriptions.length}</p>
            </div>
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Monthly Cost</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalMonthlyCost)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Annual Cost</p>
              <p className="text-2xl font-bold text-slate-700">{formatCurrency(totalMonthlyCost * 12)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Compact Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-slate-200">
          <div className="text-slate-600">Loading subscriptions...</div>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <Heart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No subscriptions found</h3>
          <p className="text-slate-600 mb-4">
            {searchTerm ? 'No subscriptions match your search criteria.' : 'Get started by adding your first subscription.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Employee</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Price</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Shared</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase max-w-xs">Notes</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSubscriptions.map((subscription) => (
                  <tr
                    key={subscription.Id}
                    onClick={() => handleEditRecord(subscription)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2">
                      <span className="font-semibold text-slate-900 text-sm">{subscription.Name}</span>
                    </td>
                    <td className="px-3 py-2">
                      {subscription.Subscription_type__c && (
                        <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-blue-100 text-blue-700">
                          {subscription.Subscription_type__c}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-600">{subscription.Employee_Name__c || '-'}</td>
                    <td className="px-3 py-2 text-sm font-medium text-slate-900">
                      {subscription.Price__c ? formatCurrency(parseFloat(subscription.Price__c)) : '-'}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-600">
                      {subscription.Shared__c ? 'Yes' : 'No'}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-600 max-w-xs truncate">
                      {subscription.Subscription_Notes__c || '-'}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRecord(subscription);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Edit Subscription</h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Subscription Name
                  </label>
                  <input
                    type="text"
                    value={editingRecord.Name || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    value={editingRecord.Employee_Name__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Employee_Name__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Price
                  </label>
                  <input
                    type="text"
                    value={editingRecord.Price__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Price__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Subscription Type
                  </label>
                  <input
                    type="text"
                    value={editingRecord.Subscription_type__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Subscription_type__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editingRecord.Username__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Username__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={editingRecord.Password__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Password__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingRecord.Shared__c || false}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Shared__c: e.target.checked })}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label className="ml-2 text-sm font-medium text-slate-700">
                    Shared Subscription
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Shared With 1
                  </label>
                  <input
                    type="text"
                    value={editingRecord.Shared_with_1__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Shared_with_1__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Shared With 2
                  </label>
                  <input
                    type="text"
                    value={editingRecord.Shared_with_2__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Shared_with_2__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Installed On 1
                  </label>
                  <input
                    type="text"
                    value={editingRecord.Installed_on_1__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Installed_on_1__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Subscription Notes
                  </label>
                  <textarea
                    rows={3}
                    value={editingRecord.Subscription_Notes__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Subscription_Notes__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecord}
                className="px-4 py-2 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-600 font-medium flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
