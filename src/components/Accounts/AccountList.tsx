import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building2, Phone, Mail, ExternalLink, TrendingUp, Users, DollarSign, Sparkles, Grid3x3, List, Eye, CreditCard as Edit, ArrowUpDown, MapPin, Calendar, Activity, Filter, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ClickToCall } from '../shared/ClickToCall';
import { DateRangeFilter, DateRangeKey, getDateRange, isInDateRange } from '../shared/DateRangeFilter';

interface SalesforceAccount {
  Id: string;
  Name: string;
  Type: string | null;
  Industry: string | null;
  Website: string | null;
  Phone: string | null;
  AnnualRevenue: string | null;
  NumberOfEmployees: string | null;
  OwnerId: string | null;
  CreatedDate: string;
  LastModifiedDate: string | null;
  LastActivityDate: string | null;
  BillingCity: string | null;
  BillingState: string | null;
  Rating: string | null;
  AccountSource: string | null;
  [key: string]: any;
}

type ViewMode = 'grid' | 'table';

const typeColors: Record<string, { border: string; glow: string; badge: string; bg: string }> = {
  'Customer': { border: 'border-blue-500', glow: 'hover:shadow-blue-500/20', badge: 'bg-blue-100 text-blue-700', bg: 'bg-gradient-to-br from-blue-50 to-transparent' },
  'Prospect': { border: 'border-emerald-500', glow: 'hover:shadow-emerald-500/20', badge: 'bg-emerald-100 text-emerald-700', bg: 'bg-gradient-to-br from-emerald-50 to-transparent' },
  'Partner': { border: 'border-violet-500', glow: 'hover:shadow-violet-500/20', badge: 'bg-violet-100 text-violet-700', bg: 'bg-gradient-to-br from-violet-50 to-transparent' },
  'Vendor': { border: 'border-amber-500', glow: 'hover:shadow-amber-500/20', badge: 'bg-amber-100 text-amber-700', bg: 'bg-gradient-to-br from-amber-50 to-transparent' },
};

