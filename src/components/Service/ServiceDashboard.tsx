import React, { useState, useEffect } from 'react';
import { Wrench, Calendar, ClipboardList, Users, Package, DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DispatchBoard from './DispatchBoard';
import ServiceTicketsManager from './ServiceTicketsManager';
import ServiceCustomersManager from './ServiceCustomersManager';
import TechniciansManager from './TechniciansManager';
import PartsInventoryManager from './PartsInventoryManager';
import ServiceInvoicesManager from './ServiceInvoicesManager';

interface ServiceMetrics {
  total_tickets: number;
  active_tickets: number;
  completed_today: number;
  revenue_today: number;
  avg_completion_time: number;
  technicians_active: number;
  pending_invoices: number;
  parts_low_stock: number;
}

type ViewMode = 'dashboard' | 'dispatch' | 'tickets' | 'customers' | 'technicians' | 'parts' | 'invoices';

export default function ServiceDashboard() {
  const [metrics, setMetrics] = useState<ServiceMetrics>({
    total_tickets: 0,
    active_tickets: 0,
    completed_today: 0,
    revenue_today: 0,
    avg_completion_time: 0,
    technicians_active: 0,
    pending_invoices: 0,
    parts_low_stock: 0,
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      const today = new Date().toISOString().split('T')[0];

      const [ticketsResult, completedTodayResult, activeTechsResult, partsResult] = await Promise.all([
        supabase.from('service_tickets').select('id, status, actual_cost, assigned_technician_id'),
        supabase.from('service_tickets').select('id, actual_cost').eq('status', 'completed').gte('updated_at', today),
        supabase.from('service_tickets').select('assigned_technician_id').eq('scheduled_date', today).in('status', ['scheduled', 'dispatched', 'in_progress']),
        supabase.from('service_parts').select('id').filter('quantity_on_hand', 'lt', 'reorder_level'),
      ]);

      const tickets = ticketsResult.data || [];
      const activeTickets = tickets.filter(t => ['scheduled', 'dispatched', 'in_progress'].includes(t.status));
      const completedToday = completedTodayResult.data || [];
      const revenueToday = completedToday.reduce((sum, t) => sum + (t.actual_cost || 0), 0);

      // Count unique technicians working today
      const uniqueTechsToday = new Set(
        (activeTechsResult.data || [])
          .map(t => t.assigned_technician_id)
          .filter(id => id)
      );

      setMetrics({
        total_tickets: tickets.length,
        active_tickets: activeTickets.length,
        completed_today: completedToday.length,
        revenue_today: revenueToday,
        avg_completion_time: 0,
        technicians_active: uniqueTechsToday.size,
        pending_invoices: 0,
        parts_low_stock: partsResult.data?.length || 0,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'dispatch':
        return <DispatchBoard />;
      case 'tickets':
        return <ServiceTicketsManager />;
      case 'customers':
        return <ServiceCustomersManager />;
      case 'technicians':
        return <TechniciansManager />;
      case 'parts':
        return <PartsInventoryManager />;
      case 'invoices':
        return <ServiceInvoicesManager />;
      default:
        return renderDashboardView();
    }
  };

  const renderDashboardView = () => (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Active Jobs</p>
              <p className="text-3xl font-bold text-blue-600">{metrics.active_tickets}</p>
              <p className="text-xs text-gray-500 mt-1">of {metrics.total_tickets} total</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Completed Today</p>
              <p className="text-3xl font-bold text-green-600">{metrics.completed_today}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                On track
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Revenue Today</p>
              <p className="text-3xl font-bold text-gray-900">${metrics.revenue_today.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-1">from completed jobs</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Active Technicians</p>
              <p className="text-3xl font-bold text-teal-600">{metrics.technicians_active}</p>
              <p className="text-xs text-gray-500 mt-1">in the field</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {metrics.parts_low_stock > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900">Low Stock Alert</h3>
              <p className="text-sm text-orange-700">
                {metrics.parts_low_stock} parts are below reorder level. Check inventory.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={() => setViewMode('dispatch')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Dispatch Board</h3>
              <p className="text-sm text-gray-500">Schedule and assign jobs</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setViewMode('tickets')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Service Tickets</h3>
              <p className="text-sm text-gray-500">Manage all service calls</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setViewMode('customers')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Customers</h3>
              <p className="text-sm text-gray-500">View customer profiles</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setViewMode('technicians')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Wrench className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Technicians</h3>
              <p className="text-sm text-gray-500">Manage field staff</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setViewMode('parts')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Parts Inventory</h3>
              <p className="text-sm text-gray-500">Track stock levels</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setViewMode('invoices')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Invoicing</h3>
              <p className="text-sm text-gray-500">Billing and payments</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Loading service dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Wrench className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Field Service Management</h1>
            </div>
          </div>

          {viewMode !== 'dashboard' && (
            <button
              onClick={() => setViewMode('dashboard')}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}
    </div>
  );
}
