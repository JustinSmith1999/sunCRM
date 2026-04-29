import { useState, useEffect } from 'react';
import { Activity, User, FileText, CheckCircle, CreditCard as Edit, Trash, Plus, MessageSquare, AtSign, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ActivityItem {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  description: string;
  changes?: any;
  created_at: string;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadActivities();
  }, [filter, page]);

  const loadActivities = async () => {
    try {
      let query = supabase
        .from('activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (filter !== 'all') {
        query = query.eq('entity_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (page === 1) {
        setActivities(data || []);
      } else {
        setActivities(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data || []).length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="w-4 h-4" />;
      case 'updated':
        return <Edit className="w-4 h-4" />;
      case 'deleted':
        return <Trash className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'commented':
        return <MessageSquare className="w-4 h-4" />;
      case 'mentioned':
        return <AtSign className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-700';
      case 'updated':
        return 'bg-blue-100 text-blue-700';
      case 'deleted':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'commented':
        return 'bg-yellow-100 text-yellow-700';
      case 'mentioned':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const entityTypes = [
    { value: 'all', label: 'All Activity' },
    { value: 'lead', label: 'Leads' },
    { value: 'opportunity', label: 'Opportunities' },
    { value: 'account', label: 'Accounts' },
    { value: 'contact', label: 'Contacts' },
    { value: 'ticket', label: 'Tickets' },
    { value: 'task', label: 'Tasks' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Activity Feed</h2>
          </div>

          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {entityTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {loading && page === 1 ? (
          <div className="p-8 text-center text-gray-500">
            Loading activity...
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No activity yet</p>
          </div>
        ) : (
          <>
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(activity.action)}`}>
                    {getActionIcon(activity.action)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user_name || activity.user_email}</span>
                          {' '}
                          <span className="text-gray-600">{activity.description}</span>
                        </p>

                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium capitalize">{activity.entity_type}</span>
                          <span>•</span>
                          <span>{activity.entity_name}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(activity.created_at)}</span>
                        </div>

                        {activity.changes && Object.keys(activity.changes).length > 0 && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <div className="font-medium text-gray-700 mb-1">Changes:</div>
                            {Object.entries(activity.changes).map(([key, value]: [string, any]) => (
                              <div key={key} className="text-gray-600">
                                <span className="font-medium">{key}:</span>{' '}
                                {value.old && <span className="line-through text-red-600">{value.old}</span>}
                                {value.old && value.new && ' → '}
                                {value.new && <span className="text-green-600">{value.new}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
