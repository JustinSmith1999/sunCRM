import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Filter, CheckSquare, AlertTriangle, MoreVertical, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SalesforceTask {
  Id: string;
  Subject: string | null;
  Description: string | null;
  Status: string | null;
  Priority: string | null;
  ActivityDate: Date | null;
  IsClosed: boolean | null;
  IsHighPriority: boolean | null;
  AccountId: string | null;
  WhoId: string | null;
  WhatId: string | null;
  OwnerId: string | null;
  CreatedDate: string | null;
  CompletedDateTime: string | null;
  CallType: string | null;
  CallDurationInSeconds: number | null;
}

export function TaskDashboard() {
  const [tasks, setTasks] = useState<SalesforceTask[]>([]);
  const [accounts, setAccounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedView, setSelectedView] = useState('all');
  const { profile } = useAuth();

  useEffect(() => {
    loadTasks();
  }, [profile]);

  const loadTasks = async () => {
    try {
      const [tasksResult, accountsResult] = await Promise.all([
        supabase
          .from('salesforce_tasks')
          .select('*')
          .order('ActivityDate', { ascending: true, nullsLast: true })
          .limit(500),
        supabase
          .from('accounts')
          .select('Id, Name')
          .limit(10000)
      ]);

      if (tasksResult.error) throw tasksResult.error;

      setTasks(tasksResult.data || []);

      const accountMap: Record<string, string> = {};
      (accountsResult.data || []).forEach((account: any) => {
        accountMap[account.Id] = account.Name;
      });
      setAccounts(accountMap);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = selectedStatus === 'all' || task.Status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || task.Priority === selectedPriority;

    let matchesView = true;
    if (selectedView === 'open') {
      matchesView = !task.IsClosed;
    } else if (selectedView === 'closed') {
      matchesView = !!task.IsClosed;
    } else if (selectedView === 'high-priority') {
      matchesView = !!task.IsHighPriority;
    }

    return matchesStatus && matchesPriority && matchesView;
  });

  const getPriorityColor = (priority: string | null, isHighPriority: boolean | null) => {
    if (isHighPriority) return 'text-red-600 bg-red-100';
    if (!priority) return 'text-slate-600 bg-slate-100';
    switch (priority.toLowerCase()) {
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-slate-600 bg-slate-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getStatusColor = (status: string | null, isClosed: boolean | null) => {
    if (isClosed) return 'text-green-600 bg-green-100';
    if (!status) return 'text-slate-600 bg-slate-100';
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in progress': return 'text-blue-600 bg-blue-100';
      case 'not started': return 'text-slate-600 bg-slate-100';
      case 'waiting on someone else': return 'text-amber-600 bg-amber-100';
      case 'deferred': return 'text-slate-600 bg-slate-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const formatDueDate = (dateString: Date | string | null) => {
    if (!dateString) return 'No due date';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const open = tasks.filter(t => !t.IsClosed).length;
    const closed = tasks.filter(t => t.IsClosed).length;
    const highPriority = tasks.filter(t => t.IsHighPriority && !t.IsClosed).length;
    const overdue = tasks.filter(t => {
      if (!t.ActivityDate || t.IsClosed) return false;
      return new Date(t.ActivityDate) < new Date();
    }).length;

    return { total, open, closed, highPriority, overdue };
  };

  const uniqueStatuses = Array.from(new Set(tasks.map(t => t.Status).filter(Boolean)));
  const uniquePriorities = Array.from(new Set(tasks.map(t => t.Priority).filter(Boolean)));

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-48"></div>
                  <div className="h-3 bg-slate-200 rounded w-32"></div>
                </div>
                <div className="h-8 bg-slate-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks & Activities</h1>
          <p className="text-slate-600">Manage your tasks and track progress ({tasks.length.toLocaleString()} total)</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total.toLocaleString()}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Open</p>
              <p className="text-2xl font-bold text-amber-600">{stats.open.toLocaleString()}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Closed</p>
              <p className="text-2xl font-bold text-green-600">{stats.closed.toLocaleString()}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">High Priority</p>
              <p className="text-2xl font-bold text-red-600">{stats.highPriority.toLocaleString()}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Overdue</p>
              <p className="text-2xl font-bold text-purple-600">{stats.overdue.toLocaleString()}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['all', 'open', 'closed', 'high-priority'].map(view => (
          <button
            key={view}
            onClick={() => setSelectedView(view)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              selectedView === view
                ? 'bg-amber-500 text-slate-900'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {view.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
          >
            <option value="all">All Priority</option>
            {uniquePriorities.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div key={task.Id} className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${task.IsClosed ? 'bg-green-100' : 'bg-slate-100'}`}>
                  <CheckSquare className={`w-5 h-5 ${task.IsClosed ? 'text-green-600' : 'text-slate-600'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-base font-semibold text-slate-900">
                      {task.Subject || 'No Subject'}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(task.Status, task.IsClosed)}`}>
                      {task.IsClosed ? 'Closed' : (task.Status || 'Unknown')}
                    </span>
                    {task.Priority && (
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(task.Priority, task.IsHighPriority)}`}>
                        {task.IsHighPriority ? 'High Priority' : task.Priority}
                      </span>
                    )}
                    {task.CallType && (
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-800">
                        {task.CallType}
                      </span>
                    )}
                  </div>

                  {task.Description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.Description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    {task.ActivityDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDueDate(task.ActivityDate)}</span>
                      </div>
                    )}
                    {task.AccountId && (
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{accounts[task.AccountId] || task.AccountId}</span>
                      </div>
                    )}
                    {task.CallDurationInSeconds && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{Math.round(task.CallDurationInSeconds / 60)} min</span>
                      </div>
                    )}
                    {task.CompletedDateTime && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Completed {new Date(task.CompletedDateTime).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks found</h3>
            <p className="text-slate-600 mb-4">
              No tasks match your current filters. Try adjusting your view or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
