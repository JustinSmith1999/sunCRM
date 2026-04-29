import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, RefreshCw, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { executeReportById } from '../../lib/reportQueryEngine';

interface ReportViewerProps {
  report: {
    id: string;
    name: string;
    description: string | null;
    report_type: string;
    source_object: string;
    columns: any[] | string[] | any;
    filters: any;
    grouping: any;
  };
  onBack: () => void;
}

export function ReportViewer({ report, onBack }: ReportViewerProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runReport();
  }, [report.id]);

  const runReport = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Running report:', report.name, 'ID:', report.id);
      console.log('Report config:', {
        source_object: report.source_object,
        columns: report.columns,
        filters: report.filters
      });

      const result = await executeReportById(report.id);

      console.log('Report result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to execute report');
      }

      setData(result.data || []);
    } catch (err: any) {
      console.error('Error running report:', err);
      setError(err.message || 'Failed to run report');
    } finally {
      setLoading(false);
    }
  };

  const processGroupedData = (rows: any[], grouping: any) => {
    const groups = new Map<string, any>();

    rows.forEach(row => {
      const key = grouping.groupBy.map((field: string) => row[field] || 'Unknown').join('|');

      if (!groups.has(key)) {
        const groupData: any = {};
        grouping.groupBy.forEach((field: string) => {
          groupData[field] = row[field] || 'Unknown';
        });
        groups.set(key, groupData);
      }

      const group = groups.get(key)!;

      if (grouping.aggregations) {
        grouping.aggregations.forEach((agg: any) => {
          if (agg.function === 'count') {
            group.count = (group.count || 0) + 1;
          } else if (agg.function === 'sum') {
            const value = parseFloat(row[agg.field]) || 0;
            const aggKey = `total_${agg.field}`;
            group[aggKey] = (group[aggKey] || 0) + value;
          }
        });
      }
    });

    return Array.from(groups.values());
  };

  const exportToCSV = () => {
    if (data.length === 0) return;

    const columns = report.columns && Array.isArray(report.columns) && report.columns.length > 0
      ? report.columns.map(col => typeof col === 'string' ? col : col.field || col)
      : Object.keys(data[0]);

    const csv = [
      columns.join(','),
      ...data.map(row =>
        columns.map((col: string) => {
          const value = row[col];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  const formatValue = (value: any, key: string) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number' && (key.includes('Amount') || key.includes('total') || key.includes('revenue'))) {
      return `$${value.toLocaleString()}`;
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(value).toLocaleDateString();
    }
    return value;
  };

  const shouldHideColumn = (col: string) => {
    const lowerCol = col.toLowerCase();
    return lowerCol === 'id' ||
           lowerCol.endsWith('_id') ||
           lowerCol.includes('uuid') ||
           lowerCol === 'salesforce_id' ||
           lowerCol === 'organization_id';
  };

  const sortColumns = (columns: string[]) => {
    const nameColumns: string[] = [];
    const otherColumns: string[] = [];

    columns.forEach(col => {
      if (shouldHideColumn(col)) {
        return;
      }

      const lowerCol = col.toLowerCase();
      if (lowerCol.includes('first') && lowerCol.includes('name')) {
        nameColumns.unshift(col);
      } else if (lowerCol.includes('last') && lowerCol.includes('name')) {
        if (nameColumns.length > 0 && nameColumns[0].toLowerCase().includes('first')) {
          nameColumns.splice(1, 0, col);
        } else {
          nameColumns.unshift(col);
        }
      } else if (lowerCol.includes('full') && lowerCol.includes('name')) {
        nameColumns.unshift(col);
      } else if (lowerCol === 'name') {
        nameColumns.unshift(col);
      } else {
        otherColumns.push(col);
      }
    });

    return [...nameColumns, ...otherColumns];
  };

  const allColumns = report.columns && Array.isArray(report.columns) && report.columns.length > 0
    ? report.columns.map(col => typeof col === 'string' ? col : col.field || col)
    : data.length > 0 ? Object.keys(data[0]) : [];

  const displayColumns = sortColumns(allColumns);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{report.name}</h1>
              {report.description && (
                <p className="text-xs text-slate-600 mt-0.5">{report.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runReport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              disabled={data.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {!loading && !error && data.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold">{data.length}</span> {data.length === 1 ? 'record' : 'records'}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Last run: {new Date().toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <RefreshCw className="w-10 h-10 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-slate-600 font-medium">Running report...</p>
              <p className="text-sm text-slate-500 mt-1">Please wait while we fetch your data</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-semibold text-lg mb-2">Error Running Report</p>
              <p className="text-slate-600 text-sm max-w-md mx-auto">{error}</p>
              <button
                onClick={runReport}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          ) : data.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-semibold text-lg mb-2">No Results Found</p>
              <p className="text-slate-500 text-sm">This report returned no data. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                  <tr>
                    {displayColumns.map((col: string) => (
                      <th
                        key={col}
                        className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap border-r border-slate-200 last:border-r-0"
                      >
                        {col.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50 transition-colors">
                      {displayColumns.map((col: string) => (
                        <td key={col} className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap border-r border-slate-100 last:border-r-0">
                          {formatValue(row[col], col)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
