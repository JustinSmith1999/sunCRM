import React, { useState, useEffect } from 'react';
import { Search, Filter, Sun, Zap, FileText, CheckCircle2, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Lead {
  Id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  monthly_electric_bill: number;
  solar_interest_score: number;
  qualification_status: string;
  Status: string;
  created_at: string;
  timeline_urgency: string;
}

const SOLAR_STAGES = [
  { id: 'new', name: 'Solar Interest', icon: Sun, color: 'slate' },
  { id: 'qualified', name: 'Qualified', icon: CheckCircle2, color: 'green' },
  { id: 'site_assessment', name: 'Site Assessment', icon: Search, color: 'blue' },
  { id: 'design_proposal', name: 'Design & Proposal', icon: FileText, color: 'purple' },
  { id: 'contract_signed', name: 'Contract Signed', icon: CheckCircle2, color: 'amber' },
  { id: 'installation', name: 'Installation', icon: Zap, color: 'orange' },
];

export function SolarPipelineView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .in('Status', ['Open', 'Opportunity', 'Qualifying', 'Future Contact', 'Contacted', 'Working'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageForLead = (lead: Lead) => {
    const status = lead.Status?.toLowerCase() || '';
    const qualStatus = lead.qualification_status || '';

    if (status === 'contract signed' || status === 'closed won' || status === 'closed - won') return 'contract_signed';
    if (status === 'installation' || status === 'installing') return 'installation';
    if (status.includes('proposal') || status.includes('quote') || status === 'opportunity') return 'design_proposal';
    if (status.includes('assessment') || status.includes('visit') || status === 'working') return 'site_assessment';
    if (status === 'qualifying' || qualStatus === 'qualified' || status === 'contacted') return 'qualified';
    return 'new';
  };

  const getLeadsByStage = (stageId: string) => {
    return leads.filter(lead => {
      const leadStage = getStageForLead(lead);
      const matchesStage = leadStage === stageId;
      const matchesSearch = searchTerm === '' ||
        `${lead.FirstName} ${lead.LastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.Phone?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesScore = true;
      if (lead.solar_interest_score) {
        if (scoreFilter === 'high') matchesScore = lead.solar_interest_score >= 70;
        else if (scoreFilter === 'medium') matchesScore = lead.solar_interest_score >= 40 && lead.solar_interest_score < 70;
        else if (scoreFilter === 'low') matchesScore = lead.solar_interest_score < 40;
      }

      return matchesStage && matchesSearch && matchesScore;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 40) return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-600';
  };

  const getUrgencyIcon = (urgency: string) => {
    if (urgency === 'immediate' || urgency === '1_3_months') {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  const LeadCard = ({ lead }: { lead: Lead }) => (
    <div className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer touch-manipulation">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 text-sm truncate">
            {lead.FirstName} {lead.LastName}
          </h4>
          <p className="text-xs text-slate-600 truncate">{lead.Email || lead.Phone || 'No contact info'}</p>
        </div>
        {lead.solar_interest_score ? (
          <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2 ${getScoreColor(lead.solar_interest_score)}`}>
            {lead.solar_interest_score}
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2 bg-slate-100 text-slate-500">
            New
          </span>
        )}
      </div>

      <div className="space-y-1">
        {lead.monthly_electric_bill && (
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Zap className="w-3 h-3 flex-shrink-0" />
            <span>${lead.monthly_electric_bill}/mo bill</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{lead.Status || 'Open'}</span>
        </div>
      </div>

      <div className="mt-2 flex justify-end">
        <button className="text-amber-600 hover:text-amber-700 flex-shrink-0 p-1">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Solar Pipeline</h1>
            <p className="text-sm sm:text-base text-slate-600">Track solar leads through the customer journey</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value as any)}
            className="px-4 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">All Scores</option>
            <option value="high">High (70+)</option>
            <option value="medium">Medium (40-69)</option>
            <option value="low">Low (&lt;40)</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 sm:px-6 pb-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm inline-flex lg:flex min-w-full">
          <div className="flex lg:grid lg:grid-cols-6 divide-x divide-slate-200 min-w-full">
            {SOLAR_STAGES.map((stage) => {
              const Icon = stage.icon;
              const stageLeads = getLeadsByStage(stage.id);
              const colorClasses = {
                slate: { bg: 'bg-slate-50', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-800' },
                green: { bg: 'bg-green-50', text: 'text-green-600', badge: 'bg-green-100 text-green-800' },
                blue: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-800' },
                purple: { bg: 'bg-purple-50', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-800' },
                amber: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800' },
                orange: { bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-800' },
              };
              const colors = colorClasses[stage.color as keyof typeof colorClasses];

              return (
                <div key={stage.id} className="flex flex-col w-64 lg:w-auto lg:flex-1 min-h-[400px] max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-320px)]">
                  <div className={`p-3 sm:p-4 ${colors.bg} border-b border-slate-200 flex-shrink-0`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.text} flex-shrink-0`} />
                        <h3 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">{stage.name}</h3>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${colors.badge}`}>
                        {stageLeads.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 p-2 sm:p-3 space-y-2 sm:space-y-3 overflow-y-auto bg-slate-50">
                    {stageLeads.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        No leads in this stage
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <LeadCard key={lead.Id} lead={lead} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 sm:p-6 bg-slate-50">
        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Pipeline Summary</h3>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {SOLAR_STAGES.map((stage) => {
              const count = getLeadsByStage(stage.id).length;
              return (
                <div key={stage.id} className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{count}</p>
                  <p className="text-xs sm:text-sm text-slate-600 truncate">{stage.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
