import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckSquare, Phone, Mail, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CallHistoryWidget } from '../RingCentral/CallHistoryWidget';
import { useRingCentralWebhooks } from '../../hooks/useRingCentralWebhooks';

interface TodayActivity {
  id: string;
  type: string;
  subject: string;
  due_date: string | null;
  status: string;
  priority: string;
  accounts?: { name: string };
  contacts?: { first_name: string; last_name: string };
  opportunities?: { name: string };
}

interface UpcomingOpportunity {
  id: string;
  name: string;
  amount: number | null;
  close_date: string | null;
  stage: string;
  accounts: { name: string };
}

export function MyDayDashboard() {
  const [todayActivities, setTodayActivities] = useState<TodayActivity[]>([]);
  const [upcomingOpportunities, setUpcomingOpportunities] = useState<UpcomingOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  
  // Enable RingCentral webhook processing
  useRingCentralWebhooks();

  useEffect(() => {
    loadMyDayData();
  }, [profile]);

  const loadMyDayData = async () => {
    if (!profile?.organization_id) return;

    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Load today's activities
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select(`
          *,
          accounts (name),
          contacts (first_name, last_name),
          opportunities (name)
        `)
        .eq('organization_id', profile.organization_id)
        .eq('assigned_to', profile.id)
        .gte('due_date', startOfDay)
        .lte('due_date', endOfDay)
        .order('due_date', { ascending: true });

      if (activitiesError) throw activitiesError;

      // Load upcoming opportunities
      const { data: opportunities, error: opportunitiesError } = await supabase
        .from('opportunities')
        .select(`
          *,
          accounts (name)
        `)
        .eq('organization_id', profile.organization_id)
        .eq('owner_id', profile.id)
        .gte('close_date', today.toISOString().split('T')[0])
        .lte('close_date', nextWeek.split('T')[0])
        .in('stage', ['proposal', 'negotiation'])
        .order('close_date', { ascending: true })
        .limit(5);

      if (opportunitiesError) throw opportunitiesError;

      setTodayActivities(activities || []);
      setUpcomingOpportunities(opportunities || []);
    } catch (error) {
      console.error('Error loading my day data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateActivityStatus = async (id: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setTodayActivities(prev => 
        prev.map(activity => 
          activity.id === id 
            ? { ...activity, status }
            : activity
        )
      );
    } catch (error) {
      console.error('Error updating activity status:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'task': return <CheckSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-slate-600 bg-slate-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'No time set';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDaysUntilClose = (closeDate: string | null) => {
    if (!closeDate) return null;
    const today = new Date();
    const close = new Date(closeDate);
    const diffTime = close.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 border border-slate-200">
                <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-16 bg-slate-100 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const completedTasks = todayActivities.filter(a => a.status === 'completed').length;
  const totalTasks = todayActivities.length;
  const urgentTasks = todayActivities.filter(a => a.priority === 'urgent' && a.status !== 'completed').length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Good morning, {profile?.full_name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-slate-600">Here's your schedule for today, {new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Tasks Today</p>
              <p className="text-2xl font-bold text-slate-900">{completedTasks}/{totalTasks}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Urgent Tasks</p>
              <p className="text-2xl font-bold text-red-600">{urgentTasks}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Closing Soon</p>
              <p className="text-2xl font-bold text-amber-600">{upcomingOpportunities.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Activities */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-900">Today's Schedule</h3>
            </div>
          </div>
          <div className="p-6">
            {todayActivities.length > 0 ? (
              <div className="space-y-4">
                {todayActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        checked={activity.status === 'completed'}
                        onChange={(e) => updateActivityStatus(activity.id, e.target.checked ? 'completed' : 'not_started')}
                        className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-slate-600">
                          {getActivityIcon(activity.type)}
                        </div>
                        <h4 className={`font-medium ${
                          activity.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'
                        }`}>
                          {activity.subject}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(activity.priority)}`}>
                          {activity.priority}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        <div className="flex items-center gap-4">
                          <span>{formatTime(activity.due_date)}</span>
                          {activity.accounts && (
                            <span>• {activity.accounts.name}</span>
                          )}
                          {activity.contacts && (
                            <span>• {activity.contacts.first_name} {activity.contacts.last_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No activities scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Opportunities */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-900">Closing This Week</h3>
            </div>
          </div>
          <div className="p-6">
            {upcomingOpportunities.length > 0 ? (
              <div className="space-y-4">
                {upcomingOpportunities.map((opportunity) => {
                  const daysUntilClose = getDaysUntilClose(opportunity.close_date);
                  return (
                    <div key={opportunity.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-slate-900">{opportunity.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          opportunity.stage === 'negotiation' ? 'text-orange-600 bg-orange-100' : 'text-blue-600 bg-blue-100'
                        }`}>
                          {opportunity.stage.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{opportunity.accounts.name}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-900">
                          {formatCurrency(opportunity.amount)}
                        </span>
                        <span className={`font-medium ${
                          daysUntilClose !== null && daysUntilClose <= 2 ? 'text-red-600' : 'text-slate-600'
                        }`}>
                          {daysUntilClose !== null && (
                            daysUntilClose === 0 ? 'Closes today' :
                            daysUntilClose === 1 ? 'Closes tomorrow' :
                            `Closes in ${daysUntilClose} days`
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No opportunities closing this week</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RingCentral Call History */}
      <div className="mt-8">
        <CallHistoryWidget onCreateActivity={(call) => {
          // Refresh activities when a call is logged
          loadMyDayData();
        }} />
      </div>
    </div>
  );
}