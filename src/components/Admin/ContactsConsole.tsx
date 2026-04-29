import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Phone, Mail, Building2, MapPin, Search, Filter, Users, Sparkles, Activity, Eye, MessageCircle, Star, Clock, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ClickToCall } from '../shared/ClickToCall';
import { DateRangeFilter, DateRangeKey, getDateRange } from '../shared/DateRangeFilter';

interface SalesforceContact {
  Id: string;
  FirstName: string | null;
  LastName: string | null;
  Name: string | null;
  Email: string | null;
  Phone: string | null;
  MobilePhone: string | null;
  Title: string | null;
  Department: string | null;
  AccountId: string | null;
  MailingStreet: string | null;
  MailingCity: string | null;
  MailingState: string | null;
  MailingPostalCode: string | null;
  CreatedDate: string | null;
  LastModifiedDate: string | null;
  LeadSource: string | null;
  Primary_Contact__c: boolean | null;
  [key: string]: any;
}

const getAvatarColor = (name: string) => {
  const firstLetter = name?.charAt(0).toUpperCase() || 'A';
  const charCode = firstLetter.charCodeAt(0);
  if (charCode >= 65 && charCode <= 70) return 'from-blue-600 to-cyan-600';
  if (charCode >= 71 && charCode <= 76) return 'from-emerald-600 to-green-600';
  if (charCode >= 77 && charCode <= 82) return 'from-purple-600 to-pink-600';
  return 'from-amber-600 to-orange-600';
};

const getAccountTypeColor = (type: string | null) => {
  const colors: Record<string, string> = {
    'Customer': 'border-blue-500',
    'Prospect': 'border-emerald-500',
    'Partner': 'border-violet-500',
    'Vendor': 'border-amber-500'
  };
  return colors[type || ''] || 'border-gray-300';
};

const PAGE_SIZE = 24;

