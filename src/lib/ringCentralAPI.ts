import { supabase } from './supabase';

const CLIENT_ID = import.meta.env.VITE_RINGCENTRAL_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_RINGCENTRAL_CLIENT_SECRET;
const SERVER_URL = import.meta.env.VITE_RINGCENTRAL_SERVER_URL || 'https://platform.ringcentral.com';
const REDIRECT_URI = import.meta.env.VITE_RINGCENTRAL_REDIRECT_URI;

export interface RingCentralCredentials {
  id: string;
  user_id: string;
  organization_id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  extension_id: string | null;
  extension_number: string | null;
  phone_number: string | null;
  is_active: boolean;
}

class RingCentralAPIService {
  private userId: string | null = null;
  private organizationId: string | null = null;

  setUser(userId: string, organizationId: string) {
    this.userId = userId;
    this.organizationId = organizationId;
  }

  getLoginUrl(): string {
    if (!CLIENT_ID || !REDIRECT_URI) {
      throw new Error('RingCentral configuration missing');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      state: `user_${this.userId}_org_${this.organizationId}`
    });

    return `${SERVER_URL}/restapi/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(authorizationCode: string): Promise<boolean> {
    if (!this.userId || !this.organizationId) {
      throw new Error('User not set');
    }

    try {
      const tokenResponse = await fetch(`${SERVER_URL}/restapi/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authorizationCode,
          redirect_uri: REDIRECT_URI || ''
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange authorization code');
      }

      const authData = await tokenResponse.json();

      const extensionResponse = await fetch(`${SERVER_URL}/restapi/v1.0/account/~/extension/~`, {
        headers: {
          'Authorization': `Bearer ${authData.access_token}`
        }
      });

      const extensionData = await extensionResponse.json();

      const credentials = {
        user_id: this.userId,
        organization_id: this.organizationId,
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        token_expires_at: new Date(Date.now() + (authData.expires_in || 3600) * 1000).toISOString(),
        extension_id: extensionData.id?.toString() || null,
        extension_number: extensionData.extensionNumber || null,
        phone_number: extensionData.contact?.businessPhone || null,
        is_active: true
      };

      const { error } = await supabase
        .from('ringcentral_user_credentials')
        .upsert(credentials, { onConflict: 'user_id,organization_id' });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw error;
    }
  }

  async getUserCredentials(userId: string): Promise<RingCentralCredentials | null> {
    const { data, error } = await supabase
      .from('ringcentral_user_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching credentials:', error);
      return null;
    }

    return data;
  }

  async refreshTokenIfNeeded(credentials: RingCentralCredentials): Promise<RingCentralCredentials> {
    if (!credentials.token_expires_at) return credentials;

    const expiresAt = new Date(credentials.token_expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    if (timeUntilExpiry > 5 * 60 * 1000) {
      return credentials;
    }

    try {
      const tokenResponse = await fetch(`${SERVER_URL}/restapi/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: credentials.refresh_token || ''
        })
      });

      const authData = await tokenResponse.json();

      const updatedCredentials = {
        ...credentials,
        access_token: authData.access_token,
        refresh_token: authData.refresh_token || credentials.refresh_token,
        token_expires_at: new Date(Date.now() + (authData.expires_in || 3600) * 1000).toISOString()
      };

      await supabase
        .from('ringcentral_user_credentials')
        .update({
          access_token: updatedCredentials.access_token,
          refresh_token: updatedCredentials.refresh_token,
          token_expires_at: updatedCredentials.token_expires_at
        })
        .eq('id', credentials.id);

      return updatedCredentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  async makeCall(phoneNumber: string, userId: string): Promise<any> {
    const credentials = await this.getUserCredentials(userId);
    if (!credentials) throw new Error('No credentials found');

    const freshCredentials = await this.refreshTokenIfNeeded(credentials);

    const response = await fetch(`${SERVER_URL}/restapi/v1.0/account/~/extension/~/ring-out`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${freshCredentials.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: { phoneNumber: credentials.phone_number },
        to: { phoneNumber },
        playPrompt: false
      })
    });

    return response.json();
  }

  async sendSMS(phoneNumber: string, message: string, userId: string): Promise<any> {
    const credentials = await this.getUserCredentials(userId);
    if (!credentials) throw new Error('No credentials found');

    const freshCredentials = await this.refreshTokenIfNeeded(credentials);

    const response = await fetch(`${SERVER_URL}/restapi/v1.0/account/~/extension/~/sms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${freshCredentials.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: { phoneNumber: credentials.phone_number },
        to: [{ phoneNumber }],
        text: message
      })
    });

    return response.json();
  }

  async getCallLog(userId: string, dateFrom?: string, dateTo?: string): Promise<any> {
    const credentials = await this.getUserCredentials(userId);
    if (!credentials) throw new Error('No credentials found');

    const freshCredentials = await this.refreshTokenIfNeeded(credentials);

    const params = new URLSearchParams({
      view: 'Detailed',
      perPage: '100'
    });

    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    const response = await fetch(`${SERVER_URL}/restapi/v1.0/account/~/extension/~/call-log?${params}`, {
      headers: {
        'Authorization': `Bearer ${freshCredentials.access_token}`
      }
    });

    return response.json();
  }

  async disconnect(userId: string): Promise<void> {
    await supabase
      .from('ringcentral_user_credentials')
      .update({ is_active: false })
      .eq('user_id', userId);
  }
}

export const ringCentralAPI = new RingCentralAPIService();
