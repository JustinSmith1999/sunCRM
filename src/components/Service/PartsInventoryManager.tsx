import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertCircle, TrendingDown, DollarSign, Box } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ServicePart {
  id: string;
  part_number: string;
  part_name: string;
  description: string;
  category: string;
  manufacturer: string;
  supplier: string;
  quantity_on_hand: number;
  reorder_level: number;
  reorder_quantity: number;
  unit_cost: number;
  unit_price: number;
  location: string;
  status: string;
  created_at: string;
}

interface NewPart {
  part_name: string;
  category: string;
  quantity_on_hand: string;
  unit_cost: string;
}

export default function PartsInventoryManager() {
  const [parts, setParts] = useState<ServicePart[]>([]);
  const [filteredParts, setFilteredParts] = useState<ServicePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);

  const [newPart, setNewPart] = useState<NewPart>({
    part_name: '',
    category: '',
    quantity_on_hand: '0',
    unit_cost: ''
  });

  const categories = [
    'Solar Panels',
    'Inverters',
    'Batteries',
    'Mounting Hardware',
    'Electrical Components',
    'Wiring & Cables',
    'Tools',
    'Safety Equipment',
    'Other'
  ];

  useEffect(() => {
    loadParts();
  }, []);

  useEffect(() => {
    filterParts();
  }, [parts, searchTerm, filterCategory, filterStatus, showLowStock]);

  const loadParts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_parts')
        .select('*')
        .order('part_name', { ascending: true });

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error('Error loading parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterParts = () => {
    let filtered = parts;

    if (filterCategory !== 'all') {
      filtered = filtered.filter(part => part.category === filterCategory);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(part => part.status === filterStatus);
    }

    if (showLowStock) {
      filtered = filtered.filter(part => part.quantity_on_hand <= part.reorder_level);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(part =>
        part.part_number?.toLowerCase().includes(term) ||
        part.part_name?.toLowerCase().includes(term) ||
        part.manufacturer?.toLowerCase().includes(term)
      );
    }

    setFilteredParts(filtered);
  };

  const createPart = async () => {
    try {
      const date = new Date();
      const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      const part_number = `PART-${random}`;

      const partData = {
        part_number: part_number,
        part_name: newPart.part_name,
        category: newPart.category,
        quantity_on_hand: parseInt(newPart.quantity_on_hand) || 0,
        reorder_level: 10,
        reorder_quantity: 25,
        unit_cost: parseFloat(newPart.unit_cost) || null,
        unit_price: parseFloat(newPart.unit_cost) * 1.5 || null,
        status: 'active'
      };

      const { error } = await supabase
        .from('service_parts')
        .insert(partData);

      if (error) throw error;

      alert('Part added!');
      setShowNewForm(false);
      setNewPart({
        part_name: '',
        category: '',
        quantity_on_hand: '0',
        unit_cost: ''
      });
      loadParts();
    } catch (error) {
      console.error('Error creating part:', error);
      alert('Failed to add part');
    }
  };

  const updateQuantity = async (partId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('service_parts')
        .update({ quantity_on_hand: newQuantity })
        .eq('id', partId);

      if (error) throw error;
      loadParts();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const getStockStatusColor = (part: ServicePart) => {
    if (part.quantity_on_hand === 0) return 'bg-red-100 text-red-700 border-red-200';
    if (part.quantity_on_hand <= part.reorder_level) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getStockStatusLabel = (part: ServicePart) => {
    if (part.quantity_on_hand === 0) return 'Out of Stock';
    if (part.quantity_on_hand <= part.reorder_level) return 'Low Stock';
    return 'In Stock';
  };

  const lowStockCount = parts.filter(p => p.quantity_on_hand <= p.reorder_level && p.quantity_on_hand > 0).length;
  const outOfStockCount = parts.filter(p => p.quantity_on_hand === 0).length;
  const totalValue = parts.reduce((sum, p) => sum + (p.quantity_on_hand * (p.unit_cost || 0)), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Parts Inventory</h1>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Part</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900">Inventory Alerts</h3>
              <p className="text-sm text-orange-700">
                {outOfStockCount > 0 && `${outOfStockCount} parts out of stock. `}
                {lowStockCount > 0 && `${lowStockCount} parts below reorder level.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="discontinued">Discontinued</option>
          </select>
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`px-4 py-2 rounded-lg border ${
              showLowStock
                ? 'bg-orange-100 border-orange-300 text-orange-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <TrendingDown className="h-4 w-4 inline mr-2" />
            Low Stock Only
          </button>
        </div>
      </div>

      {/* Simple New Part Form */}
      {showNewForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Part</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Name *</label>
              <input
                type="text"
                value={newPart.part_name}
                onChange={(e) => setNewPart({ ...newPart, part_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Solar Panel 400W"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={newPart.category}
                onChange={(e) => setNewPart({ ...newPart, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={newPart.quantity_on_hand}
                  onChange={(e) => setNewPart({ ...newPart, quantity_on_hand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPart.unit_cost}
                  onChange={(e) => setNewPart({ ...newPart, unit_cost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex space-x-2">
            <button
              onClick={createPart}
              disabled={!newPart.part_name || !newPart.category}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-medium"
            >
              Add Part
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

      {/* Parts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading parts...</div>
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No parts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredParts.map(part => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{part.part_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{part.part_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{part.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{part.manufacturer}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(part)}`}>
                        {part.quantity_on_hand}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{part.reorder_level}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {part.unit_cost ? `$${part.unit_cost.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {part.unit_price ? `$${part.unit_price.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStockStatusColor(part)}`}>
                        {getStockStatusLabel(part)}
                      </span>
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
          <div className="text-sm text-gray-500 mb-1">Total Parts</div>
          <div className="text-2xl font-bold text-gray-900">{parts.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Low Stock</div>
          <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Out of Stock</div>
          <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Total Value</div>
          <div className="text-2xl font-bold text-gray-900">${totalValue.toFixed(0)}</div>
        </div>
      </div>
    </div>
  );
}
