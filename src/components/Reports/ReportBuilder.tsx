import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, X, ChevronUp, ChevronDown, Settings, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ReportBuilderProps {
  report?: any;
  onSave: () => void;
  onCancel: () => void;
}

const DATA_SOURCES = [
  { value: 'leads', label: 'Leads' },
  { value: 'opportunities', label: 'Opportunities' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'salesforce_contacts', label: 'Contacts' },
  { value: 'salesforce_cases', label: 'Cases' },
  { value: 'activities', label: 'Activities' },
  { value: 'hr_records', label: 'HR Records' },
];

const REPORT_TYPES = [
  { value: 'tabular', label: 'Tabular', description: 'Simple table listing records' },
  { value: 'summary', label: 'Summary', description: 'Grouped with aggregations' },
];

const OPERATORS = [
  { value: '=', label: 'Equals', types: ['text', 'number', 'date', 'boolean'] },
  { value: '!=', label: 'Not Equals', types: ['text', 'number', 'date', 'boolean'] },
  { value: '>', label: 'Greater Than', types: ['number', 'date'] },
  { value: '<', label: 'Less Than', types: ['number', 'date'] },
  { value: '>=', label: 'Greater or Equal', types: ['number', 'date'] },
  { value: '<=', label: 'Less or Equal', types: ['number', 'date'] },
  { value: 'contains', label: 'Contains', types: ['text'] },
  { value: 'starts_with', label: 'Starts With', types: ['text'] },
  { value: 'ends_with', label: 'Ends With', types: ['text'] },
  { value: 'is_null', label: 'Is Empty', types: ['text', 'number', 'date'] },
  { value: 'not_null', label: 'Is Not Empty', types: ['text', 'number', 'date'] },
];

const DATE_PRESETS = [
  { value: 'TODAY', label: 'Today' },
  { value: 'YESTERDAY', label: 'Yesterday' },
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'LAST_WEEK', label: 'Last Week' },
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'LAST_MONTH', label: 'Last Month' },
  { value: 'THIS_QUARTER', label: 'This Quarter' },
  { value: 'THIS_YEAR', label: 'This Year' },
  { value: 'LAST_90_DAYS', label: 'Last 90 Days' },
  { value: 'LAST_365_DAYS', label: 'Last 365 Days' },
];

const AGGREGATION_FUNCTIONS = [
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
];

