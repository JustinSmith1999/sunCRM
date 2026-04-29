import React from 'react';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { ServiceDashboard } from './ServiceDashboard';
import { UniversalDashboard } from './UniversalDashboard';

export interface DashboardComponentProps {
  dashboardId: string;
  dashboardTitle: string;
  folderName: string;
  description: string;
  owner: string;
  lastModifiedDate: string;
}

export function getDashboardComponent(folderName: string, dashboardTitle: string): React.ComponentType<any> {
  const folderLower = folderName.toLowerCase();

  if (folderLower.includes('executive')) {
    return ExecutiveDashboard;
  }

  if (folderLower.includes('service')) {
    return ServiceDashboard;
  }

  return () => <UniversalDashboard folderName={folderName} dashboardTitle={dashboardTitle} />;
}
