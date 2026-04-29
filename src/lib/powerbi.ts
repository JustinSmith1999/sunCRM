import { supabase } from './supabase';

export interface PowerBIConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  workspaceId: string;
  accessToken?: string;
}

export interface PowerBIReport {
  id: string;
  name: string;
  webUrl: string;
  embedUrl: string;
  datasetId: string;
  description?: string;
}

export interface PowerBIDashboard {
  id: string;
  displayName: string;
  embedUrl: string;
  isReadOnly: boolean;
}

export interface PowerBIDataset {
  id: string;
  name: string;
  configuredBy: string;
  isRefreshable: boolean;
}

class PowerBIClient {
  private config: PowerBIConfig | null = null;
  private tokenExpiry: Date | null = null;

  async loadConfig(): Promise<PowerBIConfig | null> {
    const { data } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('service_name', 'powerbi')
      .eq('is_active', true)
      .single();

    if (data) {
      const creds = typeof data.credentials === 'string'
        ? JSON.parse(data.credentials)
        : data.credentials;
      const config = typeof data.config === 'string'
        ? JSON.parse(data.config)
        : data.config;

      this.config = {
        clientId: creds.client_id || '',
        clientSecret: creds.client_secret || '',
        tenantId: creds.tenant_id || '',
        workspaceId: config.workspace_id || '',
        accessToken: data.access_token || undefined,
      };

      if (data.token_expires_at) {
        this.tokenExpiry = new Date(data.token_expires_at);
      }
    }

    return this.config;
  }

  private async getAccessToken(): Promise<string> {
    if (!this.config) await this.loadConfig();
    if (!this.config) throw new Error('Power BI not configured');

    if (this.config.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.config.accessToken;
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: 'https://analysis.windows.net/powerbi/api/.default',
      grant_type: 'client_credentials',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const expiresIn = data.expires_in;

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await supabase
      .from('api_credentials')
      .update({
        access_token: accessToken,
        token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('service_name', 'powerbi');

    this.config.accessToken = accessToken;
    this.tokenExpiry = expiresAt;

    return accessToken;
  }

  async getReports(): Promise<PowerBIReport[]> {
    const token = await this.getAccessToken();
    if (!this.config?.workspaceId) throw new Error('Workspace ID not configured');

    const url = `https://api.powerbi.com/v1.0/myorg/groups/${this.config.workspaceId}/reports`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch reports: ${response.statusText}`);
    }

    const data = await response.json();

    await this.logAPICall('getReports', url, 'GET', response.status, true);

    return (data.value || []).map((report: any) => ({
      id: report.id,
      name: report.name,
      webUrl: report.webUrl,
      embedUrl: report.embedUrl,
      datasetId: report.datasetId,
      description: report.description,
    }));
  }

  async getDashboards(): Promise<PowerBIDashboard[]> {
    const token = await this.getAccessToken();
    if (!this.config?.workspaceId) throw new Error('Workspace ID not configured');

    const url = `https://api.powerbi.com/v1.0/myorg/groups/${this.config.workspaceId}/dashboards`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboards: ${response.statusText}`);
    }

    const data = await response.json();

    await this.logAPICall('getDashboards', url, 'GET', response.status, true);

    return (data.value || []).map((dashboard: any) => ({
      id: dashboard.id,
      displayName: dashboard.displayName,
      embedUrl: dashboard.embedUrl,
      isReadOnly: dashboard.isReadOnly,
    }));
  }

  async getDatasets(): Promise<PowerBIDataset[]> {
    const token = await this.getAccessToken();
    if (!this.config?.workspaceId) throw new Error('Workspace ID not configured');

    const url = `https://api.powerbi.com/v1.0/myorg/groups/${this.config.workspaceId}/datasets`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch datasets: ${response.statusText}`);
    }

    const data = await response.json();

    await this.logAPICall('getDatasets', url, 'GET', response.status, true);

    return (data.value || []).map((dataset: any) => ({
      id: dataset.id,
      name: dataset.name,
      configuredBy: dataset.configuredBy,
      isRefreshable: dataset.isRefreshable,
    }));
  }

  async refreshDataset(datasetId: string): Promise<void> {
    const token = await this.getAccessToken();
    if (!this.config?.workspaceId) throw new Error('Workspace ID not configured');

    const url = `https://api.powerbi.com/v1.0/myorg/groups/${this.config.workspaceId}/datasets/${datasetId}/refreshes`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      await this.logAPICall('refreshDataset', url, 'POST', response.status, false, `Failed: ${response.statusText}`);
      throw new Error(`Failed to refresh dataset: ${response.statusText}`);
    }

    await this.logAPICall('refreshDataset', url, 'POST', response.status, true);
  }

  async getEmbedToken(reportId: string): Promise<string> {
    const token = await this.getAccessToken();
    if (!this.config?.workspaceId) throw new Error('Workspace ID not configured');

    const url = `https://api.powerbi.com/v1.0/myorg/groups/${this.config.workspaceId}/reports/${reportId}/GenerateToken`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessLevel: 'View',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get embed token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.token;
  }

  private async logAPICall(
    endpoint: string,
    url: string,
    method: string,
    statusCode: number,
    success: boolean,
    errorMessage?: string
  ) {
    const { data: user } = await supabase.auth.getUser();

    await supabase.from('api_integration_logs').insert({
      service_name: 'powerbi',
      endpoint,
      method,
      status_code: statusCode,
      success,
      error_message: errorMessage,
      user_id: user.user?.id,
    });
  }
}

export const powerBIClient = new PowerBIClient();

export async function syncPowerBIReports() {
  try {
    const reports = await powerBIClient.getReports();

    for (const report of reports) {
      await supabase.from('powerbi_reports').upsert(
        {
          powerbi_id: report.id,
          name: report.name,
          web_url: report.webUrl,
          embed_url: report.embedUrl,
          dataset_id: report.datasetId,
          description: report.description,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'powerbi_id' }
      );
    }

    return { success: true, count: reports.length };
  } catch (error: any) {
    console.error('Failed to sync Power BI reports:', error);
    return { success: false, error: error.message };
  }
}
