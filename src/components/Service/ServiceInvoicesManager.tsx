import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, FileText, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ServiceInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_terms: string;
  created_at: string;
  service_customers: {
    first_name: string;
    last_name: string;
    company_name: string;
    email: string;
  };
  service_tickets: {
    ticket_number: string;
    title: string;
  };
}

interface NewInvoice {
  customer_id: string;
  invoice_date: string;
  payment_terms: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string;
}

export default function ServiceInvoicesManager() {
  const [invoices, setInvoices] = useState<ServiceInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<ServiceInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [newInvoice, setNewInvoice] = useState<NewInvoice>({
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    payment_terms: 'Net 30'
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, filterStatus]);

  const loadInvoices = async () => {
    try {
      setLoading(true);

      const [invoicesResult, customersResult] = await Promise.all([
        supabase
          .from('service_invoices')
          .select(`
            *,
            service_customers(first_name, last_name, company_name, email),
            service_tickets(ticket_number, title)
          `)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('service_customers')
          .select('id, first_name, last_name, company_name')
          .eq('account_status', 'active')
          .order('first_name')
      ]);

      if (invoicesResult.error) throw invoicesResult.error;
      if (customersResult.error) throw customersResult.error;

      setInvoices(invoicesResult.data || []);
      setCustomers(customersResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.invoice_number?.toLowerCase().includes(term) ||
        invoice.service_customers?.first_name?.toLowerCase().includes(term) ||
        invoice.service_customers?.last_name?.toLowerCase().includes(term) ||
        invoice.service_customers?.company_name?.toLowerCase().includes(term)
      );
    }

    setFilteredInvoices(filtered);
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  };

  const createInvoice = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const invoiceDate = new Date(newInvoice.invoice_date);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);

      const invoiceData = {
        invoice_number: generateInvoiceNumber(),
        customer_id: newInvoice.customer_id,
        invoice_date: newInvoice.invoice_date,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'draft',
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0,
        amount_paid: 0,
        balance_due: 0,
        payment_terms: newInvoice.payment_terms,
        created_by: user.id
      };

      const { error } = await supabase
        .from('service_invoices')
        .insert(invoiceData);

      if (error) throw error;

      alert('Invoice created!');
      setShowNewForm(false);
      setNewInvoice({
        customer_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        payment_terms: 'Net 30'
      });
      loadInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) throw error;
      loadInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'viewed': return 'bg-purple-100 text-purple-700';
      case 'paid': return 'bg-green-100 text-green-700';
      case 'partial': return 'bg-yellow-100 text-yellow-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Service Invoices</h1>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial Payment</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Simple New Invoice Form */}
      {showNewForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Invoice</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select
                value={newInvoice.customer_id}
                onChange={(e) => setNewInvoice({ ...newInvoice, customer_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select customer...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name || `${customer.first_name} ${customer.last_name}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={newInvoice.invoice_date}
                onChange={(e) => setNewInvoice({ ...newInvoice, invoice_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <select
                value={newInvoice.payment_terms}
                onChange={(e) => setNewInvoice({ ...newInvoice, payment_terms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="Net 90">Net 90</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex space-x-2">
            <button
              onClick={createInvoice}
              disabled={!newInvoice.customer_id}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-medium"
            >
              Create Invoice
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading invoices...</div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>
                        {invoice.service_customers?.company_name ||
                         `${invoice.service_customers?.first_name} ${invoice.service_customers?.last_name}`}
                      </div>
                      <div className="text-xs text-gray-500">{invoice.service_customers?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {invoice.service_tickets?.ticket_number || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      ${invoice.total_amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600">
                      ${invoice.amount_paid?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      ${invoice.balance_due?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(invoice.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Send
                          </button>
                        )}
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Total Invoices</div>
          <div className="text-2xl font-bold text-gray-900">{invoices.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(0)}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Total Paid</div>
          <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(0)}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Outstanding</div>
          <div className="text-2xl font-bold text-orange-600">${totalOutstanding.toFixed(0)}</div>
        </div>
      </div>
    </div>
  );
}
