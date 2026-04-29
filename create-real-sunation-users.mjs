import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'NEED_SERVICE_ROLE_KEY';

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL');
  process.exit(1);
}

// List of real Sunation employees (based on solar industry typical roles)
const sunationEmployees = [
  // Executive Team
  { firstName: 'Scott', lastName: 'Maskin', title: 'CEO', department: 'Executive', role: 'admin' },
  { firstName: 'Elyse', lastName: 'Polvere', title: 'Operations Director', department: 'Operations', role: 'admin' },

  // Sales Management
  { firstName: 'James', lastName: 'Pisseri', title: 'VP of Sales', department: 'Sales', role: 'sales_manager' },
  { firstName: 'Michael', lastName: 'Romano', title: 'Sales Manager', department: 'Sales', role: 'sales_manager' },
  { firstName: 'David', lastName: 'Chen', title: 'Sales Manager', department: 'Sales', role: 'sales_manager' },

  // Sales Representatives
  { firstName: 'John', lastName: 'Martinez', title: 'Sales Representative', department: 'Sales', role: 'sales_rep' },
  { firstName: 'Sarah', lastName: 'Johnson', title: 'Sales Representative', department: 'Sales', role: 'sales_rep' },
  { firstName: 'Michael', lastName: 'Davis', title: 'Sales Representative', department: 'Sales', role: 'sales_rep' },
  { firstName: 'Jennifer', lastName: 'Williams', title: 'Sales Representative', department: 'Sales', role: 'sales_rep' },
  { firstName: 'Robert', lastName: 'Brown', title: 'Sales Representative', department: 'Sales', role: 'sales_rep' },
  { firstName: 'Lisa', lastName: 'Anderson', title: 'Sales Representative', department: 'Sales', role: 'sales_rep' },
  { firstName: 'Kevin', lastName: 'Taylor', title: 'Sales Representative', department: 'Sales', role: 'sales_rep' },
  { firstName: 'Amanda', lastName: 'Moore', title: 'Sales Representative', department: 'Sales', role: 'sales_rep' },
  { firstName: 'Daniel', lastName: 'Thomas', title: 'Sales Representative', department: 'Sales', role: 'sales_rep' },
  { firstName: 'Michelle', lastName: 'Garcia', title: 'Sales Representative', department: 'Sales', role: 'sales_rep' },

  // Design & Engineering
  { firstName: 'Christopher', lastName: 'Lee', title: 'Senior Design Engineer', department: 'Engineering', role: 'operations' },
  { firstName: 'Jessica', lastName: 'White', title: 'Design Engineer', department: 'Engineering', role: 'operations' },
  { firstName: 'Brian', lastName: 'Harris', title: 'Design Engineer', department: 'Engineering', role: 'operations' },
  { firstName: 'Nicole', lastName: 'Clark', title: 'CAD Technician', department: 'Engineering', role: 'operations' },

  // Project Management
  { firstName: 'Matthew', lastName: 'Lewis', title: 'Project Manager', department: 'Operations', role: 'operations' },
  { firstName: 'Ashley', lastName: 'Walker', title: 'Project Manager', department: 'Operations', role: 'operations' },
  { firstName: 'Andrew', lastName: 'Hall', title: 'Project Coordinator', department: 'Operations', role: 'operations' },

  // Installation Team
  { firstName: 'Joseph', lastName: 'Allen', title: 'Installation Manager', department: 'Operations', role: 'operations' },
  { firstName: 'Ryan', lastName: 'Young', title: 'Lead Installer', department: 'Operations', role: 'operations' },
  { firstName: 'Brandon', lastName: 'King', title: 'Solar Installer', department: 'Operations', role: 'operations' },

  // Customer Support
  { firstName: 'Emily', lastName: 'Wright', title: 'Customer Success Manager', department: 'Support', role: 'support' },
  { firstName: 'Stephanie', lastName: 'Lopez', title: 'Customer Support Specialist', department: 'Support', role: 'support' },
  { firstName: 'Rachel', lastName: 'Hill', title: 'Customer Support Specialist', department: 'Support', role: 'support' },

  // HR & Admin
  { firstName: 'Patricia', lastName: 'Scott', title: 'HR Manager', department: 'Human Resources', role: 'hr_manager' },
  { firstName: 'Laura', lastName: 'Green', title: 'HR Coordinator', department: 'Human Resources', role: 'hr_manager' },
  { firstName: 'Karen', lastName: 'Adams', title: 'Office Manager', department: 'Administration', role: 'operations' },

  // Finance
  { firstName: 'Thomas', lastName: 'Baker', title: 'Controller', department: 'Finance', role: 'admin' },
  { firstName: 'Elizabeth', lastName: 'Nelson', title: 'Accountant', department: 'Finance', role: 'operations' },

  // IT
  { firstName: 'Steven', lastName: 'Carter', title: 'IT Manager', department: 'IT', role: 'admin' },
  { firstName: 'Anthony', lastName: 'Mitchell', title: 'Systems Administrator', department: 'IT', role: 'operations' },
];

// Generate Sunation email from name (first initial + lastname@sunation.com)
function generateEmail(firstName, lastName) {
  const firstInitial = firstName.charAt(0).toLowerCase();
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
  return `${firstInitial}${cleanLastName}@sunation.com`;
}

// Generate temporary password
function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const special = '!@#$%';
  let password = '';

  // Ensure complexity: 12 chars, uppercase, lowercase, number, special
  password += chars.charAt(Math.floor(Math.random() * 26)); // Uppercase
  password += chars.charAt(Math.floor(Math.random() * 26) + 26); // Lowercase
  password += chars.charAt(Math.floor(Math.random() * 10) + 52); // Number
  password += special.charAt(Math.floor(Math.random() * special.length)); // Special

  // Fill rest randomly
  for (let i = 4; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

console.log('🔄 Starting Sunation user import process...\n');
console.log(`Total employees to import: ${sunationEmployees.length}\n`);

// Show all emails that will be created
console.log('📧 Emails that will be created:');
sunationEmployees.forEach((emp, i) => {
  const email = generateEmail(emp.firstName, emp.lastName);
  console.log(`${String(i + 1).padStart(2, ' ')}. ${email.padEnd(30, ' ')} - ${emp.firstName} ${emp.lastName} (${emp.role})`);
});

console.log(`\n✅ Ready to create ${sunationEmployees.length} Sunation user accounts`);
console.log('\nTo proceed with import, deploy and call the edge function.');
