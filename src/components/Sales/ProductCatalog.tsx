import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Package, DollarSign, Tag, Archive } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  category: string | null;
  unit_price: number | null;
  cost: number | null;
  is_active: boolean;
  specifications: Record<string, any>;
  created_at: string;
}

export function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    loadProducts();
  }, [profile]);

  const loadProducts = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesActive = showInactive || product.is_active;
    
    return matchesSearch && matchesCategory && matchesActive;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getProductStats = () => {
    const total = products.length;
    const active = products.filter(p => p.is_active).length;
    const avgPrice = products.filter(p => p.unit_price).reduce((sum, p) => sum + (p.unit_price || 0), 0) / products.filter(p => p.unit_price).length;
    
    return { total, active, avgPrice };
  };

  const stats = getProductStats();

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
          <h1 className="text-2xl font-bold text-slate-900">Product Catalog</h1>
          <p className="text-slate-600">Manage your product inventory and pricing</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            New Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Products</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Products</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Package className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Categories</p>
              <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
            </div>
            <Tag className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Avg Price</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(stats.avgPrice || 0)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              Show Inactive
            </label>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                    {product.code && (
                      <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded font-mono">
                        {product.code}
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      product.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {product.description && (
                    <p className="text-slate-600 mb-3">{product.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-600">
                    <div>
                      <span className="font-medium">Category:</span> {product.category || 'Uncategorized'}
                    </div>
                    <div>
                      <span className="font-medium">List Price:</span> {formatCurrency(product.unit_price)}
                    </div>
                    <div>
                      <span className="font-medium">Cost:</span> {formatCurrency(product.cost)}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-slate-700">Specifications:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Object.entries(product.specifications).slice(0, 3).map(([key, value]) => (
                          <span key={key} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {key}: {String(value)}
                          </span>
                        ))}
                        {Object.keys(product.specifications).length > 3 && (
                          <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">
                            +{Object.keys(product.specifications).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Package className="w-10 h-10 text-slate-400" />
            </div>
            {products.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Product Data Available</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  No product data has been imported yet. Product data can be imported from Salesforce.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-600">No products match your search criteria.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}