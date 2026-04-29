// Mock RingCentral service for demo purposes
// In production, this would integrate with RingCentral's REST API

interface CallRecord {
  id: string;
  direction: 'Inbound' | 'Outbound';
  from: { phoneNumber: string; name?: string };
  to: { phoneNumber: string; name?: string };
  startTime: string;
  duration: number;
  result: string;
}

interface PresenceData {
  presenceStatus: string;
  telephonyStatus: string;
  extensionId: string;
}

export class RingCentralService {
  private isAuthenticated = false;
  private mockCallHistory: CallRecord[] = [
    {
      id: '1',
      direction: 'Inbound',
      from: { phoneNumber: '+1-555-0123', name: 'John Customer' },
      to: { phoneNumber: '+1-555-0100' },
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      duration: 180,
      result: 'Call Connected'
    },
    {
      id: '2',
      direction: 'Outbound',
      from: { phoneNumber: '+1-555-0100' },
      to: { phoneNumber: '+1-555-0456', name: 'Sarah Prospect' },
      startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      duration: 300,
      result: 'Call Connected'
    },
    {
      id: '3',
      direction: 'Inbound',
      from: { phoneNumber: '+1-555-0789' },
      to: { phoneNumber: '+1-555-0100' },
      startTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      duration: 0,
      result: 'Missed'
    }
  ];

  async authenticate(username: string, password: string, extension?: string) {
    // Mock authentication - in production this would call RingCentral API
    return new Promise<{ success: boolean; error?: any }>((resolve) => {
      setTimeout(() => {
        if (username && password) {
          this.isAuthenticated = true;
          resolve({ success: true });
        } else {
          resolve({ success: false, error: { message: 'Invalid credentials' } });
        }
      }, 1000);
    });
  }

  async getCallLog(dateFrom?: string, dateTo?: string) {
    // Mock call log - in production this would call RingCentral API
    return new Promise<{ records: CallRecord[] }>((resolve) => {
      setTimeout(() => {
        let filteredCalls = [...this.mockCallHistory];
        
        if (dateFrom) {
          filteredCalls = filteredCalls.filter(call => 
            new Date(call.startTime) >= new Date(dateFrom)
          );
        }
        
        if (dateTo) {
          filteredCalls = filteredCalls.filter(call => 
            new Date(call.startTime) <= new Date(dateTo)
          );
        }
        
        resolve({ records: filteredCalls });
      }, 500);
    });
  }

  async getPresence(): Promise<PresenceData> {
    // Mock presence data - in production this would call RingCentral API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          presenceStatus: 'Available',
          telephonyStatus: 'NoCall',
          extensionId: '101'
        });
      }, 300);
    });
  }

  async makeCall(phoneNumber: string) {
    // Mock call initiation - in production this would call RingCentral API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          status: 'Success',
          from: { phoneNumber: '+1-555-0100' },
          to: { phoneNumber }
        });
      }, 500);
    });
  }

  async sendSMS(phoneNumber: string, message: string) {
    // Mock SMS sending - in production this would call RingCentral API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          status: 'Queued',
          from: { phoneNumber: '+1-555-0100' },
          to: [{ phoneNumber }],
          text: message
        });
      }, 500);
    });
  }

  async subscribeToCallEvents(webhookUrl: string) {
    // Mock webhook subscription - in production this would call RingCentral API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          uri: webhookUrl,
          eventFilters: [
            '/restapi/v1.0/account/~/extension/~/telephony/sessions',
            '/restapi/v1.0/account/~/extension/~/presence'
          ]
        });
      }, 500);
    });
  }

  // Add a method to simulate receiving a new call for demo purposes
  simulateIncomingCall(phoneNumber: string, callerName?: string) {
    const newCall: CallRecord = {
      id: Date.now().toString(),
      direction: 'Inbound',
      from: { phoneNumber, name: callerName },
      to: { phoneNumber: '+1-555-0100' },
      startTime: new Date().toISOString(),
      duration: Math.floor(Math.random() * 300) + 60, // Random duration 1-6 minutes
      result: 'Call Connected'
    };
    
    this.mockCallHistory.unshift(newCall);
    return newCall;
  }
}

export const ringCentralService = new RingCentralService();