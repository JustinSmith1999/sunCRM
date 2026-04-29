import React from 'react';
import { ArrowLeft, Calendar, User, Folder } from 'lucide-react';

interface DashboardViewerProps {
  dashboardId: string;
  dashboardTitle: string;
  folderName: string;
  description: string;
  owner: string;
  lastModifiedDate: string;
  onBack: () => void;
}

export function DashboardViewer({
  dashboardId,
  dashboardTitle,
  folderName,
  description,
  owner,
  lastModifiedDate,
  onBack
}: DashboardViewerProps) {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Dashboards</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{dashboardTitle}</h1>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-slate-600 mb-4">
          <div className="flex items-center gap-1">
            <Folder className="w-4 h-4" />
            <span>{folderName}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{owner}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Updated {new Date(lastModifiedDate).toLocaleDateString()}</span>
          </div>
        </div>

        {description && (
          <p className="text-slate-600 text-sm">{description}</p>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
        <div className="aspect-video bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500 text-sm mb-2">Dashboard ID: {dashboardId}</p>
            <p className="text-slate-400 text-xs">Dashboard visualization would load here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
