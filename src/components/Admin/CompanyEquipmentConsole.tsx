import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, Star, Filter, BarChart3, MoreHorizontal, ChevronDown, ChevronRight, Settings, Grid3x3, Eye, CreditCard as Edit, UserCheck, Phone, MessageSquare, History, BarChart, StickyNote, Zap, List, Bell, Upload, Menu } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from '../Layout/Sidebar';

interface EquipmentRecord {
  id: string;
  Name: string;
  Employee_HR__c: string;
  Computer_Name__c: string;
  Username__c: string;
  Computer_Make__c: string;
  Computer_Model__c: string;
  Operating_System__c: string;
  Serial_Tag_ID__c: string;
  iPhone_Phone__c: string;
  iPhone_IMEI__c: string;
  MiFi_Phone__c: string;
  MiFi_IMEI__c: string;
  Office_Field__c: string;
  Department__c: string;
  Notes__c: string;
  Install_Date__c: string;
}

interface Tab {
  id: string;
  label: string;
  object: string;
  isActive: boolean;
}

interface CompanyEquipmentConsoleProps {
  onViewChange?: (view: string) => void;
}

export function CompanyEquipmentConsole({ onViewChange }: CompanyEquipmentConsoleProps = {}) {
  const [equipmentRecords, setEquipmentRecords] = useState<EquipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedView, setSelectedView] = useState('All');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState('Name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showChangeOwnerModal, setShowChangeOwnerModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentNavView, setCurrentNavView] = useState('equipment');
  const [showTabMenu, setShowTabMenu] = useState(false);
  const [newRecordData, setNewRecordData] = useState({
    Name: '',
    Employee_HR__c: '',
    Computer_Name__c: '',
    Username__c: '',
    Computer_Make__c: '',
    Computer_Model__c: '',
    Operating_System__c: '',
    Serial_Tag_ID__c: '',
    iPhone_Phone__c: '',
    iPhone_IMEI__c: '',
    MiFi_Phone__c: '',
    MiFi_IMEI__c: '',
    Office_Field__c: '',
    Department__c: '',
    Notes__c: ''
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'equipment', label: 'Company Equipment', object: 'equipment', isActive: true }
  ]);
  const { profile } = useAuth();

  const formatIMEI = (value: string | null | undefined): string => {
    if (!value) return '-';
    if (value.includes('E+')) {
      const num = parseFloat(value);
      return num.toFixed(0);
    }
    return value;
  };

  const columns = [
    { key: 'Name', label: 'Equipment Name', sortable: true, sticky: true, width: 'min-w-[200px]' },
    { key: 'Department__c', label: 'Dept', sortable: true, width: 'min-w-[100px]' },
    { key: 'Employee_HR__c', label: 'Employee', sortable: true, width: 'min-w-[140px]' },
    { key: 'Computer_Name__c', label: 'Computer', sortable: true, width: 'min-w-[120px]' },
    { key: 'Computer_Make__c', label: 'Make', sortable: true, width: 'min-w-[80px]' },
    { key: 'Computer_Model__c', label: 'Model', sortable: true, width: 'min-w-[120px]' },
    { key: 'Serial_Tag_ID__c', label: 'Serial', sortable: true, width: 'min-w-[140px]' },
    { key: 'iPhone_Phone__c', label: 'iPhone', sortable: false, width: 'min-w-[110px]' },
    { key: 'Office_Field__c', label: 'Location', sortable: true, width: 'min-w-[100px]' }
  ];

  useEffect(() => {
    loadEquipmentData();
  }, [searchTerm, sortField, sortDirection]);

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

  const loadEquipmentData = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('company_equipment')
        .select('*');

      if (searchTerm) {
        query = query.or(`Name.ilike.%${searchTerm}%,Department__c.ilike.%${searchTerm}%,Employee_HR__c.ilike.%${searchTerm}%,Computer_Name__c.ilike.%${searchTerm}%`);
      }

      if (sortField) {
        query = query.order(sortField, {
          ascending: sortDirection === 'asc',
          nullsFirst: false
        });
      }

      query = query.limit(100);

      const { data, error } = await query;

      if (error) {
        console.error('Error loading equipment data:', error);
        setEquipmentRecords([]);
      } else {
        setEquipmentRecords(data || []);
      }
    } catch (error) {
      console.error('Error loading equipment data:', error);
      setEquipmentRecords([]);
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
    if (selectedRows.size === equipmentRecords.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(equipmentRecords.map(r => r.id)));
    }
  };

  const openNewTab = (label: string, tabId: string) => {
    const existingTab = tabs.find(tab => tab.id === tabId);
    if (existingTab) {
      setActiveTab(tabId);
      return;
    }

    const newTab: Tab = {
      id: tabId,
      label,
      object: tabId,
      isActive: false
    };
    setTabs(prev => [...prev, newTab]);
    setTimeout(() => setActiveTab(tabId), 0);
  };

  const availableTabs = [
    { id: 'admin', label: 'Admin Dashboard' },
    { id: 'home', label: 'Home' },
    { id: 'hr', label: 'HR Console' },
    { id: 'leads', label: 'Leads' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'deals', label: 'Opportunities' },
    { id: 'cases', label: 'Cases' },
    { id: 'software', label: 'Software/Subscriptions' },
    { id: 'webforms', label: 'Web Forms' },
    { id: 'automation', label: 'Automation' },
    { id: 'flows', label: 'Flows' },
    { id: 'dashboards', label: 'Dashboards' },
    { id: 'engineering', label: 'Engineering Requests' },
    { id: 'finance', label: 'Finance' },
    { id: 'salesforce', label: 'Salesforce Requests' },
    { id: 'salesforce-sync', label: 'Salesforce Sync' },
    { id: 'reports', label: 'Reports' },
    { id: 'campaigns', label: 'Campaigns' }
  ];

  const setActiveTab = (tabId: string) => {
    setTabs(prev => prev.map(tab => ({ ...tab, isActive: tab.id === tabId })));

    if (onViewChange) {
      const viewMap: { [key: string]: string } = {
        'equipment': 'admin-equipment',
        'home': 'home',
        'admin': 'admin',
        'hr': 'admin-hr',
        'leads': 'leads',
        'contacts': 'admin-contacts',
        'accounts': 'accounts',
        'deals': 'deals',
        'cases': 'cases',
        'software': 'admin-software',
        'webforms': 'admin-webforms',
        'automation': 'admin-automation',
        'flows': 'admin-flows',
        'dashboards': 'admin-dashboards',
        'engineering': 'admin-engineering',
        'finance': 'admin-finance',
        'salesforce': 'admin-salesforce',
        'salesforce-sync': 'admin-salesforce-sync',
        'reports': 'reports',
        'campaigns': 'campaigns'
      };

      const viewName = viewMap[tabId] || tabId;
      onViewChange(viewName);
    }
  };

  const handleNewRecord = () => {
    setShowNewModal(true);
  };

  const handleSaveNewRecord = async () => {
    try {
      const { data, error } = await supabase
        .from('company_equipment')
        .insert([newRecordData])
        .select();

      if (error) throw error;

      setShowNewModal(false);
      setNewRecordData({
        Name: '',
        Employee_HR__c: '',
        Computer_Name__c: '',
        Username__c: '',
        Computer_Make__c: '',
        Computer_Model__c: '',
        Operating_System__c: '',
        Serial_Tag_ID__c: '',
        iPhone_Phone__c: '',
        iPhone_IMEI__c: '',
        MiFi_Phone__c: '',
        MiFi_IMEI__c: '',
        Office_Field__c: '',
        Department__c: '',
        Notes__c: ''
      });

      await loadEquipmentData();
      alert('Equipment record created successfully!');
    } catch (error) {
      console.error('Error saving equipment record:', error);
      alert('Error creating equipment record');
    }
  };

  const handleImport = () => {
    setShowImportModal(true);
  };

  const handleFileUpload = async () => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

      const records = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const record: any = {};

          headers.forEach((header, index) => {
            const value = values[index] || '';
            switch (header.toLowerCase()) {
              case 'type of equipment':
              case 'type_of_equipment':
                record.type_of_equipment = value;
                break;
              case 'department':
                record.department = value;
                break;
              case 'employee (hr)':
              case 'employee_hr':
                record.employee_hr = value;
                break;
              case 'computer name':
              case 'computer_name':
                record.computer_name = value;
                break;
              case 'username':
                record.username = value;
                break;
              case 'computer make':
              case 'computer_make':
                record.computer_make = value;
                break;
              case 'computer model':
              case 'computer_model':
                record.computer_model = value;
                break;
              case 'iphone phone #':
              case 'iphone_phone_number':
                record.iphone_phone_number = value;
                break;
              case 'mifi phone #':
              case 'mifi_phone_number':
                record.mifi_phone_number = value;
                break;
              case 'mifi imei':
              case 'mifi_imei':
                record.mifi_imei = value;
                break;
              case 'battery jetpack':
              case 'battery_jetpack':
                record.battery_jetpack = value;
                break;
            }
          });

          if (record.type_of_equipment) {
            record.id = Date.now().toString() + Math.random();
            record.last_modified_by = 'IT Support';
            record.last_modified_date = new Date().toISOString();
            record.created_at = new Date().toISOString();
            records.push(record);
          }
        }
      }

      if (records.length > 0) {
        setEquipmentRecords(prev => [...records, ...prev]);
        setShowImportModal(false);
        setImportFile(null);
        alert(`Successfully imported ${records.length} equipment records`);
      }
    } catch (error) {
      console.error('Error importing equipment data:', error);
      alert('Error importing data. Please check the file format.');
    }
  };

  const handleChangeOwner = () => {
    if (selectedRows.size === 0) return;
    setShowChangeOwnerModal(true);
  };

  const handleRowClick = (record: EquipmentRecord) => {
    setEditingData(record);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingData) return;

    try {
      const { error } = await supabase
        .from('company_equipment')
        .update(editingData)
        .eq('id', editingData.id);

      if (error) throw error;

      setShowEditModal(false);
      setEditingData(null);
      await loadEquipmentData();
      alert('Equipment record updated successfully!');
    } catch (error) {
      console.error('Error updating equipment record:', error);
      alert('Error updating equipment record');
    }
  };

  const handleSearch = () => {
    loadEquipmentData();
  };

  return (
    <div className="h-screen flex bg-white">
      <Sidebar
        currentView={currentNavView}
        onViewChange={(view) => {
          setCurrentNavView(view);
          setShowMobileMenu(false);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
        showOnMobile={showMobileMenu}
        onCloseMobile={() => setShowMobileMenu(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="https://husbupeealwuxyopfwwb.supabase.co/storage/v1/object/public/logos/03018223-ac24-400d-acbc-2c1480a05441.webp"
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                />
                <span className="font-semibold text-gray-900">Admin Console</span>
              </div>

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
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowTabMenu(!showTabMenu)}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 border border-gray-300 rounded"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  {showTabMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowTabMenu(false)}
                      />
                      <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 max-h-96 overflow-y-auto">
                        {availableTabs.map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              openNewTab(tab.label, tab.id);
                              setShowTabMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-1.5 text-gray-400 hover:text-gray-600">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="hidden md:block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-sm font-medium text-gray-900">
                  Company Equipment
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={loadEquipmentData}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Star className="w-4 h-4" />
                </button>
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

            <div className="flex items-center justify-end gap-2 mt-3">
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
        </div>

        {/* Compact Data Grid */}
        <div className="flex-1 overflow-auto hidden md:block">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-20">
              <tr className="border-b-2 border-gray-300">
                <th className="w-10 px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === equipmentRecords.length && equipmentRecords.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 cursor-pointer"
                  />
                </th>
                {columns.map((column, index) => (
                  <th
                    key={column.key}
                    className={`px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase ${
                      column.sticky && index === 0 ? 'sticky left-10 bg-gray-100 z-20' : ''
                    } ${column.width || ''}`}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-1 hover:text-gray-900"
                      >
                        {column.label}
                        {sortField === column.key && (
                          <ChevronDown className={`w-3 h-3 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
                <th className="w-10 px-2 py-2"></th>
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
              ) : equipmentRecords.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-4 py-12 text-center">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium">No items to display</p>
                      <p className="text-sm mt-1">Try changing your filters or search term</p>
                    </div>
                  </td>
                </tr>
              ) : (
                equipmentRecords.map((record, idx) => (
                  <tr
                    key={record.id}
                    className={`hover:bg-blue-50 cursor-pointer border-b border-gray-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                    onClick={() => handleRowClick(record)}
                  >
                    <td
                      className="px-2 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRows.has(record.id)}
                        onChange={() => handleRowSelect(record.id)}
                        className="rounded border-gray-300 cursor-pointer"
                      />
                    </td>
                    {columns.map((column, index) => (
                      <td
                        key={column.key}
                        className={`px-3 py-2 text-sm ${
                          column.sticky && index === 0 ? 'sticky left-10 bg-inherit z-10' : ''
                        } ${column.width || ''}`}
                      >
                        {column.key === 'Name' ? (
                          <span className="text-blue-600 font-semibold">
                            {record[column.key as keyof EquipmentRecord] || '-'}
                          </span>
                        ) : column.key === 'iPhone_IMEI__c' || column.key === 'MiFi_IMEI__c' ? (
                          <span className="text-gray-700">{formatIMEI(record[column.key as keyof EquipmentRecord])}</span>
                        ) : (
                          <span className="text-gray-700">{record[column.key as keyof EquipmentRecord] || '-'}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <div>{equipmentRecords.length}+ items • Sorted by {sortField.replace('_', ' ')}</div>
          </div>
        </div>

        {/* Keep all existing modals... */}
      </div>
    </div>
  );
}
