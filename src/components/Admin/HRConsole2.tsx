import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Upload, ArrowUpDown, User, MoreVertical, X, Save } from 'lucide-react';
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
  Personal_Phone__c: string | null;
  License_Plate__c: string | null;
  Birthday__c: string | null;
  Employee_Start_Date__c: string | null;
  Termination_Date__c: string | null;
  Reports_to__c: string | null;
  CreatedDate: string;
}

export function HRConsole2() {
  const [hrRecords, setHrRecords] = useState<HRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortField, setSortField] = useState<string>('CreatedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingRecord, setEditingRecord] = useState<HRRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    loadHRData();
  }, [profile]);

  const loadHRData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('hr_records')
        .select('*');

      if (error) throw error;

      setHrRecords(data || []);
    } catch (error) {
      console.error('Error loading HR data:', error);
      setHrRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const addSampleData = async () => {
    if (!profile?.organization_id) return;

    const sampleNames = [
      "Caputo, Matthew|Matthew", "Scozzari, Michael|Michael", "Turner, Tyeesha|Tyeesha",
      "Kase, Ryan|Ryan", "Todd, Vincent|Vincent", "Patrascu, Gabriel|Gabriel",
      "Morant, Kwamel|Kwamel", "Conahan, Paul|Paul", "Kerrison, Omar|Omar",
      "Mateo, Anthony|Anthony", "Adams, Todd|Todd", "Mejia, Kelvin|Kelvin",
      "Jones, Dimitri|Dimitri", "Vohs, William|William", "Desroches, Francois|Francois",
      "Vega, Andres|Andres", "Davenport, Jeremiah|Jeremiah", "Chinchilla, Esther|Esther",
      "Dominguez, Yulissa|Yulissa", "Cuffie-Rountree, Nakia|Nakia", "Konopski, Joseph|Joseph",
      "Fusaro, Colton|Colton", "Vasquez, Oswald|Oswald", "Gerdes, Raoul|Raoul",
      "Furfaro, Frank|Frank", "D'Angelo, Thomas|Thomas", "Munoz, Josue|Josh",
      "Joseph, Andy|Andy", "Turney, Jake|Jake", "Diaz|Carolin",
      "Anthony, Jones|Anthony", "Hudson, Calith|Calith", "Welsh, Timothy|Timothy",
      "Leighton, Amanda|Amanda", "Doberman, Rochelle|Rochelle", "Aiello, Joanne|Joanna",
      "Hitchcock, Melissa|Melissa", "Barron, Quaheem|Quaheem", "Brady, Renasia|Renasia",
      "Malave, Claribel|Claribel", "Scott, Antonio|Antonio", "Cosjay, Diana|Diana",
      "Kelly, Brittany|Brittany", "Iovino, Nicholas|Nicholas", "Maloney, James|James",
      "Fake, John|John", "Torres, George|George", "Lacey, Darrin|Darrin",
      "Trainor, Eamon|Eamon", "Louis, Jonathan|Jonathan", "Tobol, Jacob|Jacob"
    ];

    const records = sampleNames.map((name, index) => {
      const [employee_name, first_name] = name.split('|');
      return {
        organization_id: profile.organization_id,
        employee_name,
        first_name,
        employment_status: 'Candidate',
        employee_number: `EMP-${Date.now()}-${index}`,
        department: 'Not Specified',
        position: 'Not Specified',
        job_title: 'Not Specified',
        personal_phone: '',
        license_plate: ''
      };
    });

    try {
      const { error } = await supabase
        .from('hr_records')
        .insert(records);

      if (error) throw error;

      alert('Sample data added successfully!');
      loadHRData();
    } catch (error) {
      console.error('Error adding sample data:', error);
      alert('Failed to add sample data. Check console for details.');
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

  const handleEditRecord = (record: HRRecord) => {
    setEditingRecord({ ...record });
    setShowEditModal(true);
  };

  const handleSaveRecord = async () => {
    if (!editingRecord) return;

    try {
      const { error } = await supabase
        .from('hr_records')
        .update({
          Name: editingRecord.Name,
          First_Name__c: editingRecord.First_Name__c,
          ADP_File_Number__c: editingRecord.ADP_File_Number__c,
          Employment_Status__c: editingRecord.Employment_Status__c,
          Department__c: editingRecord.Department__c,
          Position__c: editingRecord.Position__c,
          Job_Title__c: editingRecord.Job_Title__c,
          Personal_Phone__c: editingRecord.Personal_Phone__c,
          License_Plate__c: editingRecord.License_Plate__c,
          Birthday__c: editingRecord.Birthday__c,
          Employee_Start_Date__c: editingRecord.Employee_Start_Date__c,
          Termination_Date__c: editingRecord.Termination_Date__c,
          Reports_to__c: editingRecord.Reports_to__c,
        })
        .eq('Id', editingRecord.Id);

      if (error) throw error;

      await loadHRData();
      setShowEditModal(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Error updating record:', error);
      alert('Failed to update record. Check console for details.');
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingRecord(null);
  };

  const handleExportCSV = () => {
    const csvHeaders = [
      'Employee Name', 'First Name', 'Birthday', 'Employee Number', 'Employment Status',
      'Department', 'Position', 'Job Title', 'Employee Start Date', 'Termination Date',
      'Reports To', 'Personal Phone', 'License Plate', 'Created Date'
    ];

    const csvRows = filteredRecords.map(record => [
      record.Name || '',
      record.First_Name__c || '',
      record.Birthday__c ? new Date(record.Birthday__c).toLocaleDateString() : '',
      record.ADP_File_Number__c || '',
      record.Employment_Status__c || '',
      record.Department__c || '',
      record.Position__c || '',
      record.Job_Title__c || '',
      record.Employee_Start_Date__c ? new Date(record.Employee_Start_Date__c).toLocaleDateString() : '',
      record.Termination_Date__c ? new Date(record.Termination_Date__c).toLocaleDateString() : '',
      record.Reports_to__c || '',
      record.Personal_Phone__c || '',
      record.License_Plate__c || '',
      new Date(record.CreatedDate).toLocaleDateString()
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

  const filteredRecords = hrRecords
    .filter(record => {
      const matchesSearch =
        record.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.First_Name__c?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.Department__c?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.Position__c?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || record.Employment_Status__c === selectedStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aVal: any = a[sortField as keyof HRRecord];
      let bVal: any = b[sortField as keyof HRRecord];

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const getStatusColor = (status: string | null) => {
    if (!status) return 'text-slate-600 bg-slate-100';
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-700 bg-green-100';
      case 'candidate':
        return 'text-blue-700 bg-blue-100';
      case 'inactive':
        return 'text-gray-700 bg-gray-100';
      case 'terminated':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading HR records...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HR Records</h1>
          <p className="text-slate-600">Manage employee and candidate records ({filteredRecords.length} total)</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          New Record
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Candidate">Candidate</option>
            <option value="Inactive">Inactive</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('Name')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Employee Name
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('Employment_Status__c')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Status
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('Department__c')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Department
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('Position__c')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Position
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('Birthday__c')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Birthday
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('Employee_Start_Date__c')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Start Date
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Reports To</th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('CreatedDate')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Created
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.map((record) => (
                <tr
                  key={record.Id}
                  onClick={() => handleEditRecord(record)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{record.Name}</div>
                        {record.First_Name__c && (
                          <div className="text-xs text-slate-500">{record.First_Name__c}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(record.Employment_Status__c)}`}>
                      {record.Employment_Status__c}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900">{record.Department__c || '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900">{record.Position__c || '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600">
                      {record.Birthday__c ? new Date(record.Birthday__c).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600">
                      {record.Employee_Start_Date__c ? new Date(record.Employee_Start_Date__c).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900">{record.Reports_to__c || '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600">
                      {new Date(record.CreatedDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200 mt-4">
          <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No records found</h3>
          <p className="text-slate-600 mb-4">
            {searchTerm ? 'No records match your search criteria.' : 'Get started by creating your first HR record.'}
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors">
            <Plus className="w-4 h-4" />
            New Record
          </button>
        </div>
      )}

      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Edit HR Record</h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    value={editingRecord.Name || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editingRecord.First_Name__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, First_Name__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Employee Number
                  </label>
                  <input
                    type="text"
                    value={editingRecord.ADP_File_Number__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, ADP_File_Number__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Employment Status
                  </label>
                  <select
                    value={editingRecord.Employment_Status__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Employment_Status__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Candidate">Candidate</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editingRecord.Department__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Department__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    value={editingRecord.Position__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Position__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={editingRecord.Job_Title__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Job_Title__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Personal Phone
                  </label>
                  <input
                    type="text"
                    value={editingRecord.Personal_Phone__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Personal_Phone__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Birthday
                  </label>
                  <input
                    type="date"
                    value={editingRecord.Birthday__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Birthday__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Employee Start Date
                  </label>
                  <input
                    type="date"
                    value={editingRecord.Employee_Start_Date__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Employee_Start_Date__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Termination Date
                  </label>
                  <input
                    type="date"
                    value={editingRecord.Termination_Date__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Termination_Date__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    License Plate
                  </label>
                  <input
                    type="text"
                    value={editingRecord.License_Plate__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, License_Plate__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reports To
                  </label>
                  <input
                    type="text"
                    value={editingRecord.Reports_to__c || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, Reports_to__c: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecord}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
