import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Play,
  Pause,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  FileText,
  Zap,
  Calendar,
  Phone,
  Mail,
  FolderOpen,
  Target,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  is_active: boolean;
  priority: number;
  created_at: string;
}

interface Execution {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  completed_at: string;
  error_message: string;
}

interface LeadRule {
  id: string;
  name: string;
  assignment_type: string;
  is_active: boolean;
  priority: number;
}

interface AutomationTask {
  id: string;
  task_type: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_to: string;
}

const ProcessAutomationConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [leadRules, setLeadRules] = useState<LeadRule[]>([]);
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [stats, setStats] = useState({
    total_workflows: 0,
    active_workflows: 0,
    executions_today: 0,
    success_rate: 0,
    pending_tasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadWorkflows(),
        loadExecutions(),
        loadLeadRules(),
        loadTasks(),
        loadStats(),
      ]);
    } catch (error) {
      console.error('Error loading automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    const { data, error } = await supabase
      .from('automation_workflows')
      .select('*')
      .order('priority', { ascending: false });

    if (!error && data) setWorkflows(data);
  };

  const loadExecutions = async () => {
    const { data, error } = await supabase
      .from('automation_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) setExecutions(data);
  };

  const loadLeadRules = async () => {
    const { data, error } = await supabase
      .from('lead_automation_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (!error && data) setLeadRules(data);
  };

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from('automation_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('due_date', { ascending: true })
      .limit(20);

    if (!error && data) setTasks(data);
  };

  const loadStats = async () => {
    const today = new Date().toISOString().split('T')[0];

    const [workflowCount, executionsToday, pendingTasksCount] = await Promise.all([
      supabase.from('automation_workflows').select('*', { count: 'exact', head: true }),
      supabase
        .from('automation_executions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`),
      supabase
        .from('automation_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    const activeWorkflows = workflows.filter((w) => w.is_active).length;
    const completedToday = executions.filter(
      (e) => e.status === 'completed' && e.started_at?.startsWith(today)
    ).length;
    const successRate =
      executionsToday.count > 0 ? (completedToday / executionsToday.count) * 100 : 0;

    setStats({
      total_workflows: workflowCount.count || 0,
      active_workflows: activeWorkflows,
      executions_today: executionsToday.count || 0,
      success_rate: Math.round(successRate),
      pending_tasks: pendingTasksCount.count || 0,
    });
  };

  const toggleWorkflow = async (workflowId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('automation_workflows')
      .update({ is_active: !isActive })
      .eq('id', workflowId);

    if (!error) {
      loadWorkflows();
    }
  };

  const createWorkflow = async (workflowData: any) => {
    const { error } = await supabase.from('automation_workflows').insert([workflowData]);

    if (!error) {
      loadWorkflows();
    }
  };

  const testLeadAutomation = async () => {
    try {
      // Get a recent lead to test with
      const { data: leads } = await supabase
        .from('leads')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (leads && leads.length > 0) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-to-call-automation`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lead_id: leads[0].id }),
          }
        );

        const result = await response.json();
        alert(
          `Test completed! Lead assigned with ${result.call_priority} priority. Check tasks.`
        );
        loadData();
      } else {
        alert('No leads available for testing');
      }
    } catch (error) {
      alert(`Test failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Process Automation</h1>
        <p className="text-gray-600 mt-2">
          Automated workflows for lead-to-sale, permitting, and design processes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Workflows</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_workflows}</p>
            </div>
            <Zap className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Workflows</p>
              <p className="text-2xl font-bold text-green-600">{stats.active_workflows}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Executions Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.executions_today}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">{stats.success_rate}%</p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending_tasks}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'workflows', label: 'Workflows', icon: Zap },
              { id: 'lead-rules', label: 'Lead Assignment', icon: Users },
              { id: 'executions', label: 'Execution History', icon: Clock },
              { id: 'tasks', label: 'Automated Tasks', icon: CheckCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Automation Overview</h2>
                <button
                  onClick={loadData}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <span>Lead-to-Call Automation</span>
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Automatically assigns leads, calculates scores, and schedules calls based on
                    priority
                  </p>
                  <button
                    onClick={testLeadAutomation}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Test Lead Automation
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span>Permitting Automation</span>
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Tracks permit documents, automates submissions, and monitors approval status
                  </p>
                  <div className="text-sm text-gray-500">Triggered on opportunity win</div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-orange-600" />
                    <span>Design Automation</span>
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Auto-assigns designers, tracks revisions, and manages Aurora Solar integration
                  </p>
                  <div className="text-sm text-gray-500">Load-balanced assignment</div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <FolderOpen className="w-5 h-5 text-green-600" />
                    <span>Document Management</span>
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Automatically creates Egnyte folders and organizes project documents
                  </p>
                  <div className="text-sm text-gray-500">Integrated with all workflows</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50">
                    Create New Workflow
                  </button>
                  <button className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50">
                    Add Lead Rule
                  </button>
                  <button className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50">
                    View All Tasks
                  </button>
                  <button className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50">
                    Export Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflows' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Automation Workflows</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Workflow
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">Loading workflows...</div>
              ) : (
                <div className="space-y-3">
                  {workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold">{workflow.name}</h3>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                workflow.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {workflow.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Priority {workflow.priority}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1">{workflow.description}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Trigger: {workflow.trigger_type}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleWorkflow(workflow.id, workflow.is_active)}
                          className="ml-4 p-2 hover:bg-gray-100 rounded"
                        >
                          {workflow.is_active ? (
                            <Pause className="w-5 h-5 text-gray-600" />
                          ) : (
                            <Play className="w-5 h-5 text-green-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'lead-rules' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Lead Assignment Rules</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add Rule
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">Loading rules...</div>
              ) : (
                <div className="space-y-3">
                  {leadRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold">{rule.name}</h3>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                rule.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Type: {rule.assignment_type} | Priority: {rule.priority}
                          </p>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded">
                          <Settings className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'executions' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Recent Executions</h2>

              {loading ? (
                <div className="text-center py-12">Loading executions...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Started
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {executions.map((execution) => (
                        <tr key={execution.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                execution.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : execution.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {execution.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(execution.started_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {execution.completed_at
                              ? `${Math.round(
                                  (new Date(execution.completed_at).getTime() -
                                    new Date(execution.started_at).getTime()) /
                                    1000
                                )}s`
                              : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600">
                            {execution.error_message || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Automated Tasks</h2>

              {loading ? (
                <div className="text-center py-12">Loading tasks...</div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                task.priority === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : task.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {task.priority}
                            </span>
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {task.task_type}
                            </span>
                          </div>
                          <h3 className="font-semibold mt-2">{task.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Due: {new Date(task.due_date).toLocaleString()}
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessAutomationConsole;
