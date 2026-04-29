import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, Star, Filter, BarChart3, MoreHorizontal, ChevronDown, ChevronRight, Settings, Grid3x3, Eye, CreditCard as Edit, UserCheck, Phone, MessageSquare, History, BarChart, StickyNote, Zap, List, Bell, Upload, Download, Monitor, Smartphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface HRRecord {
  Id: string;
  Name: string;
  First_Name__c: string;
  ADP_File_Number__c: string;
  Employment_Status__c: string;
  Department__c: string;
  Position__c: string;
  Job_Title__c: string;
  Personal_Phone__c: string;
  License_Plate__c: string;
  Birthday__c: string | null;
  Employee_Start_Date__c: string | null;
  Termination_Date__c: string | null;
  Reports_to__c: string | null;
  CreatedDate: string;
}

interface Equipment {
  id: string;
  Name: string;
  Computer_Name__c: string;
  Computer_Make__c: string;
  Computer_Model__c: string;
  Serial_Tag_ID__c: string;
  iPhone_Phone__c: string;
  TeamViewer_ID__c: string;
  Department__c: string;
}

interface Tab {
  id: string;
  label: string;
  object: string;
  isActive: boolean;
}

export function HRConsole() {
  const [hrRecords, setHrRecords] = useState<HRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedView, setSelectedView] = useState('Recently Viewed');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState('Name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showChangeOwnerModal, setShowChangeOwnerModal] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<HRRecord | null>(null);
  const [employeeEquipment, setEmployeeEquipment] = useState<Equipment[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const ITEMS_PER_PAGE = 100;
  const [newRecordData, setNewRecordData] = useState({
    employment_status: 'Candidate',
    record_type: 'Applicant',
    employee_name: '',
    first_name: '',
    declined_employment: false,
    declined_reason: '',
    contact_created: false,
    personal_phone: '',
    personal_email: '',
    position: '',
    applicant_notes: '',
    applicant_source: '',
    interview_notes: '',
    referred_by: '',
    interview_date: '',
    date_received: '',
    offer_date: '',
    date_called: '',
    drug_test_administered: false,
    drug_test_results: '',
    background_administered: false,
    background_results: '',
    employee_start_date: '',
    dt_bg_given: '',
    sent_email_to_manager: false,
    owner: 'IT Support'
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'hr', label: 'HR', object: 'hr', isActive: true }
  ]);
  const { profile } = useAuth();

  const viewOptions = [
    'Recently Viewed',
    'All HR Records',
    'Active Employees',
    'Candidates',
    'Inactive',
    'Terminated'
  ];

  const columns = [
    { key: 'Name', label: 'Employee Name', sortable: true, sticky: true, width: 'min-w-[200px]' },
    { key: 'First_Name__c', label: 'First Name', sortable: true, width: 'min-w-[140px]' },
    { key: 'ADP_File_Number__c', label: 'Employee #', sortable: true, width: 'min-w-[120px]' },
    { key: 'Employment_Status__c', label: 'Employment Status', sortable: true, width: 'min-w-[160px]' },
    { key: 'Department__c', label: 'Department', sortable: true, width: 'min-w-[140px]' },
    { key: 'Position__c', label: 'Position', sortable: true, width: 'min-w-[160px]' },
    { key: 'Job_Title__c', label: 'Job Title', sortable: true, width: 'min-w-[160px]' },
    { key: 'Personal_Phone__c', label: 'Personal Phone', sortable: false, width: 'min-w-[140px]' },
    { key: 'Employee_Start_Date__c', label: 'Start Date', sortable: true, width: 'min-w-[120px]' },
    { key: 'Birthday__c', label: 'Birthday', sortable: true, width: 'min-w-[120px]' },
    { key: 'License_Plate__c', label: 'License Plate', sortable: false, width: 'min-w-[130px]' },
    { key: 'Reports_to__c', label: 'Reports To', sortable: true, width: 'min-w-[140px]' }
  ];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection, selectedView]);

  useEffect(() => {
    loadHRData();
  }, [profile, currentPage, selectedView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const searchInput = document.getElementById('list-search');
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showViewDropdown && !target.closest('.view-dropdown-container')) {
        setShowViewDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showViewDropdown]);

  const loadEquipmentForEmployee = async (hrRecordId: string) => {
    try {
      setLoadingEquipment(true);
      const { data, error } = await supabase
        .from('company_equipment')
        .select('id, Name, Computer_Name__c, Computer_Make__c, Computer_Model__c, Serial_Tag_ID__c, iPhone_Phone__c, TeamViewer_ID__c, Department__c')
        .eq('hr_record_id', hrRecordId)
        .order('Name');

      if (error) throw error;
      setEmployeeEquipment(data || []);
    } catch (error) {
      console.error('Error loading equipment:', error);
      setEmployeeEquipment([]);
    } finally {
      setLoadingEquipment(false);
    }
  };

  const loadHRData = async () => {
    try {
      setLoading(true);

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('hr_records')
        .select('*', { count: 'exact' });

      // Apply view filter
      switch (selectedView) {
        case 'Active Employees':
          query = query.eq('Employment_Status__c', 'Active');
          break;
        case 'Candidates':
          query = query.eq('Employment_Status__c', 'Candidate');
          break;
        case 'Inactive':
          query = query.eq('Employment_Status__c', 'Inactive');
          break;
        case 'Terminated':
          query = query.eq('Employment_Status__c', 'Terminated');
          break;
        case 'Recently Viewed':
          // Show most recently created/updated records
          query = query.order('CreatedDate', { ascending: false });
          break;
        // 'All HR Records' - no filter
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`Name.ilike.%${searchTerm}%,First_Name__c.ilike.%${searchTerm}%,Department__c.ilike.%${searchTerm}%`);
      }

      // Apply sorting (unless Recently Viewed which uses its own sorting)
      if (selectedView !== 'Recently Viewed') {
        query = query.order(sortField, { ascending: sortDirection === 'asc' });
      }

      // Apply pagination
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      setHrRecords(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading HR data:', error);
      setHrRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowSelect = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === hrRecords.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(hrRecords.map(r => r.Id)));
    }
  };

  const openNewTab = (label: string, object: string) => {
    const newTab: Tab = {
      id: `${object}-${Date.now()}`,
      label,
      object,
      isActive: false
    };
    setTabs(prev => [...prev, newTab]);
  };

  const setActiveTab = (tabId: string) => {
    setTabs(prev => prev.map(tab => ({ ...tab, isActive: tab.id === tabId })));
  };

  const handleNewRecord = () => {
    console.log('New button clicked'); // Debug log
    setShowNewModal(true);
  };

  const handleSaveNewRecord = async () => {
    if (!profile?.organization_id) return;
    
    // Validate required fields
    if (!newRecordData.employment_status || !newRecordData.employee_name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const recordToSave = {
        organization_id: profile.organization_id,
        employee_name: newRecordData.employee_name,
        first_name: newRecordData.first_name,
        employee_number: `EMP-${Date.now()}`, // Generate a unique employee number
        employment_status: newRecordData.employment_status,
        department: newRecordData.position || 'Not Specified',
        position: newRecordData.position || 'Not Specified',
        job_title: newRecordData.position || 'Not Specified',
        personal_phone: newRecordData.personal_phone,
        // Store additional applicant data in a JSON field or separate fields
        // For now, we'll use the existing structure
      };

      const { error } = await supabase
        .from('hr_records')
        .insert(recordToSave);

      if (error) throw error;

      // Reset form and close modal
      setNewRecordData({
        employment_status: 'Candidate',
        record_type: 'Applicant',
        employee_name: '',
        first_name: '',
        declined_employment: false,
        declined_reason: '',
        contact_created: false,
        personal_phone: '',
        personal_email: '',
        position: '',
        applicant_notes: '',
        applicant_source: '',
        interview_notes: '',
        referred_by: '',
        interview_date: '',
        date_received: '',
        offer_date: '',
        date_called: '',
        drug_test_administered: false,
        drug_test_results: '',
        background_administered: false,
        background_results: '',
        employee_start_date: '',
        dt_bg_given: '',
        sent_email_to_manager: false,
        owner: 'IT Support'
      });
      setShowNewModal(false);
      loadHRData(); // Refresh the table
      alert('HR record created successfully!');
    } catch (error) {
      console.error('Error creating HR record:', error);
      alert('Error creating HR record. Please try again.');
    }
  };

  const handleImport = () => {
    setShowImportModal(true);
  };

  const handleFileUpload = async () => {
    if (!importFile || !profile?.organization_id) return;

    try {
      const text = await importFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const records = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const record: any = { organization_id: profile.organization_id };
          
          headers.forEach((header, index) => {
            const value = values[index] || null;
            switch (header.toLowerCase()) {
              case 'employee name':
              case 'employee_name':
                record.employee_name = value;
                break;
              case 'first name':
              case 'first_name':
                record.first_name = value;
                break;
              case 'employee number':
              case 'employee_number':
                record.employee_number = value;
                break;
              case 'employment status':
              case 'employment_status':
                record.employment_status = value || 'Active';
                break;
              case 'department':
                record.department = value;
                break;
              case 'position':
                record.position = value;
                break;
              case 'job title':
              case 'job_title':
                record.job_title = value;
                break;
              case 'personal phone':
              case 'personal_phone':
                record.personal_phone = value;
                break;
              case 'license plate':
              case 'license_plate':
                record.license_plate = value;
                break;
              case 'birthday':
                record.birthday = value ? new Date(value).toISOString().split('T')[0] : null;
                break;
              case 'employee start date':
              case 'employee_start_date':
                record.employee_start_date = value ? new Date(value).toISOString().split('T')[0] : null;
                break;
              case 'termination date':
              case 'termination_date':
                record.termination_date = value ? new Date(value).toISOString().split('T')[0] : null;
                break;
              case 'reports to':
              case 'reports_to':
                record.reports_to = value;
                break;
            }
          });
          
          if (record.employee_name && record.first_name && record.employee_number) {
            records.push(record);
          }
        }
      }

      if (records.length > 0) {
        const { error } = await supabase
          .from('hr_records')
          .insert(records);

        if (error) throw error;

        setShowImportModal(false);
        setImportFile(null);
        loadHRData();
        alert(`Successfully imported ${records.length} HR records`);
      }
    } catch (error) {
      console.error('Error importing HR data:', error);
      alert('Error importing data. Please check the file format.');
    }
  };

  const handleChangeOwner = () => {
    if (selectedRows.size === 0) return;
    setShowChangeOwnerModal(true);
  };

  const handleSearch = () => {
    loadHRData();
  };

  const handleExportCSV = () => {
    const csvHeaders = [
      'Employee Name', 'First Name', 'Birthday', 'Employee Number', 'Employment Status',
      'Department', 'Position', 'Job Title', 'Employee Start Date', 'Termination Date',
      'Reports To', 'Personal Phone', 'License Plate', 'Created Date'
    ];

    const csvRows = hrRecords.map(record => [
      record.employee_name || '',
      record.first_name || '',
      record.birthday ? new Date(record.birthday).toLocaleDateString() : '',
      record.employee_number || '',
      record.employment_status || '',
      record.department || '',
      record.position || '',
      record.job_title || '',
      record.employee_start_date ? new Date(record.employee_start_date).toLocaleDateString() : '',
      record.termination_date ? new Date(record.termination_date).toLocaleDateString() : '',
      record.reports_to || '',
      record.personal_phone || '',
      record.license_plate || '',
      new Date(record.created_at).toLocaleDateString()
    ].map(field => `"${field}"`).join(','));

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hr_records_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* App Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="https://husbupeealwuxyopfwwb.supabase.co/storage/v1/object/public/logos/03018223-ac24-400d-acbc-2c1480a05441.webp" 
                alt="Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="font-semibold text-gray-900">Admin Console</span>
            </div>
            
            {/* Tab Bar */}
            <div className="flex items-center">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 text-sm border-b-2 ${
                    tab.isActive 
                      ? 'border-blue-500 text-blue-600 bg-blue-50' 
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => openNewTab('New Tab', 'object')}
                className="ml-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 border border-gray-300 rounded"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Global Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-1.5 text-gray-400 hover:text-gray-600">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* List View Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative view-dropdown-container">
                <button
                  onClick={() => setShowViewDropdown(!showViewDropdown)}
                  className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  {selectedView}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showViewDropdown && (
                  <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      {viewOptions.map((view) => (
                        <button
                          key={view}
                          onClick={() => {
                            setSelectedView(view);
                            setShowViewDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            selectedView === view
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {view}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={loadHRData}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <Star className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-500">Updated a few seconds ago</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="list-search"
                type="text"
                placeholder="Search this list..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button 
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="p-1.5 text-gray-400 hover:text-gray-600"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            
            <button className="p-1.5 text-gray-400 hover:text-gray-600">
              <Filter className="w-4 h-4" />
            </button>
            
            <button className="p-1.5 text-gray-400 hover:text-gray-600">
              <BarChart3 className="w-4 h-4" />
            </button>
            
            <button className="p-1.5 text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            onClick={handleExportCSV}
            disabled={hrRecords.length === 0}
            className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleNewRecord}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
          >
            New
          </button>
          <button
            onClick={handleImport}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
          >
            Import
          </button>
          <button
            onClick={handleChangeOwner}
            disabled={selectedRows.size === 0}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Change Owner
          </button>
        </div>
      </div>

      {/* Pagination - Top */}
      {totalCount > ITEMS_PER_PAGE && (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE), p + 1))}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-20">
            <tr className="border-b-2 border-gray-300">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedRows.size === hrRecords.length && hrRecords.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 cursor-pointer"
                />
              </th>
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide ${
                    column.sticky && index === 0 ? 'sticky left-12 bg-gray-100 z-20' : ''
                  } ${column.width || ''} whitespace-nowrap`}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
                    >
                      {column.label}
                      {sortField === column.key && (
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : hrRecords.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-12 text-center">
                  <div className="text-gray-500">
                    <p className="text-lg font-medium">No items to display</p>
                    <p className="text-sm mt-1">Try changing your filters or search term</p>
                    <button
                      onClick={handleNewRecord}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                    >
                      New
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              hrRecords.map((record, idx) => (
                <tr key={record.Id} className={`hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-200 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(record.Id)}
                      onChange={() => handleRowSelect(record.Id)}
                      className="rounded border-gray-300 cursor-pointer"
                    />
                  </td>
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3.5 text-sm ${
                        column.sticky && index === 0 ? 'sticky left-12 bg-inherit z-10' : ''
                      } ${column.width || ''}`}
                    >
                      {column.key === 'Name' ? (
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            loadEquipmentForEmployee(record.Id);
                          }}
                          className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                        >
                          {record[column.key as keyof HRRecord] || '-'}
                        </button>
                      ) : column.key === 'Birthday__c' || column.key === 'Employee_Start_Date__c' || column.key === 'Termination_Date__c' ? (
                        <span className="text-gray-700">
                          {record[column.key as keyof HRRecord]
                            ? new Date(record[column.key as keyof HRRecord] as string).toLocaleDateString()
                            : '-'}
                        </span>
                      ) : (
                        <span className="text-gray-700">{record[column.key as keyof HRRecord] || '-'}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} items • Sorted by {sortField.replace('_', ' ')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE), p + 1))}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals - keeping all the existing modal code */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white px-6 py-4">
              <h2 className="text-xl font-semibold">New HR: Applicant</h2>
              <p className="text-blue-100 text-sm">* = Required Information</p>
            </div>
            
            {/* Form Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <form className="space-y-8">
                {/* Information Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        *Employment Status
                      </label>
                      <select
                        value={newRecordData.employment_status}
                        onChange={(e) => setNewRecordData({...newRecordData, employment_status: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="Candidate">Candidate</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Record Type
                      </label>
                      <select
                        value={newRecordData.record_type}
                        onChange={(e) => setNewRecordData({...newRecordData, record_type: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Applicant">Applicant</option>
                        <option value="Employee">Employee</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        *Employee Name
                      </label>
                      <input
                        type="text"
                        value={newRecordData.employee_name}
                        onChange={(e) => setNewRecordData({...newRecordData, employee_name: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={newRecordData.first_name}
                        onChange={(e) => setNewRecordData({...newRecordData, first_name: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Personal Phone
                      </label>
                      <input
                        type="tel"
                        value={newRecordData.personal_phone}
                        onChange={(e) => setNewRecordData({...newRecordData, personal_phone: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Personal Email
                      </label>
                      <input
                        type="email"
                        value={newRecordData.personal_email}
                        onChange={(e) => setNewRecordData({...newRecordData, personal_email: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <input
                        type="text"
                        value={newRecordData.position}
                        onChange={(e) => setNewRecordData({...newRecordData, position: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Applicant Source
                      </label>
                      <input
                        type="text"
                        value={newRecordData.applicant_source}
                        onChange={(e) => setNewRecordData({...newRecordData, applicant_source: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Referred By
                      </label>
                      <input
                        type="text"
                        value={newRecordData.referred_by}
                        onChange={(e) => setNewRecordData({...newRecordData, referred_by: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Date
                      </label>
                      <input
                        type="date"
                        value={newRecordData.interview_date}
                        onChange={(e) => setNewRecordData({...newRecordData, interview_date: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Received
                      </label>
                      <input
                        type="date"
                        value={newRecordData.date_received}
                        onChange={(e) => setNewRecordData({...newRecordData, date_received: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Offer Date
                      </label>
                      <input
                        type="date"
                        value={newRecordData.offer_date}
                        onChange={(e) => setNewRecordData({...newRecordData, offer_date: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Called
                      </label>
                      <input
                        type="date"
                        value={newRecordData.date_called}
                        onChange={(e) => setNewRecordData({...newRecordData, date_called: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee Start Date
                      </label>
                      <input
                        type="date"
                        value={newRecordData.employee_start_date}
                        onChange={(e) => setNewRecordData({...newRecordData, employee_start_date: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DT/BG Given
                      </label>
                      <input
                        type="date"
                        value={newRecordData.dt_bg_given}
                        onChange={(e) => setNewRecordData({...newRecordData, dt_bg_given: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Drug Test Results
                      </label>
                      <select
                        value={newRecordData.drug_test_results}
                        onChange={(e) => setNewRecordData({...newRecordData, drug_test_results: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Background Results
                      </label>
                      <select
                        value={newRecordData.background_results}
                        onChange={(e) => setNewRecordData({...newRecordData, background_results: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Owner
                      </label>
                      <input
                        type="text"
                        value={newRecordData.owner}
                        onChange={(e) => setNewRecordData({...newRecordData, owner: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="declined_employment"
                        checked={newRecordData.declined_employment}
                        onChange={(e) => setNewRecordData({...newRecordData, declined_employment: e.target.checked})}
                        className="rounded border-gray-300 mr-2"
                      />
                      <label htmlFor="declined_employment" className="text-sm text-gray-700">
                        Declined Employment
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="contact_created"
                        checked={newRecordData.contact_created}
                        onChange={(e) => setNewRecordData({...newRecordData, contact_created: e.target.checked})}
                        className="rounded border-gray-300 mr-2"
                      />
                      <label htmlFor="contact_created" className="text-sm text-gray-700">
                        Contact Created
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="drug_test_administered"
                        checked={newRecordData.drug_test_administered}
                        onChange={(e) => setNewRecordData({...newRecordData, drug_test_administered: e.target.checked})}
                        className="rounded border-gray-300 mr-2"
                      />
                      <label htmlFor="drug_test_administered" className="text-sm text-gray-700">
                        Drug Test Administered
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="background_administered"
                        checked={newRecordData.background_administered}
                        onChange={(e) => setNewRecordData({...newRecordData, background_administered: e.target.checked})}
                        className="rounded border-gray-300 mr-2"
                      />
                      <label htmlFor="background_administered" className="text-sm text-gray-700">
                        Background Administered
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sent_email_to_manager"
                        checked={newRecordData.sent_email_to_manager}
                        onChange={(e) => setNewRecordData({...newRecordData, sent_email_to_manager: e.target.checked})}
                        className="rounded border-gray-300 mr-2"
                      />
                      <label htmlFor="sent_email_to_manager" className="text-sm text-gray-700">
                        Sent Email to Manager
                      </label>
                    </div>
                  </div>

                  {/* Text Areas */}
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Declined Reason
                      </label>
                      <textarea
                        value={newRecordData.declined_reason}
                        onChange={(e) => setNewRecordData({...newRecordData, declined_reason: e.target.value})}
                        rows={3}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Applicant Notes
                      </label>
                      <textarea
                        value={newRecordData.applicant_notes}
                        onChange={(e) => setNewRecordData({...newRecordData, applicant_notes: e.target.value})}
                        rows={3}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Notes
                      </label>
                      <textarea
                        value={newRecordData.interview_notes}
                        onChange={(e) => setNewRecordData({...newRecordData, interview_notes: e.target.value})}
                        rows={3}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewRecord}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-semibold">Import HR Records</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <p className="font-medium mb-2">Expected CSV format:</p>
                <p>Employee Name, First Name, Employee Number, Employment Status, Department, Position, Job Title, Personal Phone, License Plate, Birthday, Employee Start Date, Termination Date, Reports to</p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!importFile}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Owner Modal */}
      {showChangeOwnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-semibold">Change Owner</h2>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Change owner for {selectedRows.size} selected record(s)
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Owner
                </label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select new owner...</option>
                  <option value="IT Support">IT Support</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Department Head">Department Head</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => setShowChangeOwnerModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowChangeOwnerModal(false);
                  setSelectedRows(new Set());
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Change Owner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4">
              <h2 className="text-xl font-semibold">{selectedRecord.Name}</h2>
              <p className="text-blue-100 text-sm">{selectedRecord.Position__c || selectedRecord.Job_Title__c}</p>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">First Name:</span> <span className="font-medium">{selectedRecord.First_Name__c || '-'}</span></div>
                    <div><span className="text-gray-600">Employee #:</span> <span className="font-medium">{selectedRecord.ADP_File_Number__c || '-'}</span></div>
                    <div><span className="text-gray-600">Personal Phone:</span> <span className="font-medium">{selectedRecord.Personal_Phone__c || '-'}</span></div>
                    <div><span className="text-gray-600">Birthday:</span> <span className="font-medium">
                      {selectedRecord.Birthday__c ? new Date(selectedRecord.Birthday__c).toLocaleDateString() : '-'}
                    </span></div>
                    <div><span className="text-gray-600">License Plate:</span> <span className="font-medium">{selectedRecord.License_Plate__c || '-'}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Employment Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Status:</span> <span className={`font-medium px-2 py-0.5 rounded ${
                      selectedRecord.Employment_Status__c === 'Active' ? 'bg-green-100 text-green-800' :
                      selectedRecord.Employment_Status__c === 'Terminated' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{selectedRecord.Employment_Status__c || '-'}</span></div>
                    <div><span className="text-gray-600">Department:</span> <span className="font-medium">{selectedRecord.Department__c || '-'}</span></div>
                    <div><span className="text-gray-600">Position:</span> <span className="font-medium">{selectedRecord.Position__c || '-'}</span></div>
                    <div><span className="text-gray-600">Job Title:</span> <span className="font-medium">{selectedRecord.Job_Title__c || '-'}</span></div>
                    <div><span className="text-gray-600">Start Date:</span> <span className="font-medium">
                      {selectedRecord.Employee_Start_Date__c ? new Date(selectedRecord.Employee_Start_Date__c).toLocaleDateString() : '-'}
                    </span></div>
                    {selectedRecord.Termination_Date__c && (
                      <div><span className="text-gray-600">Termination Date:</span> <span className="font-medium text-red-600">
                        {new Date(selectedRecord.Termination_Date__c).toLocaleDateString()}
                      </span></div>
                    )}
                    <div><span className="text-gray-600">Reports To:</span> <span className="font-medium">{selectedRecord.Reports_to__c || '-'}</span></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Company Equipment
                </h3>
                {loadingEquipment ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                    Loading equipment...
                  </div>
                ) : employeeEquipment.length > 0 ? (
                  <div className="space-y-3">
                    {employeeEquipment.map((equipment) => (
                      <div key={equipment.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-3">
                          {equipment.Computer_Name__c ? (
                            <Monitor className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Smartphone className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm">{equipment.Name}</div>
                            <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                              {equipment.Computer_Name__c && (
                                <div><span className="text-gray-500">Computer:</span> {equipment.Computer_Name__c}</div>
                              )}
                              {equipment.Computer_Make__c && equipment.Computer_Model__c && (
                                <div><span className="text-gray-500">Model:</span> {equipment.Computer_Make__c} {equipment.Computer_Model__c}</div>
                              )}
                              {equipment.Serial_Tag_ID__c && (
                                <div><span className="text-gray-500">Serial:</span> {equipment.Serial_Tag_ID__c}</div>
                              )}
                              {equipment.iPhone_Phone__c && (
                                <div><span className="text-gray-500">Phone:</span> {equipment.iPhone_Phone__c}</div>
                              )}
                              {equipment.TeamViewer_ID__c && (
                                <div><span className="text-gray-500">TeamViewer:</span> {equipment.TeamViewer_ID__c}</div>
                              )}
                              {equipment.Department__c && (
                                <div><span className="text-gray-500">Dept:</span> {equipment.Department__c}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                    No equipment assigned
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">System Information</h3>
                <div className="text-sm text-gray-600">
                  <div><span className="font-medium">Created:</span> {new Date(selectedRecord.CreatedDate).toLocaleString()}</div>
                  <div><span className="font-medium">Record ID:</span> {selectedRecord.Id}</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}