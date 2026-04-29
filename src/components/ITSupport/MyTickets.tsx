import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Paperclip
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ITTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_response_at: string | null;
  comments?: TicketComment[];
}

interface TicketComment {
  id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
  user_name?: string;
}

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ITTicket | null>(null);
  const [newComment, setNewComment] = useState('');

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'other',
    priority: 'medium'
  });

  useEffect(() => {
    fetchMyTickets();
  }, [user]);

  const fetchMyTickets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('it_support_tickets')
        .select('*')
        .eq('user_id', user.id)
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
        .eq('is_internal', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(comment => ({
        ...comment,
        user_name: comment.user_name || 'Support'
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data: newTicketData, error } = await supabase
        .from('it_support_tickets')
        .insert({
          user_id: user.id,
          created_by_email: user.email,
          subject: newTicket.subject,
          description: newTicket.description,
          category: newTicket.category,
          priority: newTicket.priority,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      // Automatically sync to Atera in background
      if (newTicketData) {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/atera-sync-worker`;
        const token = (await supabase.auth.getSession()).data.session?.access_token;

        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ticketId: newTicketData.id }),
        }).catch(err => console.error('Background sync to Atera failed:', err));
      }

      setNewTicket({
        subject: '',
        description: '',
        category: 'other',
        priority: 'medium'
      });
      setShowNewTicketModal(false);
      fetchMyTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const handleViewTicket = async (ticket: ITTicket) => {
    const comments = await fetchTicketComments(ticket.id);
    setSelectedTicket({ ...ticket, comments });
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;

    try {
      const { error } = await supabase
        .from('it_ticket_comments')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user?.id,
          comment: newComment,
          is_internal: false
        });

      if (error) throw error;

      setNewComment('');

      // Refresh comments
      const comments = await fetchTicketComments(selectedTicket.id);
      setSelectedTicket({ ...selectedTicket, comments });

      // Update ticket list
      fetchMyTickets();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in_progress': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'waiting_on_user': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-5 h-5" />;
      case 'in_progress': return <Clock className="w-5 h-5" />;
      case 'resolved': return <CheckCircle2 className="w-5 h-5" />;
      case 'closed': return <CheckCircle2 className="w-5 h-5" />;
      default: return <Ticket className="w-5 h-5" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading your tickets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My IT Support Tickets</h1>
          <p className="text-gray-600 mt-1">Track your IT support requests</p>
        </div>
        <button
          onClick={() => setShowNewTicketModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{tickets.length}</p>
            </div>
            <Ticket className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {tickets.filter(t => t.status === 'open').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {tickets.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 gap-4">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {ticket.ticket_number}
                    </span>
                    <span className={`inline-flex items-center space-x-1 text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      <span>{formatStatus(ticket.status)}</span>
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{ticket.subject}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center">
                    <Ticket className="w-4 h-4 mr-1" />
                    {ticket.category}
                  </span>
                  <span>
                    Created {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => handleViewTicket(ticket)}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {tickets.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets yet</h3>
            <p className="text-gray-600 mb-4">Need IT support? Create your first ticket</p>
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Ticket</span>
            </button>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create New IT Support Ticket</h2>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  required
                  placeholder="Brief description of the issue"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  required
                  rows={5}
                  placeholder="Detailed description of the issue, including any error messages or steps to reproduce"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="hardware">Hardware</option>
                    <option value="software">Software</option>
                    <option value="network">Network</option>
                    <option value="access">Access/Permissions</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedTicket.ticket_number}</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedTicket.subject}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Priority */}
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center space-x-1 text-sm font-medium px-3 py-1.5 rounded-full border ${getStatusColor(selectedTicket.status)}`}>
                  {getStatusIcon(selectedTicket.status)}
                  <span>{formatStatus(selectedTicket.status)}</span>
                </span>
                <span className={`text-sm font-medium px-3 py-1.5 rounded-full border ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority.toUpperCase()} PRIORITY
                </span>
                <span className="text-sm text-gray-600">
                  {selectedTicket.category}
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Comments */}
              {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Comments</h3>
                  <div className="space-y-3">
                    {selectedTicket.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {comment.user_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Comment */}
              {selectedTicket.status !== 'closed' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Add Comment</h3>
                  <div className="space-y-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Type your message..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(selectedTicket.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