export function ContactsConsole() {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<SalesforceContact[]>([]);
  const [accounts, setAccounts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [vipCount, setVipCount] = useState<number>(0);
  const [recentCount, setRecentCount] = useState<number>(0);
  const [recentContacts, setRecentContacts] = useState<SalesforceContact[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedContact, setSelectedContact] = useState<SalesforceContact | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeKey>('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const [accountsList, setAccountsList] = useState<Array<{ id: string; name: string }>>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);

  useEffect(() => {
    if (profile?.id) {
      loadMetaAndStats();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      setCurrentPage(1);
      loadPage(1);
    }
  }, [searchTerm, selectedAccount, selectedCity, dateRange]);

  useEffect(() => {
    if (profile?.id && currentPage > 1) {
      loadPage(currentPage);
    }
  }, [currentPage]);

  const buildQuery = useCallback(() => {
    let q = supabase.from('salesforce_contacts').select('*', { count: 'exact' });

    if (searchTerm) {
      q = q.or(`Name.ilike.%${searchTerm}%,Email.ilike.%${searchTerm}%,Title.ilike.%${searchTerm}%`);
    }
    if (selectedAccount !== 'all') {
      q = q.eq('AccountId', selectedAccount);
    }
    if (selectedCity !== 'all') {
      q = q.eq('MailingCity', selectedCity);
    }
    const range = getDateRange(dateRange);
    if (range.start) {
      q = q.gte('CreatedDate', range.start.toISOString());
    }
    if (range.end) {
      q = q.lte('CreatedDate', range.end.toISOString());
    }
    return q;
  }, [searchTerm, selectedAccount, selectedCity, dateRange]);

  const loadPage = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const { data, count, error } = await buildQuery()
        .order('CreatedDate', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;
      setContacts(data || []);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error('Error loading contacts page:', err);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  const loadMetaAndStats = async () => {
    try {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [
        accsResult,
        activeResult,
        vipResult,
        recentResult,
        citiesResult,
        recentContactsResult,
        initialPageResult,
      ] = await Promise.all([
        supabase.from('accounts').select('Id, Name').limit(500),
        supabase.from('salesforce_contacts')
          .select('*', { count: 'exact', head: true })
          .gte('LastModifiedDate', monthAgo.toISOString()),
        supabase.from('salesforce_contacts')
          .select('*', { count: 'exact', head: true })
          .eq('Primary_Contact__c', true),
        supabase.from('salesforce_contacts')
          .select('*', { count: 'exact', head: true })
          .gte('CreatedDate', weekAgo.toISOString()),
        supabase.from('salesforce_contacts')
          .select('MailingCity')
          .not('MailingCity', 'is', null)
          .limit(2000),
        supabase.from('salesforce_contacts')
          .select('*')
          .order('LastModifiedDate', { ascending: false })
          .limit(5),
        supabase.from('salesforce_contacts')
          .select('*', { count: 'exact' })
          .order('CreatedDate', { ascending: false })
          .range(0, PAGE_SIZE - 1),
      ]);

      const accsMap: Record<string, any> = {};
      const accsListArr: Array<{ id: string; name: string }> = [];
      (accsResult.data || []).forEach(a => {
        accsMap[a.Id] = a;
        accsListArr.push({ id: a.Id, name: a.Name || 'Unknown' });
      });
      setAccounts(accsMap);
      setAccountsList(accsListArr.sort((a, b) => a.name.localeCompare(b.name)));

      const uniqueCities = Array.from(new Set(
        (citiesResult.data || []).map((r: any) => r.MailingCity).filter(Boolean)
      )).sort() as string[];
      setCitiesList(uniqueCities);

      setActiveCount(activeResult.count ?? 0);
      setVipCount(vipResult.count ?? 0);
      setRecentCount(recentResult.count ?? 0);
      setRecentContacts(recentContactsResult.data || []);

      setContacts(initialPageResult.data || []);
      setTotalCount(initialPageResult.count ?? 0);
    } catch (err) {
      console.error('Error loading contact meta:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadPage(page);
  };

  const getStatusDot = (contact: SalesforceContact) => {
    const modified = contact.LastModifiedDate ? new Date(contact.LastModifiedDate) : null;
    if (!modified) return 'bg-red-500';
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    if (modified >= weekAgo) return 'bg-emerald-500';
    if (modified >= monthAgo) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const ContactCard = ({ contact }: { contact: SalesforceContact }) => {
    const avatarGradient = getAvatarColor(contact.Name || '');
    const initials = (contact.FirstName?.[0] || '') + (contact.LastName?.[0] || '');
    const account = accounts[contact.AccountId || ''];
    const accountColor = getAccountTypeColor(account?.Type);
    const statusDot = getStatusDot(contact);

    return (
      <div
        onClick={() => setSelectedContact(contact)}
        className={`bg-white rounded-xl border border-gray-200 border-l-4 ${accountColor} p-6 hover:scale-105 hover:shadow-lg hover:shadow-blue-100 transition-all duration-300 cursor-pointer group relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-black text-xl shadow-lg`}>
              {initials || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {contact.Name || 'Unknown'}
                </h3>
                <div className={`w-2 h-2 rounded-full ${statusDot}`}></div>
                {contact.Primary_Contact__c && (
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                )}
              </div>
              {contact.Title && (
                <p className="text-sm text-gray-500 truncate">{contact.Title}</p>
              )}
            </div>
          </div>

          {account && (
            <div className="flex items-center gap-2 text-sm mb-3">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span className="text-blue-600 hover:text-blue-700 truncate cursor-pointer">
                {account.Name}
              </span>
            </div>
          )}

          <div className="space-y-2 text-sm text-gray-500">
            {contact.Email && (
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{contact.Email}</span>
              </div>
            )}
            {contact.Phone && (
              <ClickToCall phoneNumber={contact.Phone} />
            )}
            {contact.MailingCity && (
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{contact.MailingCity}, {contact.MailingState}</span>
              </div>
            )}
          </div>

          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors">
              <Eye className="w-4 h-4" />
            </button>
            <button className="p-2 bg-emerald-50 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors">
              <Mail className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | '...')[] = [];
    let l: number | undefined;

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) range.unshift(-1);
    if (currentPage + delta < totalPages - 1) range.push(-2);
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);

    range.forEach(i => {
      if (i < 0) {
        rangeWithDots.push('...');
      } else {
        rangeWithDots.push(i);
      }
    });
    return rangeWithDots;
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-4 sm:space-y-6">

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Contact Hub</h1>
          <p className="text-gray-500 mt-1">Manage and engage with your business contacts</p>
          <div className="mt-3">
            <DateRangeFilter value={dateRange} onChange={(k) => { setDateRange(k); setCurrentPage(1); }} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <Users className="w-10 h-10 text-white/90 mb-3" />
              <div className="text-5xl font-black text-white mb-2">{totalCount.toLocaleString()}</div>
              <div className="text-sm text-cyan-100 font-medium">Total Contacts</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <Activity className="w-10 h-10 text-white/90 mb-3" />
              <div className="text-5xl font-black text-white mb-2">{activeCount.toLocaleString()}</div>
              <div className="text-sm text-emerald-100 font-medium">Active Contacts</div>
              <div className="mt-2 text-xs text-emerald-200 bg-emerald-500/20 px-2 py-1 rounded-full inline-block">
                Last 30 days
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <Star className="w-10 h-10 text-white/90 mb-3" />
              <div className="text-5xl font-black text-white mb-2">{vipCount.toLocaleString()}</div>
              <div className="text-sm text-amber-100 font-medium">VIP / Key Contacts</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-sky-600 to-blue-600 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <Sparkles className="w-10 h-10 text-white/90 mb-3" />
              <div className="text-5xl font-black text-white mb-2">{recentCount.toLocaleString()}</div>
              <div className="text-sm text-sky-100 font-medium">Recently Added</div>
              <div className="mt-2 text-xs text-sky-200 bg-sky-500/20 px-2 py-1 rounded-full inline-block">
                Last 7 days
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search contacts, titles, emails..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Search
                  </button>
                </div>

                <select
                  value={selectedAccount}
                  onChange={(e) => { setSelectedAccount(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  <option value="all">All Accounts</option>
                  {accountsList.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>

                <select
                  value={selectedCity}
                  onChange={(e) => { setSelectedCity(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  <option value="all">All Cities</option>
                  {citiesList.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(PAGE_SIZE)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contacts.map(contact => (
                  <ContactCard key={contact.Id} contact={contact} />
                ))}
                {contacts.length === 0 && (
                  <div className="col-span-3 text-center py-16">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium text-lg">No contacts found</p>
                    <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {pageNumbers.map((page, idx) =>
                    page === '...' ? (
                      <span key={`dot-${idx}`} className="w-10 h-10 flex items-center justify-center text-gray-400">…</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className={`w-10 h-10 rounded-lg transition-colors text-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {totalCount > 0 && (
              <div className="text-center mt-3 text-sm text-gray-500">
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()} contacts
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 sticky top-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold text-gray-900">Recently Contacted</h3>
              </div>
              <div className="space-y-4">
                {recentContacts.map(contact => {
                  const avatarGradient = getAvatarColor(contact.Name || '');
                  const initials = (contact.FirstName?.[0] || '') + (contact.LastName?.[0] || '');
                  return (
                    <div
                      key={contact.Id}
                      onClick={() => setSelectedContact(contact)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors cursor-pointer group"
                    >
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {initials || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                          {contact.Name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{contact.Title || 'No title'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {selectedContact && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedContact(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-start justify-between z-10">
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedContact.Name}</h2>
                  <p className="text-sm text-blue-100 mt-1">{selectedContact.Title || 'Contact'}</p>
                </div>
                <button onClick={() => setSelectedContact(null)} className="text-white hover:text-blue-100 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedContact)
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
