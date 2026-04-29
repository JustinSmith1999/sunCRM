import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, ChevronDown, ChevronUp, X, Building2, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SalesforceQuote {
  Id: string;
  Name: string;
  QuoteNumber: string | null;
  Status: string | null;
  ExpirationDate: string | null;
  TotalPrice: string | null;
  OpportunityId: string | null;
  AccountId: string | null;
  ContactId: string | null;
  Description: string | null;
  CreatedDate: string | null;
  Subtotal: string | null;
  Tax: string | null;
  GrandTotal: string | null;
  [key: string]: any;
}

type SortField = 'Name' | 'QuoteNumber' | 'ExpirationDate' | 'TotalPrice';
type SortDirection = 'asc' | 'desc';

const statusColors: Record<string, { bg: string; text: string }> = {
  'Draft': { bg: 'bg-slate-100', text: 'text-slate-700' },
  'Pending': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Approved': { bg: 'bg-green-100', text: 'text-green-700' },
  'Rejected': { bg: 'bg-red-100', text: 'text-red-700' },
  'Presented': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Accepted': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Denied': { bg: 'bg-orange-100', text: 'text-orange-700' }
};

export function Quotes() {
  const [quotes, setQuotes] = useState<SalesforceQuote[]>([]);
  const [accounts, setAccounts] = useState<Record<string, string>>({});
  const [opportunities, setOpportunities] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedQuote, setSelectedQuote] = useState<SalesforceQuote | null>(null);
  const [sortField, setSortField] = useState<SortField>('ExpirationDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 25;
  const { profile } = useAuth();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  useEffect(() => {
    loadQuotes();
  }, [profile, currentPage, searchTerm, selectedStatus]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let quotesQuery = supabase
        .from('salesforce_quotes')
        .select('*', { count: 'exact' })
        .order('ExpirationDate', { ascending: false, nullsFirst: false });

      if (searchTerm) {
        quotesQuery = quotesQuery.or(`Name.ilike.%${searchTerm}%,QuoteNumber.ilike.%${searchTerm}%,Description.ilike.%${searchTerm}%`);
      }

      if (selectedStatus !== 'all') {
        quotesQuery = quotesQuery.eq('Status', selectedStatus);
      }

      const [quotesResult, accountsResult, opportunitiesResult] = await Promise.all([
        quotesQuery.range(from, to),
        supabase
          .from('accounts')
          .select('Id, Name')
          .limit(10000),
        supabase
          .from('opportunities')
          .select('Id, Name')
          .limit(10000)
      ]);

      if (quotesResult.error) throw quotesResult.error;

      setQuotes(quotesResult.data || []);
      setTotalCount(quotesResult.count || 0);

      const accountMap: Record<string, string> = {};
      (accountsResult.data || []).forEach((account: any) => {
        accountMap[account.Id] = account.Name;
      });
      setAccounts(accountMap);

      const oppMap: Record<string, string> = {};
      (opportunitiesResult.data || []).forEach((opp: any) => {
        oppMap[opp.Id] = opp.Name;
      });
      setOpportunities(oppMap);
    } catch (error) {
      console.error('Error loading quotes:', error);
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

  const filteredAndSortedQuotes = useMemo(() => {
    return [...quotes].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'TotalPrice') {
        aVal = parseFloat(aVal || '0');
        bVal = parseFloat(bVal || '0');
      } else if (sortField === 'ExpirationDate') {
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
  }, [quotes, sortField, sortDirection]);

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
    if (!status) return statusColors['Draft'];
    return statusColors[status] || { bg: 'bg-slate-100', text: 'text-slate-700' };
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  const getQuoteStats = () => {
    const total = totalCount;
    const pending = quotes.filter(q => q.Status === 'Pending' || q.Status === 'Draft').length;
    const approved = quotes.filter(q => q.Status === 'Approved' || q.Status === 'Accepted').length;
    const totalValue = quotes.reduce((sum, q) => sum + parseFloat(q.TotalPrice || '0'), 0);

    return { total, pending, approved, totalValue };
  };

  const stats = getQuoteStats();

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
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Quotes</h1>
        <p className="text-slate-600">Manage sales quotes and proposals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Quotes</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total.toLocaleString()}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
            </div>
            <Calendar className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Approved</p>
              <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
            </div>
            <Building2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Value</p>
              <p className="text-2xl font-bold text-slate-900">{formatAmount(stats.totalValue.toString())}</p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Presented">Presented</option>
              <option value="Accepted">Accepted</option>
              <option value="Denied">Denied</option>
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
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort('QuoteNumber')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Quote Number
                    <SortIcon field="QuoteNumber" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('Name')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Name
                    <SortIcon field="Name" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Status</th>
                <th
                  onClick={() => handleSort('ExpirationDate')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Expiration Date
                    <SortIcon field="ExpirationDate" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('TotalPrice')}
                  className="text-right px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Price
                    <SortIcon field="TotalPrice" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Opportunity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedQuotes.map((quote) => (
                <tr
                  key={quote.Id}
                  onClick={() => setSelectedQuote(quote)}
                  className="hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{quote.QuoteNumber || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{quote.Name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(quote.Status).bg} ${getStatusColor(quote.Status).text}`}>
                      {quote.Status || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(quote.ExpirationDate)}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                    {formatAmount(quote.TotalPrice)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{opportunities[quote.OpportunityId || ''] || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{accounts[quote.AccountId || ''] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedQuotes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No quotes found</p>
          </div>
        )}
      </div>

      {selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedQuote(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Quote {selectedQuote.QuoteNumber}</h2>
                <p className="text-sm text-slate-600 mt-1">{selectedQuote.Name}</p>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedQuote)
                  .filter(([key]) => !['id', 'salesforce_id', 'owner_id', 'created_at', 'updated_at', 'created_by', 'last_modified_by', 'is_deleted'].includes(key))
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
                              : key.toLowerCase().includes('price') || key.toLowerCase().includes('total') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('subtotal') || key.toLowerCase().includes('tax')
                                ? formatAmount(value as string)
                                : key === 'AccountId'
                                  ? accounts[value as string] || value
                                  : key === 'OpportunityId'
                                    ? opportunities[value as string] || value
                                    : String(value)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setSelectedQuote(null)}
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
