import React, { useState, useEffect } from 'react';
import {
  Plus,
  Save,
  Eye,
  Settings,
  Trash2,
  GripVertical,
  X,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  TrendingUp,
  Table as TableIcon,
  Filter,
  AreaChart as AreaChartIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Widget, WidgetType, WIDGET_LIBRARY, Dashboard } from './widgets/WidgetTypes';
import { MetricCard } from './widgets/MetricCard';
import {
  LineChartWidget,
  BarChartWidget,
  PieChartWidget,
  AreaChartWidget,
  TableWidget,
  FunnelWidget
} from './widgets/ChartWidgets';

interface DashboardBuilderProps {
  dashboardId?: string;
  onBack: () => void;
}

const WIDGET_ICONS: Record<WidgetType, React.ReactNode> = {
  metric_card: <TrendingUp className="w-5 h-5" />,
  line_chart: <LineChartIcon className="w-5 h-5" />,
  bar_chart: <BarChart3 className="w-5 h-5" />,
  pie_chart: <PieChartIcon className="w-5 h-5" />,
  area_chart: <AreaChartIcon className="w-5 h-5" />,
  table: <TableIcon className="w-5 h-5" />,
  funnel: <Filter className="w-5 h-5" />
};

export function DashboardBuilder({ dashboardId, onBack }: DashboardBuilderProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditMode, setIsEditMode] = useState(true);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<Widget | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    if (dashboardId) {
      loadDashboard();
    }
  }, [dashboardId]);

  const loadDashboard = async () => {
    if (!dashboardId) return;

    try {
      const { data: dashboardData, error: dashError } = await supabase
        .from('custom_dashboards')
        .select('*')
        .eq('id', dashboardId)
        .single();

      if (dashError) throw dashError;

      const { data: widgetsData, error: widgetsError } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .order('position_y', { ascending: true })
        .order('position_x', { ascending: true });

      if (widgetsError) throw widgetsError;

      setDashboard(dashboardData);
      setWidgets(widgetsData || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const addWidget = async (widgetType: WidgetType) => {
    if (!dashboardId || !profile?.organization_id) return;

    const libraryItem = WIDGET_LIBRARY.find(w => w.type === widgetType);
    if (!libraryItem) return;

    const nextY = widgets.length > 0 ? Math.max(...widgets.map(w => w.position_y + w.height)) : 0;

    const newWidget: Partial<Widget> = {
      dashboard_id: dashboardId,
      widget_type: widgetType,
      title: `New ${libraryItem.name}`,
      position_x: 0,
      position_y: nextY,
      width: libraryItem.defaultWidth,
      height: libraryItem.defaultHeight,
      config: libraryItem.defaultConfig,
      data_source_config: {
        source_type: 'leads',
        aggregation: 'count'
      }
    };

    try {
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .insert([newWidget])
        .select()
        .single();

      if (error) throw error;

      setWidgets([...widgets, data]);
      setShowWidgetLibrary(false);
    } catch (error) {
      console.error('Error adding widget:', error);
    }
  };

  const deleteWidget = async (widgetId: string) => {
    try {
      const { error } = await supabase
        .from('dashboard_widgets')
        .delete()
        .eq('id', widgetId);

      if (error) throw error;

      setWidgets(widgets.filter(w => w.id !== widgetId));
    } catch (error) {
      console.error('Error deleting widget:', error);
    }
  };

  const updateWidget = async (widgetId: string, updates: Partial<Widget>) => {
    try {
      const { error } = await supabase
        .from('dashboard_widgets')
        .update(updates)
        .eq('id', widgetId);

      if (error) throw error;

      setWidgets(widgets.map(w => (w.id === widgetId ? { ...w, ...updates } : w)));
    } catch (error) {
      console.error('Error updating widget:', error);
    }
  };

  const saveDashboard = async () => {
    setSaving(true);
    try {
      await loadDashboard();
      alert('Dashboard saved successfully!');
    } catch (error) {
      console.error('Error saving dashboard:', error);
      alert('Failed to save dashboard');
    } finally {
      setSaving(false);
    }
  };

  const renderWidget = (widget: Widget) => {
    const sampleData = generateSampleData(widget.widget_type);

    switch (widget.widget_type) {
      case 'metric_card':
        return (
          <MetricCard
            title={widget.title}
            value={1234}
            config={widget.config}
            data={sampleData}
          />
        );
      case 'line_chart':
        return <LineChartWidget title={widget.title} data={sampleData} config={widget.config} />;
      case 'bar_chart':
        return <BarChartWidget title={widget.title} data={sampleData} config={widget.config} />;
      case 'pie_chart':
        return <PieChartWidget title={widget.title} data={sampleData} config={widget.config} />;
      case 'area_chart':
        return <AreaChartWidget title={widget.title} data={sampleData} config={widget.config} />;
      case 'table':
        return <TableWidget title={widget.title} data={sampleData} />;
      case 'funnel':
        return <FunnelWidget title={widget.title} data={sampleData} config={widget.config} />;
      default:
        return null;
    }
  };

  const generateSampleData = (type: WidgetType) => {
    switch (type) {
      case 'line_chart':
      case 'bar_chart':
      case 'area_chart':
        return [
          { name: 'Jan', value: 400 },
          { name: 'Feb', value: 300 },
          { name: 'Mar', value: 600 },
          { name: 'Apr', value: 800 },
          { name: 'May', value: 500 },
          { name: 'Jun', value: 700 }
        ];
      case 'pie_chart':
        return [
          { name: 'Qualified', value: 400 },
          { name: 'Contacted', value: 300 },
          { name: 'Converted', value: 200 },
          { name: 'Open', value: 100 }
        ];
      case 'funnel':
        return [
          { name: 'Leads', value: 1000 },
          { name: 'Qualified', value: 750 },
          { name: 'Proposals', value: 500 },
          { name: 'Negotiations', value: 250 },
          { name: 'Closed Won', value: 150 }
        ];
      case 'table':
        return [
          { name: 'John Doe', status: 'Active', deals: 5, revenue: '$50K' },
          { name: 'Jane Smith', status: 'Active', deals: 8, revenue: '$80K' },
          { name: 'Bob Johnson', status: 'Active', deals: 3, revenue: '$30K' }
        ];
      default:
        return [];
    }
  };

  const gridCols = dashboard?.layout_config?.cols || 12;
  const rowHeight = dashboard?.layout_config?.rowHeight || 80;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {dashboard?.name || 'New Dashboard'}
            </h1>
            <p className="text-sm text-slate-600">{dashboard?.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              isEditMode
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isEditMode ? (
              <>
                <Eye className="w-4 h-4" />
                Preview
              </>
            ) : (
              <>
                <Settings className="w-4 h-4" />
                Edit
              </>
            )}
          </button>

          {isEditMode && (
            <button
              onClick={() => setShowWidgetLibrary(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Widget
            </button>
          )}

          <button
            onClick={saveDashboard}
            disabled={saving}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
        }}
      >
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className="relative group"
            style={{
              gridColumn: `span ${widget.width}`,
              gridRow: `span ${widget.height}`,
              minHeight: `${widget.height * rowHeight}px`
            }}
          >
            {isEditMode && (
              <div className="absolute -top-2 -right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setSelectedWidget(widget);
                    setShowWidgetConfig(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded shadow-lg"
                  title="Configure"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteWidget(widget.id)}
                  className="bg-red-500 hover:bg-red-600 text-white p-1 rounded shadow-lg"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {isEditMode && (
              <div
                className="absolute top-2 left-2 z-10 cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
                draggable
                onDragStart={() => setDraggedWidget(widget)}
                onDragEnd={() => setDraggedWidget(null)}
              >
                <GripVertical className="w-5 h-5 text-slate-400" />
              </div>
            )}

            <div className="h-full">{renderWidget(widget)}</div>
          </div>
        ))}
      </div>

      {widgets.length === 0 && (
        <div className="text-center py-20">
          <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No widgets yet</h3>
          <p className="text-slate-600 mb-4">Add your first widget to get started</p>
          <button
            onClick={() => setShowWidgetLibrary(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Widget
          </button>
        </div>
      )}

      {/* Widget Library Modal */}
      {showWidgetLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">Add Widget</h2>
              <button
                onClick={() => setShowWidgetLibrary(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {['metrics', 'charts', 'tables'].map((category) => (
                <div key={category} className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 capitalize">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {WIDGET_LIBRARY.filter((w) => w.category === category).map((widget) => (
                      <button
                        key={widget.type}
                        onClick={() => addWidget(widget.type)}
                        className="p-4 border border-slate-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-amber-500">{WIDGET_ICONS[widget.type]}</div>
                          <h4 className="font-semibold text-slate-900">{widget.name}</h4>
                        </div>
                        <p className="text-sm text-slate-600">{widget.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Widget Configuration Modal */}
      {showWidgetConfig && selectedWidget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">Configure Widget</h2>
              <button
                onClick={() => {
                  setShowWidgetConfig(false);
                  setSelectedWidget(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Widget Title
                </label>
                <input
                  type="text"
                  value={selectedWidget.title}
                  onChange={(e) =>
                    setSelectedWidget({ ...selectedWidget, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Width</label>
                  <input
                    type="number"
                    min="1"
                    max={gridCols}
                    value={selectedWidget.width}
                    onChange={(e) =>
                      setSelectedWidget({ ...selectedWidget, width: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Height</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={selectedWidget.height}
                    onChange={(e) =>
                      setSelectedWidget({ ...selectedWidget, height: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowWidgetConfig(false);
                    setSelectedWidget(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateWidget(selectedWidget.id, {
                      title: selectedWidget.title,
                      width: selectedWidget.width,
                      height: selectedWidget.height
                    });
                    setShowWidgetConfig(false);
                    setSelectedWidget(null);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
