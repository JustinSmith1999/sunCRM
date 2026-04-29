import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Upload, Download, Search, Filter, AlertCircle, CheckCircle, XCircle, Clock, CreditCard as Edit2, Save, X, FileSpreadsheet, History, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import BarcodeScannerModal from './BarcodeScannerModal';

interface InventoryItem {
  id: string;
  product_code: string;
  product_name: string;
  category: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  unit_cost: number;
  total_value: number;
  location: string;
  bin_location: string;
  reorder_point: number;
  reorder_quantity: number;
  supplier_name: string;
  supplier_sku: string;
  last_received_date: string | null;
  last_ordered_date: string | null;
  notes: string | null;
  excel_source_file: string | null;
  excel_row_number: number | null;
  synced_at: string;
  updated_at: string;
}

interface SyncHistory {
  id: string;
  sync_started_at: string;
  sync_completed_at: string | null;
  status: string;
  file_name: string;
  records_processed: number;
  records_added: number;
  records_updated: number;
  records_skipped: number;
  error_message: string | null;
}

export default function WarehouseInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showSyncHistory, setShowSyncHistory] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InventoryItem>>({});
  const [showScanner, setShowScanner] = useState(false);

  const categories = ['all', ...new Set(inventory.map(item => item.category).filter(Boolean))];
  const locations = ['all', ...new Set(inventory.map(item => item.location).filter(Boolean))];

  useEffect(() => {
    loadInventory();
    loadSyncHistory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, categoryFilter, locationFilter, showLowStock]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('warehouse_inventory')
        .select('*')
        .order('product_name');

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouse_sync_history')
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSyncHistory(data || []);
    } catch (error) {
      console.error('Error loading sync history:', error);
    }
  };

  const filterInventory = () => {
    let filtered = [...inventory];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.product_name?.toLowerCase().includes(search) ||
        item.product_code?.toLowerCase().includes(search) ||
        item.supplier_sku?.toLowerCase().includes(search)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter(item => item.location === locationFilter);
    }

    if (showLowStock) {
      filtered = filtered.filter(item => item.quantity_available <= item.reorder_point);
    }

    setFilteredInventory(filtered);
  };

  const triggerSync = async () => {
    try {
      setSyncing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to sync warehouse data');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/warehouse-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        alert(`Sync completed successfully!\n\nRecords Processed: ${result.recordsProcessed}\nAdded: ${result.recordsAdded}\nUpdated: ${result.recordsUpdated}\nSkipped: ${result.recordsSkipped}`);
        await loadInventory();
        await loadSyncHistory();
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('Failed to trigger sync. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    try {
      const { error } = await supabase
        .from('warehouse_inventory')
        .update({
          notes: editForm.notes,
          reorder_point: editForm.reorder_point,
          reorder_quantity: editForm.reorder_quantity,
        })
        .eq('id', editingId);

      if (error) throw error;

      await loadInventory();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert('Failed to update inventory item');
    }
  };

  const exportToCSV = () => {
    const headers = ['Product Code', 'Product Name', 'Category', 'On Hand', 'Reserved', 'Available', 'Unit Cost', 'Total Value', 'Location', 'Bin', 'Reorder Point', 'Supplier', 'Last Synced'];
    const rows = filteredInventory.map(item => [
      item.product_code,
      item.product_name,
      item.category,
      item.quantity_on_hand,
      item.quantity_reserved,
      item.quantity_available,
      item.unit_cost.toFixed(2),
      item.total_value.toFixed(2),
      item.location,
      item.bin_location,
      item.reorder_point,
      item.supplier_name,
      new Date(item.synced_at).toLocaleDateString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warehouse-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalValue = filteredInventory.reduce((sum, item) => sum + item.total_value, 0);
  const totalItems = filteredInventory.reduce((sum, item) => sum + item.quantity_on_hand, 0);
  const lowStockCount = inventory.filter(item => item.quantity_available <= item.reorder_point).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Warehouse Inventory</h1>
              <p className="text-sm text-gray-500 mt-1">Manage and track inventory synced from Excel</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowScanner(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 font-medium"
            >
              <Camera className="h-5 w-5" />
              <span>Scan Barcode</span>
            </button>
            <button
              onClick={() => setShowSyncHistory(!showSyncHistory)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <History className="h-5 w-5" />
              <span>Sync History</span>
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  <span>Sync from Excel</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Total Items</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalItems.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">{filteredInventory.length} SKUs</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Total Value</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Low Stock</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{lowStockCount}</div>
            <div className="text-xs text-gray-500 mt-1">Need reorder</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Last Sync</span>
            </div>
            <div className="text-sm text-gray-900">
              {syncHistory[0] ? new Date(syncHistory[0].sync_started_at).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {showSyncHistory && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {syncHistory.map((sync) => (
                  <tr key={sync.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {sync.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : sync.status === 'failed' ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-600" />
                        )}
                        <span className="text-sm capitalize">{sync.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(sync.sync_started_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{sync.records_processed}</td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">{sync.records_added}</td>
                    <td className="px-4 py-3 text-sm text-blue-600 font-medium">{sync.records_updated}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{sync.file_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Excel File Sync</h3>
            <p className="text-sm text-blue-700 mt-1">
              Inventory data syncs from <strong>/Shared/Warehouse/Warehouse Pull Spreadsheet V28.xlsm</strong> on Egnyte.
              The Excel file is the master source. Click "Sync from Excel\" to pull the latest data.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name, code, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc === 'all' ? 'All Locations' : loc}</option>
            ))}
          </select>
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              showLowStock
                ? 'bg-orange-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-5 w-5" />
            <span>Low Stock</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading inventory...</div>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No inventory items found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or sync from Excel</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">On Hand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reserved</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Point</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map((item) => {
                  const isLowStock = item.quantity_available <= item.reorder_point;
                  const isEditing = editingId === item.id;

                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-orange-50' : ''}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.product_code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.product_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.quantity_on_hand}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.quantity_reserved}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.quantity_available}
                        {isLowStock && <AlertCircle className="inline h-4 w-4 text-orange-600 ml-1" />}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">${item.unit_cost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">${item.total_value.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.location}
                        {item.bin_location && <div className="text-xs text-gray-500">Bin: {item.bin_location}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.reorder_point || 0}
                            onChange={(e) => setEditForm({ ...editForm, reorder_point: parseInt(e.target.value) })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          item.reorder_point
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {isEditing ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={saveEdit}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showScanner && (
        <BarcodeScannerModal
          onClose={() => setShowScanner(false)}
          onSuccess={() => {
            setShowScanner(false);
            loadInventory();
          }}
        />
      )}
    </div>
  );
}
