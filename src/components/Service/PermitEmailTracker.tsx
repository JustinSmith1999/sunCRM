import React, { useState, useEffect } from 'react';
import { Mail, Clock, User, Paperclip, Search, Filter, RefreshCw, ExternalLink, ArrowUpRight, ArrowDownLeft, Eye, MailOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OutlookEmail {
  id: string;
  outlook_message_id: string;
  conversation_id: string;
  subject: string;
  body_preview: string;
  body_content: string;
  from_email: string;
  from_name: string;
  to_recipients: any[];
  sent_datetime: string;
  received_datetime: string;
  is_read: boolean;
  has_attachments: boolean;
  direction: 'inbound' | 'outbound';
  related_permit_reference: string;
  outlook_email_attachments: Array<{
    id: string;
    name: string;
    content_type: string;
    size: number;
  }>;
}

interface PermitEmailTrackerProps {
  permitReference?: string;
  townName?: string;
}

export default function PermitEmailTracker({ permitReference, townName }: PermitEmailTrackerProps) {
  const [emails, setEmails] = useState<OutlookEmail[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<OutlookEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<OutlookEmail | null>(null);
  const [filterDirection, setFilterDirection] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');

  useEffect(() => {
    loadEmails();
  }, [permitReference]);

  useEffect(() => {
    filterEmails();
  }, [emails, searchTerm, filterDirection, filterRead]);

  async function loadEmails() {
    try {
      setLoading(true);
      let query = supabase
        .from('outlook_emails')
        .select(`
          *,
          outlook_email_attachments (
            id,
            name,
            content_type,
            size
          )
        `)
        .order('received_datetime', { ascending: false });

      if (permitReference) {
        query = query.eq('related_permit_reference', permitReference);
      } else if (townName) {
        query = query.ilike('subject', `%${townName}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmails(data || []);
    } catch (error: any) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterEmails() {
    let filtered = [...emails];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(email =>
        email.subject.toLowerCase().includes(term) ||
        email.from_email.toLowerCase().includes(term) ||
        email.from_name?.toLowerCase().includes(term) ||
        email.body_preview?.toLowerCase().includes(term)
      );
    }

    if (filterDirection !== 'all') {
      filtered = filtered.filter(email => email.direction === filterDirection);
    }

    if (filterRead === 'read') {
      filtered = filtered.filter(email => email.is_read);
    } else if (filterRead === 'unread') {
      filtered = filtered.filter(email => !email.is_read);
    }

    setFilteredEmails(filtered);
  }

  async function syncEmails() {
    setSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outlook-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ syncType: 'manual' }),
        }
      );

      if (!response.ok) throw new Error('Sync failed');
      await loadEmails();
    } catch (error: any) {
      console.error('Error syncing emails:', error);
      alert('Failed to sync emails. Please try again.');
    } finally {
      setSyncing(false);
    }
  }

  async function markAsRead(emailId: string) {
    try {
      const { error } = await supabase
        .from('outlook_emails')
        .update({ is_read: true })
        .eq('id', emailId);

      if (error) throw error;
      await loadEmails();
    } catch (error: any) {
      console.error('Error marking email as read:', error);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-slate-900">Email Correspondence</h3>
            <span className="text-sm text-slate-500">({filteredEmails.length})</span>
          </div>
          <button
            onClick={syncEmails}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync Emails
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search emails by subject, sender, or content..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={filterDirection}
            onChange={(e) => setFilterDirection(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="all">All Directions</option>
            <option value="inbound">Received</option>
            <option value="outbound">Sent</option>
          </select>

          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No emails found</p>
            {permitReference && (
              <p className="text-sm mt-2">
                Link emails to this permit by including the permit reference in the subject line
              </p>
            )}
          </div>
        ) : (
          filteredEmails.map((email) => (
            <div
              key={email.id}
              className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                !email.is_read ? 'bg-amber-50' : ''
              }`}
              onClick={() => {
                setSelectedEmail(email);
                if (!email.is_read) markAsRead(email.id);
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  email.direction === 'inbound' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {email.direction === 'inbound' ? (
                    <ArrowDownLeft className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium text-slate-900 truncate ${
                          !email.is_read ? 'font-semibold' : ''
                        }`}>
                          {email.subject}
                        </h4>
                        {!email.is_read && (
                          <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="w-3 h-3" />
                        <span className="truncate">
                          {email.from_name || email.from_email}
                        </span>
                        {email.from_name && (
                          <span className="text-slate-400 truncate">
                            {email.from_email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDate(email.received_datetime)}
                    </div>
                  </div>

                  {email.body_preview && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                      {email.body_preview}
                    </p>
                  )}

                  {email.has_attachments && email.outlook_email_attachments.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Paperclip className="w-3 h-3" />
                      <span>
                        {email.outlook_email_attachments.length} attachment
                        {email.outlook_email_attachments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {selectedEmail.subject}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{selectedEmail.from_name || selectedEmail.from_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(selectedEmail.received_datetime).toLocaleString()}</span>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                      selectedEmail.direction === 'inbound' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {selectedEmail.direction === 'inbound' ? (
                        <>
                          <ArrowDownLeft className="w-3 h-3" />
                          <span className="text-xs">Received</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3 h-3" />
                          <span className="text-xs">Sent</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>

              {selectedEmail.to_recipients && selectedEmail.to_recipients.length > 0 && (
                <div className="text-sm text-slate-600 mb-2">
                  <span className="font-medium">To:</span>{' '}
                  {selectedEmail.to_recipients.map((r: any) => r.emailAddress?.address || r).join(', ')}
                </div>
              )}
            </div>

            <div className="p-6">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: selectedEmail.body_content || selectedEmail.body_preview || 'No content'
                }}
              />

              {selectedEmail.has_attachments && selectedEmail.outlook_email_attachments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments ({selectedEmail.outlook_email_attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedEmail.outlook_email_attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Paperclip className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="font-medium text-slate-900">{attachment.name}</div>
                            <div className="text-sm text-slate-500">
                              {attachment.content_type} • {formatFileSize(attachment.size)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
