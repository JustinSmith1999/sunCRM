import React, { useState, useEffect } from 'react';
import { Settings, ToggleLeft as Toggle, Check, X, Info, Zap, Shield, Users, BarChart3, Wrench, Globe, Bot, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Feature {
  id: string;
  module_key: string;
  module_name: string;
  category: string;
  description: string;
  is_enabled: boolean;
  dependencies: string[];
  version: string;
}

interface OrganizationFeature {
  feature_key: string;
  is_enabled: boolean;
  settings: Record<string, any>;
}

const categoryIcons = {
  'Platform': Settings,
  'Automation': Zap,
  'DevOps': Wrench,
  'Analytics': BarChart3,
  'Sales': Users,
  'CPQ': CreditCard,
  'Service': Shield,
  'Experience': Globe,
  'AI': Bot,
  'Security': Shield,
  'Integration': Globe,
  'Commerce': CreditCard
};

const categoryColors = {
  'Platform': 'bg-blue-100 text-blue-800',
  'Automation': 'bg-sky-100 text-sky-800',
  'DevOps': 'bg-green-100 text-green-800',
  'Analytics': 'bg-amber-100 text-amber-800',
  'Sales': 'bg-orange-100 text-orange-800',
  'CPQ': 'bg-red-100 text-red-800',
  'Service': 'bg-teal-100 text-teal-800',
  'Experience': 'bg-rose-100 text-rose-800',
  'AI': 'bg-pink-100 text-pink-800',
  'Security': 'bg-gray-100 text-gray-800',
  'Integration': 'bg-cyan-100 text-cyan-800',
  'Commerce': 'bg-emerald-100 text-emerald-800'
};

export function FeatureRegistry() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [orgFeatures, setOrgFeatures] = useState<OrganizationFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { profile } = useAuth();

  useEffect(() => {
    loadFeatures();
  }, [profile]);

  const loadFeatures = async () => {
    if (!profile?.organization_id) return;

    try {
      // Load feature registry
      const { data: featuresData, error: featuresError } = await supabase
        .from('feature_registry')
        .select('*')
        .order('category', { ascending: true })
        .order('module_name', { ascending: true });

      if (featuresError) throw featuresError;

      // Load organization feature settings
      const { data: orgFeaturesData, error: orgError } = await supabase
        .from('organization_features')
        .select('*')
        .eq('organization_id', profile.organization_id);

      if (orgError) throw orgError;

      setFeatures(featuresData || []);
      setOrgFeatures(orgFeaturesData || []);
    } catch (error) {
      console.error('Error loading features:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureKey: string, enabled: boolean) => {
    if (!profile?.organization_id) return;

    try {
      const { error } = await supabase
        .from('organization_features')
        .upsert({
          organization_id: profile.organization_id,
          feature_key: featureKey,
          is_enabled: enabled,
          enabled_by: profile.id,
          enabled_at: enabled ? new Date().toISOString() : null
        }, {
          onConflict: 'organization_id,feature_key'
        });

      if (error) throw error;

      // Update local state
      setOrgFeatures(prev => {
        const existing = prev.find(f => f.feature_key === featureKey);
        if (existing) {
          return prev.map(f => 
            f.feature_key === featureKey 
              ? { ...f, is_enabled: enabled }
              : f
          );
        } else {
          return [...prev, { feature_key: featureKey, is_enabled: enabled, settings: {} }];
        }
      });
    } catch (error) {
      console.error('Error toggling feature:', error);
    }
  };

  const isFeatureEnabled = (featureKey: string) => {
    const orgFeature = orgFeatures.find(f => f.feature_key === featureKey);
    return orgFeature?.is_enabled || false;
  };

  const getFeatureDependencies = (feature: Feature) => {
    return feature.dependencies.map(dep => {
      const depFeature = features.find(f => f.module_key === dep);
      return depFeature?.module_name || dep;
    });
  };

  const canToggleFeature = (feature: Feature) => {
    // Check if all dependencies are enabled
    return feature.dependencies.every(dep => isFeatureEnabled(dep));
  };

  const filteredFeatures = features.filter(feature => {
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    const matchesSearch = feature.module_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [...new Set(features.map(f => f.category))].sort();
  const enabledCount = features.filter(f => isFeatureEnabled(f.module_key)).length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-48"></div>
                  <div className="h-3 bg-slate-200 rounded w-64"></div>
                </div>
                <div className="h-6 bg-slate-200 rounded w-12"></div>
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Feature Registry</h2>
        <p className="text-slate-600">
          Manage platform capabilities and modules. {enabledCount} of {features.length} features enabled.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Features</p>
              <p className="text-2xl font-bold text-slate-900">{features.length}</p>
            </div>
            <Settings className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Enabled</p>
              <p className="text-2xl font-bold text-green-600">{enabledCount}</p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Categories</p>
              <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Available</p>
              <p className="text-2xl font-bold text-slate-600">{features.length - enabledCount}</p>
            </div>
            <X className="w-8 h-8 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-amber-100 text-amber-800'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature List */}
      <div className="space-y-4">
        {filteredFeatures.map((feature) => {
          const IconComponent = categoryIcons[feature.category] || Settings;
          const isEnabled = isFeatureEnabled(feature.module_key);
          const canToggle = canToggleFeature(feature);
          const dependencies = getFeatureDependencies(feature);

          return (
            <div key={feature.id} className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {feature.module_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        categoryColors[feature.category] || 'bg-slate-100 text-slate-800'
                      }`}>
                        {feature.category}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-slate-100 text-slate-600">
                        v{feature.version}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 mb-3">{feature.description}</p>
                    
                    {dependencies.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-slate-500 mb-1">Dependencies:</p>
                        <div className="flex flex-wrap gap-1">
                          {dependencies.map((dep, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {dep}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-sm text-slate-500">
                      <span className="font-medium">Module Key:</span> {feature.module_key}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {!canToggle && !isEnabled && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Info className="w-4 h-4" />
                      <span className="text-sm">Dependencies required</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      isEnabled ? 'text-green-600' : 'text-slate-500'
                    }`}>
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => toggleFeature(feature.module_key, !isEnabled)}
                      disabled={!canToggle && !isEnabled}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isEnabled
                          ? 'bg-green-600'
                          : canToggle
                          ? 'bg-slate-200 hover:bg-slate-300'
                          : 'bg-slate-100 cursor-not-allowed'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {filteredFeatures.length === 0 && (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No features found</h3>
            <p className="text-slate-600">
              {searchTerm ? 'No features match your search criteria.' : 'No features available in this category.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}