import React, { useState, useEffect, useMemo } from 'react';
import { Search, Star, Award, TrendingUp, ChevronDown, ChevronUp, X, Crown, Medal } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface LoyaltyMember {
  Id: string;
  Name: string;
  Opportunity_Name__c: string | null;
  Contact_Name__c: string | null;
  Total_Referred__c: string | null;
  Solar_SuperStar_Status__c: string | null;
  Referral_Fee__c: string | null;
  RockStar_Referrer__c: boolean | null;
  of_Voucher__c: string | null;
  Unpaid_Vouchers__c: string | null;
  Install_Completion_Date__c: string | null;
  CreatedDate: string | null;
  [key: string]: any;
}

type SortField = 'Name' | 'Total_Referred__c' | 'Solar_SuperStar_Status__c' | 'Referral_Fee__c';
type SortDirection = 'asc' | 'desc';

const tierColors: Record<string, { bg: string; text: string; icon: any }> = {
  'Platinum': { bg: 'bg-slate-200', text: 'text-slate-800', icon: Crown },
  'Gold': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Crown },
  'Silver': { bg: 'bg-slate-100', text: 'text-slate-600', icon: Medal },
  'Bronze': { bg: 'bg-orange-100', text: 'text-orange-700', icon: Award }
};

export function LoyaltyProgram() {
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedMember, setSelectedMember] = useState<LoyaltyMember | null>(null);
  const [sortField, setSortField] = useState<SortField>('Total_Referred__c');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 25;
  const { profile } = useAuth();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTier]);

  useEffect(() => {
    loadMembers();
  }, [profile, currentPage, searchTerm, selectedTier]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let membersQuery = supabase
        .from('sunation_loyalty')
        .select('*', { count: 'exact' })
        .order('CreatedDate', { ascending: false, nullsFirst: false });

      if (searchTerm) {
        membersQuery = membersQuery.or(`Name.ilike.%${searchTerm}%,Contact_Name__c.ilike.%${searchTerm}%,Opportunity_Name__c.ilike.%${searchTerm}%`);
      }

      if (selectedTier !== 'all') {
        membersQuery = membersQuery.eq('Solar_SuperStar_Status__c', selectedTier);
      }

      const membersResult = await membersQuery.range(from, to);

      if (membersResult.error) throw membersResult.error;

      setMembers(membersResult.data || []);
      setTotalCount(membersResult.count || 0);
    } catch (error) {
      console.error('Error loading loyalty members:', error);
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

  const filteredAndSortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'Total_Referred__c' || sortField === 'Referral_Fee__c') {
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
  }, [members, sortField, sortDirection]);

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

  const getTierColor = (tier: string | null) => {
    if (!tier) return { bg: 'bg-slate-100', text: 'text-slate-700', icon: Award };
    return tierColors[tier] || { bg: 'bg-slate-100', text: 'text-slate-700', icon: Award };
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-50" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-yellow-600" /> : <ChevronDown className="w-3 h-3 text-yellow-600" />;
  };

  const getMemberStats = () => {
    const total = totalCount;
    const rockStars = members.filter(m => m.RockStar_Referrer__c).length;
    const totalReferrals = members.reduce((sum, m) => sum + parseFloat(m.Total_Referred__c || '0'), 0);
    const totalRewards = members.reduce((sum, m) => sum + parseFloat(m.Referral_Fee__c || '0'), 0);

    return { total, rockStars, totalReferrals, totalRewards };
  };

  const stats = getMemberStats();

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
          <Star className="w-7 h-7 text-yellow-500" />
          Loyalty Program
        </h1>
        <p className="text-slate-600">Track customer referrals and rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-100">Total Members</p>
              <p className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-100">Rock Stars</p>
              <p className="text-2xl font-bold text-white">{stats.rockStars}</p>
            </div>
            <Crown className="w-8 h-8 text-orange-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-100">Total Referrals</p>
              <p className="text-2xl font-bold text-white">{stats.totalReferrals.toFixed(0)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-amber-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-100">Total Rewards</p>
              <p className="text-2xl font-bold text-white">{formatAmount(stats.totalRewards.toString())}</p>
            </div>
            <Award className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Tiers</option>
              <option value="Platinum">Platinum</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Bronze">Bronze</option>
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
            <thead className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort('Name')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-yellow-100 group"
                >
                  <div className="flex items-center gap-1">
                    Member Name
                    <SortIcon field="Name" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Opportunity</th>
                <th
                  onClick={() => handleSort('Total_Referred__c')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-yellow-100 group"
                >
                  <div className="flex items-center gap-1">
                    Total Referrals
                    <SortIcon field="Total_Referred__c" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('Solar_SuperStar_Status__c')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-yellow-100 group"
                >
                  <div className="flex items-center gap-1">
                    Tier
                    <SortIcon field="Solar_SuperStar_Status__c" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('Referral_Fee__c')}
                  className="text-right px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-yellow-100 group"
                >
                  <div className="flex items-center justify-end gap-1">
                    Rewards
                    <SortIcon field="Referral_Fee__c" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Install Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedMembers.map((member) => {
                const tierColor = getTierColor(member.Solar_SuperStar_Status__c);
                const TierIcon = tierColor.icon;
                return (
                  <tr
                    key={member.Id}
                    onClick={() => setSelectedMember(member)}
                    className="hover:bg-yellow-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{member.Name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{member.Contact_Name__c || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate">{member.Opportunity_Name__c || '-'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{member.Total_Referred__c || '0'}</td>
                    <td className="px-4 py-3">
                      {member.Solar_SuperStar_Status__c ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${tierColor.bg} ${tierColor.text}`}>
                          <TierIcon className="w-3 h-3" />
                          {member.Solar_SuperStar_Status__c}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-yellow-700">
                      {formatAmount(member.Referral_Fee__c)}
                    </td>
                    <td className="px-4 py-3">
                      {member.RockStar_Referrer__c && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                          <Star className="w-3 h-3" />
                          Rock Star
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(member.Install_Completion_Date__c)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAndSortedMembers.length === 0 && (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No loyalty members found</p>
          </div>
        )}
      </div>

      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedMember(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-6 py-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Star className="w-6 h-6" />
                  {selectedMember.Name}
                </h2>
                <p className="text-sm text-yellow-100 mt-1">{selectedMember.Contact_Name__c || 'Loyalty Member'}</p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-white hover:text-yellow-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedMember)
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
                              : key.toLowerCase().includes('fee') || key.toLowerCase().includes('amount')
                                ? formatAmount(value as string)
                                : String(value)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setSelectedMember(null)}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-colors font-medium"
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
