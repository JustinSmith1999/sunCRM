import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkSalesData() {
  console.log('Checking Sales Management data...\n');

  // Check for sales roles
  const { data: allUsers, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, role, department, title')
    .order('email');

  if (usersError) {
    console.error('Error fetching users:', usersError);
  } else {
    console.log(`Total users: ${allUsers.length}`);
    console.log('\nAll user roles:');
    const roleCounts = {};
    allUsers.forEach(user => {
      const role = user.role || 'no_role';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    console.log(roleCounts);

    const salesReps = allUsers.filter(u =>
      u.role === 'sales_rep' || u.role === 'sales_manager'
    );
    console.log(`\nSales team members (sales_rep or sales_manager): ${salesReps.length}`);
    if (salesReps.length > 0) {
      salesReps.forEach(rep => {
        console.log(`  - ${rep.full_name || rep.email} (${rep.role})`);
      });
    }

    // Show users who might be sales people
    const potentialSalesUsers = allUsers.filter(u =>
      u.role?.includes('sales') ||
      u.department?.toLowerCase().includes('sales') ||
      u.title?.toLowerCase().includes('sales')
    );
    console.log(`\nPotential sales users (by role/department/title): ${potentialSalesUsers.length}`);
    if (potentialSalesUsers.length > 0) {
      potentialSalesUsers.forEach(user => {
        console.log(`  - ${user.full_name || user.email}`);
        console.log(`    Role: ${user.role || 'N/A'}, Dept: ${user.department || 'N/A'}, Title: ${user.title || 'N/A'}`);
      });
    }
  }

  // Check leads
  const { data: allLeads, count: totalLeads, error: leadsError } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  if (leadsError) {
    console.error('\nError fetching leads:', leadsError);
  } else {
    console.log(`\n\nTotal leads in database: ${totalLeads}`);

    const { count: unassignedCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .is('assigned_to', null);

    console.log(`Unassigned leads: ${unassignedCount || 0}`);

    // Get sample of recent leads
    const { data: recentLeads } = await supabase
      .from('leads')
      .select('first_name, last_name, company, status, assigned_to, created_date')
      .order('created_date', { ascending: false })
      .limit(5);

    if (recentLeads && recentLeads.length > 0) {
      console.log('\nRecent leads:');
      recentLeads.forEach(lead => {
        console.log(`  - ${lead.first_name} ${lead.last_name} (${lead.company || 'No company'})`);
        console.log(`    Status: ${lead.status}, Assigned: ${lead.assigned_to ? 'Yes' : 'No'}, Date: ${lead.created_date}`);
      });
    }
  }
}

checkSalesData().catch(console.error);
