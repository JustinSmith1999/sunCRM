#!/usr/bin/env node
/**
 * Bulk-create OR RESET Supabase auth users + user_profiles for every SUNation
 * employee in `web/employees-to-import.json`, plus a separate `tech@sunation.com`
 * IT account.
 *
 * Behavior:
 *   - For each EE-list employee:
 *       email = <firstInitial><lastname>@sunation.com
 *       password = fresh crypto-random 16 chars
 *       password_change_required = true (forced rotation on first login)
 *       If auth user exists  → admin.updateUserById(password)
 *       If auth user missing → admin.createUser
 *       upsert user_profiles row
 *   - Separately, the IT-only account `tech@sunation.com`:
 *       password = Go2Maine!*  (operator-supplied)
 *       password_change_required = false
 *       role = admin, title = IT Manager
 *       Same create-or-reset path.
 *   - Output: web/employees-credentials.csv (mode 0600, gitignored).
 *     Distribute via 1Password / sealed envelopes, then DELETE the file.
 *
 * REQUIRES env:
 *   VITE_SUPABASE_URL              (already in web/.env)
 *   SUPABASE_SERVICE_ROLE_KEY      (Supabase Dashboard → Project Settings →
 *                                   API → service_role. Admin-only.)
 *
 * Usage from web/:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/bulk-create-users.mjs --dry-run
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/bulk-create-users.mjs
 *
 * WARNING: this is destructive. Every account's password is replaced.
 * Anyone signed in is effectively kicked out at next refresh.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
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

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}
if (SERVICE_KEY.includes('"role":"anon"') || SERVICE_KEY.length < 200) {
  console.error('That looks like an anon key. Need the service_role key.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Password generator — 16 chars, all four classes guaranteed.
// ---------------------------------------------------------------------------
const POOL_UPPER   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const POOL_LOWER   = 'abcdefghjkmnpqrstuvwxyz';
const POOL_DIGITS  = '23456789';
const POOL_SPECIAL = '!@#$%&*+=?';
const POOL_ALL     = POOL_UPPER + POOL_LOWER + POOL_DIGITS + POOL_SPECIAL;
const pick   = (p) => p[crypto.randomInt(p.length)];
const newPwd = (len = 16) => {
  const c = [pick(POOL_UPPER), pick(POOL_LOWER), pick(POOL_DIGITS), pick(POOL_SPECIAL)];
  while (c.length < len) c.push(pick(POOL_ALL));
  for (let i = c.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c.join('');
};

// ---------------------------------------------------------------------------
// Department → role mapping
// ---------------------------------------------------------------------------
const DEPT_TO_ROLE = {
  'Finance':                       'admin',
  'Information Systems':           'admin',
  'Corporate Office':              'admin',
  'Executive Office':              'admin',
  'Human Resources':               'hr_manager',
  'Residential Sales':             'sales_rep',
  'Commercial Sales':              'sales_rep',
  'Lead Qualification':            'sales_rep',
  'Marketing':                     'sales_manager',
  'Service Field':                 'support',
  'Service Office':                'support',
  'Maintenance':                   'support',
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
const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const employees = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, 'employees-to-import.json'), 'utf8')
);

console.log(`Loaded ${employees.length} EE-list employees + 1 IT account (tech@).`);
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE — passwords will be reset'}`);
console.log('---');

// Roles
const { data: roles, error: rolesErr } = await sb.from('user_roles').select('id, name, permissions');
if (rolesErr) { console.error('Could not read user_roles:', rolesErr.message); process.exit(1); }
const roleByName = Object.fromEntries(roles.map((r) => [r.name, r]));
const required = new Set(Object.values(DEPT_TO_ROLE).concat([DEFAULT_ROLE, 'admin']));
const missing  = [...required].filter((r) => !roleByName[r]);
if (missing.length) {
  console.error(`Missing roles in user_roles: ${missing.join(', ')}`);
  process.exit(1);
}

// Existing auth users (by email)
const existingByEmail = new Map();
{
  let page = 1;
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) { console.error('listUsers:', error.message); process.exit(1); }
    for (const u of data.users) if (u.email) existingByEmail.set(u.email.toLowerCase(), u.id);
    if (!data.users.length || data.users.length < 1000) break;
    page++;
  }
}
console.log(`Existing auth users in project: ${existingByEmail.size}`);
console.log('---');

// ---------------------------------------------------------------------------
// Build the work list — EE list + the standalone IT account.
// ---------------------------------------------------------------------------
const work = employees.map((e) => ({
  email:    e.email.toLowerCase(),
  fullName: e.full_name,
  first:    e.first,
  last:     e.last,
  dept:     e.department,
  title:    e.department,
  role:     DEPT_TO_ROLE[e.department] ?? DEFAULT_ROLE,
  password: newPwd(16),
  pwdChange:true,
  source:   'ee-list',
}));

work.push({
  email:    'tech@sunation.com',
  fullName: 'IT Support',
  first:    'IT',
  last:     'Support',
  dept:     'Information Systems',
  title:    'IT Manager',
  role:     'admin',
  password: 'Go2Maine!*',
  pwdChange:false,
  source:   'it-account',
});

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------
const created = [];
const reset   = [];
const errored = [];

for (const w of work) {
  const existingId = existingByEmail.get(w.email);
  const action     = existingId ? 'reset' : 'create';

  if (DRY_RUN) {
    (action === 'reset' ? reset : created).push(rowFor(w, action));
    continue;
  }

  try {
    let userId = existingId;
    if (action === 'create') {
      const { data, error } = await sb.auth.admin.createUser({
        email:         w.email,
        password:      w.password,
        email_confirm: true,
        user_metadata: { full_name: w.fullName, first_name: w.first, last_name: w.last },
      });
      if (error) throw error;
      userId = data.user.id;
    } else {
      const { error } = await sb.auth.admin.updateUserById(userId, {
        password:      w.password,
        email_confirm: true,
        user_metadata: { full_name: w.fullName, first_name: w.first, last_name: w.last },
      });
      if (error) throw error;
    }

    // Upsert profile (handles new + existing rows in the same call)
    const { error: pErr } = await sb.from('user_profiles').upsert({
      id:                       userId,
      role_id:                  roleByName[w.role].id,
      full_name:                w.fullName,
      title:                    w.title,
      department:               w.dept,
      email:                    w.email,
      is_active:                true,
      password_change_required: w.pwdChange,
      temporary_password:       w.password,
    }, { onConflict: 'id' });
    if (pErr) throw pErr;

    (action === 'reset' ? reset : created).push(rowFor(w, action));
    const tag = action === 'create' ? '🆕' : '🔁';
    console.log(`  ${tag}  ${w.email.padEnd(36)} ${w.role.padEnd(14)} ${w.fullName}`);
  } catch (err) {
    errored.push({ email: w.email, name: w.fullName, error: err.message ?? String(err) });
    console.log(`  ❌  ${w.email.padEnd(36)} ${err.message ?? err}`);
  }
}

function rowFor(w, action) {
  const perm = roleByName[w.role].permissions
    ? Object.entries(roleByName[w.role].permissions).filter(([, v]) => v).map(([k]) => k).join('|')
    : '';
  return {
    action,
    email: w.email, name: w.fullName, title: w.title, dept: w.dept, role: w.role,
    permList: perm, password: w.password, pwdChange: w.pwdChange, source: w.source,
  };
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------
const csvPath = path.join(PROJECT_ROOT, 'employees-credentials.csv');
const escape = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const header = ['action', 'email', 'full_name', 'title', 'department', 'role', 'permissions',
                'temp_password', 'must_change_on_login', 'source'];
const lines  = [header.join(',')];
for (const r of [...created, ...reset]) {
  lines.push([
    r.action, r.email, r.name, r.title, r.dept, r.role, r.permList,
    r.password, r.pwdChange ? 'YES' : 'NO', r.source,
  ].map(escape).join(','));
}
fs.writeFileSync(csvPath, lines.join('\n') + '\n', { mode: 0o600 });

const auditPath = path.join(PROJECT_ROOT, 'employees-import-result.json');
fs.writeFileSync(auditPath, JSON.stringify({
  when: new Date().toISOString(),
  created_count: created.length,
  reset_count:   reset.length,
  errored_count: errored.length,
  errored,
  // Strip passwords from audit log
  created: created.map(({ password, ...r }) => r),
  reset:   reset.map(({ password, ...r }) => r),
}, null, 2));

console.log('---');
console.log(`Created: ${created.length}`);
console.log(`Reset:   ${reset.length}`);
console.log(`Errored: ${errored.length}`);
console.log('');
console.log('CREDENTIALS:  ' + path.relative(process.cwd(), csvPath));
console.log('AUDIT LOG:    ' + path.relative(process.cwd(), auditPath));
console.log('');
console.log('⚠️  CSV contains every user\'s plaintext temp password.');
console.log('    Distribute via 1Password / Bitwarden / sealed envelope.');
console.log('    Then DELETE:  rm ' + path.relative(process.cwd(), csvPath));
if (errored.length) {
  console.log('\nErrors:');
  errored.forEach((e) => console.log(`  ${e.email}: ${e.error}`));
}