export function AccountList() {
  const { profile } = useAuth();
  const [accounts, setAccounts] = useState<SalesforceAccount[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [totalCount, setTotalCount] = useState<number>(0);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<SalesforceAccount | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeKey>('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
  }, [profile?.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      const PAGE_SIZE = 1000;
      let allAccounts: any[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .order('CreatedDate', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allAccounts = allAccounts.concat(data);
        if (data.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      const [profilesResult, countResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, full_name'),
        supabase
          .from('accounts')
          .select('*', { count: 'exact', head: true })
      ]);

      const usersMap: Record<string, string> = {};
      (profilesResult.data || []).forEach(user => {
        usersMap[user.id] = user.full_name || 'Unknown';
      });

      setAccounts(allAccounts);
      setUsers(usersMap);
      setTotalCount(countResult.count ?? allAccounts.length);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    const range = getDateRange(dateRange);
    if (range.start || range.end) {
      filtered = filtered.filter(acc =>
        isInDateRange(acc.LastActivityDate || acc.CreatedDate, range)
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(acc =>
        acc.Name?.toLowerCase().includes(term) ||
        acc.Industry?.toLowerCase().includes(term) ||
        acc.BillingCity?.toLowerCase().includes(term)
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(acc => acc.Type === selectedType);
    }

    if (selectedIndustry !== 'all') {
      filtered = filtered.filter(acc => acc.Industry === selectedIndustry);
    }

    if (selectedOwner !== 'all') {
      filtered = filtered.filter(acc => acc.OwnerId === selectedOwner);
    }

    return filtered;
  }, [accounts, searchTerm, selectedType, selectedIndustry, selectedOwner]);

  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAccounts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAccounts, currentPage]);

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);

  const stats = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

    const activeThisMonth = accounts.filter(acc => {
      const lastActivity = acc.LastActivityDate ? new Date(acc.LastActivityDate) : null;
      return lastActivity && lastActivity >= firstDayOfMonth;
    }).length;

    const newThisQuarter = accounts.filter(acc => {
      const created = new Date(acc.CreatedDate);
      return created >= firstDayOfQuarter;
    }).length;

    const totalRevenue = accounts.reduce((sum, acc) => {
      return sum + (parseFloat(acc.AnnualRevenue || '0') || 0);
    }, 0);

    return {
      total: totalCount,
      activeThisMonth,
      totalRevenue,
      newThisQuarter
    };
  }, [accounts, totalCount]);

  const industries = useMemo(() => {
    const set = new Set(accounts.map(a => a.Industry).filter(Boolean));
    return Array.from(set).sort();
  }, [accounts]);

  const types = useMemo(() => {
    const set = new Set(accounts.map(a => a.Type).filter(Boolean));
    return Array.from(set).sort();
  }, [accounts]);

  const owners = useMemo(() => {
    const set = new Set(accounts.map(a => a.OwnerId).filter(Boolean));
    return Array.from(set).sort();
  }, [accounts]);

  const formatCurrency = (amount: string | null) => {
    const num = parseFloat(amount || '0');
    if (isNaN(num) || num === 0) return '-';
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

  const getTypeConfig = (type: string | null) => {
    return typeColors[type || ''] || {
      border: 'border-slate-600',
      glow: 'hover:shadow-slate-500/50',
      badge: 'bg-slate-500/20 text-slate-300',
      bg: 'bg-gradient-to-br from-slate-500/10 to-transparent'
    };
  };

  const AccountCard = ({ account }: { account: SalesforceAccount }) => {
    const config = getTypeConfig(account.Type);
    const owner = users[account.OwnerId || ''] || 'Unassigned';

    return (
      <div
        onClick={() => setSelectedAccount(account)}
        className={`bg-white rounded-xl border border-gray-200 border-l-4 ${config.border} p-6 hover:scale-105 hover:shadow-lg ${config.glow} transition-all duration-300 cursor-pointer group relative overflow-hidden`}
      >
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${config.bg}`}></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <Building2 className="w-8 h-8 text-blue-500" />
            {account.Type && (
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${config.badge}`}>
                {account.Type}
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {account.Name}
          </h3>

          {account.Industry && (
            <div className="mb-3">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                {account.Industry}
              </span>
            </div>
          )}

          <div className="space-y-2 text-sm text-gray-500 mb-4">
            {account.Phone && (
              <ClickToCall phoneNumber={account.Phone} />
            )}
            {account.BillingCity && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{account.BillingCity}, {account.BillingState}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{owner}</span>
            </div>
          </div>

          {account.LastActivityDate && (
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Last activity: {formatDate(account.LastActivityDate)}
            </div>
          )}

          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors">
              <Eye className="w-4 h-4" />
            </button>
            <button className="p-2 bg-emerald-50 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors">
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">

        <div>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
            <div>
              <div className="text-[11px] font-bold tracking-eyebrow uppercase text-sky-dark">Customer Base</div>
              <h1 className="font-display text-[34px] leading-[40px] font-bold text-ink mt-1 tracking-tighter">Accounts</h1>
              <p className="text-sm text-ink-muted mt-1">Manage and track your customer accounts.</p>
            </div>
          </div>
          <DateRangeFilter value={dateRange} onChange={(k) => { setDateRange(k); setCurrentPage(1); }} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-line p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle">Total Accounts</span>
              <Building2 className="w-4 h-4 text-sky" />
            </div>
            <div className="font-display text-[28px] leading-[32px] font-bold text-ink tabular mt-2">{stats.total.toLocaleString()}</div>
          </div>

          <div className="bg-white rounded-lg border border-line p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle">Active This Month</span>
              <Activity className="w-4 h-4 text-court" />
            </div>
            <div className="font-display text-[28px] leading-[32px] font-bold text-ink tabular mt-2">{stats.activeThisMonth.toLocaleString()}</div>
            <div className="text-xs text-court font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {stats.total > 0 ? Math.round((stats.activeThisMonth / stats.total) * 100) : 0}% active
            </div>
          </div>

          <div className="bg-white rounded-lg border border-line p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle">Annual Revenue</span>
              <DollarSign className="w-4 h-4 text-sun-deep" />
            </div>
            <div className="font-display text-[28px] leading-[32px] font-bold text-ink tabular mt-2">{formatCurrency(stats.totalRevenue.toString())}</div>
          </div>

          <div className="bg-white rounded-lg border border-line p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-eyebrow uppercase text-ink-subtle">New This Quarter</span>
              <Sparkles className="w-4 h-4 text-sky" />
            </div>
            <div className="font-display text-[28px] leading-[32px] font-bold text-ink tabular mt-2">{stats.newThisQuarter.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search accounts, industries, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-700"
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-700"
            >
              <option value="all">All Industries</option>
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>

            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-700"
            >
              <option value="all">All Owners</option>
              {owners.map(ownerId => (
                <option key={ownerId} value={ownerId}>{users[ownerId] || 'Unknown'}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-3 rounded-xl transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedAccounts.map(account => (
              <AccountCard key={account.Id} account={account} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Name</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Industry</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedAccounts.map((acc, index) => {
                    const config = getTypeConfig(acc.Type);
                    return (
                      <tr
                        key={acc.Id}
                        onClick={() => setSelectedAccount(acc)}
                        className={`hover:bg-blue-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-1 h-10 rounded-full ${config.border.replace('border-', 'bg-')}`}></div>
                            <div>
                              <div className="font-bold text-gray-900">{acc.Name}</div>
                              {acc.Phone && <ClickToCall phoneNumber={acc.Phone} showCopy={false} />}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {acc.Type && (
                            <span className={`text-xs px-2 py-1 rounded-full ${config.badge}`}>
                              {acc.Type}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{acc.Industry || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {acc.BillingCity ? `${acc.BillingCity}, ${acc.BillingState}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{users[acc.OwnerId || ''] || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(acc.LastActivityDate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {selectedAccount && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAccount(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-start justify-between z-10">
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedAccount.Name}</h2>
                  <p className="text-sm text-blue-100 mt-1">{selectedAccount.Type || 'Account'}</p>
                </div>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  <ExternalLink className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedAccount)
                    .filter(([key]) => !['id', 'owner_id'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="border-b border-gray-100 pb-3">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
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
          </div>
        )}
    </div>
  );
}
