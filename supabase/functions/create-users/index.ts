import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SunationEmployee {
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  role: string;
}
const sunationEmployees: SunationEmployee[] = [
  { firstName: 'Michael', lastName: 'Dellarocca', title: 'Finance Administrator', department: 'ADMIN - Finance', role: 'admin' },
  { firstName: 'Richard', lastName: 'Gutkind', title: 'Finance Administrator', department: 'ADMIN - Finance', role: 'admin' },
  { firstName: 'Sandra', lastName: 'Rivera', title: 'Finance Administrator', department: 'ADMIN - Finance', role: 'admin' },
  { firstName: 'Alyssa', lastName: 'Levy', title: 'Finance Administrator', department: 'ADMIN - Finance', role: 'admin' },
  { firstName: 'Kim', lastName: 'Betsko', title: 'Finance Administrator', department: 'ADMIN - Finance', role: 'admin' },
  { firstName: 'Roanne', lastName: 'Morse', title: 'Finance Administrator', department: 'ADMIN - Finance', role: 'admin' },
  { firstName: 'Sara', lastName: 'Aronson', title: 'Finance Administrator', department: 'ADMIN - Finance', role: 'admin' },
  { firstName: 'Kathleen', lastName: 'Noonan', title: 'Finance Administrator', department: 'ADMIN - Finance', role: 'admin' },
  { firstName: 'Sean', lastName: 'Beattie', title: 'Engineering Administrator', department: 'ADMIN- Engineering', role: 'admin' },
  { firstName: 'Julianna', lastName: 'Cicero', title: 'Engineering Administrator', department: 'ADMIN- Engineering', role: 'admin' },
  { firstName: 'John', lastName: 'Ferrara', title: 'Engineering Administrator', department: 'ADMIN- Engineering', role: 'admin' },
  { firstName: 'James', lastName: 'Pisseri', title: 'Engineering Administrator', department: 'ADMIN- Engineering', role: 'admin' },
  { firstName: 'Melinda', lastName: 'Danziger', title: 'Engineering Administrator', department: 'ADMIN- Engineering', role: 'admin' },
  { firstName: 'Jethro', lastName: 'Armand', title: 'Engineering Administrator', department: 'ADMIN- Engineering', role: 'admin' },
  { firstName: 'Justin', lastName: 'DellaRocca', title: 'Engineering Administrator', department: 'ADMIN- Engineering', role: 'admin' },
  { firstName: 'Brian', lastName: 'Ziff', title: 'Engineering Administrator', department: 'ADMIN- Engineering', role: 'admin' },
  { firstName: 'Maria', lastName: 'Martin', title: 'Lead Qualification Manager', department: 'Admin- Lead Qualification', role: 'sales_manager' },
  { firstName: 'Lynn', lastName: 'Vita', title: 'Lead Qualification Manager', department: 'Admin- Lead Qualification', role: 'sales_manager' },
  { firstName: 'Patricia', lastName: 'Kemesies', title: 'Lead Qualification Manager', department: 'Admin- Lead Qualification', role: 'sales_manager' },
  { firstName: 'Brandon', lastName: 'Evans', title: 'Lead Qualification Manager', department: 'Admin- Lead Qualification', role: 'sales_manager' },
  { firstName: 'Kristin', lastName: 'Hlavka', title: 'Executive', department: 'Executive', role: 'admin' },
  { firstName: 'Scott', lastName: 'Maskin', title: 'Executive', department: 'Executive', role: 'admin' },
  { firstName: 'James', lastName: 'Brennan', title: 'Executive', department: 'Executive', role: 'admin' },
  { firstName: 'Mitchell', lastName: 'Sommer', title: 'Finance', department: 'Finance', role: 'admin' },
  { firstName: 'Maria', lastName: 'Diaz', title: 'HR Manager', department: 'Human Resources', role: 'hr_manager' },
  { firstName: 'Melissa', lastName: 'Johnson', title: 'HR Manager', department: 'Human Resources', role: 'hr_manager' },
  { firstName: 'Erin', lastName: 'MacGrady', title: 'HR Manager', department: 'Human Resources', role: 'hr_manager' },
  { firstName: 'Michael', lastName: 'Stegmeier', title: 'IT Manager', department: 'Information Systems', role: 'admin' },
  { firstName: 'Cory', lastName: 'Carrara', title: 'IT Manager', department: 'Information Systems', role: 'admin' },
  { firstName: 'Regina', lastName: 'Yau', title: 'IT Manager', department: 'Information Systems', role: 'admin' },
  { firstName: 'Tammy', lastName: 'Lea', title: 'Processing Administrator', department: 'Resi Admin - Processing', role: 'operations' },
  { firstName: 'Jessica', lastName: 'Vandenburgh', title: 'Processing Administrator', department: 'Resi Admin - Processing', role: 'operations' },
  { firstName: 'Gina', lastName: 'Cicero', title: 'Processing Administrator', department: 'Resi Admin - Processing', role: 'operations' },
  { firstName: 'Evelyn', lastName: 'Polvere', title: 'Processing Administrator', department: 'Resi Admin - Processing', role: 'operations' },
  { firstName: 'Jasmine', lastName: 'Fuentes', title: 'Processing Administrator', department: 'Resi Admin - Processing', role: 'operations' },
  { firstName: 'David', lastName: 'Strickland', title: 'Maintenance Technician', department: 'Resi Maintenance', role: 'operations' },
  { firstName: 'John', lastName: 'Leach', title: 'Residential Sales Representative', department: 'Resi Sales', role: 'sales_rep' },
  { firstName: 'John', lastName: 'Liberatore', title: 'Residential Sales Representative', department: 'Resi Sales', role: 'sales_rep' },
  { firstName: 'Kevin', lastName: 'Stafford', title: 'Residential Sales Representative', department: 'Resi Sales', role: 'sales_rep' },
  { firstName: 'Chandradat', lastName: 'Phagu', title: 'Residential Sales Representative', department: 'Resi Sales', role: 'sales_rep' },
  { firstName: 'Cameron', lastName: 'Augienello', title: 'Residential Sales Representative', department: 'Resi Sales', role: 'sales_rep' },
  { firstName: 'Brian', lastName: 'Murphy', title: 'Residential Sales Representative', department: 'Resi Sales', role: 'sales_rep' },
  { firstName: 'Marques', lastName: 'Bloxon', title: 'Residential Sales Representative', department: 'Resi Sales', role: 'sales_rep' },
  { firstName: 'Kevin', lastName: 'Jaramillo', title: 'Residential Sales Representative', department: 'Resi Sales', role: 'sales_rep' },
  { firstName: 'Christopher', lastName: 'Johnson', title: 'Residential Sales Representative', department: 'Resi Sales', role: 'sales_rep' },
  { firstName: 'Gary', lastName: 'Roffman', title: 'Sales Administrator', department: 'Resi Sales - Admin', role: 'sales_manager' },
  { firstName: 'Brian', lastName: 'Bennett', title: 'Sales Administrator', department: 'Resi Sales - Admin', role: 'sales_manager' },
  { firstName: 'Alexa', lastName: 'Papa', title: 'Sales Administrator', department: 'Resi Sales - Admin', role: 'sales_manager' },
  { firstName: 'Jessica', lastName: 'Grady', title: 'Sales Administrator', department: 'Resi Sales - Admin', role: 'sales_manager' },
  { firstName: 'Richard', lastName: 'Gearhart', title: 'Sales Administrator', department: 'Resi Sales - Admin', role: 'sales_manager' },
  { firstName: 'Harry', lastName: 'Belechto', title: 'Service Coordinator', department: 'Service Office', role: 'support' },
  { firstName: 'Antoinette', lastName: 'Hemberger', title: 'Service Coordinator', department: 'Service Office', role: 'support' },
  { firstName: 'Christopher', lastName: 'Sauve', title: 'Service Coordinator', department: 'Service Office', role: 'support' },
  { firstName: 'Glenn', lastName: 'Dachinger', title: 'Service Coordinator', department: 'Service Office', role: 'support' },
  { firstName: 'Michael', lastName: 'Castillo', title: 'Service Coordinator', department: 'Service Office', role: 'support' },
  { firstName: 'Alyssa', lastName: 'Smith', title: 'Service Coordinator', department: 'Service Office', role: 'support' },
  { firstName: 'Donna', lastName: 'Trott', title: 'Service Coordinator', department: 'Service Office', role: 'support' },
  { firstName: 'Jeffrey', lastName: 'Karpowich', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Frank', lastName: 'Capone', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Nicholas', lastName: 'Henneborn', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Tyler', lastName: 'Jackson', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Michael', lastName: 'LoSordo', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Jason', lastName: 'Fraser', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Jonathon', lastName: 'Ziff', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Jarrid', lastName: 'Long', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Daniel', lastName: 'Hummel', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Ravi', lastName: 'Lakhindar', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Brian', lastName: 'DeRoia', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Dominick', lastName: 'Bostick', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Edenilson', lastName: 'Martinez', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Benjamin', lastName: 'Perrone', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Michael', lastName: 'Michelini', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Orland', lastName: 'Sweeney', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Brody', lastName: 'Streames', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Brian', lastName: 'Hoffman', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Erik', lastName: 'Lundegaard', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Paul', lastName: 'Schmitt', title: 'Commercial Installer', department: 'SUN Commercial Install', role: 'operations' },
  { firstName: 'Scott', lastName: 'Sousa', title: 'Commercial Office Staff', department: 'SUN Commercial Office', role: 'operations' },
  { firstName: 'Tara', lastName: 'DelBianco', title: 'Commercial Office Staff', department: 'SUN Commercial Office', role: 'operations' },
  { firstName: 'Rachel', lastName: 'Sauve', title: 'Commercial Office Staff', department: 'SUN Commercial Office', role: 'operations' },
  { firstName: 'Elizabeth', lastName: 'Graziani', title: 'Commercial Office Staff', department: 'SUN Commercial Office', role: 'operations' },
  { firstName: 'Jayson', lastName: 'Morales', title: 'Commercial Office Staff', department: 'SUN Commercial Office', role: 'operations' },
  { firstName: 'Taylor', lastName: 'MacCallum', title: 'Commercial Office Staff', department: 'SUN Commercial Office', role: 'operations' },
  { firstName: 'Daniel', lastName: 'Lombardi', title: 'Commercial Office Staff', department: 'SUN Commercial Office', role: 'operations' },
  { firstName: 'Victor', lastName: 'Taciak', title: 'Commercial Office Staff', department: 'SUN Commercial Office', role: 'operations' },
  { firstName: 'James', lastName: 'Keane', title: 'Commercial Sales Representative', department: 'SUN Commercial Sales', role: 'sales_rep' },
  { firstName: 'Andrew', lastName: 'Figueroa', title: 'Commercial Sales Representative', department: 'SUN Commercial Sales', role: 'sales_rep' },
  { firstName: 'Richard', lastName: 'Murdocco', title: 'Marketing Administrator', department: 'SUN Resi Admin - Marketin', role: 'sales_manager' },
  { firstName: 'Chris', lastName: 'Allgaier', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Joseph', lastName: 'Picinich', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Michael', lastName: 'Krebs', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'John', lastName: 'Bergano', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Devin', lastName: 'Woods', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Joseph', lastName: 'Charlip', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Steven', lastName: 'Pipitone', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Steven', lastName: 'Menendez', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'John', lastName: 'McDonough', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Michael', lastName: 'Burns', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Victor', lastName: 'Higgins', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Thomas', lastName: 'Vojta', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Emmanuel', lastName: 'Hernandez', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Massiah', lastName: 'Williams', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Michael', lastName: 'Kenney', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'John', lastName: 'Feramola', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Kyle', lastName: 'Menendez', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Rahmel', lastName: 'Young', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Jephthe', lastName: 'De Peretti', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Joshua', lastName: 'Barker-Ortiz', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Timothy', lastName: 'Monahan', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Justin', lastName: 'Tobin', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Jackson', lastName: 'Aplicano-Lopez', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Devyn', lastName: 'Suncar', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Marvin', lastName: 'Torres', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Ryan', lastName: 'Alexis', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'David', lastName: 'Vasquez Cardenas', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Jaime', lastName: 'Martinez', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Edison', lastName: 'Fernandez Lopez', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Joshua', lastName: 'Dukofsky', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Oscar', lastName: 'Troost', title: 'Residential Installer', department: 'SUN Resi Install', role: 'operations' },
  { firstName: 'Brian', lastName: 'Karp', title: 'Residential Operations Manager', department: 'SUN Resi Leadership', role: 'sales_manager' },
  { firstName: 'John', lastName: 'Mucci', title: 'Residential Operations Manager', department: 'SUN Resi Leadership', role: 'sales_manager' },
  { firstName: 'Scott', lastName: 'Morrison', title: 'Roofing Specialist', department: 'SUN Roofing', role: 'operations' },
  { firstName: 'Gregory', lastName: 'Morrison', title: 'Roofing Specialist', department: 'SUN Roofing', role: 'operations' },
  { firstName: 'Juan', lastName: 'Cartagena', title: 'Roofing Specialist', department: 'SUN Roofing', role: 'operations' },
  { firstName: 'Alexander', lastName: 'Terlizzo', title: 'Roofing Specialist', department: 'SUN Roofing', role: 'operations' },
  { firstName: 'Jasler', lastName: 'Santos-Banegas', title: 'Roofing Specialist', department: 'SUN Roofing', role: 'operations' },
  { firstName: 'Randall', lastName: 'Clayton', title: 'Roofing Specialist', department: 'SUN Roofing', role: 'operations' },
  { firstName: 'Brayan', lastName: 'Santos-Padilla', title: 'Roofing Specialist', department: 'SUN Roofing', role: 'operations' },
  { firstName: 'Roger', lastName: 'Matute Ochoa', title: 'Roofing Specialist', department: 'SUN Roofing', role: 'operations' },
  { firstName: 'Bayron', lastName: 'Lobo Ordoñez', title: 'Roofing Specialist', department: 'SUN Roofing', role: 'operations' },
  { firstName: 'David', lastName: 'Kemp', title: 'Roofing Specialist', department: 'SUN Roofing', role: 'operations' },
  { firstName: 'Stephen', lastName: 'Cascio', title: 'Field Service Technician', department: 'SUN Service Field', role: 'operations' },
  { firstName: 'Peter', lastName: 'Bartolomeo', title: 'Field Service Technician', department: 'SUN Service Field', role: 'operations' },
  { firstName: 'Kris', lastName: 'Cruciani', title: 'Field Service Technician', department: 'SUN Service Field', role: 'operations' },
  { firstName: 'John', lastName: 'Koppel', title: 'Field Service Technician', department: 'SUN Service Field', role: 'operations' },
  { firstName: 'Maxwell', lastName: 'Pesa', title: 'Field Service Technician', department: 'SUN Service Field', role: 'operations' },
  { firstName: 'Darren', lastName: 'Signorelli', title: 'Field Service Technician', department: 'SUN Service Field', role: 'operations' },
  { firstName: 'Charles', lastName: 'Corbett', title: 'Field Service Technician', department: 'SUN Service Field', role: 'operations' },
  { firstName: 'Eric', lastName: 'Flores', title: 'Field Service Technician', department: 'SUN Service Field', role: 'operations' },
  { firstName: 'Micah', lastName: 'Benjamin', title: 'Field Service Technician', department: 'SUN Service Field', role: 'operations' },
  { firstName: 'Kwesi', lastName: 'Afrim-Thomas-Henderson', title: 'Field Service Technician', department: 'SUN Service Field', role: 'operations' },
  { firstName: 'Anthony', lastName: 'Averos Valverde', title: 'Field Service Technician', department: 'SUN Service Field', role: 'operations' },
  { firstName: 'Michael', lastName: 'King', title: 'Field Service Technician', department: 'SUN Service Field', role: 'operations' },
  { firstName: 'Frank', lastName: 'Struffolino', title: 'Service Sales Representative', department: 'SUN Service Sales', role: 'sales_rep' },
  { firstName: 'Sean', lastName: 'Stafford', title: 'Service Sales Representative', department: 'SUN Service Sales', role: 'sales_rep' },
  { firstName: 'Christina', lastName: 'Etienne', title: 'Warehouse Staff', department: 'Warehouse', role: 'operations' },
  { firstName: 'Williams', lastName: 'Segura', title: 'Warehouse Staff', department: 'Warehouse', role: 'operations' }
];

function generateEmail(firstName: string, lastName: string): string {
  const firstInitial = firstName.charAt(0).toLowerCase();
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
  return `${firstInitial}${cleanLastName}@sunation.com`;
}

const DEFAULT_PASSWORD = 'sunation9454';

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

    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('id, name, display_name');

    if (rolesError) throw rolesError;

    const roleMap: Record<string, string> = {};
    roles?.forEach((role: any) => {
      roleMap[role.name] = role.id;
    });

    const results = {
      deleted: 0,
      created: [] as any[],
      errors: [] as any[]
    };

    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();

    for (const user of existingAuthUsers.users) {
      if (user.email?.includes('@sunation.com')) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        results.deleted++;
      }
    }

    for (const emp of sunationEmployees) {
      const email = generateEmail(emp.firstName, emp.lastName);
      const tempPassword = DEFAULT_PASSWORD;
      const fullName = `${emp.firstName} ${emp.lastName}`;

      try {
        const { data: authData, error: authError} = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            first_name: emp.firstName,
            last_name: emp.lastName
          }
        });

        if (authError) throw authError;

        const roleId = roleMap[emp.role];

        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            role_id: roleId,
            full_name: fullName,
            title: emp.title,
            department: emp.department,
            email: email,
            is_active: true,
            password_change_required: true,
            temporary_password: tempPassword
          });

        if (profileError) throw profileError;

        results.created.push({
          email,
          name: fullName,
          role: emp.role,
          tempPassword
        });

      } catch (error: any) {
        results.errors.push({ email, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sunation users imported successfully',
        summary: {
          deleted: results.deleted,
          created: results.created.length,
          errors: results.errors.length
        },
        users: results.created
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
