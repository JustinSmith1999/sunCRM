import { SDK } from '@ringcentral/sdk';
import { supabase } from './supabase';

const CLIENT_ID = import.meta.env.VITE_RINGCENTRAL_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_RINGCENTRAL_CLIENT_SECRET;
const SERVER_URL = import.meta.env.VITE_RINGCENTRAL_SERVER_URL;
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

class RingCentralAuthService {
  private sdk: SDK | null = null;
  private userId: string | null = null;
  private organizationId: string | null = null;

  constructor() {
    if (CLIENT_ID && CLIENT_SECRET && SERVER_URL) {
      this.sdk = new SDK({
        server: SERVER_URL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        redirectUri: REDIRECT_URI
      });
    }
  }

  setUser(userId: string, organizationId: string) {
    this.userId = userId;
    this.organizationId = organizationId;
  }

  getLoginUrl(): string {
    if (!this.sdk) {
      throw new Error('RingCentral SDK not initialized. Check environment variables.');
    }

    const platform = this.sdk.platform();
    const loginUrl = platform.loginUrl({
      implicit: false,
      state: `user_${this.userId}_org_${this.organizationId}`
    });

    return loginUrl;
  }

  async handleCallback(authorizationCode: string): Promise<boolean> {
    if (!this.sdk || !this.userId || !this.organizationId) {
      throw new Error('SDK not initialized or user not set');
    }

    try {
      const platform = this.sdk.platform();
      await platform.login({ code: authorizationCode });

      const authData = await platform.auth().data();
      const extensionInfo = await platform.get('/restapi/v1.0/account/~/extension/~');
      const extensionData = await extensionInfo.json();

      const credentials = {
        user_id: this.userId,
        organization_id: this.organizationId,
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        token_expires_at: new Date(Date.now() + (authData.expires_in || 3600) * 1000).toISOString(),
        extension_id: extensionData.id,
        extension_number: extensionData.extensionNumber,
        phone_number: extensionData.contact?.businessPhone || null,
        is_active: true
      };

      const { error } = await supabase
        .from('ringcentral_user_credentials')
        .upsert(credentials, { onConflict: 'user_id,organization_id' });

      if (error) throw error;

      await this.subscribeToWebhooks();

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

    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }

    try {
      const platform = this.sdk.platform();
      await platform.auth().setData({
        access_token: credentials.access_token || '',
        refresh_token: credentials.refresh_token || '',
        expires_in: 0
      });

      await platform.refresh();
      const authData = await platform.auth().data();

      const updatedCredentials = {
        ...credentials,
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
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

  async initializeSDKWithCredentials(credentials: RingCentralCredentials): Promise<SDK> {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }

    const freshCredentials = await this.refreshTokenIfNeeded(credentials);
    const platform = this.sdk.platform();

    await platform.auth().setData({
      access_token: freshCredentials.access_token || '',
      refresh_token: freshCredentials.refresh_token || '',
      expires_in: 3600
    });

    return this.sdk;
  }

  async makeCall(phoneNumber: string, userId: string): Promise<any> {
    const credentials = await this.getUserCredentials(userId);
    if (!credentials) throw new Error('No RingCentral credentials found');

    const sdk = await this.initializeSDKWithCredentials(credentials);
    const platform = sdk.platform();

    const response = await platform.post('/restapi/v1.0/account/~/extension/~/ring-out', {
      from: { phoneNumber: credentials.phone_number },
      to: { phoneNumber },
      playPrompt: false
    });

    return response.json();
  }

  async sendSMS(phoneNumber: string, message: string, userId: string): Promise<any> {
    const credentials = await this.getUserCredentials(userId);
    if (!credentials) throw new Error('No RingCentral credentials found');

    const sdk = await this.initializeSDKWithCredentials(credentials);
    const platform = sdk.platform();

    const response = await platform.post('/restapi/v1.0/account/~/extension/~/sms', {
      from: { phoneNumber: credentials.phone_number },
      to: [{ phoneNumber }],
      text: message
    });

    return response.json();
  }

  async getCallLog(userId: string, dateFrom?: string, dateTo?: string): Promise<any> {
    const credentials = await this.getUserCredentials(userId);
    if (!credentials) throw new Error('No RingCentral credentials found');

    const sdk = await this.initializeSDKWithCredentials(credentials);
    const platform = sdk.platform();

    const params: any = {
      view: 'Detailed',
      perPage: 100
    };

    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const response = await platform.get('/restapi/v1.0/account/~/extension/~/call-log', params);
    return response.json();
  }

  async subscribeToWebhooks(): Promise<void> {
    if (!this.userId) return;

    const credentials = await this.getUserCredentials(this.userId);
    if (!credentials) return;

    const sdk = await this.initializeSDKWithCredentials(credentials);
    const platform = sdk.platform();

    const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ringcentral-webhook`;

    try {
      await platform.post('/restapi/v1.0/subscription', {
        eventFilters: [
          '/restapi/v1.0/account/~/extension/~/telephony/sessions',
          '/restapi/v1.0/account/~/extension/~/presence'
        ],
        deliveryMode: {
          transportType: 'WebHook',
          address: webhookUrl
        },
        expiresIn: 630720000
      });
    } catch (error) {
      console.error('Error subscribing to webhooks:', error);
    }
  }

  async disconnect(userId: string): Promise<void> {
    await supabase
      .from('ringcentral_user_credentials')
      .update({ is_active: false })
      .eq('user_id', userId);
  }
}

export const ringCentralAuth = new RingCentralAuthService();
