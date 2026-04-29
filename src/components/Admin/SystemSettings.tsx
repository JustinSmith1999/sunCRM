import React, { useState } from 'react';
import {
  Settings, Bell, Shield, Database, Mail, Cloud,
  Globe, Calendar, DollarSign, FileText, Lock, Key
} from 'lucide-react';

export function SystemSettings() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Cloud },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'billing', label: 'Billing', icon: DollarSign }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-600 mt-1">Configure system-wide preferences and integrations</p>
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-slate-200 p-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'integrations' && <IntegrationSettings />}
            {activeTab === 'email' && <EmailSettings />}
            {activeTab === 'billing' && <BillingSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">General Settings</h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Organization Name
        </label>
        <input
          type="text"
          defaultValue="Sunation Solar"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Time Zone
        </label>
        <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option>America/New_York (EST)</option>
          <option>America/Chicago (CST)</option>
          <option>America/Denver (MST)</option>
          <option>America/Los_Angeles (PST)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Default Currency
        </label>
        <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option>USD - US Dollar</option>
          <option>EUR - Euro</option>
          <option>GBP - British Pound</option>
        </select>
      </div>

      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Save Changes
      </button>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Security Settings</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-slate-600" />
            <div>
              <div className="font-medium text-slate-900">Two-Factor Authentication</div>
              <div className="text-sm text-slate-600">Add an extra layer of security</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-slate-600" />
            <div>
              <div className="font-medium text-slate-900">API Access</div>
              <div className="text-sm text-slate-600">Manage API keys and webhooks</div>
            </div>
          </div>
          <button className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            Manage
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-slate-600" />
            <div>
              <div className="font-medium text-slate-900">Session Timeout</div>
              <div className="text-sm text-slate-600">Auto-logout after inactivity</div>
            </div>
          </div>
          <select className="px-4 py-2 border border-slate-300 rounded-lg text-sm">
            <option>30 minutes</option>
            <option>1 hour</option>
            <option>4 hours</option>
            <option>8 hours</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Notification Settings</h2>
        <p className="text-slate-600">Manage how you receive notifications</p>
      </div>

      <div className="space-y-4">
        {['New Leads', 'Deal Updates', 'Task Reminders', 'System Alerts'].map((item) => (
          <div key={item} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <span className="font-medium text-slate-900">{item}</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span className="text-sm text-slate-600">Email</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-blue-600" />
                <span className="text-sm text-slate-600">Push</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Save Preferences
      </button>
    </div>
  );
}

function IntegrationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Integrations</h2>
        <p className="text-slate-600">Connect with third-party services</p>
      </div>

      <div className="grid gap-4">
        {[
          { name: 'Salesforce', status: 'connected', icon: Cloud },
          { name: 'RingCentral', status: 'connected', icon: Bell },
          { name: 'Stripe', status: 'not-connected', icon: DollarSign },
          { name: 'Zapier', status: 'not-connected', icon: Globe }
        ].map((integration) => {
          const IconComponent = integration.icon;
          return (
            <div key={integration.name} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <IconComponent className="w-8 h-8 text-slate-600" />
                <div>
                  <div className="font-medium text-slate-900">{integration.name}</div>
                  <div className={`text-sm ${integration.status === 'connected' ? 'text-green-600' : 'text-slate-500'}`}>
                    {integration.status === 'connected' ? 'Connected' : 'Not Connected'}
                  </div>
                </div>
              </div>
              <button className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                integration.status === 'connected'
                  ? 'text-red-600 hover:bg-red-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
                {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmailSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Email Settings</h2>
        <p className="text-slate-600">Configure email delivery and templates</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            From Email Address
          </label>
          <input
            type="email"
            defaultValue="noreply@sunation.com"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            From Name
          </label>
          <input
            type="text"
            defaultValue="Sunation Solar"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              Email templates can be managed in the <span className="font-semibold">Email Templates</span> section
            </div>
          </div>
        </div>

        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Billing Settings</h2>
        <p className="text-slate-600">Manage your subscription and payment methods</p>
      </div>

      <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm opacity-80">Current Plan</div>
            <div className="text-2xl font-bold">Enterprise</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">Monthly</div>
            <div className="text-2xl font-bold">$499</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 px-4 py-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors font-medium">
            Change Plan
          </button>
          <button className="flex-1 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors font-medium">
            View Usage
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-slate-900">Payment Method</div>
            <div className="text-sm text-slate-600">•••• •••• •••• 4242</div>
          </div>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Update
          </button>
        </div>
      </div>

      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
        Cancel Subscription
      </button>
    </div>
  );
}
