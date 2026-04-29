import { readFileSync } from 'fs';

const csv = readFileSync('/tmp/cc-agent/57590864/project/real-sunation-employees.csv', 'utf-8');
const lines = csv.split('\n').slice(1).filter(line => line.trim());

const departmentToRole = {
  'ADMIN - Finance': 'admin',
  'ADMIN- Engineering': 'admin',
  'Admin- Lead Qualification': 'sales_manager',
  'Executive': 'admin',
  'Finance': 'admin',
  'Human Resources': 'hr_manager',
  'Information Systems': 'admin',
  'Resi Admin - Processing': 'operations',
  'Resi Maintenance': 'operations',
  'Resi Sales': 'sales_rep',
  'Resi Sales - Admin': 'sales_manager',
  'Service Office': 'support',
  'SUN Commercial Install': 'operations',
  'SUN Commercial Office': 'operations',
  'SUN Commercial Sales': 'sales_rep',
  'SUN Resi Admin - Marketin': 'sales_manager',
  'SUN Resi Install': 'operations',
  'SUN Resi Leadership': 'sales_manager',
  'SUN Roofing': 'operations',
  'SUN Service Field': 'operations',
  'SUN Service Sales': 'sales_rep',
  'Warehouse': 'operations'
};

const departmentToTitle = {
  'ADMIN - Finance': 'Finance Administrator',
  'ADMIN- Engineering': 'Engineering Administrator',
  'Admin- Lead Qualification': 'Lead Qualification Manager',
  'Executive': 'Executive',
  'Finance': 'Finance',
  'Human Resources': 'HR Manager',
  'Information Systems': 'IT Manager',
  'Resi Admin - Processing': 'Processing Administrator',
  'Resi Maintenance': 'Maintenance Technician',
  'Resi Sales': 'Residential Sales Representative',
  'Resi Sales - Admin': 'Sales Administrator',
  'Service Office': 'Service Coordinator',
  'SUN Commercial Install': 'Commercial Installer',
  'SUN Commercial Office': 'Commercial Office Staff',
  'SUN Commercial Sales': 'Commercial Sales Representative',
  'SUN Resi Admin - Marketin': 'Marketing Administrator',
  'SUN Resi Install': 'Residential Installer',
  'SUN Resi Leadership': 'Residential Operations Manager',
  'SUN Roofing': 'Roofing Specialist',
  'SUN Service Field': 'Field Service Technician',
  'SUN Service Sales': 'Service Sales Representative',
  'Warehouse': 'Warehouse Staff'
};

const employees = [];
const seenEmails = new Set();

for (const line of lines) {
  const match = line.match(/"([^"]+)",(.+)/);
  if (!match) continue;

  const [, name, department] = match;
  const nameParts = name.split(',').map(s => s.trim());

  if (nameParts.length < 2) continue;

  let lastName = nameParts[0].replace(/ (Jr\.|Sr\.|II|III|IV)$/i, '').trim();
  let firstNameParts = nameParts[1].split(' ');
  let firstName = firstNameParts[0];

  const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const firstInitial = firstName.charAt(0).toLowerCase();
  const email = `${firstInitial}${cleanLastName}@sunation.com`;

  if (seenEmails.has(email)) {
    console.log(`Skipping duplicate email: ${email} for ${firstName} ${lastName}`);
    continue;
  }
  seenEmails.add(email);

  const role = departmentToRole[department] || 'operations';
  const title = departmentToTitle[department] || department;

  employees.push({
    firstName,
    lastName,
    title,
    department,
    role
  });
}

console.log(`Total unique employees: ${employees.length}\n`);

console.log('Role breakdown:');
const roleCounts = {};
employees.forEach(emp => {
  roleCounts[emp.role] = (roleCounts[emp.role] || 0) + 1;
});
Object.entries(roleCounts).forEach(([role, count]) => {
  console.log(`  ${role}: ${count}`);
});

console.log('\n// TypeScript array for edge function:');
console.log('const sunationEmployees: SunationEmployee[] = [');
employees.forEach((emp, i) => {
  const comma = i < employees.length - 1 ? ',' : '';
  console.log(`  { firstName: '${emp.firstName}', lastName: '${emp.lastName}', title: '${emp.title}', department: '${emp.department}', role: '${emp.role}' }${comma}`);
});
console.log('];');

console.log(`\n\nTotal: ${employees.length} employees`);
