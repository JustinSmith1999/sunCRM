import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  config: {
    color?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    comparison?: {
      enabled: boolean;
      value?: number;
      label?: string;
    };
  };
  data?: any;
}

export function MetricCard({ title, value, config, data }: MetricCardProps) {
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString(undefined, { maximumFractionDigits: config.decimals || 0 })
    : value;

  const displayValue = `${config.prefix || ''}${formattedValue}${config.suffix || ''}`;

  const comparisonValue = config.comparison?.value || 0;
  const isPositive = comparisonValue >= 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-medium text-slate-600 mb-2">{title}</h3>
        <div className="flex items-baseline gap-2">
          <p
            className="text-3xl font-bold"
            style={{ color: config.color || '#1e293b' }}
          >
            {displayValue}
          </p>
        </div>
      </div>

      {config.comparison?.enabled && (
        <div className="flex items-center gap-2 mt-4">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{comparisonValue}%
          </span>
          {config.comparison.label && (
            <span className="text-sm text-slate-500">
              {config.comparison.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
