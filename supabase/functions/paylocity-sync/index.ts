import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaylocityConfig {
  clientId: string;
  clientSecret: string;
  companyId: string;
  apiUrl: string;
}

interface PaylocityEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  email: string;
  employeeNumber?: string;
  hireDate?: string;
  terminationDate?: string;
  status: string;
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
  workPhone?: string;
  homePhone?: string;
  mobilePhone?: string;
  homeAddress?: {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

async function getPaylocityConfig(supabase: any): Promise<PaylocityConfig> {
  const { data, error } = await supabase
    .from('api_credentials')
    .select('*')
    .eq('service_name', 'paylocity')
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Paylocity credentials not configured');
  }

  return {
    clientId: data.credentials.client_id || '',
    clientSecret: data.credentials.client_secret || '',
    companyId: data.credentials.company_id || '',
    apiUrl: data.credentials.api_url || 'https://api.paylocity.com/api/v2'
  };
}

async function authenticatePaylocity(config: PaylocityConfig): Promise<string> {
  const authString = btoa(`${config.clientId}:${config.clientSecret}`);

  const response = await fetch('https://api.paylocity.com/IdentityServer/connect/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials&scope=WebLinkAPI'
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paylocity authentication failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getPaylocityEmployees(config: PaylocityConfig, token: string): Promise<PaylocityEmployee[]> {
  const url = `${config.apiUrl}/companies/${config.companyId}/employees`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch employees: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data || [];
}

async function syncEmployees(
  supabase: any,
  config: PaylocityConfig,
  employees: PaylocityEmployee[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const employee of employees) {
    try {
      const { error } = await supabase
        .from('paylocity_employees')
        .upsert({
          paylocity_employee_id: employee.employeeId,
          company_id: config.companyId,
          first_name: employee.firstName,
          last_name: employee.lastName,
          middle_name: employee.middleName,
          preferred_name: employee.preferredName,
          email: employee.email,
          employee_number: employee.employeeNumber,
          hire_date: employee.hireDate,
          termination_date: employee.terminationDate,
          employment_status: employee.status,
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
          phone_number: employee.workPhone,
          mobile_phone: employee.mobilePhone,
          address_line1: employee.homeAddress?.address1,
          address_line2: employee.homeAddress?.address2,
          city: employee.homeAddress?.city,
          state: employee.homeAddress?.state,
          zip_code: employee.homeAddress?.zip,
          country: employee.homeAddress?.country || 'USA',
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

  return results;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('=== Paylocity Sync Function Started ===');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: logData } = await supabase
      .from('paylocity_sync_logs')
      .insert({
        sync_type: 'employees',
        status: 'started',
        records_processed: 0,
        records_created: 0,
        records_updated: 0,
        records_failed: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    const syncLogId = logData?.id;

    console.log('Getting Paylocity configuration...');
    const config = await getPaylocityConfig(supabase);

    console.log('Authenticating with Paylocity...');
    const token = await authenticatePaylocity(config);

    await supabase
      .from('api_credentials')
      .update({
        access_token: token,
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        is_connected: true,
        last_tested_at: new Date().toISOString()
      })
      .eq('service_name', 'paylocity');

    console.log('Fetching employees from Paylocity...');
    const employees = await getPaylocityEmployees(config, token);
    console.log(`Found ${employees.length} employees`);

    console.log('Syncing employees to database...');
    const results = await syncEmployees(supabase, config, employees);

    await supabase
      .from('paylocity_sync_logs')
      .update({
        status: results.failed === 0 ? 'completed' : 'completed',
        records_processed: employees.length,
        records_created: results.success,
        records_failed: results.failed,
        completed_at: new Date().toISOString(),
        error_message: results.errors.length > 0 ? results.errors.join('; ') : null,
        metadata: {
          total_employees: employees.length,
          errors: results.errors
        }
      })
      .eq('id', syncLogId);

    console.log('=== Sync Complete ===');
    console.log(`Success: ${results.success}, Failed: ${results.failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        employees_synced: results.success,
        employees_failed: results.failed,
        total_employees: employees.length,
        errors: results.errors
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error: any) {
    console.error('Paylocity sync error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
});
