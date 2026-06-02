import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, Calendar, User, Search, Filter, X, LayoutGrid, List,
  ChevronDown, ChevronUp, ExternalLink, FolderOpen, TrendingUp, ArrowUpDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SalesforceOpportunity {
  Id: string;
  Name: string;
  Amount: string | null;
  StageName: string | null;
  Probability: string | null;
  CloseDate: string | null;
  AccountId: string | null;
  OwnerId: string | null;
  Description: string | null;
  Type: string | null;
  LeadSource: string | null;
  NextStep: string | null;
  Job_Notes__c: string | null;
  Submission_Notes__c: string | null;
  CreatedDate: string | null;
  LastModifiedDate: string | null;
  egnyte_folder_url?: string | null;
  egnyte_url?: string | null;
  aurora_solar_url?: string | null;
  basecamp_url?: string | null;
}

type ViewMode = 'kanban' | 'table';
type SortField = 'Name' | 'Amount' | 'CloseDate';
type SortDirection = 'asc' | 'desc';

interface PipelineColumn {
  key: string;
  label: string;
  stages: string[];
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

const PIPELINE_COLUMNS: PipelineColumn[] = [
  {
    key: 'Inquiry',
    label: 'Inquiry',
    stages: ['Inquiry', '1 - Initial Contact', 'Call Only'],
    color: '#3B82F6',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-500',
  },
  {
    key: 'First Sit',
    label: 'First Sit',
    stages: [
      '1. First Sit Scheduled',
      '2. First Sit Complete',
      '2 - Client Discovery',
      '2a - Client Undiscovered',
      '2a. Preliminary Agreement',
    ],
    color: '#F59E0B',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-500',
  },
  {
    key: 'Proposal',
    label: 'Proposal',
    stages: [
      'Quote Provided',
      '3 - Budget Review with Sales / Engineering',
      '3a - Budget Review Complete - Presentation Pending',
      '3. Site Evaluation Scheduled',
      '4. Site Evaluation Complete',
      '4 - Client Presentation 1',
      '5. Final Proposal Presented',
      '5. Design Presentation',
      '5 - LOI Sent for Signature',
    ],
    color: '#F97316',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-500',
  },
  {
    key: 'Closed Won',
    label: 'Closed Won',
    stages: ['Closed Won'],
    color: '#10B981',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-500',
  },
  {
    key: 'Closed Lost',
    label: 'Closed Lost',
    stages: ['Closed Lost'],
    color: '#EF4444',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    borderClass: 'border-red-500',
  },
  {
    key: 'Other',
    label: 'Other',
    stages: ['Future Contact', 'Service'],
    color: '#6B7280',
    bgClass: 'bg-gray-50',
    textClass: 'text-gray-700',
    borderClass: 'border-gray-400',
  },
];

const ALL_STAGE_NAMES = PIPELINE_COLUMNS.flatMap(c => c.stages);

function getColumnForStage(stageName: string | null): PipelineColumn {
  if (!stageName) return PIPELINE_COLUMNS[5];
  const col = PIPELINE_COLUMNS.find(c => c.stages.includes(stageName));
  return col || PIPELINE_COLUMNS[5];
}

function getStageConfig(stage: string | null) {
  const col = getColumnForStage(stage);
  return { color: col.color, bgClass: col.bgClass, textClass: col.textClass, borderClass: col.borderClass };
}

interface ColumnStat {
  count: number;
  value: number;
}

const CARDS_PER_COLUMN = 50;
const TABLE_PAGE_SIZE = 50;

export function DealsKanban() {
  const { profile } = useAuth();
  const [opportunities, setOpportunities] = useState<SalesforceOpportunity[]>([]);
  const [accounts, setAccounts] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [columnStats, setColumnStats] = useState<Record<string, ColumnStat>>({});
  const [totalPipelineValue, setTotalPipelineValue] = useState(0);
  const [tablePage, setTablePage] = useState(1);
  const [tableTotal, setTableTotal] = useState(0);

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('Amount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedDeal, setSelectedDeal] = useState<SalesforceOpportunity | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      setTablePage(1);
      loadTablePage(1);
    }
  }, [searchTerm, selectedStage, sortField, sortDirection]);

  useEffect(() => {
    if (profile?.id && tablePage > 1) {
      loadTablePage(tablePage);
    }
  }, [tablePage]);

  const buildTableQuery = () => {
    let q = supabase.from('opportunities').select('*', { count: 'exact' });
    if (searchTerm) {
      q = q.ilike('Name', `%${searchTerm}%`);
    }
    if (selectedStage !== 'all') {
      const col = PIPELINE_COLUMNS.find(c => c.key === selectedStage);
      if (col) q = q.in('StageName', col.stages);
    }
    if (sortField === 'Amount') {
      q = q.order('Amount', { ascending: sortDirection === 'asc', nullsFirst: false });
    } else {
      q = q.order(sortField, { ascending: sortDirection === 'asc' });
    }
    return q;
  };

  const loadTablePage = async (page: number) => {
    const offset = (page - 1) * TABLE_PAGE_SIZE;
    const { data, count, error } = await buildTableQuery().range(offset, offset + TABLE_PAGE_SIZE - 1);
    if (!error) {
      setOpportunities(data || []);
      setTableTotal(count ?? 0);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const countQueries = PIPELINE_COLUMNS.map(col =>
        supabase.from('opportunities')
          .select('Amount', { count: 'exact' })
          .in('StageName', col.stages)
      );

      let allOpps: any[] = [];
      let oppOffset = 0;
      const OPP_PAGE = 1000;
      while (true) {
        const { data, error } = await supabase.from('opportunities')
          .select('*')
          .order('Amount', { ascending: false, nullsFirst: false })
          .range(oppOffset, oppOffset + OPP_PAGE - 1);
        if (error || !data || data.length === 0) break;
        allOpps = allOpps.concat(data);
        if (data.length < OPP_PAGE) break;
        oppOffset += OPP_PAGE;
      }

      const [accountsResult, profilesResult, ...colResults] = await Promise.all([
        supabase.from('accounts').select('Id, Name'),
        supabase.from('user_profiles').select('id, full_name'),
        ...countQueries,
      ]);

      const accountsMap: Record<string, any> = {};
      (accountsResult.data || []).forEach(acc => { accountsMap[acc.Id] = acc; });

      const usersMap: Record<string, string> = {};
      (profilesResult.data || []).forEach(user => { usersMap[user.id] = user.full_name || 'Unknown'; });

      const stats: Record<string, ColumnStat> = {};
      let grandTotal = 0;
      PIPELINE_COLUMNS.forEach((col, idx) => {
        const res = colResults[idx];
        const count = res.count ?? 0;
        const value = (res.data || []).reduce((sum: number, r: any) => sum + (parseFloat(r.Amount || '0') || 0), 0);
        stats[col.key] = { count, value };
        grandTotal += value;
      });

      setAccounts(accountsMap);
      setUsers(usersMap);
      setColumnStats(stats);
      setTotalPipelineValue(grandTotal);
      setOpportunities(allOpps);
      setTableTotal(allOpps.length);
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const opportunitiesByColumn = useMemo(() => {
    const grouped: Record<string, SalesforceOpportunity[]> = {};
    PIPELINE_COLUMNS.forEach(col => {
      grouped[col.key] = opportunities
        .filter(opp => col.stages.includes(opp.StageName || ''))
        .slice(0, CARDS_PER_COLUMN);
    });
    return grouped;
  }, [opportunities]);

  const sortedOpportunities = useMemo(() => {
    return [...opportunities].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      if (sortField === 'Amount') {
        aVal = parseFloat(aVal || '0');
        bVal = parseFloat(bVal || '0');
      } else if (sortField === 'CloseDate') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [opportunities, sortField, sortDirection]);

  const tableTotalPages = Math.ceil(tableTotal / TABLE_PAGE_SIZE);

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-orange-600" /> : <ChevronDown className="w-3 h-3 text-orange-600" />;
  };

  const DealCard = ({ opportunity }: { opportunity: SalesforceOpportunity }) => {
    const config = getStageConfig(opportunity.StageName);
    const amount = parseFloat(opportunity.Amount || '0');
    const isLargeDeal = amount > 50000;
    const account = accounts[opportunity.AccountId || ''];
    const owner = users[opportunity.OwnerId || ''] || 'Unassigned';
    const initials = owner.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
      <div
        onClick={() => setSelectedDeal(opportunity)}
        className={`bg-white rounded-xl shadow-sm border-l-4 ${config.borderClass} p-4 mb-3 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group`}
      >
        <div className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {opportunity.Name || 'Untitled Deal'}
        </div>

        <div className="text-sm text-gray-600 mb-2 truncate">
          {account?.Name || 'Unknown Account'}
        </div>

        <div className="text-xs text-gray-500 mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}>
            {opportunity.StageName || 'Unknown'}
          </span>
        </div>

        <div className={`text-2xl font-black mb-3 ${isLargeDeal ? 'text-emerald-600' : 'text-gray-900'}`}>
          {formatCurrency(amount)}
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar className="w-3 h-3" />
            {formatDate(opportunity.CloseDate)}
          </div>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        </div>

        {(opportunity.egnyte_folder_url || opportunity.aurora_solar_url) && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            {opportunity.egnyte_folder_url && (
              <a
                href={opportunity.egnyte_folder_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <FolderOpen className="w-3 h-3" />
                Files
              </a>
            )}
            {opportunity.aurora_solar_url && (
              <a
                href={opportunity.aurora_solar_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Aurora
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600 mt-1">Manage your opportunities and track deals through the sales cycle</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-600">Pipeline Summary</div>
            <div className="text-2xl font-black text-orange-600">{formatCurrency(totalPipelineValue)}</div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
            {PIPELINE_COLUMNS.map((col) => {
              const percentage = totalPipelineValue > 0 ? (columnStats[col.key].value / totalPipelineValue) * 100 : 0;
              return percentage > 0 ? (
                <div
                  key={col.key}
                  style={{ width: `${percentage}%`, backgroundColor: col.color }}
                  className="h-full"
                  title={`${col.label}: ${formatCurrency(columnStats[col.key].value)}`}
                />
              ) : null;
            })}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
            {PIPELINE_COLUMNS.map((col) => (
              <div key={col.key} className={`rounded-lg p-3 ${col.bgClass}`}>
                <div className={`text-xs font-semibold ${col.textClass} mb-1`}>{col.label}</div>
                <div className="text-lg font-black text-gray-900">{columnStats[col.key].count}</div>
                <div className={`text-xs ${col.textClass}`}>{formatCurrency(columnStats[col.key].value)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search deals..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSearchTerm(searchInput); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setSearchTerm(searchInput)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Search
              </button>
            </div>

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Stages</option>
              {PIPELINE_COLUMNS.map(col => (
                <option key={col.key} value={col.key}>{col.label}</option>
              ))}
            </select>

            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="Amount">Sort by Amount</option>
              <option value="CloseDate">Sort by Close Date</option>
              <option value="Name">Sort by Name</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {PIPELINE_COLUMNS.map(col => {
              const deals = opportunitiesByColumn[col.key] || [];
              const stats = columnStats[col.key] || { count: 0, value: 0 };

              return (
                <div key={col.key} className="bg-gray-100 rounded-2xl p-4 min-h-[500px]">
                  <div className={`${col.bgClass} rounded-xl p-4 mb-4 border-t-4 ${col.borderClass}`}>
                    <div className={`font-bold ${col.textClass} mb-1`}>{col.label}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{stats.count} deals</span>
                      <span className={`text-lg font-black ${col.textClass}`}>{formatCurrency(stats.value)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {deals.map(deal => (
                      <DealCard key={deal.Id} opportunity={deal} />
                    ))}
                  </div>

                  {deals.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      No deals in this stage
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-gray-200">
                  <tr>
                    <th
                      onClick={() => handleSort('Name')}
                      className="text-left px-6 py-4 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-orange-100 group"
                    >
                      <div className="flex items-center gap-2">
                        Deal Name
                        <SortIcon field="Name" />
                      </div>
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700">Account</th>
                    <th
                      onClick={() => handleSort('Amount')}
                      className="text-right px-6 py-4 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-orange-100 group"
                    >
                      <div className="flex items-center justify-end gap-2">
                        Amount
                        <SortIcon field="Amount" />
                      </div>
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700">Stage</th>
                    <th
                      onClick={() => handleSort('CloseDate')}
                      className="text-left px-6 py-4 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-orange-100 group"
                    >
                      <div className="flex items-center gap-2">
                        Close Date
                        <SortIcon field="CloseDate" />
                      </div>
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700">Owner</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700">Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedOpportunities.map((opp, index) => {
                    const config = getStageConfig(opp.StageName);
                    const amount = parseFloat(opp.Amount || '0');
                    const isLargeDeal = amount > 50000;
                    const account = accounts[opp.AccountId || ''];
                    const owner = users[opp.OwnerId || ''] || 'Unassigned';

                    return (
                      <tr
                        key={opp.Id}
                        onClick={() => setSelectedDeal(opp)}
                        className={`hover:bg-orange-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{opp.Name || 'Untitled'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{account?.Name || 'Unknown'}</td>
                        <td className={`px-6 py-4 text-right text-sm font-bold ${isLargeDeal ? 'text-emerald-600' : 'text-gray-900'}`}>
                          {formatCurrency(amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.bgClass} ${config.textClass}`}>
                            {opp.StageName || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{formatDate(opp.CloseDate)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{owner}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {opp.egnyte_folder_url && (
                              <a
                                href={opp.egnyte_folder_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <FolderOpen className="w-4 h-4" />
                              </a>
                            )}
                            {opp.aurora_solar_url && (
                              <a
                                href={opp.aurora_solar_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {sortedOpportunities.length === 0 && (
              <div className="text-center py-16">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No opportunities found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        )}
      {viewMode === 'table' && tableTotalPages > 1 && (
        <div className="bg-white rounded-2xl shadow-lg flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            Showing {((tablePage - 1) * TABLE_PAGE_SIZE) + 1}–{Math.min(tablePage * TABLE_PAGE_SIZE, tableTotal)} of {tableTotal.toLocaleString()} deals
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setTablePage(p => Math.max(1, p - 1))}
              disabled={tablePage === 1}
              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600">
              Page {tablePage} of {tableTotalPages}
            </span>
            <button
              onClick={() => setTablePage(p => Math.min(tableTotalPages, p + 1))}
              disabled={tablePage === tableTotalPages}
              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

        {selectedDeal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDeal(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-yellow-500 px-6 py-4 flex items-start justify-between z-10">
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedDeal.Name || 'Untitled Deal'}</h2>
                  <p className="text-sm text-orange-100 mt-1">{accounts[selectedDeal.AccountId || '']?.Name || 'Unknown Account'}</p>
                </div>
                <button
                  onClick={() => setSelectedDeal(null)}
                  className="text-white hover:text-orange-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Amount</label>
                    <div className="text-3xl font-black text-emerald-600">{formatCurrency(selectedDeal.Amount || '0')}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Stage</label>
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStageConfig(selectedDeal.StageName).bgClass} ${getStageConfig(selectedDeal.StageName).textClass}`}>
                      {selectedDeal.StageName || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Close Date</label>
                    <div className="text-lg font-semibold text-gray-900">{formatDate(selectedDeal.CloseDate)}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Probability</label>
                    <div className="text-lg font-semibold text-gray-900">{selectedDeal.Probability || '0'}%</div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedDeal)
                      .filter(([key]) => !['id', 'owner_id', 'created_at', 'updated_at'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="border-b border-gray-100 pb-3">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                            {key.replace(/_/g, ' ').replace(/Id|__c/g, '')}
                          </label>
                          <p className="text-sm text-gray-900">
                            {value === null || value === undefined || value === '' ? '-' : String(value)}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setSelectedDeal(null)}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all font-bold"
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
