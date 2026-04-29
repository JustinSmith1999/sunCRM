import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, AlertTriangle, FileText, Zap, Users, Package, MapPin, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SolarProject {
  id: string;
  project_name: string;
  opportunity_salesforce_id: string;
  account_salesforce_id: string;
  system_size_kw: number;
  panel_count: number;
  inverter_type: string;
  battery_system: boolean;
  contract_signed_date: string;
  estimated_installation_date: string;
  actual_installation_date: string;
  pto_date: string;
  project_status: string;
  current_stage: string;
  completion_percentage: number;
  assigned_installer: string;
  assigned_project_manager: string;
  site_address: string;
  customer_name: string;
  created_at: string;
  updated_at: string;
}

interface SolarPermit {
  id: string;
  project_id: string;
  permit_type: string;
  permit_number: string;
  permit_status: string;
  submitted_date: string;
  approved_date: string;
  expiration_date: string;
}

interface SolarInspection {
  id: string;
  project_id: string;
  inspection_type: string;
  scheduled_date: string;
  completed_date: string;
  inspection_status: string;
  inspector_name: string;
  result: string;
}

interface SolarMilestone {
  id: string;
  project_id: string;
  milestone_name: string;
  milestone_type: string;
  target_date: string;
  completed_date: string;
  is_completed: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  'contract_signed': 'bg-blue-100 text-blue-800',
  'design_review': 'bg-purple-100 text-purple-800',
  'permitting': 'bg-amber-100 text-amber-800',
  'pre_installation': 'bg-orange-100 text-orange-800',
  'installation': 'bg-green-100 text-green-800',
  'inspection': 'bg-teal-100 text-teal-800',
  'pto_pending': 'bg-sky-100 text-sky-800',
  'active': 'bg-emerald-100 text-emerald-800',
  'on_hold': 'bg-slate-100 text-slate-800',
  'cancelled': 'bg-red-100 text-red-800',
};

const STATUS_COLORS: Record<string, string> = {
  'pending': 'bg-amber-100 text-amber-800',
  'submitted': 'bg-blue-100 text-blue-800',
  'approved': 'bg-green-100 text-green-800',
  'passed': 'bg-green-100 text-green-800',
  'failed': 'bg-red-100 text-red-800',
  'scheduled': 'bg-purple-100 text-purple-800',
  'completed': 'bg-emerald-100 text-emerald-800',
};

