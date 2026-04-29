import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const DEFAULT_PASSWORD = 'sunation9454';

// Map Salesforce Profile/Role/Department to our system roles
function mapSalesforceRole(profile: string, userRole: string, department: string, title: string): string {
  const profileLower = profile?.toLowerCase() || '';
  const roleLower = userRole?.toLowerCase() || '';
  const deptLower = department?.toLowerCase() || '';
  const titleLower = title?.toLowerCase() || '';

  // System Administrator and similar
  if (profileLower.includes('system administrator') || profileLower.includes('admin')) {
    return 'admin';
  }

  // Executive roles (CEO, CFO, VP, Director, President)
  if (titleLower.includes('ceo') || titleLower.includes('cfo') || titleLower.includes('cto') ||
      titleLower.includes('president') || titleLower.includes('chief') ||
      titleLower.includes('vice president') || titleLower.includes('vp') ||
      (titleLower.includes('director') && !titleLower.includes('sales director'))) {
    return 'executive';
  }

  // Finance/Accounting Department
  if (deptLower.includes('finance') || deptLower.includes('accounting') ||
      titleLower.includes('accountant') || titleLower.includes('finance')) {
    if (titleLower.includes('manager') || roleLower.includes('manager')) {
      return 'finance_manager';
    }
    return 'finance_manager'; // Default finance to manager role
  }

  // Engineering/Technical Department
  if (deptLower.includes('engineering') || deptLower.includes('technical') ||
      deptLower.includes('design') || titleLower.includes('engineer') ||
      titleLower.includes('designer')) {
    return 'engineering';
  }

  // Marketing Department
  if (deptLower.includes('marketing') || titleLower.includes('marketing')) {
    return 'marketing';
  }

  // HR/People Department
  if (deptLower.includes('hr') || deptLower.includes('human resource') ||
      deptLower.includes('people') || titleLower.includes('hr ')) {
    return 'hr_manager';
  }

  // Customer Success/Account Management
  if (deptLower.includes('customer success') || deptLower.includes('account management') ||
      titleLower.includes('customer success') || titleLower.includes('account manager')) {
    return 'customer_success';
  }

  // Service/Support roles
  if (deptLower.includes('service') || deptLower.includes('support') ||
      profileLower.includes('service') || profileLower.includes('support')) {
    return 'support';
  }

  // Sales Department
  if (deptLower.includes('sales') || profileLower.includes('sales') ||
      roleLower.includes('sales') || titleLower.includes('sales')) {
    // Sales Managers
    if (titleLower.includes('manager') || titleLower.includes('director') ||
        roleLower.includes('manager') || roleLower.includes('director') ||
        titleLower.includes('vp') || titleLower.includes('vice president')) {
      return 'sales_manager';
    }
    // Regular sales reps
    return 'sales_rep';
  }

  // Installation/Field Technicians
  if (deptLower.includes('installation') || deptLower.includes('field') ||
      titleLower.includes('installer') || titleLower.includes('technician') ||
      titleLower.includes('field tech')) {
    return 'installation_tech';
  }

  // Operations roles
  if (deptLower.includes('operations') || profileLower.includes('operations') ||
      titleLower.includes('operations')) {
    return 'operations';
  }

  // Warehouse/Inventory
  if (deptLower.includes('warehouse') || deptLower.includes('inventory') ||
      deptLower.includes('logistics') || titleLower.includes('warehouse')) {
    return 'warehouse';
  }

  // Partner/External users
  if (profileLower.includes('partner') || profileLower.includes('external') ||
      profileLower.includes('community') || profileLower.includes('portal')) {
    return 'partner';
  }

  // Default to sales_rep for standard users
  return 'sales_rep';
}

async function getSalesforceSessionId(supabase: any): Promise<{ sessionId: string, instanceUrl: string }> {
  const { data, error } = await supabase
    .from('api_credentials')
    .select('credentials')
    .eq('service_name', 'salesforce')
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new Error('Salesforce integration not configured');
  }

  const credentials = data.credentials as any;

  // Login to Salesforce
  const loginResponse = await fetch('https://login.salesforce.com/services/Soap/u/58.0', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      'SOAPAction': 'login'
    },
    body: `<?xml version="1.0" encoding="utf-8"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:partner.soap.sforce.com">
        <soapenv:Body>
          <urn:login>
            <urn:username>${credentials.username}</urn:username>
            <urn:password>${credentials.password}${credentials.security_token || ''}</urn:password>
          </urn:login>
        </soapenv:Body>
      </soapenv:Envelope>`
  });

  const loginText = await loginResponse.text();
  const sessionIdMatch = loginText.match(/<sessionId>([^<]+)<\/sessionId>/);
  const instanceUrlMatch = loginText.match(/<serverUrl>([^<]+)<\/serverUrl>/);

  if (!sessionIdMatch || !instanceUrlMatch) {
    throw new Error('Failed to authenticate with Salesforce');
  }

  const instanceUrl = instanceUrlMatch[1].replace(/\/services\/Soap\/u\/[\d.]+$/, '');
  return { sessionId: sessionIdMatch[1], instanceUrl };
}

