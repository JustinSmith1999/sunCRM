import React, { useState } from 'react';
import {
  Users, Globe, Zap, UserCog, Cloud, LayoutDashboard, Handshake,
  Briefcase, DollarSign, MonitorPlay, Wrench, Code, BookOpen,
  UserPlus, Target, Building2, LifeBuoy, BarChart3, Settings,
  Package, ShoppingCart, FileText, Calendar, Bell, Shield, Plug, Wallet, Warehouse, ScrollText, Headphones, Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminTile {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  onClick: () => void;
}

interface AdminDashboardProps {
  onViewChange: (view: string) => void;
}

export function AdminDashboard({ onViewChange }: AdminDashboardProps) {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-900 mb-2">Access Denied</h3>
          <p className="text-red-700">You don't have permission to access the admin dashboard.</p>
          <p className="text-sm text-red-600 mt-2">Current role: {profile?.role || 'none'}</p>
        </div>
      </div>
    );
  }

  const adminTiles: AdminTile[] = [
    {
      id: 'system-health',
      label: 'System Health',
      icon: Activity,
      color: 'bg-red-600',
      onClick: () => onViewChange('admin-system-health')
    },
    {
      id: 'user-mappings',
      label: 'User Mappings',
      icon: UserCog,
      color: 'bg-blue-600',
      onClick: () => onViewChange('admin-user-mappings')
    },
    {
      id: 'users',
      label: 'User Management',
      icon: UserPlus,
      color: 'bg-blue-700',
      onClick: () => onViewChange('admin-users')
    },
    {
      id: 'audit-log',
      label: 'Admin Change Log',
      icon: ScrollText,
      color: 'bg-slate-700',
      onClick: () => onViewChange('admin-change-log')
    },
    {
      id: 'hr',
      label: 'HR Console',
      icon: Briefcase,
      color: 'bg-teal-600',
      onClick: () => onViewChange('admin-hr')
    },
    {
      id: 'paylocity',
      label: 'Paylocity HR',
      icon: Wallet,
      color: 'bg-teal-700',
      onClick: () => onViewChange('admin-paylocity')
    },
    {
      id: 'salesforce-sync',
      label: 'Salesforce Sync',
      icon: Cloud,
      color: 'bg-sky-600',
      onClick: () => onViewChange('admin-salesforce-sync')
    },
    {
      id: 'web-forms',
      label: 'Web-to-Lead Forms',
      icon: Globe,
      color: 'bg-cyan-600',
      onClick: () => onViewChange('admin-webforms')
    },
    {
      id: 'api-integrations',
      label: 'API Integrations',
      icon: Plug,
      color: 'bg-red-600',
      onClick: () => onViewChange('admin-api-integrations')
    },
    {
      id: 'atera',
      label: 'Atera Integration',
      icon: Headphones,
      color: 'bg-teal-600',
      onClick: () => onViewChange('admin-atera')
    },
    {
      id: 'automation',
      label: 'Automation Flows',
      icon: Zap,
      color: 'bg-amber-600',
      onClick: () => onViewChange('admin-automation')
    },
    {
      id: 'process-automation',
      label: 'Process Automation',
      icon: Settings,
      color: 'bg-sky-600',
      onClick: () => onViewChange('admin-process-automation')
    },
    {
      id: 'dashboards',
      label: 'Dashboard Builder',
      icon: LayoutDashboard,
      color: 'bg-slate-600',
      onClick: () => onViewChange('admin-dashboards')
    },
    {
      id: 'contacts',
      label: 'Contacts Console',
      icon: Users,
      color: 'bg-teal-600',
      onClick: () => onViewChange('admin-contacts')
    },
    {
      id: 'channel-partners',
      label: 'Channel Partners',
      icon: Handshake,
      color: 'bg-green-600',
      onClick: () => onViewChange('admin-channel-partners')
    },
    {
      id: 'leads',
      label: 'Leads Management',
      icon: Target,
      color: 'bg-rose-600',
      onClick: () => onViewChange('leads')
    },
    {
      id: 'deals',
      label: 'Deals Pipeline',
      icon: ShoppingCart,
      color: 'bg-emerald-600',
      onClick: () => onViewChange('deals')
    },
    {
      id: 'accounts',
      label: 'Accounts',
      icon: Building2,
      color: 'bg-blue-700',
      onClick: () => onViewChange('accounts')
    },
    {
      id: 'cases',
      label: 'Support Cases',
      icon: LifeBuoy,
      color: 'bg-orange-600',
      onClick: () => onViewChange('cases')
    },
    {
      id: 'finance',
      label: 'Finance Dashboard',
      icon: DollarSign,
      color: 'bg-green-700',
      onClick: () => onViewChange('admin-finance')
    },
    {
      id: 'equipment',
      label: 'Company Equipment',
      icon: MonitorPlay,
      color: 'bg-slate-600',
      onClick: () => onViewChange('admin-equipment')
    },
    {
      id: 'software',
      label: 'Software Subscriptions',
      icon: Package,
      color: 'bg-pink-600',
      onClick: () => onViewChange('admin-software')
    },
    {
      id: 'knowledge-base',
      label: 'Knowledge Base',
      icon: BookOpen,
      color: 'bg-cyan-700',
      onClick: () => onViewChange('knowledge-base')
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      color: 'bg-blue-800',
      onClick: () => onViewChange('reports')
    },
    {
      id: 'engineering',
      label: 'Engineering Requests',
      icon: Code,
      color: 'bg-slate-700',
      onClick: () => onViewChange('admin-engineering')
    },
    {
      id: 'salesforce-requests',
      label: 'Salesforce Requests',
      icon: Wrench,
      color: 'bg-blue-800',
      onClick: () => onViewChange('admin-salesforce-requests')
    },
    {
      id: 'campaigns',
      label: 'Marketing Campaigns',
      icon: Bell,
      color: 'bg-yellow-600',
      onClick: () => onViewChange('campaigns')
    },
    {
      id: 'products',
      label: 'Product Catalog',
      icon: FileText,
      color: 'bg-teal-700',
      onClick: () => onViewChange('products')
    },
    {
      id: 'warehouse-sync',
      label: 'Warehouse Sync',
      icon: Warehouse,
      color: 'bg-stone-600',
      onClick: () => onViewChange('admin-warehouse-sync')
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      color: 'bg-gray-700',
      onClick: () => onViewChange('admin-settings')
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Administration</h1>
        <p className="text-slate-600">System configuration and management</p>
      </div>

      {/* Navigation Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {adminTiles.map((tile) => {
          const IconComponent = tile.icon;
          return (
            <button
              key={tile.id}
              onClick={tile.onClick}
              className="group p-4 bg-white rounded-lg border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-200 text-center"
            >
              <div className={`w-14 h-14 ${tile.color} rounded-lg flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform`}>
                <IconComponent className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-medium text-slate-900 text-xs leading-tight">{tile.label}</h3>
            </button>
          );
        })}
      </div>
    </div>
  );
}