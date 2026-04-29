import React, { useState, useEffect, useMemo } from 'react';
import { Search, Receipt, ChevronDown, ChevronUp, X, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Voucher {
  Id: string;
  Name: string;
  Check_Amount__c?: string | null;
  SUNation_Loyalty_Program__c?: string | null;
  Voucher_Paid_to__c?: string | null;
  Voucher_Submitted__c?: string | null;
  Check_Received_Sent__c?: string | null;
  CreatedDate?: string | null;
  Paid_Invoice_Date__c?: string | null;
  [key: string]: any;
}

type SortField = 'Name' | 'Check_Amount__c' | 'CreatedDate';
type SortDirection = 'asc' | 'desc';

export function Vouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [accounts, setAccounts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('CreatedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    loadVouchers();
  }, [currentPage, searchTerm]);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('vouchers')
        .select('*', { count: 'exact' })
        .order('CreatedDate', { ascending: false });

      if (searchTerm) {
        query = query.or(`Name.ilike.%${searchTerm}%,Voucher_Paid_to__c.ilike.%${searchTerm}%`);
      }

      const [vouchersResult, accountsResult] = await Promise.all([
        query.range(from, to),
        supabase.from('accounts').select('Id, Name')
      ]);

      if (vouchersResult.error) throw vouchersResult.error;

      setVouchers(vouchersResult.data || []);
      setTotalCount(vouchersResult.count || 0);

      const accountMap: Record<string, any> = {};
      (accountsResult.data || []).forEach((account: any) => {
        accountMap[account.Id] = account;
      });
      setAccounts(accountMap);
    } catch (error) {
      console.error('Error loading vouchers:', error);
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

  const filteredAndSortedVouchers = useMemo(() => {
    return [...vouchers].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'Check_Amount__c') {
        aVal = parseFloat(aVal || '0');
        bVal = parseFloat(bVal || '0');
      } else if (sortField === 'CreatedDate') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [vouchers, sortField, sortDirection]);

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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-amber-600" /> : <ChevronDown className="w-3 h-3 text-amber-600" />;
  };

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
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Vouchers</h1>
        <p className="text-slate-600">Track voucher payments and loyalty program rewards</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="p-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vouchers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
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
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort('Name')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Name
                    <SortIcon field="Name" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('Check_Amount__c')}
                  className="text-right px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    <SortIcon field="Check_Amount__c" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Loyalty Program</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Paid To</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Status</th>
                <th
                  onClick={() => handleSort('CreatedDate')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Created
                    <SortIcon field="CreatedDate" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedVouchers.map((voucher) => (
                <tr
                  key={voucher.Id}
                  onClick={() => setSelectedVoucher(voucher)}
                  className="hover:bg-amber-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{voucher.Name || '-'}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                    {formatAmount(voucher.Check_Amount__c)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{voucher.SUNation_Loyalty_Program__c || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{voucher.Voucher_Paid_to__c || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      voucher.Check_Received_Sent__c
                        ? 'bg-green-100 text-green-700'
                        : voucher.Voucher_Submitted__c
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {voucher.Check_Received_Sent__c ? formatDate(voucher.Check_Received_Sent__c) : voucher.Voucher_Submitted__c ? 'Submitted' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(voucher.CreatedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedVouchers.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No vouchers found</p>
          </div>
        )}
      </div>

      {selectedVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVoucher(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedVoucher.Name}</h2>
                <p className="text-sm text-slate-600 mt-1">Voucher Details</p>
              </div>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedVoucher)
                  .filter(([key]) => !['Id', 'owner_id', 'created_at', 'updated_at', 'created_by', 'last_modified_by', 'is_deleted'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="border-b border-slate-100 pb-3">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        {key.replace(/_/g, ' ').replace(/__c/g, '')}
                      </label>
                      <p className="text-sm text-slate-900">
                        {value === null || value === undefined || value === ''
                          ? '-'
                          : key.toLowerCase().includes('date')
                            ? formatDate(value as string)
                            : key.toLowerCase().includes('amount')
                              ? formatAmount(value as string)
                              : String(value)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setSelectedVoucher(null)}
                className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium"
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
