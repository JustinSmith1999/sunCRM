import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserPlus, Edit, Trash2, Shield, Mail, Phone, Calendar, RefreshCw, Unlock, Lock } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  department: string;
  title: string;
  status: string;
  created_at: string;
  last_login: string;
  locked_until: string | null;
  failed_login_attempts: number;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          role,
          department,
          title,
          status,
          created_at,
          last_login,
          locked_until,
          failed_login_attempts
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function unlockAccount(userEmail: string) {
    try {
      const { data, error } = await supabase.rpc('unlock_user_account', {
        user_email: userEmail
      });

      if (error) throw error;

      alert('Account unlocked successfully!');
      await loadUsers();
    } catch (error: any) {
      console.error('Error unlocking account:', error);
      alert(`Failed to unlock account: ${error.message}`);
    }
  }

  function isAccountLocked(user: User): boolean {
    if (!user.locked_until) return false;
    const lockUntil = new Date(user.locked_until);
    const now = new Date();
    return lockUntil > now;
  }

  async function syncFromSalesforce() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-salesforce-users`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        setSyncResult(result);
        await loadUsers();
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Error syncing users:', error);
      alert(`Failed to sync users: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600 mt-1">Manage user accounts and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={syncFromSalesforce}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from Salesforce'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Sync Complete</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-green-600 font-medium">Total</div>
              <div className="text-green-900 text-lg font-bold">{syncResult.summary.total}</div>
            </div>
            <div>
              <div className="text-green-600 font-medium">Created</div>
              <div className="text-green-900 text-lg font-bold">{syncResult.summary.created}</div>
            </div>
            <div>
              <div className="text-green-600 font-medium">Updated</div>
              <div className="text-green-900 text-lg font-bold">{syncResult.summary.updated}</div>
            </div>
            <div>
              <div className="text-green-600 font-medium">Errors</div>
              <div className="text-red-900 text-lg font-bold">{syncResult.summary.errors}</div>
            </div>
          </div>
          <button
            onClick={() => setSyncResult(null)}
            className="mt-3 text-sm text-green-600 hover:text-green-700"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{user.full_name || 'Unnamed User'}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Role</div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900 capitalize">{user.role || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Department</div>
                    <div className="text-sm font-medium text-slate-900">{user.department || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Title</div>
                    <div className="text-sm font-medium text-slate-900">{user.title || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Status</div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {user.status || 'inactive'}
                    </span>
                  </div>
                </div>

                {isAccountLocked(user) && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                    <Lock className="w-4 h-4 text-orange-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900">Account Locked</p>
                      <p className="text-xs text-orange-700">
                        {user.failed_login_attempts} failed attempts - Locked until {new Date(user.locked_until!).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                {isAccountLocked(user) && (
                  <button
                    onClick={() => {
                      if (confirm(`Unlock account for ${user.email}?`)) {
                        unlockAccount(user.email);
                      }
                    }}
                    className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Unlock Account"
                  >
                    <Unlock className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedUser(user)}
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to deactivate this user?')) {
                      console.log('Deactivate user:', user.id);
                    }
                  }}
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <UserPlus className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No users found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first user
          </button>
        </div>
      )}
    </div>
  );
}
