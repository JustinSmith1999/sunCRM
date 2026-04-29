import React, { useState, useEffect } from 'react';
import { Wrench, Clock, CheckCircle, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../../lib/supabase';

const caseData = [
  { day: 'Mon', opened: 15, closed: 12, pending: 8 },
  { day: 'Tue', opened: 18, closed: 14, pending: 12 },
  { day: 'Wed', opened: 12, closed: 16, pending: 8 },
  { day: 'Thu', opened: 20, closed: 15, pending: 13 },
  { day: 'Fri', opened: 16, closed: 18, pending: 11 },
  { day: 'Sat', opened: 8, closed: 10, pending: 9 },
  { day: 'Sun', opened: 5, closed: 7, pending: 7 },
];

const responseTimeData = [
  { week: 'Week 1', avgTime: 2.5 },
  { week: 'Week 2', avgTime: 2.2 },
  { week: 'Week 3', avgTime: 1.8 },
  { week: 'Week 4', avgTime: 1.5 },
];

export function ServiceDashboard() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> This dashboard shows sample template data. To view real service metrics, use the Service Team Dashboard from the main navigation.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Open Cases</h3>
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">47</p>
          <p className="text-xs text-amber-600 mt-1">12 high priority</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Avg Response Time</h3>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">1.5h</p>
          <p className="text-xs text-green-600 mt-1">↓ 0.5h vs last week</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Resolution Rate</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">94%</p>
          <p className="text-xs text-green-600 mt-1">↑ 3% this month</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">CSAT Score</h3>
            <TrendingUp className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">4.7/5</p>
          <p className="text-xs text-teal-600 mt-1">Based on 156 surveys</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Cases This Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={caseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="opened" fill="#3b82f6" name="Opened" />
              <Bar dataKey="closed" fill="#10b981" name="Closed" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Avg Response Time Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip formatter={(value) => `${value} hours`} />
              <Legend />
              <Line type="monotone" dataKey="avgTime" stroke="#8b5cf6" strokeWidth={2} name="Avg Time (hours)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Recent Service Cases</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Case #</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Subject</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Customer</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Priority</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Status</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-3 text-sm text-slate-900 font-medium">#10547</td>
                <td className="py-3 px-3 text-sm text-slate-900">Inverter malfunction</td>
                <td className="py-3 px-3 text-sm text-slate-600">Johnson Family</td>
                <td className="py-3 px-3"><span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">High</span></td>
                <td className="py-3 px-3"><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">In Progress</span></td>
                <td className="py-3 px-3 text-sm text-slate-600">Mike Chen</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-3 text-sm text-slate-900 font-medium">#10546</td>
                <td className="py-3 px-3 text-sm text-slate-900">Performance monitoring request</td>
                <td className="py-3 px-3 text-sm text-slate-600">Smith Residence</td>
                <td className="py-3 px-3"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Normal</span></td>
                <td className="py-3 px-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Resolved</span></td>
                <td className="py-3 px-3 text-sm text-slate-600">Sarah Wilson</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-3 text-sm text-slate-900 font-medium">#10545</td>
                <td className="py-3 px-3 text-sm text-slate-900">Warranty claim - panel replacement</td>
                <td className="py-3 px-3 text-sm text-slate-600">ABC Manufacturing</td>
                <td className="py-3 px-3"><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">Medium</span></td>
                <td className="py-3 px-3"><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">In Progress</span></td>
                <td className="py-3 px-3 text-sm text-slate-600">Tom Rodriguez</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-3 text-sm text-slate-900 font-medium">#10544</td>
                <td className="py-3 px-3 text-sm text-slate-900">Installation follow-up inspection</td>
                <td className="py-3 px-3 text-sm text-slate-600">Davis Home</td>
                <td className="py-3 px-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Low</span></td>
                <td className="py-3 px-3"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Scheduled</span></td>
                <td className="py-3 px-3 text-sm text-slate-600">Lisa Park</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Top Service Technicians</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Mike Chen</p>
                  <p className="text-xs text-slate-500">28 cases closed</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">4.9/5</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Sarah Wilson</p>
                  <p className="text-xs text-slate-500">24 cases closed</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">4.8/5</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Tom Rodriguez</p>
                  <p className="text-xs text-slate-500">22 cases closed</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">4.7/5</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Case Categories</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Installation Support</span>
                <span className="text-sm font-medium text-slate-900">32%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '32%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Maintenance</span>
                <span className="text-sm font-medium text-slate-900">28%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Warranty Claims</span>
                <span className="text-sm font-medium text-slate-900">24%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-amber-600 h-2 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Technical Issues</span>
                <span className="text-sm font-medium text-slate-900">16%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-teal-600 h-2 rounded-full" style={{ width: '16%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
