import { supabase } from './supabase';

export interface EgnyteConfig {
  domain: string;
  apiToken: string;
  baseFolderPath: string;
}

export interface EgnyteFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  lastModified: string;
  downloadUrl?: string;
}

class EgnyteClient {
  private config: EgnyteConfig | null = null;

  async loadConfig(): Promise<EgnyteConfig | null> {
    const { data } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('service_name', 'egnyte')
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
        domain: creds.domain || '',
        apiToken: data.access_token || creds.api_key || '',
        baseFolderPath: config.base_path || '/Shared/CRM',
      };
    }

    return this.config;
  }

  async listFiles(folderPath: string): Promise<EgnyteFile[]> {
    if (!this.config) await this.loadConfig();
    if (!this.config?.apiToken) {
      throw new Error('Egnyte not configured');
    }

    const fullPath = `${this.config.baseFolderPath}${folderPath}`;
    const url = `https://${this.config.domain}.egnyte.com/pubapi/v1/fs${fullPath}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const data = await response.json();

    return (data.files || []).map((file: any) => ({
      id: file.entry_id,
      name: file.name,
      path: file.path,
      size: file.size,
      mimeType: file.content_type || 'application/octet-stream',
      lastModified: file.last_modified,
    }));
  }

  async getFileLink(filePath: string): Promise<string> {
    if (!this.config) await this.loadConfig();
    if (!this.config?.apiToken) {
      throw new Error('Egnyte not configured');
    }

    const url = `https://${this.config.domain}.egnyte.com/pubapi/v1/links`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: filePath,
        type: 'file',
        accessibility: 'anyone',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create link: ${response.statusText}`);
    }

    const data = await response.json();
    return data.links?.[0]?.url || data.url;
  }

  async uploadFile(
    file: File,
    folderPath: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    if (!this.config) await this.loadConfig();
    if (!this.config?.apiToken) {
      throw new Error('Egnyte not configured');
    }

    const fullPath = `${this.config.baseFolderPath}${folderPath}/${file.name}`;
    const url = `https://${this.config.domain}.egnyte.com/pubapi/v1/fs-content${fullPath}`;

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(fullPath);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${this.config!.apiToken}`);
      xhr.send(file);
    });
  }

  getViewerUrl(filePath: string): string {
    if (!this.config?.domain) return '';
    return `https://${this.config.domain}.egnyte.com/navigate/file${filePath}`;
  }
}

export const egnyteClient = new EgnyteClient();

export async function linkFileToRecord(
  filePath: string,
  fileName: string,
  fileSize: number,
  options: {
    leadId?: string;
    opportunityId?: string;
    accountId?: string;
    auroraProjectId?: string;
    categoryId?: string;
    title?: string;
    description?: string;
    tags?: string[];
    visibility?: 'private' | 'team' | 'public' | 'customer';
  }
) {
  const { data: user } = await supabase.auth.getUser();

  const link = await egnyteClient.getFileLink(filePath);

  const { data, error } = await supabase
    .from('document_library')
    .insert({
      egnyte_path: filePath,
      egnyte_link: link,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileName.split('.').pop()?.toLowerCase(),
      uploaded_by: user.user?.id,
      ...options,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function logDocumentAccess(
  documentId: string,
  action: 'view' | 'download' | 'upload' | 'delete' | 'share'
) {
  const { data: user } = await supabase.auth.getUser();

  await supabase.from('document_access_log').insert({
    document_id: documentId,
    user_id: user.user?.id,
    action,
  });
}
