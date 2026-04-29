import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CustomerData {
  contact?: any;
  leads: any[];
  opportunities: any[];
  cases: any[];
  accounts: any[];
}

export function CustomerProfile() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<CustomerData>({
    leads: [],
    opportunities: [],
    cases: [],
    accounts: []
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'leads' | 'cases' | 'timeline'>('overview');
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);

  useEffect(() => {
    if (identifier) {
      loadCustomerData(identifier);
    }
  }, [identifier]);

  const loadCustomerData = async (id: string) => {
    try {
      setLoading(true);

      let email: string | null = null;
      let phone: string | null = null;
      let contactRecord: any = null;

      if (id.includes('@')) {
        email = id;
        const { data } = await supabase
          .from('salesforce_contacts')
          .select('*')
          .eq('Email', email)
          .maybeSingle();
        contactRecord = data;
      } else if (id.match(/^\d{3}/)) {
        phone = id;
        const { data } = await supabase
          .from('salesforce_contacts')
          .select('*')
          .eq('Phone', phone)
          .maybeSingle();
        contactRecord = data;
      } else {
        const { data } = await supabase
          .from('salesforce_contacts')
          .select('*')
          .eq('Id', id)
          .maybeSingle();
        contactRecord = data;
      }

      if (contactRecord) {
        email = contactRecord.Email;
        phone = contactRecord.Phone;
      }

      const [leadsResult, opportunitiesResult, casesResult, accountsResult] = await Promise.all([
        supabase
          .from('leads')
          .select('*')
          .or(email ? `Email.eq."${email}"` : phone ? `Phone.eq."${phone}"` : 'id.eq.null'),

        supabase
          .from('opportunities')
          .select('*')
          .or(
            contactRecord?.AccountId
              ? `AccountId.eq."${contactRecord.AccountId}",ContactId.eq."${contactRecord.Id}"`
              : 'Id.eq.null'
          ),

        supabase
          .from('salesforce_cases')
          .select('*')
          .or(
            contactRecord?.AccountId
              ? `AccountId.eq."${contactRecord.AccountId}",ContactId.eq."${contactRecord.Id}"`
              : 'Id.eq.null'
          ),

        contactRecord?.AccountId
          ? supabase
              .from('accounts')
              .select('*')
              .eq('Id', contactRecord.AccountId)
          : Promise.resolve({ data: [] })
      ]);

      setCustomerData({
        contact: contactRecord,
        leads: leadsResult.data || [],
        opportunities: opportunitiesResult.data || [],
        cases: casesResult.data || [],
        accounts: accountsResult.data || []
      });
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '-';
    return `$${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const { contact, leads, opportunities, cases, accounts } = customerData;
  const account = accounts[0];

  const totalRevenue = opportunities
    .filter(opp => opp.StageName === 'Closed Won' && opp.Amount)
    .reduce((sum, opp) => sum + parseFloat(opp.Amount), 0);

  const pipelineValue = opportunities
    .filter(opp => opp.StageName !== 'Closed Won' && opp.StageName !== 'Closed Lost' && opp.Amount)
    .reduce((sum, opp) => sum + parseFloat(opp.Amount), 0);

  const displayName = contact
    ? `${contact.FirstName || ''} ${contact.LastName || ''}`.trim()
    : leads[0]
    ? `${leads[0].FirstName || ''} ${leads[0].LastName || ''}`.trim()
    : 'Unknown Customer';

  const displayEmail = contact?.Email || leads[0]?.Email || null;
  const displayPhone = contact?.Phone || leads[0]?.Phone || null;

  const allActivities = [
    ...opportunities.map(o => ({ ...o, type: 'opportunity', date: o.CreatedDate || o.LastModifiedDate })),
    ...leads.map(l => ({ ...l, type: 'lead', date: l.CreatedDate || l.created_at })),
    ...cases.map(c => ({ ...c, type: 'case', date: c.CreatedDate }))
  ].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex items-center gap-4 mb-4 sm:mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{displayName}</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <div className="text-xs text-slate-500 mb-1">Revenue</div>
            <div className="text-xl font-semibold text-slate-900">${totalRevenue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Pipeline</div>
            <div className="text-xl font-semibold text-slate-900">${pipelineValue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Opportunities</div>
            <div className="text-xl font-semibold text-slate-900">{opportunities.length}</div>
          </div>
          {displayEmail && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Email</div>
              <a href={`mailto:${displayEmail}`} className="text-sm text-amber-600 hover:text-amber-700 break-all">
                {displayEmail}
              </a>
            </div>
          )}
          {displayPhone && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Phone</div>
              <a href={`tel:${displayPhone}`} className="text-sm text-amber-600 hover:text-amber-700">
                {displayPhone}
              </a>
            </div>
          )}
          {contact?.Title && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Title</div>
              <div className="text-sm text-slate-900">{contact.Title}</div>
            </div>
          )}
          {account?.Name && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Company</div>
              <div className="text-sm text-slate-900">{account.Name}</div>
            </div>
          )}
          {(account?.BillingStreet || contact?.MailingStreet) && (
            <div className="sm:col-span-2">
              <div className="text-xs text-slate-500 mb-1">Address</div>
              <div className="text-sm text-slate-900">
                {account?.BillingStreet || contact?.MailingStreet}
                {((account?.BillingCity || contact?.MailingCity) ||
                  (account?.BillingState || contact?.MailingState) ||
                  (account?.BillingPostalCode || contact?.MailingPostalCode)) && (
                  <span className="ml-1">
                    {[
                      account?.BillingCity || contact?.MailingCity,
                      account?.BillingState || contact?.MailingState,
                      account?.BillingPostalCode || contact?.MailingPostalCode
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex gap-1 p-1 overflow-x-auto">
            {['overview', 'opportunities', 'leads', 'cases', 'timeline'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-amber-100 text-amber-900'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'leads' && leads.length > 0 && ` (${leads.length})`}
                {tab === 'opportunities' && opportunities.length > 0 && ` (${opportunities.length})`}
                {tab === 'cases' && cases.length > 0 && ` (${cases.length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {opportunities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Active Opportunities</h3>
                  <div className="space-y-2">
                    {opportunities
                      .filter(opp => opp.StageName !== 'Closed Won' && opp.StageName !== 'Closed Lost')
                      .map((opp) => (
                        <div
                          key={opp.Id}
                          onClick={() => {
                            setSelectedOpportunity(opp);
                            setActiveTab('opportunities');
                          }}
                          className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 text-sm">{opp.Name}</div>
                              <div className="text-xs text-slate-600 mt-1">
                                {opp.StageName} • {formatDate(opp.CloseDate)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-slate-900">{formatCurrency(opp.Amount)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {leads.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Leads</h3>
                  <div className="space-y-2">
                    {leads.map((lead) => (
                      <div key={lead.id} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                            {lead.Status}
                          </span>
                          {lead.LeadSource && (
                            <span className="text-xs text-slate-600">{lead.LeadSource}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {opportunities.length === 0 && leads.length === 0 && (
                <p className="text-slate-500 text-center py-8 text-sm">No activity yet</p>
              )}
            </div>
          )}

          {activeTab === 'opportunities' && (
            <div className="space-y-4">
              {opportunities.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No opportunities found</p>
              ) : (
                opportunities.map((opp) => (
                  <div
                    key={opp.Id}
                    onClick={() => setSelectedOpportunity(selectedOpportunity?.Id === opp.Id ? null : opp)}
                    className="border border-slate-200 rounded-lg p-4 hover:border-amber-300 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 text-lg">{opp.Name}</div>
                        <div className="text-sm text-slate-600 mt-1 flex items-center gap-3 flex-wrap">
                          <span>Stage: <span className="font-medium">{opp.StageName}</span></span>
                          <span>•</span>
                          <span>Close: {formatDate(opp.CloseDate)}</span>
                          {opp.LeadSource && (
                            <>
                              <span>•</span>
                              <span>Source: {opp.LeadSource}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">{formatCurrency(opp.Amount)}</div>
                        <div className="text-sm text-slate-600">{opp.Probability}% probability</div>
                      </div>
                    </div>

                    {selectedOpportunity?.Id === opp.Id && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                        {opp.Description && (
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Description</div>
                            <div className="text-sm text-slate-900">{opp.Description}</div>
                          </div>
                        )}

                        {opp.NextStep && (
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Next Step</div>
                            <div className="text-sm text-slate-900">{opp.NextStep}</div>
                          </div>
                        )}

                        {opp.Job_Notes__c && (
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Job Notes</div>
                            <div className="text-sm text-slate-900">{opp.Job_Notes__c}</div>
                          </div>
                        )}

                        {opp.Submission_Notes__c && (
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Submission Notes</div>
                            <div className="text-sm text-slate-900">{opp.Submission_Notes__c}</div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {opp.System_Size_kW__c && (
                            <div>
                              <div className="text-xs text-slate-500 mb-1">System Size</div>
                              <div className="text-sm text-slate-900">{opp.System_Size_kW__c} kW</div>
                            </div>
                          )}

                          {opp.Annual_Production_kWhr__c && (
                            <div>
                              <div className="text-xs text-slate-500 mb-1">Annual Production</div>
                              <div className="text-sm text-slate-900">{opp.Annual_Production_kWhr__c} kWh</div>
                            </div>
                          )}

                          {opp.First_Sit_Date__c && (
                            <div>
                              <div className="text-xs text-slate-500 mb-1">First Sit</div>
                              <div className="text-sm text-slate-900">{formatDate(opp.First_Sit_Date__c)}</div>
                            </div>
                          )}

                          {opp.Install_Scheduled_Date__c && (
                            <div>
                              <div className="text-xs text-slate-500 mb-1">Install Scheduled</div>
                              <div className="text-sm text-slate-900">{formatDate(opp.Install_Scheduled_Date__c)}</div>
                            </div>
                          )}

                          {opp.Install_Completion_Date__c && (
                            <div>
                              <div className="text-xs text-slate-500 mb-1">Install Completed</div>
                              <div className="text-sm text-slate-900">{formatDate(opp.Install_Completion_Date__c)}</div>
                            </div>
                          )}

                          {opp.Contract_Date__c && (
                            <div>
                              <div className="text-xs text-slate-500 mb-1">Contract Date</div>
                              <div className="text-sm text-slate-900">{formatDate(opp.Contract_Date__c)}</div>
                            </div>
                          )}

                          {opp.Payment_Method__c && (
                            <div>
                              <div className="text-xs text-slate-500 mb-1">Payment Method</div>
                              <div className="text-sm text-slate-900">{opp.Payment_Method__c}</div>
                            </div>
                          )}

                          {opp.Job_Number__c && (
                            <div>
                              <div className="text-xs text-slate-500 mb-1">Job Number</div>
                              <div className="text-sm text-slate-900">{opp.Job_Number__c}</div>
                            </div>
                          )}
                        </div>

                        {(opp.Battery_Storage_Adder__c || opp.EV_Charger_Adder__c || opp.New_Construction__c || opp.Roof_Work__c) && (
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Add-ons</div>
                            <div className="flex gap-2 flex-wrap">
                              {opp.Battery_Storage_Adder__c && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">Battery</span>
                              )}
                              {opp.EV_Charger_Adder__c && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">EV Charger</span>
                              )}
                              {opp.New_Construction__c && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">New Construction</span>
                              )}
                              {opp.Roof_Work__c && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">Roof Work</span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                          <div>Created {formatDate(opp.CreatedDate)}</div>
                          <div>Modified {formatDate(opp.LastModifiedDate)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="space-y-2">
              {leads.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">No leads found</p>
              ) : (
                leads.map((lead) => (
                  <div key={lead.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-slate-900 text-sm">
                          {lead.FirstName} {lead.LastName}
                        </div>
                        {lead.Company && (
                          <div className="text-xs text-slate-600">{lead.Company}</div>
                        )}
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                        {lead.Status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {lead.LeadSource && (
                        <div>
                          <span className="text-slate-500">Source:</span>{' '}
                          <span className="text-slate-900">{lead.LeadSource}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500">Created:</span>{' '}
                        <span className="text-slate-900">{formatDate(lead.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'cases' && (
            <div className="space-y-2">
              {cases.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">No cases found</p>
              ) : (
                cases.map((caseItem) => (
                  <div key={caseItem.Id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 text-sm">{caseItem.Subject}</div>
                        {caseItem.Description && (
                          <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {caseItem.Description}
                          </div>
                        )}
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                        {caseItem.Status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(caseItem.CreatedDate)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-2">
              {allActivities.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">No activity found</p>
              ) : (
                allActivities.map((activity, idx) => {
                  const isOpportunity = activity.type === 'opportunity';
                  const isLead = activity.type === 'lead';
                  const isCase = activity.type === 'case';

                  return (
                    <div key={idx} className="border border-slate-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-slate-900">
                        {isOpportunity && activity.Name}
                        {isLead && `Lead: ${activity.Status}`}
                        {isCase && activity.Subject}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {formatDate(activity.date)}
                        {isOpportunity && ` • ${activity.StageName} • ${formatCurrency(activity.Amount)}`}
                        {isLead && activity.LeadSource && ` • ${activity.LeadSource}`}
                        {isCase && ` • ${activity.Status}`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
