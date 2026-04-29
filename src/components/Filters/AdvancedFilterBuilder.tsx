import { useState, useEffect } from 'react';
import { Filter, Plus, X, Save, Trash, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface SavedFilter {
  id: string;
  name: string;
  object_type: string;
  conditions: FilterCondition[];
  is_favorite: boolean;
  created_at: string;
}

interface AdvancedFilterBuilderProps {
  objectType: string;
  fields: { value: string; label: string; type: string }[];
  onApplyFilter: (conditions: FilterCondition[]) => void;
  onClose: () => void;
}

const OPERATORS = {
  text: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does Not Contain' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' }
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'greater_or_equal', label: 'Greater or Equal' },
    { value: 'less_or_equal', label: 'Less or Equal' }
  ],
  date: [
    { value: 'equals', label: 'Equals' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_quarter', label: 'This Quarter' }
  ],
  boolean: [
    { value: 'is_true', label: 'Is True' },
    { value: 'is_false', label: 'Is False' }
  ]
};

export default function AdvancedFilterBuilder({
  objectType,
  fields,
  onApplyFilter,
  onClose
}: AdvancedFilterBuilderProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>([
    { id: crypto.randomUUID(), field: '', operator: '', value: '' }
  ]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    loadSavedFilters();
  }, [objectType]);

  const loadSavedFilters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('user_id', user.id)
        .eq('object_type', objectType)
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedFilters(data || []);
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { id: crypto.randomUUID(), field: '', operator: '', value: '' }
    ]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, field: keyof FilterCondition, value: string) => {
    setConditions(conditions.map(c => {
      if (c.id === id) {
        const updated = { ...c, [field]: value };
        if (field === 'field') {
          updated.operator = '';
          updated.value = '';
        }
        return updated;
      }
      return c;
    }));
  };

  const getOperatorsForField = (fieldName: string) => {
    const field = fields.find(f => f.value === fieldName);
    if (!field) return [];
    return OPERATORS[field.type as keyof typeof OPERATORS] || OPERATORS.text;
  };

  const handleApply = () => {
    const validConditions = conditions.filter(c => c.field && c.operator);
    onApplyFilter(validConditions);
  };

  const handleSave = async () => {
    if (!filterName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('saved_filters')
        .insert({
          user_id: user.id,
          name: filterName,
          object_type: objectType,
          conditions: conditions.filter(c => c.field && c.operator),
          is_favorite: false
        });

      if (error) throw error;

      setFilterName('');
      setShowSaveDialog(false);
      loadSavedFilters();
    } catch (error) {
      console.error('Error saving filter:', error);
    }
  };

  const loadSavedFilter = (filter: SavedFilter) => {
    setConditions(filter.conditions);
  };

  const deleteSavedFilter = async (filterId: string) => {
    try {
      const { error } = await supabase
        .from('saved_filters')
        .delete()
        .eq('id', filterId);

      if (error) throw error;
      loadSavedFilters();
    } catch (error) {
      console.error('Error deleting filter:', error);
    }
  };

  const toggleFavorite = async (filterId: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('saved_filters')
        .update({ is_favorite: !isFavorite })
        .eq('id', filterId);

      if (error) throw error;
      loadSavedFilters();
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Advanced Filters</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filter Conditions</h3>
                <button
                  onClick={addCondition}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Condition
                </button>
              </div>

              {conditions.map((condition, index) => (
                <div key={condition.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field
                      </label>
                      <select
                        value={condition.field}
                        onChange={(e) => updateCondition(condition.id, 'field', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select field...</option>
                        {fields.map(field => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Operator
                      </label>
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                        disabled={!condition.field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100"
                      >
                        <option value="">Select operator...</option>
                        {getOperatorsForField(condition.field).map(op => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Value
                      </label>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                        disabled={!condition.operator || ['is_empty', 'is_not_empty', 'is_true', 'is_false'].includes(condition.operator)}
                        placeholder="Enter value..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {conditions.length > 1 && (
                    <button
                      onClick={() => removeCondition(condition.id)}
                      className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Saved Filters</h3>

              {savedFilters.length === 0 ? (
                <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                  <Filter className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No saved filters yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedFilters.map(filter => (
                    <div
                      key={filter.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => loadSavedFilter(filter)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 text-sm">
                              {filter.name}
                            </p>
                            {filter.is_favorite && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {filter.conditions.length} condition{filter.conditions.length !== 1 ? 's' : ''}
                          </p>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleFavorite(filter.id, filter.is_favorite)}
                            className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                          >
                            <Star className={`w-4 h-4 ${filter.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                          </button>
                          <button
                            onClick={() => deleteSavedFilter(filter.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Filter
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {showSaveDialog && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Filter</h3>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Enter filter name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setFilterName('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!filterName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
