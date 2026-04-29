import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Phone, Mail, MapPin, Star, Calendar, Wrench, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ServiceCustomer {
  id: string;
  customer_type: string;
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile_phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  tags: string[];
  rating: number;
  account_status: string;
  created_at: string;
}

interface NewCustomer {
  customer_type: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
}

export default function ServiceCustomersManager() {
  const [customers, setCustomers] = useState<ServiceCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<ServiceCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<ServiceCustomer | null>(null);

  const [newCustomer, setNewCustomer] = useState<NewCustomer>({
    customer_type: 'residential',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = customers.filter(customer =>
      customer.first_name?.toLowerCase().includes(term) ||
      customer.last_name?.toLowerCase().includes(term) ||
      customer.company_name?.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.phone?.includes(term)
    );
    setFilteredCustomers(filtered);
  };

  const createCustomer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('service_customers')
        .insert({
          ...newCustomer,
          created_by: user.id
        });

      if (error) throw error;

      alert('Customer created!');
      setShowNewForm(false);
      setNewCustomer({
        customer_type: 'residential',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        address: ''
      });
      loadCustomers();
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer');
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Service Customers</h1>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Simple New Customer Form */}
      {showNewForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Customer</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={newCustomer.first_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={newCustomer.last_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="customer@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="123 Main St, City, State 12345"
              />
            </div>
          </div>
          <div className="mt-6 flex space-x-2">
            <button
              onClick={createCustomer}
              disabled={!newCustomer.first_name || !newCustomer.last_name}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-medium"
            >
              Create Customer
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

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex justify-center items-center h-64">
            <div className="text-gray-500">Loading customers...</div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No customers found</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div
              key={customer.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCustomer(customer)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {customer.first_name} {customer.last_name}
                  </h3>
                  {customer.company_name && (
                    <p className="text-sm text-gray-500">{customer.company_name}</p>
                  )}
                  <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                    customer.customer_type === 'commercial'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {customer.customer_type}
                  </span>
                </div>
                {customer.rating && (
                  <div className="flex space-x-0.5">
                    {getRatingStars(customer.rating)}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {customer.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">
                      {customer.address}, {customer.city}, {customer.state}
                    </span>
                  </div>
                )}
                {customer.property_type && (
                  <div className="flex items-center space-x-2">
                    <Wrench className="h-4 w-4" />
                    <span className="capitalize">{customer.property_type.replace('_', ' ')}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                <span>
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {new Date(customer.created_at).toLocaleDateString()}
                </span>
                <span className={`px-2 py-1 rounded-full ${
                  customer.account_status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {customer.account_status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Total Customers</div>
          <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {customers.filter(c => c.account_status === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Residential</div>
          <div className="text-2xl font-bold text-blue-600">
            {customers.filter(c => c.customer_type === 'residential').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Commercial</div>
          <div className="text-2xl font-bold text-purple-600">
            {customers.filter(c => c.customer_type === 'commercial').length}
          </div>
        </div>
      </div>
    </div>
  );
}
