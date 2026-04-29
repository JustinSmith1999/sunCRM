import React, { useState, useEffect } from 'react';
import { Wrench, Search, Phone, Mail, Calendar, Award, MapPin, Clock, DollarSign, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import TechnicianScheduleView from './TechnicianScheduleView';

interface Technician {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  specialties: string[];
  certification: string[];
  hire_date: string;
  employment_status: string;
  hourly_rate: number;
  vehicle_info: string;
  home_address: string;
  created_at: string;
}

export default function TechniciansManager() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);

  useEffect(() => {
    loadTechnicians();
  }, []);

  useEffect(() => {
    filterTechnicians();
  }, [technicians, searchTerm, filterStatus]);

  const loadTechnicians = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('first_name', { ascending: true });

      if (error) throw error;

      // Filter to only show service technicians (job title MUST include "Service")
      const fieldTechs = (data || []).filter(tech => {
        if (!tech.specialties || tech.specialties.length === 0) return false;

        // specialties array is [Department, Job_Title]
        const jobTitle = tech.specialties[1]?.toLowerCase() || '';

        // Job title MUST include "service"
        if (!jobTitle.includes('service')) return false;

        // Exclude office-based service roles
        if (jobTitle.includes('customer service') ||
            jobTitle.includes('service sales') ||
            jobTitle.includes('office manager') ||
            jobTitle.includes('project manager') ||
            jobTitle.includes('director')) {
          return false;
        }

        // Include only field service technician roles
        return true;
      });

      setTechnicians(fieldTechs);
    } catch (error) {
      console.error('Error loading technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTechnicians = () => {
    let filtered = technicians;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(tech => tech.employment_status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tech =>
        tech.first_name?.toLowerCase().includes(term) ||
        tech.last_name?.toLowerCase().includes(term) ||
        tech.employee_id?.toLowerCase().includes(term) ||
        tech.email?.toLowerCase().includes(term)
      );
    }

    setFilteredTechnicians(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      case 'on_leave': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (selectedTechnician) {
    return (
      <TechnicianScheduleView
        technician={selectedTechnician}
        onBack={() => setSelectedTechnician(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <Wrench className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Field Service Technicians</h1>
        </div>
        <p className="text-sm text-gray-600 mt-1">Technicians are synced from HR records</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search technicians..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex justify-center items-center h-64">
            <div className="text-gray-500">Loading technicians...</div>
          </div>
        ) : filteredTechnicians.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No field service technicians found</p>
          </div>
        ) : (
          filteredTechnicians.map(tech => (
            <div
              key={tech.id}
              onClick={() => setSelectedTechnician(tech)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-semibold text-lg">
                      {tech.first_name[0]}{tech.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {tech.first_name} {tech.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">{tech.employee_id}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tech.employment_status)}`}>
                  {tech.employment_status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {tech.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{tech.phone}</span>
                  </div>
                )}
                {tech.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{tech.email}</span>
                  </div>
                )}
                {tech.vehicle_info && (
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4" />
                    <span>{tech.vehicle_info}</span>
                  </div>
                )}
                {tech.hourly_rate && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>${tech.hourly_rate.toFixed(2)}/hour</span>
                  </div>
                )}
                {tech.hire_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Hired {new Date(tech.hire_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {tech.specialties && tech.specialties.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Specialties:</div>
                  <div className="flex flex-wrap gap-1">
                    {tech.specialties.map((specialty, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {tech.certification && tech.certification.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                    <Award className="h-3 w-3 mr-1" />
                    Certifications:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tech.certification.map((cert, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Total Technicians</div>
          <div className="text-2xl font-bold text-gray-900">{technicians.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {technicians.filter(t => t.employment_status === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">On Leave</div>
          <div className="text-2xl font-bold text-yellow-600">
            {technicians.filter(t => t.employment_status === 'on_leave').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Avg Rate</div>
          <div className="text-2xl font-bold text-gray-900">
            ${technicians.reduce((sum, t) => sum + (t.hourly_rate || 0), 0) / (technicians.filter(t => t.hourly_rate).length || 1).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
