#!/usr/bin/env node
/**
 * Bulk-create Supabase auth users + user_profiles rows for every SUNation
 * employee in `web/employees-to-import.json`. Idempotent — skips users that
 * already exist by email.
 *
 * REQUIRES env:
 *   VITE_SUPABASE_URL              (already in web/.env)
 *   SUPABASE_SERVICE_ROLE_KEY      (Supabase Dashboard -> Project Settings ->
 *                                   API -> service_role key. Admin-only.
 *                                   NEVER commit this. Pass via env only.)
 *
 * Usage from web/ directory:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/bulk-create-users.mjs
 *
 * Or to dry-run (no writes, just preview):
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/bulk-create-users.mjs --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN      = process.argv.includes('--dry-run');
const DEFAULT_PWD  = 'sunation9454';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  console.error('Set both before running. Service key: Dashboard → Project Settings → API → service_role.');
  process.exit(1);
}
if (SERVICE_KEY.includes('anon')) {
  console.error('That looks like an anon key. We need the service_role key.');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Department → role mapping. Roles must exist in user_roles table.
// Override per-user post-import via Admin → User Management if needed.
// ---------------------------------------------------------------------------
const DEPT_TO_ROLE = {
  // Admin / back-office
  'Finance':                       'admin',
  'Information Systems':           'admin',
  'Corporate Office':              'admin',
  'Executive Office':              'admin',

  // HR
  'Human Resources':               'hr_manager',

  // Sales
  'Residential Sales':             'sales_rep',
  'Commercial Sales':              'sales_rep',
  'Lead Qualification':            'sales_rep',
  'Marketing':                     'sales_manager',

  // Support / Service
  'Service Field':                 'support',
  'Service Office':                'support',
  'Maintenance':                   'support',

  // Operations (everything else physical / project-based)
  'Residential Installation':      'operations',
  'Commercial Installation':       'operations',
  'Commercial':                    'operations',
  'Commercial Project Management': 'operations',
  'Commercial Engineering':        'operations',
  'Residential Engineering':       'operations',
  'Roofing':                       'operations',
  'Warehouse':                     'operations',
  'Processing':                    'operations',
  'Procurement':                   'operations',
  'Operations':                    'operations',
};
const DEFAULT_ROLE = 'sales_rep';

// ---------------------------------------------------------------------------
// Load employees + existing role_id map
// ---------------------------------------------------------------------------
const employees = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, 'employees-to-import.json'), 'utf8')
);

console.log(`Loaded ${employees.length} employees.`);
console.log(`Default password for everyone: ${DEFAULT_PWD}`);
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
console.log('---');

// Fetch the user_roles table so we can resolve role names → ids.
const { data: roles, error: rolesErr } = await sb.from('user_roles').select('id, name');
if (rolesErr) {
  console.error('Could not read user_roles:', rolesErr.message);
  console.error('Is the table present? Run prior migrations first.');
  process.exit(1);
}
const roleByName = Object.fromEntries(roles.map((r) => [r.name, r.id]));
const requiredRoles = new Set(Object.values(DEPT_TO_ROLE).concat([DEFAULT_ROLE]));
const missing = [...requiredRoles].filter((r) => !roleByName[r]);
if (missing.length) {
  console.error(`Missing roles in user_roles table: ${missing.join(', ')}`);
  console.error('Create them before continuing.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Existing users by email (so we can skip)
// ---------------------------------------------------------------------------
const existingByEmail = new Map();
{
  let page = 1;
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error('Could not list existing users:', error.message);
      process.exit(1);
    }
    for (const u of data.users) {
      if (u.email) existingByEmail.set(u.email.toLowerCase(), u.id);
    }
    if (!data.users.length || data.users.length < 1000) break;
    page++;
  }
}
console.log(`Existing auth users in project: ${existingByEmail.size}`);
console.log('---');

// ---------------------------------------------------------------------------
// Create / link
// ---------------------------------------------------------------------------
const created = [];
const skipped = [];
const errored = [];

for (const emp of employees) {
  const role     = DEPT_TO_ROLE[emp.department] || DEFAULT_ROLE;
  const roleId   = roleByName[role];
  const fullName = emp.full_name;
  const email    = emp.email.toLowerCase();

  if (existingByEmail.has(email)) {
    skipped.push({ email, reason: 'already exists' });
    continue;
  }

  if (DRY_RUN) {
    created.push({ email, name: fullName, dept: emp.department, role, roleId });
    continue;
  }

  try {
    // 1. auth user
    const { data: authData, error: authErr } = await sb.auth.admin.createUser({
      email,
      password: DEFAULT_PWD,
      email_confirm: true,
      user_metadata: {
        full_name:  fullName,
        first_name: emp.first,
        last_name:  emp.last,
      },
    });
    if (authErr) throw authErr;

    // 2. user_profiles row (matches existing schema from create-users edge fn)
    const { error: profileErr } = await sb.from('user_profiles').insert({
      id:                       authData.user.id,
      role_id:                  roleId,
      full_name:                fullName,
      title:                    emp.department,           // dept doubles as title until HR fills in real titles
      department:               emp.department,
      email:                    email,
      is_active:                true,
      password_change_required: false,                    // user wants direct sign-in with default password
      temporary_password:       DEFAULT_PWD,
    });
    if (profileErr) throw profileErr;

    created.push({ email, name: fullName, dept: emp.department, role });
    console.log(`  ✅  ${email.padEnd(36)} ${role.padEnd(14)} ${fullName}`);
  } catch (err) {
    errored.push({ email, error: err.message ?? String(err) });
    console.log(`  ❌  ${email.padEnd(36)} ${err.message ?? err}`);
  }
}

// ---------------------------------------------------------------------------
// Summary + audit log
// ---------------------------------------------------------------------------
const auditPath = path.join(PROJECT_ROOT, 'employees-import-result.json');
fs.writeFileSync(auditPath, JSON.stringify({ created, skipped, errored, when: new Date().toISOString() }, null, 2));

console.log('---');
console.log(`Created: ${created.length}`);
console.log(`Skipped: ${skipped.length}`);
console.log(`Errored: ${errored.length}`);
console.log(`Audit:   ${path.relative(process.cwd(), auditPath)}`);
if (errored.length) {
  console.log('\nErrors:');
  errored.forEach((e) => console.log(`  ${e.email}: ${e.error}`));
}
