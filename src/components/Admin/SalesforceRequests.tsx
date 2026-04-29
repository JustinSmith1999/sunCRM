import React, { useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Zap, Clock, User, AlertTriangle } from 'lucide-react';

interface SalesforceRequest {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'testing' | 'completed' | 'cancelled';
  requested_by: string;
  assigned_to: string;
  created_date: string;
  due_date: string;
  request_type: string;
}

export function SalesforceRequests() {
  const [requests] = useState<SalesforceRequest[]>([
    {
      id: '1',
      title: 'Add Custom Field to Account Object',
      description: 'Need to add Solar Capacity field to track installation size',
      priority: 'high',
      status: 'in_progress',
      requested_by: 'Sales Manager',
      assigned_to: 'SF Admin',
      created_date: '2024-01-15',
      due_date: '2024-02-01',
      request_type: 'Custom Field'
    },
    {
      id: '2',
      title: 'Create Workflow Rule for Lead Assignment',
      description: 'Automatically assign leads based on territory rules',
      priority: 'urgent',
      status: 'new',
      requested_by: 'Sales Director',
      assigned_to: 'SF Admin',
      created_date: '2024-01-20',
      due_date: '2024-01-25',
      request_type: 'Workflow'
    },
    {
      id: '3',
      title: 'Update Page Layout for Opportunities',
      description: 'Reorganize opportunity page layout for better usability',
      priority: 'normal',
      status: 'testing',
      requested_by: 'Sales Rep',
      assigned_to: 'SF Admin',
      created_date: '2024-01-10',
      due_date: '2024-01-30',
      request_type: 'Page Layout'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || request.priority === selectedPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-amber-600 bg-amber-100';
      case 'testing': return 'text-sky-600 bg-sky-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
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

  const getRequestStats = () => {
    const total = requests.length;
    const open = requests.filter(r => !['completed', 'cancelled'].includes(r.status)).length;
    const urgent = requests.filter(r => r.priority === 'urgent').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    
    return { total, open, urgent, completed };
  };

  const stats = getRequestStats();

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Salesforce Requests</h1>
          <p className="text-sm sm:text-base text-slate-600">Track and manage Salesforce configuration requests</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span>New Request</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Open</p>
              <p className="text-lg sm:text-2xl font-bold text-amber-600">{stats.open}</p>
            </div>
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Urgent</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.urgent}</p>
            </div>
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Done</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm whitespace-nowrap"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="testing">Testing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm whitespace-nowrap"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Request List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <div key={request.id} className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 sm:gap-4 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 break-words">{request.title}</h3>
                    <div className="flex gap-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(request.status)} whitespace-nowrap`}>
                      {request.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(request.priority)} whitespace-nowrap`}>
                      {request.priority}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                      {request.request_type}
                    </span>
                    </div>
                  </div>
                  
                  <p className="text-sm sm:text-base text-slate-600 mb-3 break-words">{request.description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600">
                    <div>
                      <span className="font-medium">By:</span> {request.requested_by}
                    </div>
                    <div>
                      <span className="font-medium">To:</span> {request.assigned_to}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(request.created_date).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Due:</span> {new Date(request.due_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <button className="text-slate-400 hover:text-slate-600 p-1 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}