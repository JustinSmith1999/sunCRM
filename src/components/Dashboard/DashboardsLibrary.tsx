import React, { useState, useMemo } from 'react';
import { Search, LayoutDashboard, Folder, Calendar, User, Filter, TrendingUp, ArrowLeft } from 'lucide-react';
import { getDashboardComponent } from './dashboards';

interface Dashboard {
  id: string;
  title: string;
  folderName: string;
  description: string;
  type: string;
  createdDate: string;
  lastModifiedDate: string;
  owner: string;
}

const dashboardsData: Dashboard[] = [
  { id: '1', title: 'Sales Display Dashboard 2', folderName: 'Sales Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2018-08-23', lastModifiedDate: '2024-11-25', owner: 'Sales Team' },
  { id: '2', title: 'Install Display Dashboard', folderName: 'Install Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2018-09-21', lastModifiedDate: '2020-11-10', owner: 'Install Team' },
  { id: '3', title: 'Marketing Dashboard', folderName: 'Marketing Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2018-09-27', lastModifiedDate: '2025-05-12', owner: 'Marketing' },
  { id: '4', title: 'Executive Dashboard - Current YTD', folderName: 'Executive Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2018-12-06', lastModifiedDate: '2024-01-25', owner: 'Executive' },
  { id: '5', title: 'Executive Dashboard - All Time', folderName: 'Executive Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2018-12-12', lastModifiedDate: '2023-04-12', owner: 'Executive' },
  { id: '6', title: 'Service Dashboard', folderName: 'Service Dashboard Folder', description: '', type: 'SpecifiedUser', createdDate: '2018-02-06', lastModifiedDate: '2025-07-09', owner: 'Service' },
  { id: '7', title: 'Engineering Dashboard', folderName: 'Engineering Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2018-02-09', lastModifiedDate: '2024-04-12', owner: 'Engineering' },
  { id: '8', title: 'Job Flow Dashboard', folderName: 'Processing Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2018-02-23', lastModifiedDate: '2020-11-10', owner: 'Processing' },
  { id: '9', title: 'Call Center Dashboard - Display 2', folderName: 'Call Center Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2019-07-30', lastModifiedDate: '2024-10-16', owner: 'Call Center' },
  { id: '10', title: 'Commercial Tracking - CE', folderName: 'Commercial Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2019-08-02', lastModifiedDate: '2021-08-02', owner: 'Commercial' },
  { id: '11', title: 'Commercial Tracking - CE & PM', folderName: 'Commercial Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2019-08-02', lastModifiedDate: '2021-08-02', owner: 'Commercial' },
  { id: '12', title: 'Finance Dashboard - Expirations', folderName: 'Finance Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2019-12-17', lastModifiedDate: '2025-03-28', owner: 'Finance' },
  { id: '13', title: 'Finance Dashboard - Scheduled Installs', folderName: 'Finance Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2020-01-10', lastModifiedDate: '2023-12-12', owner: 'Finance' },
  { id: '14', title: 'Payment Collection', folderName: 'Finance Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2020-01-30', lastModifiedDate: '2021-02-11', owner: 'Finance' },
  { id: '15', title: 'Procurement Dashboard', folderName: 'Procurement Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2020-01-31', lastModifiedDate: '2020-01-31', owner: 'Procurement' },
  { id: '16', title: 'Submissions Dashboard', folderName: 'Processing Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2020-02-19', lastModifiedDate: '2025-06-13', owner: 'Processing' },
  { id: '17', title: 'Internal Dashboard', folderName: 'Sales Admin Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2020-02-21', lastModifiedDate: '2023-04-20', owner: 'Sales Admin' },
  { id: '18', title: 'Gross Margin Dashboard', folderName: 'Sales Admin Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2020-03-03', lastModifiedDate: '2021-06-25', owner: 'Sales Admin' },
  { id: '19', title: 'Management Recap', folderName: 'Management Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2019-03-15', lastModifiedDate: '2021-06-22', owner: 'Management' },
  { id: '20', title: 'Closeout Dashboard', folderName: 'Processing Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2019-04-26', lastModifiedDate: '2025-05-28', owner: 'Processing' },
  { id: '21', title: 'Call Center Dashboard - Display 1', folderName: 'Call Center Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2019-05-02', lastModifiedDate: '2020-11-02', owner: 'Call Center' },
  { id: '22', title: 'SF Cleanup 1 Dashboard', folderName: 'SF Cleanup Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2019-05-13', lastModifiedDate: '2025-07-15', owner: 'Admin' },
  { id: '23', title: 'Executive - Pipeline', folderName: 'Executive Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2019-06-20', lastModifiedDate: '2023-04-17', owner: 'Executive' },
  { id: '24', title: 'Permit Dashboard', folderName: 'Processing Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2019-01-03', lastModifiedDate: '2024-01-04', owner: 'Processing' },
  { id: '25', title: 'Opp Assignment Dashboard', folderName: 'Sales Admin Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2019-01-08', lastModifiedDate: '2025-05-29', owner: 'Sales Admin' },
  { id: '26', title: 'Sales Manager Dashboard', folderName: 'Sales Admin Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2019-02-11', lastModifiedDate: '2023-04-17', owner: 'Sales Admin' },
  { id: '27', title: 'Accounting Dashboard', folderName: 'Accounting Dashboard', description: 'Accounting Dashboard', type: 'SpecifiedUser', createdDate: '2020-05-27', lastModifiedDate: '2021-06-29', owner: 'Accounting' },
  { id: '28', title: 'Finance Dashboard - Pending Approval', folderName: 'Finance Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2020-03-18', lastModifiedDate: '2021-09-09', owner: 'Finance' },
  { id: '29', title: 'Sales Display Dashboard', folderName: 'Sales Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2017-09-19', lastModifiedDate: '2024-12-31', owner: 'Sales Team' },
  { id: '30', title: 'Processing - Job Status Dashboard', folderName: 'Processing Dashboards', description: 'This dashboard shows which job status each job is at depending on the month it was closed won.', type: 'SpecifiedUser', createdDate: '2017-09-21', lastModifiedDate: '2018-10-30', owner: 'Processing' },
  { id: '31', title: 'Install Dashboard', folderName: 'Install Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2017-09-21', lastModifiedDate: '2021-06-22', owner: 'Install Team' },
  { id: '32', title: 'HR Dashboard', folderName: 'HR Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2017-09-26', lastModifiedDate: '2018-11-26', owner: 'HR' },
  { id: '33', title: '360 SMS Dashboard', folderName: '360 SMS Dashboard Folder', description: '', type: 'SpecifiedUser', createdDate: '2017-02-24', lastModifiedDate: '2024-01-04', owner: 'Marketing' },
  { id: '34', title: 'Service Dashboard - One', folderName: 'Service Dashboard Folder', description: '', type: 'SpecifiedUser', createdDate: '2021-04-06', lastModifiedDate: '2021-11-16', owner: 'Service' },
  { id: '35', title: 'Inventory', folderName: 'SUNation Inventory', description: '', type: 'SpecifiedUser', createdDate: '2021-04-14', lastModifiedDate: '2021-09-01', owner: 'Operations' },
  { id: '36', title: 'Call Center Logs', folderName: 'Call Log', description: '', type: 'SpecifiedUser', createdDate: '2021-04-29', lastModifiedDate: '2023-09-13', owner: 'Call Center' },
  { id: '37', title: 'Service - Engineering Requests', folderName: 'Service Dashboard Folder', description: '', type: 'SpecifiedUser', createdDate: '2021-05-11', lastModifiedDate: '2023-10-26', owner: 'Service' },
  { id: '38', title: 'Current Job Status', folderName: 'Management Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2021-05-25', lastModifiedDate: '2021-05-25', owner: 'Management' },
  { id: '39', title: '1 - User Adoption (Logins)', folderName: 'Salesforce Adoption Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2021-06-22', lastModifiedDate: '2022-05-24', owner: 'Admin' },
  { id: '40', title: 'Guardian Dashboard', folderName: 'Service Dashboard Folder', description: '', type: 'SpecifiedUser', createdDate: '2023-01-18', lastModifiedDate: '2024-12-11', owner: 'Service' },
  { id: '41', title: 'Service Call Center Supervisor', folderName: 'Service Dashboard Folder', description: '', type: 'SpecifiedUser', createdDate: '2023-02-01', lastModifiedDate: '2023-02-01', owner: 'Service' },
  { id: '42', title: 'Lead Source Data Review', folderName: 'Private Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2023-03-28', lastModifiedDate: '2023-04-10', owner: 'Sales Admin' },
  { id: '43', title: 'Salesperson Dashboard - Classic', folderName: 'Sales Dashboards', description: '', type: 'LoggedInUser', createdDate: '2023-10-19', lastModifiedDate: '2023-11-06', owner: 'Sales' },
  { id: '44', title: 'Sales Pipeline Dashboard V2', folderName: 'Sales Dashboards', description: 'Visibility into my projects', type: 'SpecifiedUser', createdDate: '2023-10-23', lastModifiedDate: '2024-12-03', owner: 'Sales' },
  { id: '45', title: 'Channel Partners Dashboard - Partner View', folderName: 'Partner Community Dashboard', description: '', type: 'LoggedInUser', createdDate: '2023-10-26', lastModifiedDate: '2025-07-02', owner: 'Partners' },
  { id: '46', title: 'Resi Engineering Dashboard', folderName: 'Stegmeiers Dashboards', description: 'All Revision Data', type: 'SpecifiedUser', createdDate: '2021-09-09', lastModifiedDate: '2021-09-13', owner: 'Engineering' },
  { id: '47', title: 'Commercial Overview', folderName: 'Commercial Dashboards', description: 'Use by JM', type: 'SpecifiedUser', createdDate: '2021-10-25', lastModifiedDate: '2022-01-19', owner: 'Commercial' },
  { id: '48', title: 'Service Sales', folderName: 'Service Dashboard Folder', description: '', type: 'SpecifiedUser', createdDate: '2022-05-04', lastModifiedDate: '2024-05-20', owner: 'Service Sales' },
  { id: '49', title: 'Engineering Turnaround Dashboard', folderName: 'Engineering Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2022-03-24', lastModifiedDate: '2024-04-26', owner: 'Engineering' },
  { id: '50', title: 'SLA Dashboard', folderName: 'Service Dashboard Folder', description: '', type: 'SpecifiedUser', createdDate: '2022-03-30', lastModifiedDate: '2022-03-30', owner: 'Service' },
  { id: '51', title: 'Service Sales Dashboard - Frank Struffolino', folderName: 'Service Sales Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2022-10-06', lastModifiedDate: '2024-09-09', owner: 'Service Sales' },
  { id: '52', title: 'CFO Scorecard', folderName: 'Executive Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2022-12-19', lastModifiedDate: '2023-01-16', owner: 'Finance' },
  { id: '53', title: 'First Sit Data', folderName: 'Management Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2023-05-15', lastModifiedDate: '2023-05-15', owner: 'Management' },
  { id: '54', title: 'Aurora Dashboard', folderName: 'Stegmeiers Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2023-06-26', lastModifiedDate: '2023-07-05', owner: 'Engineering' },
  { id: '55', title: 'Opportunity - Florida', folderName: 'Florida', description: '', type: 'SpecifiedUser', createdDate: '2023-09-11', lastModifiedDate: '2023-09-11', owner: 'Sales' },
  { id: '56', title: 'Service Management', folderName: 'Service Dashboard Folder', description: '', type: 'SpecifiedUser', createdDate: '2023-10-11', lastModifiedDate: '2023-10-17', owner: 'Service' },
  { id: '57', title: 'Channel Partners Dashboard - SUNation View', folderName: 'Partner Dashboard', description: 'For SUNation Managers', type: 'SpecifiedUser', createdDate: '2023-10-13', lastModifiedDate: '2025-07-01', owner: 'Partners' },
  { id: '58', title: 'All Partners Open Opportunities', folderName: 'Partner Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2023-10-16', lastModifiedDate: '2024-08-02', owner: 'Partners' },
  { id: '59', title: 'Executive Dashboard - Backlogs', folderName: 'Executive Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2023-04-06', lastModifiedDate: '2023-05-25', owner: 'Executive' },
  { id: '60', title: 'Executive - Forecasting', folderName: 'Executive Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2023-04-14', lastModifiedDate: '2023-04-17', owner: 'Executive' },
  { id: '61', title: 'SMS Analytics', folderName: '360 SMS Dashboard Folder', description: 'Last 30 Days', type: 'SpecifiedUser', createdDate: '2023-08-08', lastModifiedDate: '2023-08-08', owner: 'Marketing' },
  { id: '62', title: 'Sales Consultant Benchmarks(Leads)', folderName: 'Sales Admin Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2021-01-07', lastModifiedDate: '2021-01-08', owner: 'Sales Admin' },
  { id: '63', title: 'First Sit to Won % - Current & Prev 2 yrs', folderName: 'Sales Admin Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2021-01-11', lastModifiedDate: '2024-12-23', owner: 'Sales Admin' },
  { id: '64', title: 'Salesperson Dashboard', folderName: 'Sales Dashboards', description: '', type: 'LoggedInUser', createdDate: '2015-04-01', lastModifiedDate: '2025-07-07', owner: 'Sales' },
  { id: '65', title: 'Project Sunroof Email Status', folderName: 'Call Center Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2023-12-05', lastModifiedDate: '2023-12-11', owner: 'Call Center' },
  { id: '66', title: 'Engineering - Revisions', folderName: 'Engineering Dashboard', description: 'All Revision Data', type: 'SpecifiedUser', createdDate: '2024-01-18', lastModifiedDate: '2024-01-18', owner: 'Engineering' },
  { id: '67', title: 'Service Project Management', folderName: 'Service Dashboard Folder', description: '', type: 'SpecifiedUser', createdDate: '2024-01-31', lastModifiedDate: '2024-01-31', owner: 'Service' },
  { id: '68', title: 'BB Resi Dashboard', folderName: 'Executive Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2024-02-08', lastModifiedDate: '2024-12-04', owner: 'Executive' },
  { id: '69', title: 'Service Dashboard - screen', folderName: 'Service Dashboard Folder', description: '', type: 'SpecifiedUser', createdDate: '2024-03-01', lastModifiedDate: '2024-03-01', owner: 'Service' },
  { id: '70', title: 'Baker Corporate Services Dashboard', folderName: 'Engineering Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2024-04-11', lastModifiedDate: '2024-04-11', owner: 'Engineering' },
  { id: '71', title: 'Service Sales Dashboard', folderName: 'Service Dashboard Folder', description: '', type: 'SpecifiedUser', createdDate: '2024-04-12', lastModifiedDate: '2024-04-17', owner: 'Service Sales' },
  { id: '72', title: 'SUNation Environmental Impact', folderName: 'Stegmeiers Dashboards', description: 'Equivalents to kWHrs Installed All Time', type: 'SpecifiedUser', createdDate: '2024-06-10', lastModifiedDate: '2024-06-24', owner: 'Marketing' },
  { id: '73', title: 'Salesperson Quarterly Review - Front End', folderName: 'Rick', description: '', type: 'SpecifiedUser', createdDate: '2024-06-19', lastModifiedDate: '2025-07-07', owner: 'Sales' },
  { id: '74', title: 'Salesperson Quarterly Review - Back End', folderName: 'Rick', description: '', type: 'SpecifiedUser', createdDate: '2024-07-23', lastModifiedDate: '2025-07-22', owner: 'Sales' },
  { id: '75', title: 'ASI Priority Board', folderName: 'Processing Dashboards', description: 'Jm Priority jobs ASI', type: 'SpecifiedUser', createdDate: '2024-09-05', lastModifiedDate: '2024-09-05', owner: 'Processing' },
  { id: '76', title: 'Resi Engineering Backlog Dashboard', folderName: 'Engineering Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2024-09-25', lastModifiedDate: '2024-11-04', owner: 'Engineering' },
  { id: '77', title: 'Sales Admin Workflow - Pre-Engineering', folderName: 'Rick', description: '', type: 'SpecifiedUser', createdDate: '2024-11-13', lastModifiedDate: '2025-08-05', owner: 'Sales Admin' },
  { id: '78', title: 'Sales Managment Business Review', folderName: 'Rick', description: '', type: 'SpecifiedUser', createdDate: '2024-11-13', lastModifiedDate: '2024-11-13', owner: 'Sales' },
  { id: '79', title: 'FINANCE DASHBOARD', folderName: 'Finance Dashboard', description: 'Department View', type: 'SpecifiedUser', createdDate: '2024-12-04', lastModifiedDate: '2024-12-04', owner: 'Finance' },
  { id: '80', title: 'Average Timelines', folderName: 'Rick', description: '', type: 'SpecifiedUser', createdDate: '2024-12-04', lastModifiedDate: '2025-04-11', owner: 'Operations' },
  { id: '81', title: 'Sales Admin Workflow - ENG & Beyond', folderName: 'Rick', description: '', type: 'SpecifiedUser', createdDate: '2025-01-03', lastModifiedDate: '2025-04-11', owner: 'Sales Admin' },
  { id: '82', title: 'Front End Pipeline Reviews', folderName: 'Rick', description: '', type: 'SpecifiedUser', createdDate: '2025-01-22', lastModifiedDate: '2025-01-22', owner: 'Sales' },
  { id: '83', title: 'Referral Dashboard', folderName: 'Processing Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2025-02-03', lastModifiedDate: '2025-03-20', owner: 'Processing' },
  { id: '84', title: 'New Construction', folderName: 'Ricks Public Dashboards', description: '', type: 'SpecifiedUser', createdDate: '2025-03-12', lastModifiedDate: '2025-03-14', owner: 'Sales' },
  { id: '85', title: 'Engineering Time Log (JOBS INSTALLED THIS/LAST YEAR)', folderName: 'Engineering Dashboard', description: '', type: 'SpecifiedUser', createdDate: '2025-04-18', lastModifiedDate: '2025-04-21', owner: 'Engineering' },
  { id: '86', title: 'Commercial Dashboards - For Sales User', folderName: 'Commercial Dashboards - For Sales User', description: '', type: 'LoggedInUser', createdDate: '2025-05-19', lastModifiedDate: '2025-05-19', owner: 'Sales' },
  { id: '87', title: 'Rep Metrics', folderName: 'Service Cloud Dashboards', description: 'This dashboard provides a comprehensive overview of rep work by channel, rep work by queue, and rep performance metrics', type: 'SpecifiedUser', createdDate: '2025-08-12', lastModifiedDate: '2025-08-12', owner: 'Service' },
  { id: '88', title: 'Case Management and Rep Metrics', folderName: 'Service Cloud Dashboards', description: 'This dashboard provides key insights into rep performance, including average handle time, speed to answer, and active time', type: 'SpecifiedUser', createdDate: '2025-08-12', lastModifiedDate: '2025-08-12', owner: 'Service' },
];

