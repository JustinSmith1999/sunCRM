// One-off probe: does tech@sunation.com / <password> sign in?
// Run, then DELETE this file.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const email    = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/check-login.mjs <email> <password>');
  process.exit(1);
}

console.log(`Probing ${email}...`);
const { data, error } = await sb.auth.signInWithPassword({ email, password });

if (error) {
  console.log('FAILED:', error.message);
  console.log('Status:', error.status ?? '(none)');
  process.exit(2);
}

console.log('SIGNED IN');
console.log('  user.id:        ', data.user?.id);
console.log('  user.email:     ', data.user?.email);
console.log('  email_confirmed:', data.user?.email_confirmed_at ? 'yes' : 'no');
console.log('  created_at:     ', data.user?.created_at);
console.log('  last_sign_in:   ', data.user?.last_sign_in_at);

// And check if a user_profiles row exists
const { data: profile, error: pErr } = await sb
  .from('user_profiles')
  .select('id, email, full_name, role_id, department, is_active, password_change_required')
  .eq('id', data.user.id)
  .maybeSingle();

if (pErr) console.log('user_profiles ERROR:', pErr.message);
else if (!profile) console.log('user_profiles: NO ROW (auth user exists but profile missing)');
else console.log('user_profiles:', profile);

await sb.auth.signOut();