async function fetchAllSalesforceUsers(sessionId: string, instanceUrl: string) {
  const query = `SELECT Id, FirstName, LastName, Email, Username, Profile.Name, UserRole.Name, Title, Department, IsActive, Phone, MobilePhone FROM User WHERE IsActive = true`;

  const response = await fetch(`${instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${sessionId}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Salesforce users: ${errorText}`);
  }

  const result = await response.json();
  return result.records || [];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🔐 Authenticating with Salesforce...');
    const { sessionId, instanceUrl } = await getSalesforceSessionId(supabaseAdmin);

    console.log('👥 Fetching all active Salesforce users...');
    const sfUsers = await fetchAllSalesforceUsers(sessionId, instanceUrl);
    console.log(`Found ${sfUsers.length} active Salesforce users`);

    // Get our role mappings
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('id, name, display_name');

    if (rolesError) throw rolesError;

    const roleMap: Record<string, string> = {};
    roles?.forEach((role: any) => {
      roleMap[role.name] = role.id;
    });

    const results = {
      created: [] as any[],
      updated: [] as any[],
      skipped: [] as any[],
      errors: [] as any[]
    };

    // Process each Salesforce user
    for (const sfUser of sfUsers) {
      if (!sfUser.Email) {
        results.skipped.push({
          name: `${sfUser.FirstName} ${sfUser.LastName}`,
          reason: 'No email address'
        });
        continue;
      }

      const email = sfUser.Email.toLowerCase();
      const fullName = `${sfUser.FirstName || ''} ${sfUser.LastName || ''}`.trim();
      const profileName = sfUser.Profile?.Name || '';
      const roleName = sfUser.UserRole?.Name || '';
      const department = sfUser.Department || '';
      const title = sfUser.Title || '';

      // Map to our role system
      const mappedRole = mapSalesforceRole(profileName, roleName, department, title);
      const roleId = roleMap[mappedRole];

      try {
        // Check if user already exists
        const { data: existingAuth } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingAuth.users.find(u => u.email === email);

        if (existingUser) {
          // Update existing user profile
          const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .upsert({
              id: existingUser.id,
              role_id: roleId,
              full_name: fullName,
              title: sfUser.Title || null,
              department: sfUser.Department || null,
              email: email,
              phone: sfUser.Phone || null,
              mobile_phone: sfUser.MobilePhone || null,
              salesforce_user_id: sfUser.Id,
              is_active: true
            }, {
              onConflict: 'id'
            });

          if (profileError) throw profileError;

          results.updated.push({
            email,
            name: fullName,
            role: mappedRole,
            sfProfile: profileName
          });
        } else {
          // Create new user
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            user_metadata: {
              full_name: fullName,
              first_name: sfUser.FirstName,
              last_name: sfUser.LastName
            }
          });

          if (authError) throw authError;

          // Create user profile
          const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              role_id: roleId,
              full_name: fullName,
              title: sfUser.Title || null,
              department: sfUser.Department || null,
              email: email,
              phone: sfUser.Phone || null,
              mobile_phone: sfUser.MobilePhone || null,
              salesforce_user_id: sfUser.Id,
              is_active: true,
              password_change_required: true,
              temporary_password: DEFAULT_PASSWORD
            });

          if (profileError) throw profileError;

          results.created.push({
            email,
            name: fullName,
            role: mappedRole,
            sfProfile: profileName,
            tempPassword: DEFAULT_PASSWORD
          });
        }

      } catch (error: any) {
        results.errors.push({
          email,
          name: fullName,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Salesforce users synced successfully',
        summary: {
          total: sfUsers.length,
          created: results.created.length,
          updated: results.updated.length,
          skipped: results.skipped.length,
          errors: results.errors.length
        },
        details: {
          created: results.created,
          updated: results.updated,
          skipped: results.skipped,
          errors: results.errors
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
