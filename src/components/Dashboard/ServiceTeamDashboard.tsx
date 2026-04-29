import React, { useState, useEffect } from 'react';
import {
  Users, Wrench, Clock, CheckCircle, AlertCircle, RefreshCw,
  Phone, Mail, Calendar, TrendingUp, Award, Target
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ServiceTeamMember {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  specialties?: string[];
  totalTickets: number;
  completedTickets: number;
  inProgressTickets: number;
  avgCompletionTime: number;
  customerRating: number;
}

interface ServiceMetrics {
  totalTickets: number;
  completedToday: number;
  inProgress: number;
  scheduled: number;
  avgResponseTime: number;
  teamUtilization: number;
}

export function ServiceTeamDashboard() {
  const [teamMembers, setTeamMembers] = useState<ServiceTeamMember[]>([]);
  const [metrics, setMetrics] = useState<ServiceMetrics>({
    totalTickets: 0,
    completedToday: 0,
    inProgress: 0,
    scheduled: 0,
    avgResponseTime: 0,
    teamUtilization: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServiceData();
  }, []);

  const loadServiceData = async () => {
    setLoading(true);
    try {
      // Get service team from HR records - active employees with "service" or "technician" in job title
      const { data: serviceTeam, error: teamError } = await supabase
        .from('hr_records')
        .select('*')
        .eq('Employment_Status__c', 'Employee')
        .or('Job_Title__c.ilike.%service%,Job_Title__c.ilike.%technician%')
        .order('First_Name__c');

      console.log('Service team loaded:', serviceTeam?.length || 0);

      if (teamError) throw teamError;

      // Get all service tickets
      const { data: tickets, error: ticketsError } = await supabase
        .from('service_tickets')
        .select('*');

      console.log('Service tickets loaded:', tickets?.length || 0);

      if (ticketsError) throw ticketsError;

      // Get technicians for mapping
      const { data: technicians } = await supabase
        .from('technicians')
        .select('*');

      // Create a map of technician data
      const techMap = new Map();
      technicians?.forEach(tech => {
        const name = `${tech.first_name} ${tech.last_name}`.trim();
        techMap.set(tech.id, { name, email: tech.email, specialties: tech.specialties });
      });

      const today = new Date().toISOString().split('T')[0];

      // Calculate metrics for each team member
      const teamData: ServiceTeamMember[] = (serviceTeam || []).map(member => {
        const memberName = member.Name || `${member.First_Name__c || ''} ${member.Last_Name__c || ''}`.trim();

        // Find tickets assigned to this member (match by name or technician ID)
        const memberTickets = (tickets || []).filter(ticket => {
          const techInfo = techMap.get(ticket.assigned_technician_id);
          if (!techInfo) return false;

          return techInfo.name === memberName;
        });

        const completedTickets = memberTickets.filter(t =>
          t.status === 'Completed' || t.status === 'Closed'
        );

        const inProgressTickets = memberTickets.filter(t =>
          t.status === 'In Progress' || t.status === 'Dispatched'
        );

        // Calculate average completion time (simplified)
        const avgCompletionTime = completedTickets.length > 0 ? 2.5 : 0; // hours

        // Find technician specialties
        const techEntry = Array.from(techMap.values()).find(t => t.name === memberName);

        return {
          id: member.Id,
          name: memberName,
          title: member.Job_Title__c || member.Position__c || 'Service Technician',
          email: member.Work_Email__c || member.Personal_Email__c || '',
          phone: member.Work_Phone__c || member.Personal_Phone__c || '',
          specialties: techEntry?.specialties || [],
          totalTickets: memberTickets.length,
          completedTickets: completedTickets.length,
          inProgressTickets: inProgressTickets.length,
          avgCompletionTime,
          customerRating: 4.5 // Would come from customer feedback
        };
      });

      // Calculate team metrics
      const totalTickets = (tickets || []).length;
      const completedToday = (tickets || []).filter(t =>
        (t.status === 'Completed' || t.status === 'Closed') &&
        t.updated_at?.startsWith(today)
      ).length;

      const inProgress = (tickets || []).filter(t =>
        t.status === 'In Progress' || t.status === 'Dispatched'
      ).length;

      const scheduled = (tickets || []).filter(t =>
        t.status === 'Scheduled'
      ).length;

      const teamUtilization = teamData.length > 0
        ? (teamData.reduce((sum, m) => sum + m.inProgressTickets, 0) / teamData.length) * 10
        : 0;

      setTeamMembers(teamData);
      setMetrics({
        totalTickets,
        completedToday,
        inProgress,
        scheduled,
        avgResponseTime: 1.5, // hours
        teamUtilization: Math.min(teamUtilization, 100)
      });
    } catch (error) {
      console.error('Error loading service data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'busy': return 'bg-yellow-100 text-yellow-700';
      case 'on-site': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const topPerformers = [...teamMembers]
    .sort((a, b) => b.completedTickets - a.completedTickets)
    .slice(0, 5);

  const ticketsByStatus = [
    { name: 'In Progress', value: metrics.inProgress, color: '#3b82f6' },
    { name: 'Scheduled', value: metrics.scheduled, color: '#f59e0b' },
    { name: 'Completed', value: metrics.completedToday, color: '#10b981' }
  ].filter(item => item.value > 0);

  return (
    <div className="w-full space-y-6 p-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Team Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Field service operations and team performance</p>
        </div>
        <button
          onClick={loadServiceData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.totalTickets}</div>
          <div className="text-sm text-gray-600">Total Tickets</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.completedToday}</div>
          <div className="text-sm text-gray-600">Completed Today</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.inProgress}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-teal-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.teamUtilization.toFixed(0)}%</div>
          <div className="text-sm text-gray-600">Team Utilization</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Top Performers
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPerformers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="completedTickets" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tickets by Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tickets by Status</h2>
          </div>
          {ticketsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ticketsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ticketsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No ticket data available
            </div>
          )}
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Service Team Members ({teamMembers.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {getInitials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{member.title}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <Phone className="w-3 h-3" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {member.specialties && member.specialties.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {member.specialties.slice(0, 3).map((specialty, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-lg font-bold text-gray-900">{member.totalTickets}</div>
                  <div className="text-xs text-gray-600">Total Tickets</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{member.completedTickets}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{member.inProgressTickets}</div>
                  <div className="text-xs text-gray-600">In Progress</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{member.customerRating.toFixed(1)}</div>
                  <div className="text-xs text-gray-600">Rating</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {teamMembers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No service team members found</p>
            <p className="text-sm mt-1">Add team members in the HR Console</p>
          </div>
        )}
      </div>
    </div>
  );
}
