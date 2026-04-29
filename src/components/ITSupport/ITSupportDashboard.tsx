import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Send,
  X,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ITTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  created_by_email: string;
  created_by_name: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  last_response_at: string | null;
  synced_to_atera: boolean;
  atera_sync_status: string;
  last_atera_sync: string | null;
  comments?: TicketComment[];
  atera_mapping?: {
    atera_ticket_number: string;
    atera_ticket_id: string;
  };
}

interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export default function ITSupportDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<ITTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<ITTicket | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const isITStaff = user?.email === 'tech@sunation.com';

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('it_support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketComments = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('it_ticket_comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(comment => ({
        ...comment,
        user_name: comment.user_name || 'Unknown User'
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.created_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.created_by_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((ticket) => ticket.priority === priorityFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((ticket) => ticket.category === categoryFilter);
    }

    setFilteredTickets(filtered);
  };

  const handleUpdateTicket = async (ticketId: string, updates: Partial<ITTicket>) => {
    try {
      const { error } = await supabase
        .from('it_support_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;

      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, ...updates });
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleAddComment = async (ticketId: string) => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('it_ticket_comments')
        .insert({
          ticket_id: ticketId,
          user_id: user?.id,
          comment: newComment,
          is_internal: isInternalComment
        });

      if (error) throw error;

      setNewComment('');
      setIsInternalComment(false);

      // Refresh comments
      if (selectedTicket) {
        const comments = await fetchTicketComments(ticketId);
        setSelectedTicket({ ...selectedTicket, comments });
      }

      // Update last_response_at
      await handleUpdateTicket(ticketId, { last_response_at: new Date().toISOString() });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleViewTicket = async (ticket: ITTicket) => {
    const comments = await fetchTicketComments(ticket.id);

    // Fetch Atera mapping if exists
    const { data: mapping } = await supabase
      .from('atera_ticket_mappings')
      .select('atera_ticket_number, atera_ticket_id')
      .eq('it_ticket_id', ticket.id)
      .single();

    setSelectedTicket({ ...ticket, comments, atera_mapping: mapping || undefined });
    setExpandedTicket(ticket.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-50';
      case 'in_progress': return 'text-sky-600 bg-sky-50';
      case 'waiting_on_user': return 'text-yellow-600 bg-yellow-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'closed': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tickets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IT Support Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage all IT support tickets</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Ticket className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.open}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.in_progress}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.resolved}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_on_user">Waiting on User</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="hardware">Hardware</option>
            <option value="software">Software</option>
            <option value="network">Network</option>
            <option value="access">Access</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <React.Fragment key={ticket.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Ticket className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-sm text-gray-900">{ticket.ticket_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{ticket.subject}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{ticket.created_by_name}</div>
                      <div className="text-xs text-gray-500">{ticket.created_by_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                        {ticket.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleUpdateTicket(ticket.id, { status: e.target.value })}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 ${getStatusColor(ticket.status)}`}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="waiting_on_user">Waiting on User</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewTicket(ticket)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {expandedTicket === ticket.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Ticket Details */}
                  {expandedTicket === ticket.id && selectedTicket && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          {/* Description */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                          </div>

                          {/* Comments */}
                          {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Comments</h4>
                              <div className="space-y-2">
                                {selectedTicket.comments.map((comment) => (
                                  <div
                                    key={comment.id}
                                    className={`p-3 rounded-lg ${
                                      comment.is_internal
                                        ? 'bg-amber-50 border border-amber-200'
                                        : 'bg-white border border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium text-gray-900">
                                        {comment.user_name}
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        {comment.is_internal && (
                                          <span className="text-xs font-medium text-amber-600">Internal</span>
                                        )}
                                        <span className="text-xs text-gray-500">
                                          {new Date(comment.created_at).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.comment}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Add Comment */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Add Comment</h4>
                            <div className="space-y-2">
                              <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Type your comment..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={isInternalComment}
                                    onChange={(e) => setIsInternalComment(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">Internal Note (IT only)</span>
                                </label>
                                <button
                                  onClick={() => handleAddComment(ticket.id)}
                                  disabled={!newComment.trim()}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                  <Send className="w-4 h-4" />
                                  <span>Send</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Atera Sync Status */}
                          {isITStaff && selectedTicket && selectedTicket.atera_mapping && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">Atera Integration</h4>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Atera Ticket:</span> #{selectedTicket.atera_mapping.atera_ticket_number}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Synced: {selectedTicket.last_atera_sync ? new Date(selectedTicket.last_atera_sync).toLocaleString() : 'Never'}
                                  </p>
                                </div>
                                <a
                                  href={`https://app.atera.com/tickets/${selectedTicket.atera_mapping.atera_ticket_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                >
                                  <span className="text-sm">Open in Atera</span>
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Resolution Notes */}
                          {isITStaff && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Resolution Notes</h4>
                              <textarea
                                value={ticket.resolution_notes || ''}
                                onChange={(e) => handleUpdateTicket(ticket.id, { resolution_notes: e.target.value })}
                                placeholder="Add resolution notes..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tickets found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
