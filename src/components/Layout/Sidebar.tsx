import React, { useState } from 'react';
import {
  Home,
  Calendar,
  Building2,
  TrendingUp,
  CheckSquare,
  HelpCircle,
  BarChart3,
  Settings,
  Sun,
  User,
  LogOut,
  UserPlus,
  Package,
  Megaphone,
  BookOpen,
  Zap,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Shield,
  Users,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Briefcase,
  LineChart,
  Wrench,
  ClipboardList,
  FileText,
  Cog,
  Headphones,
  Warehouse,
  RefreshCw,
  FileSpreadsheet,
  CreditCard,
  Receipt,
  ArrowLeftRight,
  BookMarked,
  Award,
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  showOnMobile: boolean;
  onCloseMobile: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  requiredPermissions?: string[];
  allowedRoles?: string[];
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    allowedRoles: ['admin', 'sales_manager', 'sales_rep', 'support', 'hr_manager', 'operations', 'partner']
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: Briefcase,
    allowedRoles: ['admin', 'sales_manager', 'sales_rep', 'operations'],
    children: [
      {
        id: 'sales-team-dashboard',
        label: 'Sales Team',
        icon: Users,
        allowedRoles: ['admin', 'sales_manager']
      },
      {
        id: 'sales-management',
        label: 'Sales Management',
        icon: LineChart,
        requiredPermissions: ['manage_team_deals'],
        allowedRoles: ['admin', 'sales_manager']
      },
      {
        id: 'leads',
        label: 'Leads',
        icon: UserPlus,
        requiredPermissions: ['view_leads', 'create_leads'],
        allowedRoles: ['admin', 'sales_manager', 'sales_rep']
      },
      {
        id: 'accounts',
        label: 'Accounts',
        icon: Building2,
        requiredPermissions: ['view_all_deals', 'view_own_deals'],
        allowedRoles: ['admin', 'sales_manager', 'sales_rep', 'operations']
      },
      {
        id: 'contacts',
        label: 'Contacts',
        icon: User,
        requiredPermissions: ['view_all_deals', 'view_own_deals'],
        allowedRoles: ['admin', 'sales_manager', 'sales_rep', 'operations']
      },
      {
        id: 'deals',
        label: 'Opportunities',
        icon: TrendingUp,
        requiredPermissions: ['view_all_deals', 'view_own_deals'],
        allowedRoles: ['admin', 'sales_manager', 'sales_rep']
      },
      {
        id: 'quotes',
        label: 'Quotes',
        icon: FileText,
        requiredPermissions: ['view_all_deals', 'view_own_deals'],
        allowedRoles: ['admin', 'sales_manager', 'sales_rep']
      },
      {
        id: 'campaigns',
        label: 'Campaigns',
        icon: Megaphone,
        requiredPermissions: ['manage_team_deals', 'view_analytics'],
        allowedRoles: ['admin', 'sales_manager']
      },
      {
        id: 'products',
        label: 'Products',
        icon: Package,
        requiredPermissions: ['view_inventory', 'view_all_deals'],
        allowedRoles: ['admin', 'sales_manager', 'operations']
      },
    ]
  },
  {
    id: 'solar',
    label: 'Solar',
    icon: Sun,
    allowedRoles: ['admin', 'sales_manager', 'sales_rep', 'operations'],
    children: [
      {
        id: 'solar-leads',
        label: 'Lead Intake',
        icon: UserPlus,
        requiredPermissions: ['view_leads', 'create_leads'],
        allowedRoles: ['admin', 'sales_manager', 'sales_rep']
      },
      {
        id: 'solar-pipeline',
        label: 'Pipeline',
        icon: TrendingUp,
        requiredPermissions: ['view_all_deals', 'view_own_deals'],
        allowedRoles: ['admin', 'sales_manager', 'sales_rep']
      },
      {
        id: 'solar-design',
        label: 'Design Platform',
        icon: LayoutDashboard,
        requiredPermissions: ['view_all_deals', 'view_own_deals'],
        allowedRoles: ['admin', 'sales_manager', 'sales_rep']
      },
      {
        id: 'solar-projects',
        label: 'Projects',
        icon: Zap,
        requiredPermissions: ['view_all_deals'],
        allowedRoles: ['admin', 'sales_manager', 'operations']
      },
      {
        id: 'solar-financing',
        label: 'Financing',
        icon: DollarSign,
        requiredPermissions: ['view_all_deals'],
        allowedRoles: ['admin', 'sales_manager', 'sales_rep']
      },
    ]
  },
  {
    id: 'service',
    label: 'Service',
    icon: Wrench,
    allowedRoles: ['admin', 'support', 'sales_manager', 'sales_rep', 'hr_manager', 'operations', 'service_manager', 'service_coordinator', 'technician'],
    children: [
      {
        id: 'service-team-dashboard',
        label: 'Service Team',
        icon: Users,
        allowedRoles: ['admin', 'service_manager', 'service_coordinator']
      },
      {
        id: 'service-dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        allowedRoles: ['admin', 'service_manager', 'service_coordinator']
      },
      {
        id: 'dispatch-board',
        label: 'Dispatch Board',
        icon: Calendar,
        allowedRoles: ['admin', 'service_manager', 'service_coordinator']
      },
      {
        id: 'service-tickets',
        label: 'Service Tickets',
        icon: ClipboardList,
        allowedRoles: ['admin', 'service_manager', 'service_coordinator', 'technician']
      },
      {
        id: 'service-customers',
        label: 'Customers',
        icon: Users,
        allowedRoles: ['admin', 'service_manager', 'service_coordinator']
      },
      {
        id: 'service-technicians',
        label: 'Technicians',
        icon: Wrench,
        allowedRoles: ['admin', 'service_manager']
      },
      {
        id: 'service-parts',
        label: 'Parts Inventory',
        icon: Package,
        allowedRoles: ['admin', 'service_manager', 'service_coordinator']
      },
      {
        id: 'service-invoices',
        label: 'Invoices',
        icon: DollarSign,
        allowedRoles: ['admin', 'service_manager', 'service_coordinator']
      },
      {
        id: 'service-payment-plans',
        label: 'Payment Plans',
        icon: CreditCard,
        allowedRoles: ['admin', 'service_manager', 'finance_manager']
      },
      {
        id: 'cases',
        label: 'Cases',
        icon: HelpCircle,
        requiredPermissions: ['view_cases'],
        allowedRoles: ['admin', 'support']
      },
      {
        id: 'tasks',
        label: 'Tasks',
        icon: CheckSquare,
        allowedRoles: ['admin', 'sales_manager', 'sales_rep', 'support', 'hr_manager', 'operations']
      },
      {
        id: 'knowledge',
        label: 'Knowledge Base',
        icon: BookOpen,
        requiredPermissions: ['view_kb'],
        allowedRoles: ['admin', 'support', 'sales_rep', 'sales_manager']
      },
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    allowedRoles: ['admin', 'finance_manager', 'operations_manager', 'sales_manager'],
    children: [
      {
        id: 'finance-loans',
        label: 'Finance & Loans',
        icon: DollarSign,
        allowedRoles: ['admin', 'finance_manager', 'operations_manager', 'sales_manager']
      },
      {
        id: 'payment-plans',
        label: 'Payment Plans',
        icon: CreditCard,
        allowedRoles: ['admin', 'finance_manager', 'operations_manager']
      },
      {
        id: 'vouchers',
        label: 'Vouchers',
        icon: Receipt,
        allowedRoles: ['admin', 'finance_manager', 'operations_manager']
      },
      {
        id: 'intercompany-payments',
        label: 'Intercompany Payments',
        icon: ArrowLeftRight,
        allowedRoles: ['admin', 'finance_manager', 'operations_manager']
      }
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Cog,
    allowedRoles: ['admin', 'operations_manager', 'operations', 'sales_manager'],
    children: [
      {
        id: 'journal-records',
        label: 'Journal Records',
        icon: BookMarked,
        allowedRoles: ['admin', 'operations_manager', 'operations']
      },
      {
        id: 'residential-contracts',
        label: 'Residential Contracts',
        icon: FileSpreadsheet,
        allowedRoles: ['admin', 'operations_manager', 'operations', 'sales_manager']
      },
      {
        id: 'equipment',
        label: 'Company Equipment',
        icon: Package,
        allowedRoles: ['admin', 'operations_manager', 'operations']
      },
      {
        id: 'production-monitoring',
        label: 'Production Monitoring',
        icon: Activity,
        allowedRoles: ['admin', 'operations_manager', 'operations']
      }
    ]
  },
  {
    id: 'warehouse',
    label: 'Warehouse',
    icon: Warehouse,
    allowedRoles: ['admin', 'operations_manager', 'operations', 'warehouse_manager'],
    children: [
      {
        id: 'warehouse-inventory',
        label: 'Inventory',
        icon: Package,
        allowedRoles: ['admin', 'operations_manager', 'operations', 'warehouse_manager']
      },
      {
        id: 'pull-sheets',
        label: 'Pull Sheets',
        icon: ClipboardList,
        // Wide open during initial rollout — tighten after demo.
        allowedRoles: ['admin', 'operations_manager', 'operations', 'warehouse_manager', 'sales_manager', 'sales_rep', 'support']
      },
      {
        id: 'warehouse-sync',
        label: 'Sync Console',
        icon: RefreshCw,
        allowedRoles: ['admin', 'operations_manager']
      }
    ]
  },
  {
    id: 'loyalty',
    label: 'Loyalty',
    icon: Award,
    allowedRoles: ['admin', 'sales_manager', 'operations_manager', 'marketing']
  },
  {
    id: 'processing',
    label: 'Processing',
    icon: Cog,
    allowedRoles: ['admin', 'operations_manager', 'service_coordinator', 'operations'],
    children: [
      {
        id: 'permit-management',
        label: 'Permit Management',
        icon: FileText,
        allowedRoles: ['admin', 'operations_manager', 'service_coordinator', 'operations']
      }
    ]
  },
  {
    id: 'it-support',
    label: 'IT Support',
    icon: Headphones,
    allowedRoles: ['admin', 'sales_manager', 'sales_rep', 'support', 'hr_manager', 'operations', 'engineering', 'marketing', 'finance_manager', 'executive', 'customer_success', 'service_manager', 'service_coordinator', 'technician', 'operations_manager', 'partner']
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    allowedRoles: ['admin', 'sales_manager', 'sales_rep', 'support', 'hr_manager', 'operations', 'engineering', 'marketing', 'finance_manager', 'executive', 'customer_success']
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: LineChart,
    allowedRoles: ['admin', 'sales_manager', 'sales_rep', 'operations'],
    children: [
      {
        id: 'dashboards-library',
        label: 'Dashboards',
        icon: LayoutDashboard,
        allowedRoles: ['admin', 'sales_manager', 'sales_rep', 'operations']
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: BarChart3,
        requiredPermissions: ['view_reports', 'view_analytics'],
        allowedRoles: ['admin', 'sales_manager', 'operations']
      },
    ]
  },
  {
    id: 'partner-portal',
    label: 'Partner Portal',
    icon: Users,
    requiredPermissions: ['view_partner_portal'],
    allowedRoles: ['partner']
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Shield,
    allowedRoles: ['admin']
  },
];

export function Sidebar({ currentView, onViewChange, collapsed, onToggleCollapsed, showOnMobile, onCloseMobile }: SidebarProps) {
  const { profile, signOut, hasPermission } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['sales', 'solar', 'service', 'finance', 'operations', 'warehouse', 'analytics']);

  const canAccessMenuItem = (item: MenuItem): boolean => {
    if (!profile) return false;

    // All authenticated users can access all menu items
    return true;
  };

  const toggleGroup = (groupId: string) => {
    if (collapsed) return;
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isGroupExpanded = (groupId: string) => {
    return !collapsed && expandedGroups.includes(groupId);
  };

  const getVisibleChildren = (item: MenuItem) => {
    if (!item.children) return [];
    return item.children.filter(canAccessMenuItem);
  };

  const isItemActive = (itemId: string, children?: MenuItem[]) => {
    if (currentView === itemId) return true;
    if (children) {
      return children.some(child => currentView === child.id);
    }
    return false;
  };

  const visibleMenuItems = menuItems.filter(item => {
    if (!canAccessMenuItem(item)) return false;
    if (item.children) {
      return getVisibleChildren(item).length > 0;
    }
    return true;
  });

  return (
    <>
      {showOnMobile && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onCloseMobile}
        />
      )}

      <div className={`bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col border-r border-zinc-200 dark:border-zinc-800 transition-[width] duration-200 ease-out
        ${collapsed ? 'w-16' : 'w-60'}
        ${showOnMobile
          ? 'fixed top-0 left-0 h-full w-60 z-50'
          : 'hidden'
        }
        md:flex md:fixed md:left-0 md:top-0 md:h-screen
      `}>
      {/* Brand */}
      <div className="px-3 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5">
        <img
          src="https://husbupeealwuxyopfwwb.supabase.co/storage/v1/object/public/logos/03018223-ac24-400d-acbc-2c1480a05441.webp"
          alt=""
          className="w-7 h-7 object-contain shrink-0"
        />
        {!collapsed && (
          <span className="font-display text-[15px] font-semibold tracking-tight">sunCRM</span>
        )}
        <button
          onClick={onToggleCollapsed}
          className="hidden md:flex items-center justify-center w-6 h-6 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ml-auto transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronLeft className="w-3.5 h-3.5 text-zinc-500" />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const visibleChildren = hasChildren ? getVisibleChildren(item) : [];
            const isExpanded = isGroupExpanded(item.id);
            const isActive = isItemActive(item.id, visibleChildren);

            if (hasChildren && visibleChildren.length === 0) return null;

            return (
              <li key={item.id}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => {
                        if (collapsed) {
                          setExpandedGroups([...expandedGroups, item.id]);
                          onToggleCollapsed();
                        } else {
                          toggleGroup(item.id);
                        }
                      }}
                      className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-2 h-8 rounded-md transition-colors ${
                        isActive
                          ? 'text-zinc-900 dark:text-zinc-50'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className={`flex items-center ${collapsed ? '' : 'gap-2.5'}`}>
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {!collapsed && <span className="text-[13px] font-medium">{item.label}</span>}
                      </div>
                      {!collapsed && (isExpanded ? <ChevronUp className="w-3 h-3 text-zinc-400" /> : <ChevronDown className="w-3 h-3 text-zinc-400" />)}
                    </button>
                    {isExpanded && !collapsed && (
                      <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-zinc-200 dark:border-zinc-800 pl-2">
                        {visibleChildren.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildActive = currentView === child.id;
                          return (
                            <li key={child.id}>
                              <button
                                onClick={() => { onViewChange(child.id); onCloseMobile(); }}
                                className={`w-full flex items-center gap-2.5 px-2 h-7 rounded-md transition-colors text-[13px] ${
                                  isChildActive
                                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                                }`}
                              >
                                <ChildIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{child.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => { onViewChange(item.id); onCloseMobile(); }}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} px-2 h-8 rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="text-[13px] font-medium">{item.label}</span>}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: user + sign out */}
      <div className="px-2 py-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} px-2 py-1.5`}>
          <div className="w-7 h-7 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium truncate text-zinc-900 dark:text-zinc-100">
                {profile?.full_name || profile?.email}
              </div>
              <div className="text-[11px] truncate capitalize text-zinc-500 dark:text-zinc-500">
                {profile?.role?.replace('_', ' ')}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={signOut}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} px-2 h-8 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors mt-1`}
          title={collapsed ? 'Sign Out' : ''}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-[13px] font-medium">Sign out</span>}
        </button>
      </div>
      </div>
    </>
  );
}
