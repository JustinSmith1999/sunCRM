import React from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Clock, CheckCircle, AlertCircle, Calendar, Target, Package, Zap, Phone, Mail, FileText, Briefcase, Wrench, Home, Building2 } from 'lucide-react';

interface DashboardProps {
  folderName: string;
  dashboardTitle: string;
}

export function UniversalDashboard({ folderName, dashboardTitle }: DashboardProps) {
  const getDashboardConfig = () => {
    const folderLower = folderName.toLowerCase();

    if (folderLower.includes('sales')) {
      return {
        icon: TrendingUp,
        color: 'blue',
        metrics: [
          { label: 'Pipeline Value', value: '$2.4M', change: '+12%', icon: DollarSign },
          { label: 'Opportunities', value: '147', change: '+8%', icon: Target },
          { label: 'Close Rate', value: '32%', change: '+5%', icon: CheckCircle },
          { label: 'Avg Deal Size', value: '$16.3K', change: '+3%', icon: TrendingUp }
        ]
      };
    }

    if (folderLower.includes('executive')) {
      return {
        icon: Briefcase,
        color: 'purple',
        metrics: [
          { label: 'Revenue YTD', value: '$8.9M', change: '+18%', icon: DollarSign },
          { label: 'Active Projects', value: '342', change: '+12%', icon: Target },
          { label: 'Team Members', value: '87', change: '+6%', icon: Users },
          { label: 'Customer Satisfaction', value: '94%', change: '+2%', icon: CheckCircle }
        ]
      };
    }

    if (folderLower.includes('service')) {
      return {
        icon: Wrench,
        color: 'green',
        metrics: [
          { label: 'Active Cases', value: '234', change: '-8%', icon: AlertCircle },
          { label: 'Avg Response Time', value: '2.3h', change: '-15%', icon: Clock },
          { label: 'Resolution Rate', value: '87%', change: '+5%', icon: CheckCircle },
          { label: 'Customer Calls', value: '1,247', change: '+12%', icon: Phone }
        ]
      };
    }

    if (folderLower.includes('engineering')) {
      return {
        icon: Wrench,
        color: 'orange',
        metrics: [
          { label: 'Active Projects', value: '67', change: '+5%', icon: Target },
          { label: 'Avg Turnaround', value: '4.2 days', change: '-12%', icon: Clock },
          { label: 'Completed', value: '432', change: '+18%', icon: CheckCircle },
          { label: 'Revisions', value: '89', change: '-7%', icon: FileText }
        ]
      };
    }

    if (folderLower.includes('finance') || folderLower.includes('accounting')) {
      return {
        icon: DollarSign,
        color: 'emerald',
        metrics: [
          { label: 'Total Revenue', value: '$8.9M', change: '+15%', icon: DollarSign },
          { label: 'Outstanding', value: '$342K', change: '-8%', icon: Clock },
          { label: 'Paid Invoices', value: '1,247', change: '+12%', icon: CheckCircle },
          { label: 'Pending Approval', value: '23', change: '+2%', icon: AlertCircle }
        ]
      };
    }

    if (folderLower.includes('marketing')) {
      return {
        icon: TrendingUp,
        color: 'pink',
        metrics: [
          { label: 'Total Leads', value: '2,847', change: '+22%', icon: Users },
          { label: 'Campaigns Active', value: '12', change: '+3%', icon: Zap },
          { label: 'Conversion Rate', value: '4.8%', change: '+1.2%', icon: Target },
          { label: 'Email Opens', value: '34%', change: '+5%', icon: Mail }
        ]
      };
    }

    if (folderLower.includes('call center')) {
      return {
        icon: Phone,
        color: 'cyan',
        metrics: [
          { label: 'Total Calls', value: '3,452', change: '+15%', icon: Phone },
          { label: 'Avg Wait Time', value: '1.2m', change: '-18%', icon: Clock },
          { label: 'First Call Resolution', value: '78%', change: '+6%', icon: CheckCircle },
          { label: 'Active Agents', value: '24', change: '+2%', icon: Users }
        ]
      };
    }

    if (folderLower.includes('processing')) {
      return {
        icon: Package,
        color: 'indigo',
        metrics: [
          { label: 'In Queue', value: '156', change: '+8%', icon: Package },
          { label: 'Processed Today', value: '89', change: '+12%', icon: CheckCircle },
          { label: 'Avg Processing Time', value: '3.4h', change: '-10%', icon: Clock },
          { label: 'Pending Permits', value: '34', change: '-5%', icon: FileText }
        ]
      };
    }

    if (folderLower.includes('install')) {
      return {
        icon: Home,
        color: 'amber',
        metrics: [
          { label: 'Scheduled Installs', value: '47', change: '+15%', icon: Calendar },
          { label: 'Completed This Week', value: '23', change: '+8%', icon: CheckCircle },
          { label: 'Avg Install Time', value: '6.2h', change: '-5%', icon: Clock },
          { label: 'Active Crews', value: '12', change: '+0%', icon: Users }
        ]
      };
    }

    if (folderLower.includes('commercial')) {
      return {
        icon: Building2,
        color: 'slate',
        metrics: [
          { label: 'Active Projects', value: '34', change: '+12%', icon: Building2 },
          { label: 'Pipeline Value', value: '$4.2M', change: '+18%', icon: DollarSign },
          { label: 'Avg Project Size', value: '$124K', change: '+8%', icon: TrendingUp },
          { label: 'Proposals Out', value: '18', change: '+5%', icon: FileText }
        ]
      };
    }

    if (folderLower.includes('hr')) {
      return {
        icon: Users,
        color: 'rose',
        metrics: [
          { label: 'Total Employees', value: '87', change: '+6%', icon: Users },
          { label: 'Open Positions', value: '5', change: '+2%', icon: Target },
          { label: 'Avg Tenure', value: '3.2y', change: '+0.3y', icon: Clock },
          { label: 'Satisfaction', value: '89%', change: '+4%', icon: CheckCircle }
        ]
      };
    }

    if (folderLower.includes('partner')) {
      return {
        icon: Users,
        color: 'teal',
        metrics: [
          { label: 'Active Partners', value: '23', change: '+8%', icon: Users },
          { label: 'Partner Revenue', value: '$1.2M', change: '+22%', icon: DollarSign },
          { label: 'Open Opportunities', value: '67', change: '+15%', icon: Target },
          { label: 'Avg Deal Size', value: '$18K', change: '+6%', icon: TrendingUp }
        ]
      };
    }

    return {
      icon: BarChart3,
      color: 'blue',
      metrics: [
        { label: 'Total Items', value: '1,247', change: '+12%', icon: Target },
        { label: 'Completed', value: '892', change: '+15%', icon: CheckCircle },
        { label: 'In Progress', value: '234', change: '+8%', icon: Clock },
        { label: 'Success Rate', value: '87%', change: '+5%', icon: TrendingUp }
      ]
    };
  };

  const config = getDashboardConfig();
  const IconComponent = config.icon;

  const colorClasses = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    purple: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
    indigo: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' }
  };

  const colors = colorClasses[config.color as keyof typeof colorClasses];

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> This dashboard shows sample template data. Use the Report Builder to create custom dashboards with real data from your Salesforce sync.
        </p>
      </div>

      <div className={`${colors.bg} border ${colors.border} rounded-lg p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <IconComponent className={`w-8 h-8 ${colors.text}`} />
          <div>
            <h2 className="text-xl font-bold text-slate-900">{dashboardTitle}</h2>
            <p className="text-sm text-slate-600">{folderName}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {config.metrics.map((metric, index) => {
          const MetricIcon = metric.icon;
          const isPositive = metric.change.startsWith('+');

          return (
            <div key={index} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${colors.bg} rounded-lg`}>
                  <MetricIcon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 mb-1">{metric.value}</p>
                <p className="text-sm text-slate-600">{metric.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                <div className={`p-2 ${colors.bg} rounded`}>
                  <CheckCircle className={`w-4 h-4 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Activity item {item}</p>
                  <p className="text-xs text-slate-500">{item} hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Overview</h3>
          <div className="space-y-4">
            {['This Week', 'This Month', 'This Quarter', 'This Year'].map((period, index) => (
              <div key={period}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">{period}</span>
                  <span className="text-sm font-medium text-slate-900">{85 + index * 3}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      config.color === 'blue' ? 'bg-blue-500' :
                      config.color === 'purple' ? 'bg-sky-500' :
                      config.color === 'green' ? 'bg-green-500' :
                      config.color === 'orange' ? 'bg-orange-500' :
                      config.color === 'emerald' ? 'bg-emerald-500' :
                      config.color === 'pink' ? 'bg-pink-500' :
                      config.color === 'cyan' ? 'bg-cyan-500' :
                      config.color === 'indigo' ? 'bg-blue-600' :
                      config.color === 'amber' ? 'bg-amber-500' :
                      config.color === 'slate' ? 'bg-slate-500' :
                      config.color === 'rose' ? 'bg-rose-500' :
                      'bg-teal-500'
                    }`}
                    style={{ width: `${85 + index * 3}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
