import React, { useState, useEffect, useMemo } from 'react';
import { Search, HelpCircle, Clock, User, AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SalesforceCase {
  Id: string;
  CaseNumber: string | null;
  Subject: string | null;
  Description: string | null;
  Status: string | null;
  Priority: string | null;
  AccountId: string | null;
  ContactId: string | null;
  OwnerId: string | null;
  CreatedById: string | null;
  CreatedDate: string | null;
  ClosedDate: string | null;
  IsClosed: boolean | null;
  Type: string | null;
  Origin: string | null;
  [key: string]: any;
}

type SortField = 'CaseNumber' | 'Status' | 'Priority' | 'CreatedDate';
type SortDirection = 'asc' | 'desc';

const statusColors: Record<string, { bg: string; text: string }> = {
  'New': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Working': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Escalated': { bg: 'bg-red-100', text: 'text-red-700' },
  'Closed': { bg: 'bg-green-100', text: 'text-green-700' },
  'On Hold': { bg: 'bg-slate-100', text: 'text-slate-700' }
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  'High': { bg: 'bg-red-100', text: 'text-red-700' },
  'Medium': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Low': { bg: 'bg-green-100', text: 'text-green-700' }
};

export function CaseList() {
  const [cases, setCases] = useState<SalesforceCase[]>([]);
  const [accounts, setAccounts] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedCase, setSelectedCase] = useState<SalesforceCase | null>(null);
  const [sortField, setSortField] = useState<SortField>('CreatedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 25;
  const { profile } = useAuth();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedPriority]);

  useEffect(() => {
    loadCases();
  }, [profile, currentPage, searchTerm, selectedStatus, selectedPriority]);

  const loadCases = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let casesQuery = supabase
        .from('cases')
        .select('*', { count: 'exact' })
        .order('CreatedDate', { ascending: false, nullsFirst: false });

      if (searchTerm) {
        casesQuery = casesQuery.or(`CaseNumber.ilike.%${searchTerm}%,Subject.ilike.%${searchTerm}%,Description.ilike.%${searchTerm}%`);
      }

      if (selectedStatus !== 'all') {
        casesQuery = casesQuery.eq('Status', selectedStatus);
      }

      if (selectedPriority !== 'all') {
        casesQuery = casesQuery.eq('Priority', selectedPriority);
      }

      const [casesResult, accountsResult, contactsResult] = await Promise.all([
        casesQuery.range(from, to),
        supabase
          .from('accounts')
          .select('Id, Name')
          .limit(10000),
        supabase
          .from('salesforce_contacts')
          .select('Id, FirstName, LastName')
          .limit(10000)
      ]);

      if (casesResult.error) throw casesResult.error;

      setCases(casesResult.data || []);
      setTotalCount(casesResult.count || 0);

      const accountMap: Record<string, string> = {};
      (accountsResult.data || []).forEach((account: any) => {
        accountMap[account.Id] = account.Name;
      });
      setAccounts(accountMap);

      const contactMap: Record<string, string> = {};
      (contactsResult.data || []).forEach((contact: any) => {
        contactMap[contact.Id] = `${contact.FirstName || ''} ${contact.LastName || ''}`.trim();
      });
      setContacts(contactMap);
    } catch (error) {
      console.error('Error loading cases:', error);
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

  const filteredAndSortedCases = useMemo(() => {
    return [...cases].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'CreatedDate') {
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
  }, [cases, sortField, sortDirection]);

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
    if (!status) return statusColors['New'];
    return statusColors[status] || { bg: 'bg-slate-100', text: 'text-slate-700' };
  };

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return priorityColors['Low'];
    return priorityColors[priority] || { bg: 'bg-slate-100', text: 'text-slate-700' };
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  const getCaseStats = () => {
    const total = totalCount;
    const open = cases.filter(c => !c.IsClosed).length;
    const closed = cases.filter(c => c.IsClosed).length;
    const highPriority = cases.filter(c => c.Priority === 'High').length;

    return { total, open, closed, highPriority };
  };

  const stats = getCaseStats();

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
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Cases</h1>
        <p className="text-slate-600">Manage customer support cases and issues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Cases</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total.toLocaleString()}</p>
            </div>
            <HelpCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Open Cases</p>
              <p className="text-2xl font-bold text-slate-900">{stats.open}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Closed Cases</p>
              <p className="text-2xl font-bold text-slate-900">{stats.closed}</p>
            </div>
            <User className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">High Priority</p>
              <p className="text-2xl font-bold text-slate-900">{stats.highPriority}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search cases..."
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
              <option value="New">New</option>
              <option value="Working">Working</option>
              <option value="Escalated">Escalated</option>
              <option value="On Hold">On Hold</option>
              <option value="Closed">Closed</option>
            </select>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
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
                  onClick={() => handleSort('CaseNumber')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Case Number
                    <SortIcon field="CaseNumber" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Subject</th>
                <th
                  onClick={() => handleSort('Status')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Status
                    <SortIcon field="Status" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('Priority')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Priority
                    <SortIcon field="Priority" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Origin</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Account</th>
                <th
                  onClick={() => handleSort('CreatedDate')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Created Date
                    <SortIcon field="CreatedDate" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedCases.map((caseRecord) => (
                <tr
                  key={caseRecord.Id}
                  onClick={() => setSelectedCase(caseRecord)}
                  className="hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{caseRecord.CaseNumber || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate">{caseRecord.Subject || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(caseRecord.Status).bg} ${getStatusColor(caseRecord.Status).text}`}>
                      {caseRecord.Status || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(caseRecord.Priority).bg} ${getPriorityColor(caseRecord.Priority).text}`}>
                      {caseRecord.Priority || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{caseRecord.Type || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{caseRecord.Origin || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{accounts[caseRecord.AccountId || ''] || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(caseRecord.CreatedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedCases.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No cases found</p>
          </div>
        )}
      </div>

      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCase(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Case {selectedCase.CaseNumber}</h2>
                <p className="text-sm text-slate-600 mt-1">{selectedCase.Subject}</p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedCase)
                  .filter(([key]) => !['id', 'organization_id', 'owner_id', 'created_at', 'updated_at', 'created_by', 'last_modified_by', 'is_deleted'].includes(key))
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
                              : key === 'AccountId'
                                ? accounts[value as string] || value
                                : key === 'ContactId'
                                  ? contacts[value as string] || value
                                  : String(value)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setSelectedCase(null)}
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
