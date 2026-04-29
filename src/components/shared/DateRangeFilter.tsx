import React from 'react';

export type DateRangeKey = '1W' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ALL';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

const now = () => new Date();

export function getDateRange(key: DateRangeKey): DateRange {
  const today = now();
  const year = today.getFullYear();

  switch (key) {
    case '1W':
      return { start: new Date(today.getTime() - 7 * 86400000), end: today };
    case '1M':
      return { start: new Date(today.getTime() - 30 * 86400000), end: today };
    case '3M':
      return { start: new Date(today.getTime() - 90 * 86400000), end: today };
    case '6M':
      return { start: new Date(today.getTime() - 183 * 86400000), end: today };
    case 'YTD':
      return { start: new Date(year, 0, 1), end: today };
    case '1Y':
      return { start: new Date(today.getTime() - 365 * 86400000), end: today };
    case 'Q1':
      return { start: new Date(year, 0, 1), end: new Date(year, 2, 31, 23, 59, 59) };
    case 'Q2':
      return { start: new Date(year, 3, 1), end: new Date(year, 5, 30, 23, 59, 59) };
    case 'Q3':
      return { start: new Date(year, 6, 1), end: new Date(year, 8, 30, 23, 59, 59) };
    case 'Q4':
      return { start: new Date(year, 9, 1), end: new Date(year, 11, 31, 23, 59, 59) };
    case 'ALL':
    default:
      return { start: null, end: null };
  }
}

export function isInDateRange(dateStr: string | null | undefined, range: DateRange): boolean {
  if (!range.start && !range.end) return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  if (range.start && d < range.start) return false;
  if (range.end && d > range.end) return false;
  return true;
}

const BUTTONS: { key: DateRangeKey; label: string }[] = [
  { key: '1W', label: '1W' },
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: 'YTD', label: 'YTD' },
  { key: '1Y', label: '1Y' },
  { key: 'Q1', label: 'Q1' },
  { key: 'Q2', label: 'Q2' },
  { key: 'Q3', label: 'Q3' },
  { key: 'Q4', label: 'Q4' },
  { key: 'ALL', label: 'ALL' },
];

interface DateRangeFilterProps {
  value: DateRangeKey;
  onChange: (key: DateRangeKey) => void;
  className?: string;
}

export function DateRangeFilter({ value, onChange, className = '' }: DateRangeFilterProps) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {BUTTONS.map(({ key, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border ${
              active
                ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                : 'bg-white text-slate-600 border-slate-300 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
