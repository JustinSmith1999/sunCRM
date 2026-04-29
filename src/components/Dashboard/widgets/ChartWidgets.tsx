import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ChartWidgetProps {
  title: string;
  data: any[];
  config: {
    color?: string;
    showLegend?: boolean;
    showGrid?: boolean;
    showLabels?: boolean;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function LineChartWidget({ title, data, config }: ChartWidgetProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 h-full flex flex-col">
      <h3 className="text-sm font-medium text-slate-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem'
            }}
          />
          {config.showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey="value"
            stroke={config.color || '#3b82f6'}
            strokeWidth={2}
            dot={{ fill: config.color || '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartWidget({ title, data, config }: ChartWidgetProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 h-full flex flex-col">
      <h3 className="text-sm font-medium text-slate-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem'
            }}
          />
          {config.showLegend && <Legend />}
          <Bar dataKey="value" fill={config.color || '#3b82f6'} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieChartWidget({ title, data, config }: ChartWidgetProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 h-full flex flex-col">
      <h3 className="text-sm font-medium text-slate-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={config.showLabels}
            label={config.showLabels ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
            outerRadius="70%"
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem'
            }}
          />
          {config.showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AreaChartWidget({ title, data, config }: ChartWidgetProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 h-full flex flex-col">
      <h3 className="text-sm font-medium text-slate-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem'
            }}
          />
          {config.showLegend && <Legend />}
          <Area
            type="monotone"
            dataKey="value"
            stroke={config.color || '#3b82f6'}
            fill={config.color || '#3b82f6'}
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TableWidget({ title, data }: { title: string; data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4 h-full flex items-center justify-center">
        <p className="text-slate-500">No data available</p>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 h-full flex flex-col">
      <h3 className="text-sm font-medium text-slate-900 mb-4">{title}</h3>
      <div className="overflow-auto flex-1">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2 text-sm text-slate-900 whitespace-nowrap">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FunnelWidget({ title, data, config }: ChartWidgetProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 h-full flex flex-col">
      <h3 className="text-sm font-medium text-slate-900 mb-4">{title}</h3>
      <div className="flex flex-col gap-2 flex-1 justify-center">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-1">
                <div
                  className="h-12 rounded flex items-center justify-between px-4 transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: COLORS[index % COLORS.length],
                    minWidth: '150px'
                  }}
                >
                  <span className="text-white font-medium text-sm">{item.name}</span>
                  {config.showLabels && (
                    <span className="text-white font-bold">{item.value}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