export function DashboardsLibrary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);

  const folders = useMemo(() => {
    const uniqueFolders = Array.from(new Set(dashboardsData.map(d => d.folderName))).sort();
    return uniqueFolders;
  }, []);

  const owners = useMemo(() => {
    const uniqueOwners = Array.from(new Set(dashboardsData.map(d => d.owner))).sort();
    return uniqueOwners;
  }, []);

  const filteredDashboards = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return dashboardsData.filter(dashboard => {
      const matchesSearch = !searchTerm || (
        dashboard.title.toLowerCase().includes(searchLower) ||
        dashboard.folderName.toLowerCase().includes(searchLower) ||
        dashboard.description.toLowerCase().includes(searchLower)
      );
      const matchesFolder = selectedFolder === 'all' || dashboard.folderName === selectedFolder;
      const matchesOwner = selectedOwner === 'all' || dashboard.owner === selectedOwner;
      return matchesSearch && matchesFolder && matchesOwner;
    });
  }, [searchTerm, selectedFolder, selectedOwner]);

  const groupedDashboards = useMemo(() => {
    const grouped: { [key: string]: Dashboard[] } = {};
    filteredDashboards.forEach(dashboard => {
      if (!grouped[dashboard.folderName]) {
        grouped[dashboard.folderName] = [];
      }
      grouped[dashboard.folderName].push(dashboard);
    });
    return grouped;
  }, [filteredDashboards]);

  if (selectedDashboard) {
    const DashboardComponent = getDashboardComponent(selectedDashboard.folderName, selectedDashboard.title);

    return (
      <div className="p-3 sm:p-4 md:p-6">
        <div className="mb-4">
          <button
            onClick={() => setSelectedDashboard(null)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboards</span>
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{selectedDashboard.title}</h1>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-slate-600 mb-4">
            <div className="flex items-center gap-1">
              <Folder className="w-4 h-4" />
              <span>{selectedDashboard.folderName}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{selectedDashboard.owner}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Updated {new Date(selectedDashboard.lastModifiedDate).toLocaleDateString()}</span>
            </div>
          </div>

          {selectedDashboard.description && (
            <p className="text-slate-600 text-sm">{selectedDashboard.description}</p>
          )}
        </div>

        <DashboardComponent />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboards Library</h1>
          <p className="text-sm sm:text-base text-slate-600">
            Browse and access all {dashboardsData.length} dashboards ({filteredDashboards.length} shown)
          </p>
        </div>
        <div className="flex items-center gap-2 text-amber-600">
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-lg font-bold">{filteredDashboards.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 mb-4 sm:mb-6 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dashboards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Folders</option>
              {folders.map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Owners</option>
              {owners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {Object.keys(groupedDashboards).sort().map(folderName => (
          <div key={folderName} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-slate-600" />
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">{folderName}</h2>
                <span className="ml-auto text-xs sm:text-sm text-slate-500">
                  {groupedDashboards[folderName].length} dashboard{groupedDashboards[folderName].length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {groupedDashboards[folderName].map(dashboard => (
                <div
                  key={dashboard.id}
                  className="p-3 sm:p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <LayoutDashboard className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">
                            {dashboard.title}
                          </h3>
                          {dashboard.description && (
                            <p className="text-xs sm:text-sm text-slate-600 mb-2 line-clamp-2">
                              {dashboard.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{dashboard.owner}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Updated {new Date(dashboard.lastModifiedDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs">
                            {dashboard.type === 'LoggedInUser' ? 'Personal' : 'Shared'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedDashboard(dashboard)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-900 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredDashboards.length === 0 && (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-slate-200">
          <LayoutDashboard className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">No dashboards found</h3>
          <p className="text-sm sm:text-base text-slate-600 px-4">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
