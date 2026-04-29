import { supabase } from './supabase';

export interface PaylocityConfig {
  clientId: string;
  clientSecret: string;
  companyId: string;
  apiUrl?: string;
}

export interface PaylocityEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  email: string;
  employeeNumber?: string;
  hireDate?: string;
  terminationDate?: string;
  employmentStatus: string;
  employmentType?: string;
  jobTitle?: string;
  department?: string;
  division?: string;
  location?: string;
  managerId?: string;
  costCenter?: string;
  payRate?: number;
  payFrequency?: string;
  payType?: string;
  annualSalary?: number;
  phoneNumber?: string;
  mobilePhone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  benefitsEligible?: boolean;
  benefitsStartDate?: string;
  ptoBalance?: number;
  sickBalance?: number;
  vacationBalance?: number;
}

export interface PaylocityPayroll {
  employeeId: string;
  payPeriodStartDate: string;
  payPeriodEndDate: string;
  payDate: string;
  grossPay: number;
  netPay: number;
  deductions: Array<{
    code: string;
    description: string;
    amount: number;
  }>;
  earnings: Array<{
    code: string;
    description: string;
    amount: number;
  }>;
  taxes: Array<{
    code: string;
    description: string;
    amount: number;
  }>;
}

class PaylocityAPI {
  private config: PaylocityConfig | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  async initialize() {
    const { data, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('service_name', 'paylocity')
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Paylocity credentials not configured');
    }

    this.config = {
      clientId: data.credentials.client_id || '',
      clientSecret: data.credentials.client_secret || '',
      companyId: data.credentials.company_id || '',
      apiUrl: data.credentials.api_url || 'https://api.paylocity.com/api/v2'
    };

    if (data.access_token && data.token_expires_at) {
      const expiry = new Date(data.token_expires_at).getTime();
      if (expiry > Date.now()) {
        this.accessToken = data.access_token;
        this.tokenExpiry = expiry;
      }
    }
  }

  async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry > Date.now() + 60000) {
      return this.accessToken;
    }

    if (!this.config) {
      await this.initialize();
    }

    const authString = btoa(`${this.config!.clientId}:${this.config!.clientSecret}`);

    const response = await fetch('https://api.paylocity.com/IdentityServer/connect/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=WebLinkAPI'
    });

    if (!response.ok) {
      throw new Error(`Paylocity authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    await supabase
      .from('api_credentials')
      .update({
        access_token: this.accessToken,
        token_expires_at: new Date(this.tokenExpiry).toISOString(),
        is_connected: true,
        last_tested_at: new Date().toISOString()
      })
      .eq('service_name', 'paylocity');

    return this.accessToken;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.authenticate();

    const url = `${this.config!.apiUrl}/companies/${this.config!.companyId}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Paylocity API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getEmployees(): Promise<PaylocityEmployee[]> {
    const data = await this.request('/employees');
    return data || [];
  }

  async getEmployee(employeeId: string): Promise<PaylocityEmployee> {
    return this.request(`/employees/${employeeId}`);
  }

  async getEmployeePayroll(employeeId: string, year?: number, checkDate?: string): Promise<PaylocityPayroll[]> {
    let endpoint = `/employees/${employeeId}/paystatements`;
    if (year) endpoint += `/${year}`;
    if (checkDate) endpoint += `/${checkDate}`;

    const data = await this.request(endpoint);
    return data || [];
  }

  async getEmployeeTimeOff(employeeId: string): Promise<any> {
    return this.request(`/employees/${employeeId}/timeoff`);
  }

  async getEmployeeBenefits(employeeId: string): Promise<any> {
    return this.request(`/employees/${employeeId}/benefits`);
  }

  async syncEmployees(): Promise<{ success: number; failed: number; errors: string[] }> {
    const employees = await this.getEmployees();
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const employee of employees) {
      try {
        const { error } = await supabase
          .from('paylocity_employees')
          .upsert({
            paylocity_employee_id: employee.employeeId,
            company_id: this.config!.companyId,
            first_name: employee.firstName,
            last_name: employee.lastName,
            middle_name: employee.middleName,
            preferred_name: employee.preferredName,
            email: employee.email,
            employee_number: employee.employeeNumber,
            hire_date: employee.hireDate,
            termination_date: employee.terminationDate,
            employment_status: employee.employmentStatus,
            employment_type: employee.employmentType,
            job_title: employee.jobTitle,
            department: employee.department,
            division: employee.division,
            location: employee.location,
            manager_id: employee.managerId,
            cost_center: employee.costCenter,
            pay_rate: employee.payRate,
            pay_frequency: employee.payFrequency,
            pay_type: employee.payType,
            annual_salary: employee.annualSalary,
            phone_number: employee.phoneNumber,
            mobile_phone: employee.mobilePhone,
            address_line1: employee.address?.line1,
            address_line2: employee.address?.line2,
            city: employee.address?.city,
            state: employee.address?.state,
            zip_code: employee.address?.zipCode,
            country: employee.address?.country || 'USA',
            benefits_eligible: employee.benefitsEligible,
            benefits_start_date: employee.benefitsStartDate,
            pto_balance: employee.ptoBalance,
            sick_balance: employee.sickBalance,
            vacation_balance: employee.vacationBalance,
            raw_data: employee,
            last_synced_at: new Date().toISOString()
          }, {
            onConflict: 'paylocity_employee_id'
          });

        if (error) {
          results.failed++;
          results.errors.push(`Employee ${employee.employeeId}: ${error.message}`);
        } else {
          results.success++;
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Employee ${employee.employeeId}: ${err.message}`);
      }
    }

    await supabase.from('paylocity_sync_logs').insert({
      sync_type: 'employees',
      status: results.failed === 0 ? 'completed' : 'completed',
      records_processed: employees.length,
      records_created: results.success,
      records_updated: 0,
      records_failed: results.failed,
      completed_at: new Date().toISOString(),
      metadata: { total_employees: employees.length }
    });

    return results;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      await this.getEmployees();
      return true;
    } catch (error) {
      console.error('Paylocity connection test failed:', error);
      return false;
    }
  }
}

export const paylocityAPI = new PaylocityAPI();

export async function syncPaylocityEmployees() {
  return paylocityAPI.syncEmployees();
}

export async function testPaylocityConnection() {
  return paylocityAPI.testConnection();
}

export async function getPaylocityEmployee(employeeId: string) {
  return paylocityAPI.getEmployee(employeeId);
}

export async function getPaylocityPayroll(employeeId: string, year?: number) {
  return paylocityAPI.getEmployeePayroll(employeeId, year);
}