export function InstallationProjectTracker() {
  const [projects, setProjects] = useState<SolarProject[]>([]);
  const [permits, setPermits] = useState<SolarPermit[]>([]);
  const [inspections, setInspections] = useState<SolarInspection[]>([]);
  const [milestones, setMilestones] = useState<SolarMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, permitsRes, inspectionsRes, milestonesRes] = await Promise.all([
        supabase.from('solar_projects').select('*').order('created_at', { ascending: false }),
        supabase.from('solar_permits').select('*'),
        supabase.from('solar_inspections').select('*'),
        supabase.from('solar_milestones').select('*'),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (permitsRes.error) throw permitsRes.error;
      if (inspectionsRes.error) throw inspectionsRes.error;
      if (milestonesRes.error) throw milestonesRes.error;

      setProjects(projectsRes.data || []);
      setPermits(permitsRes.data || []);
      setInspections(inspectionsRes.data || []);
      setMilestones(milestonesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectPermits = (projectId: string) => {
    return permits.filter(p => p.project_id === projectId);
  };

  const getProjectInspections = (projectId: string) => {
    return inspections.filter(i => i.project_id === projectId);
  };

  const getProjectMilestones = (projectId: string) => {
    return milestones.filter(m => m.project_id === projectId);
  };

  const getFilteredProjects = () => {
    return projects.filter(project => {
      const matchesStatus = filterStatus === 'all' || project.project_status === filterStatus;
      const matchesStage = filterStage === 'all' || project.current_stage === filterStage;
      return matchesStatus && matchesStage;
    });
  };

  const calculateDaysUntil = (dateString: string | null) => {
    if (!dateString) return null;
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const ProjectCard = ({ project }: { project: SolarProject }) => {
    const projectPermits = getProjectPermits(project.id);
    const projectInspections = getProjectInspections(project.id);
    const projectMilestones = getProjectMilestones(project.id);
    const completedMilestones = projectMilestones.filter(m => m.is_completed).length;
    const daysUntilInstall = calculateDaysUntil(project.estimated_installation_date);

    const approvedPermits = projectPermits.filter(p => p.permit_status === 'approved').length;
    const passedInspections = projectInspections.filter(i => i.result === 'passed').length;

    return (
      <div
        className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer touch-manipulation"
        onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 truncate">{project.project_name}</h3>
            <p className="text-xs sm:text-sm text-slate-600 truncate">{project.site_address}</p>
            {project.customer_name && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">{project.customer_name}</p>
            )}
          </div>
          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STAGE_COLORS[project.current_stage] || 'bg-slate-100 text-slate-800'}`}>
            {project.current_stage?.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">System Size</p>
              <p className="text-sm font-medium text-slate-900">{project.system_size_kw} kW</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Panels</p>
              <p className="text-sm font-medium text-slate-900">{project.panel_count}</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span>Project Completion</span>
            <span className="font-medium">{project.completion_percentage || 0}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${project.completion_percentage || 0}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 py-3 border-t border-slate-200">
          <div className="text-center">
            <div className="flex flex-col items-center gap-1 mb-1">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-slate-500">Permits</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {approvedPermits}/{projectPermits.length}
            </p>
          </div>
          <div className="text-center">
            <div className="flex flex-col items-center gap-1 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs text-slate-500">Inspections</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {passedInspections}/{projectInspections.length}
            </p>
          </div>
          <div className="text-center">
            <div className="flex flex-col items-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-slate-500">Milestones</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {completedMilestones}/{projectMilestones.length}
            </p>
          </div>
        </div>

        {daysUntilInstall !== null && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            daysUntilInstall < 7 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
          }`}>
            {daysUntilInstall < 7 ? (
              <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5 text-red-600 flex-shrink-0" />
            ) : (
              <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs text-slate-600">Installation Date</p>
              <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                {new Date(project.estimated_installation_date).toLocaleDateString()}
                <span className={`ml-2 ${daysUntilInstall < 7 ? 'text-red-600' : 'text-blue-600'}`}>
                  ({daysUntilInstall} days)
                </span>
              </p>
            </div>
          </div>
        )}

        {project.assigned_project_manager && (
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs sm:text-sm">
            <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-600">PM:</span>
            <span className="text-slate-900 font-medium truncate">{project.assigned_project_manager}</span>
          </div>
        )}

        {selectedProject === project.id && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
            <div>
              <h4 className="font-medium text-slate-900 mb-2 text-sm sm:text-base">Permits</h4>
              {projectPermits.length === 0 ? (
                <p className="text-xs sm:text-sm text-slate-500">No permits yet</p>
              ) : (
                <div className="space-y-2">
                  {projectPermits.map((permit) => (
                    <div key={permit.id} className="flex items-center justify-between text-xs sm:text-sm bg-slate-50 p-2 rounded">
                      <span className="text-slate-700 truncate flex-1 mr-2">{permit.permit_type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[permit.permit_status] || 'bg-slate-100 text-slate-800'}`}>
                        {permit.permit_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-2 text-sm sm:text-base">Inspections</h4>
              {projectInspections.length === 0 ? (
                <p className="text-xs sm:text-sm text-slate-500">No inspections scheduled</p>
              ) : (
                <div className="space-y-2">
                  {projectInspections.map((inspection) => (
                    <div key={inspection.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm bg-slate-50 p-2 rounded gap-1 sm:gap-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-700 truncate">{inspection.inspection_type}</p>
                        <p className="text-xs text-slate-500">
                          {inspection.scheduled_date ? new Date(inspection.scheduled_date).toLocaleDateString() : 'Not scheduled'}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium self-start sm:self-auto flex-shrink-0 ${STATUS_COLORS[inspection.result || inspection.inspection_status] || 'bg-slate-100 text-slate-800'}`}>
                        {inspection.result || inspection.inspection_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-2 text-sm sm:text-base">Milestones</h4>
              {projectMilestones.length === 0 ? (
                <p className="text-xs sm:text-sm text-slate-500">No milestones defined</p>
              ) : (
                <div className="space-y-2">
                  {projectMilestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between text-xs sm:text-sm bg-slate-50 p-2 rounded gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {milestone.is_completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                        <span className={`${milestone.is_completed ? 'text-slate-700 line-through' : 'text-slate-700'} truncate`}>
                          {milestone.milestone_name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {milestone.completed_date
                          ? new Date(milestone.completed_date).toLocaleDateString()
                          : milestone.target_date
                          ? new Date(milestone.target_date).toLocaleDateString()
                          : 'TBD'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredProjects = getFilteredProjects();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Installation Project Tracker</h1>
            <p className="text-sm sm:text-base text-slate-600">Monitor solar installations from contract to PTO</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{projects.length}</p>
                <p className="text-xs sm:text-sm text-slate-600 truncate">Total Projects</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {projects.filter(p => p.current_stage === 'installation').length}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 truncate">In Installation</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {projects.filter(p => p.current_stage === 'permitting').length}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 truncate">In Permitting</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {inspections.filter(i => i.inspection_status === 'scheduled').length}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 truncate">Upcoming</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="px-4 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">All Stages</option>
            <option value="contract_signed">Contract Signed</option>
            <option value="design_review">Design Review</option>
            <option value="permitting">Permitting</option>
            <option value="pre_installation">Pre-Installation</option>
            <option value="installation">Installation</option>
            <option value="inspection">Inspection</option>
            <option value="pto_pending">PTO Pending</option>
            <option value="active">Active</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-slate-500">No projects match the selected filters</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
