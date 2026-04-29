import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking knowledge base...\n');

// Check if table exists and has data
const { data: articles, error: articlesError } = await supabase
  .from('knowledge_base')
  .select('id, title, is_published, organization_id')
  .limit(10);

if (articlesError) {
  console.error('❌ Error querying knowledge_base:', articlesError.message);
} else {
  console.log(`✓ Found ${articles.length} articles in knowledge_base table:`);
  if (articles.length === 0) {
    console.log('  (Table is empty - articles need to be inserted)');
  } else {
    articles.forEach(a => console.log(`  - ${a.title.substring(0, 50)}... (published: ${a.is_published}, org: ${a.organization_id})`));
  }
}

// Check user profiles
console.log('\n🔍 Checking user profiles...');
const { data: profiles, error: profileError } = await supabase
  .from('user_profiles')
  .select('id, email, full_name')
  .limit(5);

if (profileError) {
  console.error('❌ Error:', profileError.message);
} else {
  console.log(`✓ Found ${profiles.length} profiles`);
}

// Check user_organization_roles
console.log('\n🔍 Checking user organizations...');
const { data: roles, error: rolesError } = await supabase
  .from('user_organization_roles')
  .select('user_id, organization_id, role')
  .limit(5);

if (rolesError) {
  console.error('❌ Error:', rolesError.message);
} else {
  console.log(`✓ Found ${roles.length} user-org relationships`);
  if (roles.length > 0) {
    roles.forEach(r => console.log(`  User ${r.user_id.substring(0, 8)}... -> Org ${r.organization_id.substring(0, 8)}... (${r.role})`));
  }
}

console.log('\n' + '='.repeat(60));
console.log('DIAGNOSIS:');
if (articles && articles.length === 0) {
  console.log('❌ Knowledge base table is EMPTY');
  console.log('   You need to run the browser console script to insert articles');
  console.log('   See: INSERT-KB-ARTICLES-INSTRUCTIONS.md');
} else if (articles && articles.length > 0) {
  console.log('✓ Articles exist in database');
  console.log('  If you still don\'t see them:');
  console.log('  1. Make sure you\'re logged in');
  console.log('  2. Check browser console for errors (F12)');
  console.log('  3. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
}
