export type WidgetType =
  | 'metric_card'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'table'
  | 'funnel';

export interface Widget {
  id: string;
  dashboard_id: string;
  widget_type: WidgetType;
  title: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  config: WidgetConfig;
  data_source_config: DataSourceConfig;
  refresh_interval?: number;
  created_at: string;
  updated_at: string;
}

export interface WidgetConfig {
  color?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  animationDuration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  comparison?: {
    enabled: boolean;
    value?: number;
    label?: string;
  };
}

export interface DataSourceConfig {
  source_type: 'leads' | 'opportunities' | 'accounts' | 'cases' | 'activities' | 'custom_query';
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  field?: string;
  groupBy?: string;
  filters?: Array<{
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'like';
    value: any;
  }>;
  dateRange?: {
    field: string;
    type: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'this_quarter' | 'this_year' | 'custom';
    start?: string;
    end?: string;
  };
  limit?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface Dashboard {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  type: 'sales' | 'service' | 'marketing' | 'executive' | 'custom';
  is_public: boolean;
  layout_config: {
    cols: number;
    rowHeight: number;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
  widgets?: Widget[];
}

export interface WidgetLibraryItem {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultConfig: WidgetConfig;
  category: 'metrics' | 'charts' | 'tables';
}

export const WIDGET_LIBRARY: WidgetLibraryItem[] = [
  {
    type: 'metric_card',
    name: 'Metric Card',
    description: 'Display a single key metric with comparison',
    icon: 'TrendingUp',
    defaultWidth: 3,
    defaultHeight: 2,
    defaultConfig: {
      color: '#3b82f6',
      comparison: { enabled: true }
    },
    category: 'metrics'
  },
  {
    type: 'line_chart',
    name: 'Line Chart',
    description: 'Show trends over time',
    icon: 'LineChart',
    defaultWidth: 6,
    defaultHeight: 4,
    defaultConfig: {
      showLegend: true,
      showGrid: true,
      showLabels: true
    },
    category: 'charts'
  },
  {
    type: 'bar_chart',
    name: 'Bar Chart',
    description: 'Compare values across categories',
    icon: 'BarChart3',
    defaultWidth: 6,
    defaultHeight: 4,
    defaultConfig: {
      showLegend: true,
      showGrid: true,
      showLabels: true
    },
    category: 'charts'
  },
  {
    type: 'pie_chart',
    name: 'Pie Chart',
    description: 'Show proportions and percentages',
    icon: 'PieChart',
    defaultWidth: 4,
    defaultHeight: 4,
    defaultConfig: {
      showLegend: true,
      showLabels: true
    },
    category: 'charts'
  },
  {
    type: 'area_chart',
    name: 'Area Chart',
    description: 'Display volume trends over time',
    icon: 'AreaChart',
    defaultWidth: 6,
    defaultHeight: 4,
    defaultConfig: {
      showLegend: true,
      showGrid: true,
      showLabels: true
    },
    category: 'charts'
  },
  {
    type: 'table',
    name: 'Data Table',
    description: 'Display data in tabular format',
    icon: 'Table',
    defaultWidth: 6,
    defaultHeight: 4,
    defaultConfig: {},
    category: 'tables'
  },
  {
    type: 'funnel',
    name: 'Funnel Chart',
    description: 'Visualize conversion funnels',
    icon: 'Filter',
    defaultWidth: 4,
    defaultHeight: 4,
    defaultConfig: {
      showLabels: true
    },
    category: 'charts'
  }
];
