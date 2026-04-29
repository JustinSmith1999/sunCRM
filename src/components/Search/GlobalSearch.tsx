import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader, TrendingUp, User, Users, FileText, Wrench, Ticket, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'lead' | 'opportunity' | 'account' | 'contact' | 'ticket' | 'service_ticket' | 'task' | 'report';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon: any;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const debounce = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const searchPattern = `%${searchQuery}%`;
      const allResults: SearchResult[] = [];

      const [leads, opportunities, accounts, contacts, tickets, serviceTickets, tasks, reports] = await Promise.all([
        supabase
          .from('leads')
          .select('id, first_name, last_name, company, email')
          .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},company.ilike.${searchPattern},email.ilike.${searchPattern}`)
          .limit(5),

        supabase
          .from('opportunities')
          .select('id, name, stage, amount')
          .ilike('name', searchPattern)
          .limit(5),

        supabase
          .from('accounts')
          .select('id, name, industry')
          .ilike('name', searchPattern)
          .limit(5),

        supabase
          .from('contacts')
          .select('id, first_name, last_name, email, account_name')
          .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern}`)
          .limit(5),

        supabase
          .from('it_tickets')
          .select('id, ticket_number, subject, status, priority')
          .or(`subject.ilike.${searchPattern},description.ilike.${searchPattern}`)
          .limit(5),

        supabase
          .from('service_tickets')
          .select('id, ticket_number, title, status')
          .ilike('title', searchPattern)
          .limit(5),

        supabase
          .from('tasks')
          .select('id, title, status, due_date')
          .ilike('title', searchPattern)
          .limit(5),

        supabase
          .from('reports')
          .select('id, name, description, object_type')
          .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
          .limit(5)
      ]);

      if (leads.data) {
        leads.data.forEach(lead => {
          allResults.push({
            id: lead.id,
            type: 'lead',
            title: `${lead.first_name} ${lead.last_name}`,
            subtitle: lead.company || lead.email,
            url: `/leads/${lead.id}`,
            icon: User
          });
        });
      }

      if (opportunities.data) {
        opportunities.data.forEach(opp => {
          allResults.push({
            id: opp.id,
            type: 'opportunity',
            title: opp.name,
            subtitle: `${opp.stage} - $${opp.amount?.toLocaleString() || '0'}`,
            url: `/opportunities/${opp.id}`,
            icon: TrendingUp
          });
        });
      }

      if (accounts.data) {
        accounts.data.forEach(account => {
          allResults.push({
            id: account.id,
            type: 'account',
            title: account.name,
            subtitle: account.industry,
            url: `/accounts/${account.id}`,
            icon: Users
          });
        });
      }

      if (contacts.data) {
        contacts.data.forEach(contact => {
          allResults.push({
            id: contact.id,
            type: 'contact',
            title: `${contact.first_name} ${contact.last_name}`,
            subtitle: contact.account_name || contact.email,
            url: `/contacts/${contact.id}`,
            icon: User
          });
        });
      }

      if (tickets.data) {
        tickets.data.forEach(ticket => {
          allResults.push({
            id: ticket.id,
            type: 'ticket',
            title: `#${ticket.ticket_number} - ${ticket.subject}`,
            subtitle: `${ticket.status} - ${ticket.priority} priority`,
            url: `/it-support/tickets/${ticket.id}`,
            icon: Ticket
          });
        });
      }

      if (serviceTickets.data) {
        serviceTickets.data.forEach(ticket => {
          allResults.push({
            id: ticket.id,
            type: 'service_ticket',
            title: `#${ticket.ticket_number} - ${ticket.title}`,
            subtitle: ticket.status,
            url: `/service/tickets/${ticket.id}`,
            icon: Wrench
          });
        });
      }

      if (tasks.data) {
        tasks.data.forEach(task => {
          allResults.push({
            id: task.id,
            type: 'task',
            title: task.title,
            subtitle: `${task.status}${task.due_date ? ` - Due ${new Date(task.due_date).toLocaleDateString()}` : ''}`,
            url: `/tasks/${task.id}`,
            icon: FileText
          });
        });
      }

      if (reports.data) {
        reports.data.forEach(report => {
          allResults.push({
            id: report.id,
            type: 'report',
            title: report.name,
            subtitle: report.description || report.object_type,
            url: `/reports/${report.id}`,
            icon: DollarSign
          });
        });
      }

      setResults(allResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleResultClick(results[selectedIndex]);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      lead: 'Lead',
      opportunity: 'Opportunity',
      account: 'Account',
      contact: 'Contact',
      ticket: 'IT Ticket',
      service_ticket: 'Service Ticket',
      task: 'Task',
      report: 'Report'
    };
    return labels[type] || type;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 transition-colors w-64"
      >
        <Search className="w-4 h-4" />
        <span>Search everything...</span>
        <kbd className="ml-auto px-2 py-1 bg-gray-100 text-xs rounded border border-gray-300">⌘K</kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black bg-opacity-50">
          <div ref={searchRef} className="w-full max-w-2xl bg-white rounded-lg shadow-2xl">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search leads, opportunities, tickets, and more..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-10 py-3 text-lg border-0 focus:ring-0 focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery('');
                      setResults([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p>Searching...</p>
                </div>
              ) : results.length === 0 && query.length >= 2 ? (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No results found for "{query}"</p>
                </div>
              ) : results.length > 0 ? (
                <div className="py-2">
                  {results.map((result, index) => {
                    const Icon = result.icon;
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                          index === selectedIndex ? 'bg-gray-100' : ''
                        }`}
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-gray-900 truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                          )}
                        </div>
                        <span className="flex-shrink-0 px-2 py-1 bg-gray-100 text-xs font-medium text-gray-600 rounded">
                          {getTypeLabel(result.type)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">Type at least 2 characters to search</p>
                  <p className="text-xs mt-2 text-gray-400">Press ⌘K to open search anytime</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
