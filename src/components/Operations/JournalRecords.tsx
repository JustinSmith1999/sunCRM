import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookMarked, ChevronDown, ChevronUp, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface JournalRecord {
  Id: string;
  Name: string;
  Case__c?: string | null;
  Contact_Email__c?: string | null;
  Call_Direction__c?: string | null;
  Case_Result__c?: string | null;
  Journal_Description__c?: string | null;
  Time_Call_Began__c?: string | null;
  CreatedDate?: string | null;
  [key: string]: any;
}

type SortField = 'Name' | 'Time_Call_Began__c' | 'Call_Direction__c';
type SortDirection = 'asc' | 'desc';

export function JournalRecords() {
  const [records, setRecords] = useState<JournalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('Time_Call_Began__c');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedRecord, setSelectedRecord] = useState<JournalRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    loadRecords();
  }, [currentPage, searchTerm]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('journal_records')
        .select('*', { count: 'exact' })
        .order('Time_Call_Began__c', { ascending: false, nullsFirst: false });

      if (searchTerm) {
        query = query.or(`Name.ilike.%${searchTerm}%,Case__c.ilike.%${searchTerm}%,Journal_Description__c.ilike.%${searchTerm}%`);
      }

      const result = await query.range(from, to);

      if (result.error) throw result.error;

      setRecords(result.data || []);
      setTotalCount(result.count || 0);
    } catch (error) {
      console.error('Error loading journal records:', error);
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

  const filteredAndSortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'Time_Call_Began__c') {
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
  }, [records, sortField, sortDirection]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Journal Records</h1>
        <p className="text-slate-600">Track call logs and service interactions</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="p-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search journal records..."
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Case</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Contact</th>
                <th
                  onClick={() => handleSort('Call_Direction__c')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Direction
                    <SortIcon field="Call_Direction__c" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Result</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Description</th>
                <th
                  onClick={() => handleSort('Time_Call_Began__c')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 group"
                >
                  <div className="flex items-center gap-1">
                    Call Time
                    <SortIcon field="Time_Call_Began__c" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedRecords.map((record) => (
                <tr
                  key={record.Id}
                  onClick={() => setSelectedRecord(record)}
                  className="hover:bg-amber-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{record.Name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{record.Case__c || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{record.Contact_Email__c || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      record.Call_Direction__c === 'Inbound'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {record.Call_Direction__c || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{record.Case_Result__c || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-[200px]">
                    {record.Journal_Description__c || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDateTime(record.Time_Call_Began__c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedRecords.length === 0 && (
          <div className="text-center py-12">
            <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No journal records found</p>
          </div>
        )}
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRecord(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedRecord.Name}</h2>
                <p className="text-sm text-slate-600 mt-1">Journal Record Details</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedRecord)
                  .filter(([key]) => !['Id', 'owner_id', 'created_at', 'updated_at', 'created_by', 'last_modified_by', 'is_deleted'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="border-b border-slate-100 pb-3">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        {key.replace(/_/g, ' ').replace(/__c/g, '')}
                      </label>
                      <p className="text-sm text-slate-900">
                        {value === null || value === undefined || value === ''
                          ? '-'
                          : key.toLowerCase().includes('time') || key.toLowerCase().includes('date')
                            ? formatDateTime(value as string)
                            : String(value)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setSelectedRecord(null)}
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