export function ReportBuilder({ report, onSave, onCancel }: ReportBuilderProps) {
  const [name, setName] = useState(report?.name || '');
  const [description, setDescription] = useState(report?.description || '');
  const [reportType, setReportType] = useState(report?.report_type || 'tabular');
  const [sourceObject, setSourceObject] = useState(report?.source_object || 'leads');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(report?.columns || []);
  const [filters, setFilters] = useState<any[]>(report?.filters || []);
  const [groupBy, setGroupBy] = useState<string[]>(report?.grouping?.groupBy || []);
  const [aggregations, setAggregations] = useState<any[]>(report?.grouping?.aggregations || []);
  const [sortBy, setSortBy] = useState<string>(report?.sort_by || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(report?.sort_direction || 'desc');
  const [rowLimit, setRowLimit] = useState<number>(report?.row_limit || 500);
  const [folder, setFolder] = useState(report?.folder || 'Custom Reports');
  const [saving, setSaving] = useState(false);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    loadAvailableFields();
  }, [sourceObject]);

  const loadAvailableFields = async () => {
    try {
      setLoadingFields(true);
      const { data, error } = await supabase
        .from(sourceObject)
        .select('*')
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const fields = Object.keys(data[0]).sort();
        setAvailableFields(fields);
      } else {
        const { data: schemaData } = await supabase
          .from(sourceObject)
          .select('*')
          .limit(0);
        setAvailableFields([]);
      }
    } catch (error) {
      console.error('Error loading fields:', error);
      setAvailableFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  const handleAddColumn = (column: string) => {
    if (!selectedColumns.includes(column)) {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const handleRemoveColumn = (column: string) => {
    setSelectedColumns(selectedColumns.filter(c => c !== column));
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const newColumns = [...selectedColumns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newColumns.length) return;
    [newColumns[index], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[index]];
    setSelectedColumns(newColumns);
  };

  const handleAddFilter = () => {
    setFilters([...filters, { field: availableFields[0], operator: '=', value: '', logic: 'AND' }]);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleFilterChange = (index: number, key: string, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [key]: value };
    setFilters(newFilters);
  };

  const handleAddGroupBy = (field: string) => {
    if (!groupBy.includes(field)) {
      setGroupBy([...groupBy, field]);
    }
  };

  const handleRemoveGroupBy = (field: string) => {
    setGroupBy(groupBy.filter(f => f !== field));
  };

  const handleAddAggregation = () => {
    setAggregations([...aggregations, { field: availableFields[0], function: 'count', label: '' }]);
  };

  const handleRemoveAggregation = (index: number) => {
    setAggregations(aggregations.filter((_, i) => i !== index));
  };

  const handleAggregationChange = (index: number, key: string, value: any) => {
    const newAggregations = [...aggregations];
    newAggregations[index] = { ...newAggregations[index], [key]: value };
    setAggregations(newAggregations);
  };

  const handleSave = async () => {
    if (!name || !sourceObject || selectedColumns.length === 0) {
      alert('Please fill in all required fields (Name and at least one Column)');
      return;
    }

    try {
      setSaving(true);

      const reportData = {
        name,
        description,
        report_type: reportType,
        entity_type: sourceObject,
        source_object: sourceObject,
        columns: selectedColumns,
        filters: filters.length > 0 ? filters : null,
        grouping: reportType === 'summary' ? {
          groupBy,
          aggregations: aggregations.length > 0 ? aggregations : [{ field: 'id', function: 'count' }]
        } : null,
        sort_by: sortBy || null,
        sort_direction: sortDirection,
        row_limit: rowLimit,
        folder,
        is_public: false,
        is_system: false,
        created_by: user?.id,
        updated_by: user?.id,
      };

      if (report?.id) {
        const { error } = await supabase
          .from('reports')
          .update(reportData)
          .eq('id', report.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reports')
          .insert([reportData]);

        if (error) throw error;
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving report:', error);
      alert(`Failed to save report: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getFieldType = (fieldName: string): string => {
    const lowerField = fieldName.toLowerCase();
    if (lowerField.includes('date') || lowerField.includes('time')) return 'date';
    if (lowerField.includes('amount') || lowerField.includes('count') || lowerField.includes('number')) return 'number';
    if (lowerField.includes('is_') || lowerField.includes('has_')) return 'boolean';
    return 'text';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-100 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {report ? 'Edit Report' : 'New Custom Report'}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">Configure report settings, columns, filters, and grouping</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name || selectedColumns.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Report'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Basic Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Report Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., Q1 Sales Pipeline Report"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Folder
                  </label>
                  <input
                    type="text"
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., Sales Reports"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Describe what this report shows..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Report Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {REPORT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Data Source <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sourceObject}
                    onChange={(e) => {
                      setSourceObject(e.target.value);
                      setSelectedColumns([]);
                      setGroupBy([]);
                      setFilters([]);
                      setSortBy('');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {DATA_SOURCES.map(source => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Columns Selection */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Columns <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Select and order the columns to display in your report
            </p>
            <div className="space-y-3">
              {selectedColumns.length > 0 && (
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto border border-slate-200 rounded p-3">
                  {selectedColumns.map((column, index) => (
                    <div
                      key={column}
                      className="flex items-center justify-between gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded"
                    >
                      <span className="text-sm font-medium text-blue-900">{column}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveColumn(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveColumn(index, 'down')}
                          disabled={index === selectedColumns.length - 1}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveColumn(column)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {loadingFields ? (
                <div className="text-center py-4">
                  <div className="text-sm text-slate-600">Loading available fields...</div>
                </div>
              ) : (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddColumn(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>+ Add a column...</option>
                  {availableFields
                    .filter(f => !selectedColumns.includes(f))
                    .map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                </select>
              )}

              {selectedColumns.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    Please select at least one column to display
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
                <p className="text-sm text-slate-600 mt-1">Narrow down the data shown in your report</p>
              </div>
              <button
                onClick={handleAddFilter}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Filter
              </button>
            </div>
            <div className="space-y-3">
              {filters.map((filter, index) => (
                <div key={index} className="border border-slate-200 rounded p-4 space-y-3">
                  {index > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <select
                        value={filter.logic || 'AND'}
                        onChange={(e) => handleFilterChange(index, 'logic', e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-medium"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-12 gap-2">
                    <select
                      value={filter.field}
                      onChange={(e) => handleFilterChange(index, 'field', e.target.value)}
                      className="col-span-4 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {availableFields.map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                    <select
                      value={filter.operator}
                      onChange={(e) => handleFilterChange(index, 'operator', e.target.value)}
                      className="col-span-3 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {OPERATORS.filter(op =>
                        op.types.includes(getFieldType(filter.field))
                      ).map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                    {!['is_null', 'not_null'].includes(filter.operator) && (
                      <div className="col-span-4">
                        {getFieldType(filter.field) === 'date' ? (
                          <select
                            value={filter.value}
                            onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="">Custom date...</option>
                            {DATE_PRESETS.map(preset => (
                              <option key={preset.value} value={preset.value}>{preset.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={getFieldType(filter.field) === 'number' ? 'number' : 'text'}
                            value={filter.value}
                            onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Value"
                          />
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveFilter(index)}
                      className="col-span-1 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remove filter"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              {filters.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No filters applied. Click "Add Filter" to filter your data.
                </div>
              )}
            </div>
          </div>

          {/* Summary Options */}
          {reportType === 'summary' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Summary Options</h2>

              <div className="space-y-6">
                {/* Group By */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Group By
                  </label>
                  <p className="text-xs text-slate-600 mb-3">
                    Group records by these fields to create summary rows
                  </p>
                  <div className="space-y-2">
                    {groupBy.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {groupBy.map(field => (
                          <div
                            key={field}
                            className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-900 rounded text-sm font-medium"
                          >
                            {field}
                            <button
                              onClick={() => handleRemoveGroupBy(field)}
                              className="hover:text-green-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddGroupBy(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>+ Add a field to group by...</option>
                      {availableFields.filter(f => !groupBy.includes(f)).map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Aggregations */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Aggregations
                      </label>
                      <p className="text-xs text-slate-600 mt-1">
                        Calculate summary values for grouped data
                      </p>
                    </div>
                    <button
                      onClick={handleAddAggregation}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-3">
                    {aggregations.map((agg, index) => (
                      <div key={index} className="flex gap-2 items-start border border-slate-200 rounded p-3">
                        <select
                          value={agg.function}
                          onChange={(e) => handleAggregationChange(index, 'function', e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          {AGGREGATION_FUNCTIONS.map(func => (
                            <option key={func.value} value={func.value}>{func.label}</option>
                          ))}
                        </select>
                        <select
                          value={agg.field}
                          onChange={(e) => handleAggregationChange(index, 'field', e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          {availableFields.map(field => (
                            <option key={field} value={field}>{field}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={agg.label || ''}
                          onChange={(e) => handleAggregationChange(index, 'label', e.target.value)}
                          placeholder="Label (optional)"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <button
                          onClick={() => handleRemoveAggregation(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sorting and Limits */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Sorting & Limits</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">No sorting</option>
                  {availableFields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sort Direction
                </label>
                <select
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={!sortBy}
                >
                  <option value="asc">Ascending (A-Z, 0-9)</option>
                  <option value="desc">Descending (Z-A, 9-0)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Row Limit
                </label>
                <input
                  type="number"
                  value={rowLimit}
                  onChange={(e) => setRowLimit(parseInt(e.target.value) || 500)}
                  min="10"
                  max="10000"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Creator Info */}
          {profile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium">Report will be created by: {profile.full_name || profile.email}</p>
                  <p className="text-blue-700 mt-1">
                    This information will be saved with the report for tracking purposes.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
