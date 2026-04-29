import React, { useState, useEffect, useMemo } from 'react';
import { Search, CreditCard, DollarSign, Calendar, ChevronDown, ChevronUp, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ServicePaymentPlan {
  Id: string;
  Name: string;
  CASE__c: string | null;
  Finance_Record__c: string | null;
  First_Payment_Date__c: string | null;
  Total_Payment_Amount__c: string | null;
  Total_Payment_Terms__c: string | null;
  Monthly_Payment_Amount__c: string | null;
  Payment_Frequency__c: string | null;
  Payment_Method__c: string | null;
  Status__c: string | null;
  Opportunity__c: string | null;
  CreatedDate: string | null;
  [key: string]: any;
}

type SortField = 'Name' | 'Total_Payment_Amount__c' | 'Status__c';
type SortDirection = 'asc' | 'desc';

const statusColors: Record<string, { bg: string; text: string }> = {
  'Active': { bg: 'bg-green-100', text: 'text-green-700' },
  'Pending': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Completed': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Cancelled': { bg: 'bg-red-100', text: 'text-red-700' },
  'On Hold': { bg: 'bg-slate-100', text: 'text-slate-700' }
};

export function ServicePaymentPlans() {
  const [plans, setPlans] = useState<ServicePaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState<ServicePaymentPlan | null>(null);
  const [sortField, setSortField] = useState<SortField>('Total_Payment_Amount__c');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 25;
  const { profile } = useAuth();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  useEffect(() => {
    loadPlans();
  }, [profile, currentPage, searchTerm, selectedStatus]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let plansQuery = supabase
        .from('service_payment_plans')
        .select('*', { count: 'exact' })
        .order('CreatedDate', { ascending: false, nullsFirst: false });

      if (searchTerm) {
        plansQuery = plansQuery.or(`Name.ilike.%${searchTerm}%`);
      }

      if (selectedStatus !== 'all') {
        plansQuery = plansQuery.eq('Status__c', selectedStatus);
      }

      const plansResult = await plansQuery.range(from, to);

      if (plansResult.error) throw plansResult.error;

      setPlans(plansResult.data || []);
      setTotalCount(plansResult.count || 0);
    } catch (error) {
      console.error('Error loading service payment plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'Total_Payment_Amount__c') {
        aVal = parseFloat(aVal || '0');
        bVal = parseFloat(bVal || '0');
      } else {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [plans, sortField, sortDirection]);

  const formatAmount = (amountString: string | null | undefined) => {
    if (!amountString) return '$0';
    const amount = parseFloat(amountString);
    if (isNaN(amount)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return statusColors['Pending'];
    return statusColors[status] || { bg: 'bg-slate-100', text: 'text-slate-700' };
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-rose-600" /> : <ChevronDown className="w-3 h-3 text-rose-600" />;
  };

  const getPlanStats = () => {
    const total = totalCount;
    const active = plans.filter(p => p.Status__c === 'Active').length;
    const totalAmount = plans.reduce((sum, p) => sum + parseFloat(p.Total_Payment_Amount__c || '0'), 0);
    const monthlyTotal = plans.filter(p => p.Status__c === 'Active').reduce((sum, p) => sum + parseFloat(p.Monthly_Payment_Amount__c || '0'), 0);

    return { total, active, totalAmount, monthlyTotal };
  };

  const stats = getPlanStats();

  if (loading && currentPage === 1) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-rose-500" />
          Service Payment Plans
        </h1>
        <p className="text-slate-600">Manage service payment plans and installments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-rose-400 to-rose-500 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rose-100">Total Plans</p>
              <p className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</p>
            </div>
            <CreditCard className="w-8 h-8 text-rose-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100">Active Plans</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pink-100">Total Value</p>
              <p className="text-2xl font-bold text-white">{formatAmount(stats.totalAmount.toString())}</p>
            </div>
            <DollarSign className="w-8 h-8 text-pink-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-100">Monthly Total</p>
              <p className="text-2xl font-bold text-white">{formatAmount(stats.monthlyTotal.toString())}</p>
            </div>
            <Calendar className="w-8 h-8 text-red-200" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      {totalCount > ITEMS_PER_PAGE && (
        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Page {currentPage} of {Math.ceil(totalCount / ITEMS_PER_PAGE)} ({totalCount.toLocaleString()} total)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE), p + 1))}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
              disabled={currentPage >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-rose-50 to-pink-50 border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort('Name')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-rose-100 group"
                >
                  <div className="flex items-center gap-1">
                    Plan Name
                    <SortIcon field="Name" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('Total_Payment_Amount__c')}
                  className="text-right px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-rose-100 group"
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Amount
                    <SortIcon field="Total_Payment_Amount__c" />
                  </div>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Monthly Payment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Payment Method</th>
                <th
                  onClick={() => handleSort('Status__c')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-rose-100 group"
                >
                  <div className="flex items-center gap-1">
                    Status
                    <SortIcon field="Status__c" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Terms</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">First Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedPlans.map((plan) => (
                <tr
                  key={plan.Id}
                  onClick={() => setSelectedPlan(plan)}
                  className="hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{plan.Name || '-'}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                    {formatAmount(plan.Total_Payment_Amount__c)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-rose-700">
                    {formatAmount(plan.Monthly_Payment_Amount__c)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{plan.Payment_Method__c || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(plan.Status__c).bg} ${getStatusColor(plan.Status__c).text}`}>
                      {plan.Status__c || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{plan.Total_Payment_Terms__c || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(plan.First_Payment_Date__c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedPlans.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No service payment plans found</p>
          </div>
        )}
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPlan(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-rose-400 to-pink-500 px-6 py-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  {selectedPlan.Name}
                </h2>
                <p className="text-sm text-rose-100 mt-1">Service Payment Plan Details</p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-white hover:text-rose-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedPlan)
                  .filter(([key]) => !['id', 'owner_id', 'created_at', 'updated_at', 'created_by', 'last_modified_by', 'is_deleted', 'IsDeleted'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="border-b border-slate-100 pb-3">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        {key.replace(/_/g, ' ').replace(/__c/g, '')}
                      </label>
                      <p className="text-sm text-slate-900">
                        {value === null || value === undefined || value === ''
                          ? '-'
                          : typeof value === 'boolean'
                            ? value ? 'Yes' : 'No'
                            : key.toLowerCase().includes('date')
                              ? formatDateTime(value as string)
                              : key.toLowerCase().includes('amount') || key.toLowerCase().includes('payment')
                                ? formatAmount(value as string)
                                : String(value)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setSelectedPlan(null)}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-rose-600 hover:to-pink-600 transition-colors font-medium"
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
