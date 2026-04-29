import React, { useState, useEffect } from 'react';
import { Settings, Zap, ShieldCheck, UserCheck, FileType, Play, Plus, CreditCard as Edit, Trash2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type TabType = 'validation' | 'assignment' | 'workflow' | 'record_types';

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  object_type: string;
  is_active: boolean;
  error_message: string;
  validation_formula: string;
  trigger_type: string;
}

interface AssignmentRule {
  id: string;
  name: string;
  description: string;
  object_type: string;
  is_active: boolean;
  order_number: number;
}

interface AssignmentQueue {
  id: string;
  name: string;
  description: string;
  object_type: string;
  members: string[];
  assignment_method: string;
  is_active: boolean;
}

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  object_type: string;
  trigger_type: string;
  evaluation_criteria: string;
  criteria_formula: string;
  is_active: boolean;
}

interface RecordType {
  id: string;
  name: string;
  description: string;
  object_type: string;
  is_active: boolean;
  is_default: boolean;
}

export function AutomationConsole() {
  const [activeTab, setActiveTab] = useState<TabType>('validation');
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [assignmentRules, setAssignmentRules] = useState<AssignmentRule[]>([]);
  const [assignmentQueues, setAssignmentQueues] = useState<AssignmentQueue[]>([]);
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const { profile } = useAuth();

  useEffect(() => {
    loadData();
    loadUsers();
  }, [profile, activeTab]);

  const loadUsers = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('organization_id', profile.organization_id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadData = async () => {
    if (!profile?.organization_id) return;

    setLoading(true);
    try {
      if (activeTab === 'validation') {
        const { data, error } = await supabase
          .from('validation_rules')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setValidationRules(data || []);
      } else if (activeTab === 'assignment') {
        const [rulesResult, queuesResult] = await Promise.all([
          supabase
            .from('assignment_rules')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('order_number'),
          supabase
            .from('assignment_queues')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('name'),
        ]);

        if (rulesResult.error) throw rulesResult.error;
        if (queuesResult.error) throw queuesResult.error;

        setAssignmentRules(rulesResult.data || []);
        setAssignmentQueues(queuesResult.data || []);
      } else if (activeTab === 'workflow') {
        const { data, error } = await supabase
          .from('workflow_rules')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setWorkflowRules(data || []);
      } else if (activeTab === 'record_types') {
        const { data, error } = await supabase
          .from('record_types')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .order('name');

        if (error) throw error;
        setRecordTypes(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateValidationRule = async () => {
    if (!profile?.id || !profile?.organization_id || !editingItem?.name) return;

    try {
      const { error } = await supabase.from('validation_rules').insert({
        organization_id: profile.organization_id,
        name: editingItem.name,
        description: editingItem.description || '',
        object_type: editingItem.object_type || 'leads',
        error_message: editingItem.error_message || 'Validation failed',
        validation_formula: editingItem.validation_formula || '',
        trigger_type: editingItem.trigger_type || 'both',
        is_active: true,
        created_by: profile.id,
      });

      if (error) throw error;

      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Error creating validation rule:', error);
      alert('Failed to create validation rule');
    }
  };

  const handleCreateAssignmentQueue = async () => {
    if (!profile?.organization_id || !editingItem?.name) return;

    try {
      const { error } = await supabase.from('assignment_queues').insert({
        organization_id: profile.organization_id,
        name: editingItem.name,
        description: editingItem.description || '',
        object_type: editingItem.object_type || 'leads',
        members: editingItem.members || [],
        assignment_method: editingItem.assignment_method || 'round_robin',
        is_active: true,
      });

      if (error) throw error;

      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Error creating assignment queue:', error);
      alert('Failed to create assignment queue');
    }
  };

  const handleCreateWorkflowRule = async () => {
    if (!profile?.id || !profile?.organization_id || !editingItem?.name) return;

    try {
      const { error } = await supabase.from('workflow_rules').insert({
        organization_id: profile.organization_id,
        name: editingItem.name,
        description: editingItem.description || '',
        object_type: editingItem.object_type || 'leads',
        trigger_type: editingItem.trigger_type || 'on_create',
        evaluation_criteria: editingItem.evaluation_criteria || 'created',
        criteria_formula: editingItem.criteria_formula || '',
        is_active: true,
        created_by: profile.id,
      });

      if (error) throw error;

      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Error creating workflow rule:', error);
      alert('Failed to create workflow rule');
    }
  };

  const handleCreateRecordType = async () => {
    if (!profile?.id || !profile?.organization_id || !editingItem?.name) return;

    try {
      const { error } = await supabase.from('record_types').insert({
        organization_id: profile.organization_id,
        name: editingItem.name,
        description: editingItem.description || '',
        object_type: editingItem.object_type || 'leads',
        is_active: true,
        is_default: editingItem.is_default || false,
        created_by: profile.id,
      });

      if (error) throw error;

      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Error creating record type:', error);
      alert('Failed to create record type');
    }
  };

  const handleToggleActive = async (table: string, id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase.from(table).delete().eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete item');
    }
  };

  const tabs = [
    { id: 'validation' as TabType, label: 'Validation Rules', icon: ShieldCheck },
    { id: 'assignment' as TabType, label: 'Assignment Rules', icon: UserCheck },
    { id: 'workflow' as TabType, label: 'Workflow Automation', icon: Zap },
    { id: 'record_types' as TabType, label: 'Record Types', icon: FileType },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Automation & Customization</h1>
        <p className="text-slate-600">
          Configure validation rules, assignment automation, workflows, and record types
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-amber-500 text-amber-600 bg-amber-50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'validation' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Validation Rules</h2>
                  <p className="text-sm text-slate-600">
                    Define rules to validate data before saving records
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingItem({
                      name: '',
                      description: '',
                      object_type: 'leads',
                      error_message: '',
                      validation_formula: '',
                      trigger_type: 'both',
                    });
                    setShowModal(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Validation Rule
                </button>
              </div>

              <div className="space-y-3">
                {validationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900">{rule.name}</h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                              rule.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                            {rule.object_type}
                          </span>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-slate-600 mb-2">{rule.description}</p>
                        )}
                        <div className="text-xs text-slate-500 space-y-1">
                          <p>
                            <span className="font-medium">Error:</span> {rule.error_message}
                          </p>
                          <p>
                            <span className="font-medium">Formula:</span>{' '}
                            <code className="bg-slate-100 px-1 rounded">{rule.validation_formula}</code>
                          </p>
                          <p>
                            <span className="font-medium">Trigger:</span> {rule.trigger_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleToggleActive('validation_rules', rule.id, rule.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            rule.is_active
                              ? 'text-slate-600 hover:bg-slate-100'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={rule.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {rule.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete('validation_rules', rule.id)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {validationRules.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg">
                    <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 mb-4">No validation rules configured</p>
                    <button
                      onClick={() => {
                        setEditingItem({
                          name: '',
                          description: '',
                          object_type: 'leads',
                          error_message: '',
                          validation_formula: '',
                          trigger_type: 'both',
                        });
                        setShowModal(true);
                      }}
                      className="text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Create your first validation rule
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'assignment' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Assignment Automation</h2>
                  <p className="text-sm text-slate-600">
                    Configure automatic assignment of leads and other records
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingItem({
                      name: '',
                      description: '',
                      object_type: 'leads',
                      members: [],
                      assignment_method: 'round_robin',
                    });
                    setShowModal(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Assignment Queue
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Assignment Queues</h3>
                  <div className="space-y-3">
                    {assignmentQueues.map((queue) => (
                      <div
                        key={queue.id}
                        className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-slate-900">{queue.name}</h4>
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  queue.is_active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {queue.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                                {queue.object_type}
                              </span>
                            </div>
                            {queue.description && (
                              <p className="text-sm text-slate-600 mb-2">{queue.description}</p>
                            )}
                            <div className="text-xs text-slate-500">
                              <p>
                                <span className="font-medium">Method:</span> {queue.assignment_method}
                              </p>
                              <p>
                                <span className="font-medium">Members:</span> {queue.members.length} users
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleToggleActive('assignment_queues', queue.id, queue.is_active)}
                              className={`p-2 rounded-lg transition-colors ${
                                queue.is_active
                                  ? 'text-slate-600 hover:bg-slate-100'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {queue.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete('assignment_queues', queue.id)}
                              className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {assignmentQueues.length === 0 && (
                      <div className="text-center py-8 border border-dashed border-slate-300 rounded-lg">
                        <UserCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600 text-sm">No assignment queues configured</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Workflow Automation</h2>
                  <p className="text-sm text-slate-600">
                    Automate actions when records are created or updated
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingItem({
                      name: '',
                      description: '',
                      object_type: 'leads',
                      trigger_type: 'on_create',
                      evaluation_criteria: 'created',
                      criteria_formula: '',
                    });
                    setShowModal(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Workflow Rule
                </button>
              </div>

              <div className="space-y-3">
                {workflowRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900">{rule.name}</h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                              rule.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                            {rule.object_type}
                          </span>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-slate-600 mb-2">{rule.description}</p>
                        )}
                        <div className="text-xs text-slate-500 space-y-1">
                          <p>
                            <span className="font-medium">Trigger:</span> {rule.trigger_type}
                          </p>
                          <p>
                            <span className="font-medium">Evaluation:</span> {rule.evaluation_criteria}
                          </p>
                          {rule.criteria_formula && (
                            <p>
                              <span className="font-medium">Criteria:</span>{' '}
                              <code className="bg-slate-100 px-1 rounded">{rule.criteria_formula}</code>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleToggleActive('workflow_rules', rule.id, rule.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            rule.is_active
                              ? 'text-slate-600 hover:bg-slate-100'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {rule.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete('workflow_rules', rule.id)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {workflowRules.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg">
                    <Zap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 mb-4">No workflow rules configured</p>
                    <button
                      onClick={() => {
                        setEditingItem({
                          name: '',
                          description: '',
                          object_type: 'leads',
                          trigger_type: 'on_create',
                          evaluation_criteria: 'created',
                          criteria_formula: '',
                        });
                        setShowModal(true);
                      }}
                      className="text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Create your first workflow rule
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'record_types' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Record Types</h2>
                  <p className="text-sm text-slate-600">
                    Create different record types for leads, deals, and other objects
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingItem({
                      name: '',
                      description: '',
                      object_type: 'leads',
                      is_default: false,
                    });
                    setShowModal(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Record Type
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recordTypes.map((type) => (
                  <div
                    key={type.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900">{type.name}</h3>
                          {type.is_default && (
                            <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">
                              Default
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                              type.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {type.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {type.description && (
                          <p className="text-sm text-slate-600 mb-2">{type.description}</p>
                        )}
                        <p className="text-xs text-slate-500">
                          <span className="font-medium">Object:</span> {type.object_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleToggleActive('record_types', type.id, type.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            type.is_active
                              ? 'text-slate-600 hover:bg-slate-100'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {type.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete('record_types', type.id)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {recordTypes.length === 0 && (
                  <div className="col-span-2 text-center py-12 border border-dashed border-slate-300 rounded-lg">
                    <FileType className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 mb-4">No record types configured</p>
                    <button
                      onClick={() => {
                        setEditingItem({
                          name: '',
                          description: '',
                          object_type: 'leads',
                          is_default: false,
                        });
                        setShowModal(true);
                      }}
                      className="text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Create your first record type
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {activeTab === 'validation' && 'Create Validation Rule'}
              {activeTab === 'assignment' && 'Create Assignment Queue'}
              {activeTab === 'workflow' && 'Create Workflow Rule'}
              {activeTab === 'record_types' && 'Create Record Type'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={editingItem?.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={editingItem?.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Object Type</label>
                <select
                  value={editingItem?.object_type || 'leads'}
                  onChange={(e) => setEditingItem({ ...editingItem, object_type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="leads">Leads</option>
                  <option value="accounts">Accounts</option>
                  <option value="opportunities">Opportunities</option>
                  <option value="cases">Cases</option>
                </select>
              </div>

              {activeTab === 'validation' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Error Message *
                    </label>
                    <input
                      type="text"
                      value={editingItem?.error_message || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, error_message: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g., Email is required"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Validation Formula *
                    </label>
                    <textarea
                      value={editingItem?.validation_formula || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, validation_formula: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-sm"
                      rows={3}
                      placeholder="e.g., email != null && email.length > 0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Trigger Type</label>
                    <select
                      value={editingItem?.trigger_type || 'both'}
                      onChange={(e) => setEditingItem({ ...editingItem, trigger_type: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="both">Insert and Update</option>
                      <option value="insert">Insert Only</option>
                      <option value="update">Update Only</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'assignment' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Assignment Method</label>
                    <select
                      value={editingItem?.assignment_method || 'round_robin'}
                      onChange={(e) => setEditingItem({ ...editingItem, assignment_method: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="round_robin">Round Robin</option>
                      <option value="least_busy">Least Busy</option>
                      <option value="random">Random</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Queue Members</label>
                    <div className="border border-slate-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                      {users.map((user) => (
                        <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(editingItem?.members || []).includes(user.id)}
                            onChange={(e) => {
                              const currentMembers = editingItem?.members || [];
                              const newMembers = e.target.checked
                                ? [...currentMembers, user.id]
                                : currentMembers.filter((id: string) => id !== user.id);
                              setEditingItem({ ...editingItem, members: newMembers });
                            }}
                            className="w-4 h-4 text-amber-500 rounded focus:ring-2 focus:ring-amber-500"
                          />
                          <span className="text-sm">{user.full_name || user.email}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'workflow' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Trigger Type</label>
                    <select
                      value={editingItem?.trigger_type || 'on_create'}
                      onChange={(e) => setEditingItem({ ...editingItem, trigger_type: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="on_create">When Created</option>
                      <option value="on_update">When Updated</option>
                      <option value="on_create_update">When Created or Updated</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Evaluation Criteria</label>
                    <select
                      value={editingItem?.evaluation_criteria || 'created'}
                      onChange={(e) => setEditingItem({ ...editingItem, evaluation_criteria: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="created">When record is created</option>
                      <option value="created_edited">When record is created or edited</option>
                      <option value="created_edited_subsequent">Every time record is edited</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Criteria Formula</label>
                    <textarea
                      value={editingItem?.criteria_formula || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, criteria_formula: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-sm"
                      rows={3}
                      placeholder="e.g., status == 'new' && lead_source == 'Website'"
                    />
                  </div>
                </>
              )}

              {activeTab === 'record_types' && (
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingItem?.is_default || false}
                      onChange={(e) => setEditingItem({ ...editingItem, is_default: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-700">Set as default record type</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (activeTab === 'validation') handleCreateValidationRule();
                  else if (activeTab === 'assignment') handleCreateAssignmentQueue();
                  else if (activeTab === 'workflow') handleCreateWorkflowRule();
                  else if (activeTab === 'record_types') handleCreateRecordType();
                }}
                disabled={!editingItem?.name}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-900 py-2 rounded-lg font-medium"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                }}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
