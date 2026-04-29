import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://husbupeealwuxyopfwwb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1c2J1cGVlYWx3dXh5b3Bmd3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTE3ODMsImV4cCI6MjA3NDUyNzc4M30.ERC3k2pHFZ0MOmrbcSAgS1FwTIMpMh0fKbgzLuMXP6s';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Attempting to add columns using Supabase REST API...\n');

// The columns that need to be added
const columnsToAdd = [
  { name: 'city', type: 'text', default: null },
  { name: 'state', type: 'text', default: null },
  { name: 'street', type: 'text', default: null },
  { name: 'zip_postal_code', type: 'text', default: null },
  { name: 'county', type: 'text', default: null },
  { name: 'primary_phone', type: 'text', default: null },
  { name: 'mobile_phone', type: 'text', default: null },
  { name: 'title', type: 'text', default: null },
  { name: 'company', type: 'text', default: null },
  { name: 'lead_source', type: 'text', default: null },
  { name: 'other_source', type: 'text', default: null },
  { name: 'lead_status', type: 'text', default: "'Open'" },
  { name: 'type_of_installation', type: 'text', default: null },
  { name: 'created_by_alias', type: 'text', default: null },
  { name: 'country', type: 'text', default: "'USA'" },
];

console.log('⚠️  IMPORTANT: The Supabase JS client cannot execute DDL (ALTER TABLE) commands.');
console.log('You MUST run this SQL in the Supabase Dashboard SQL Editor:\n');
console.log('👉 https://husbupeealwuxyopfwwb.supabase.co/project/husbupeealwuxyopfwwb/sql/new\n');
console.log('Copy and paste this SQL:\n');
console.log('-- Add missing columns to leads table');

columnsToAdd.forEach(col => {
  const defaultClause = col.default ? ` DEFAULT ${col.default}` : '';
  console.log(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}${defaultClause};`);
});

console.log('\n-- Fix RLS policies');
console.log(`DROP POLICY IF EXISTS "Users can view organization leads" ON leads;`);
console.log(`DROP POLICY IF EXISTS "Users can create leads" ON leads;`);
console.log(`DROP POLICY IF EXISTS "Users can update leads" ON leads;`);
console.log(`DROP POLICY IF EXISTS "Users can delete leads" ON leads;`);
console.log('');
console.log(`ALTER TABLE leads ENABLE ROW LEVEL SECURITY;`);
console.log('');
console.log(`CREATE POLICY "Users can view organization leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
  );`);
console.log('');
console.log(`CREATE POLICY "Users can create leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
  );`);
console.log('');
console.log(`CREATE POLICY "Users can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));`);
console.log('');
console.log(`CREATE POLICY "Users can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));`);

console.log('\n\n✅ After running this SQL, your lead import will work!');
