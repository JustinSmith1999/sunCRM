const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://husbupeealwuxyopfwwb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1c2J1cGVlYWx3dXh5b3Bmd3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTE3ODMsImV4cCI6MjA3NDUyNzc4M30.ERC3k2pHFZ0MOmrbcSAgS1FwTIMpMh0fKbgzLuMXP6s'
);

console.log('⚠️  The Supabase client CANNOT add columns or bypass RLS.');
console.log('\n📋 YOU MUST run this SQL in Supabase Dashboard:');
console.log('https://husbupeealwuxyopfwwb.supabase.co/project/husbupeealwuxyopfwwb/sql/new\n');
console.log('ALTER TABLE leads');
console.log('ADD COLUMN IF NOT EXISTS city text,');
console.log('ADD COLUMN IF NOT EXISTS state text,');
console.log('ADD COLUMN IF NOT EXISTS street text,');
console.log('ADD COLUMN IF NOT EXISTS zip_postal_code text,');
console.log('ADD COLUMN IF NOT EXISTS county text,');
console.log('ADD COLUMN IF NOT EXISTS primary_phone text,');
console.log('ADD COLUMN IF NOT EXISTS mobile_phone text,');
console.log('ADD COLUMN IF NOT EXISTS title text,');
console.log('ADD COLUMN IF NOT EXISTS company text,');
console.log('ADD COLUMN IF NOT EXISTS lead_source text,');
console.log('ADD COLUMN IF NOT EXISTS other_source text,');
console.log('ADD COLUMN IF NOT EXISTS lead_status text DEFAULT \'Open\',');
console.log('ADD COLUMN IF NOT EXISTS type_of_installation text,');
console.log('ADD COLUMN IF NOT EXISTS created_by_alias text,');
console.log('ADD COLUMN IF NOT EXISTS country text DEFAULT \'USA\';\n');
console.log('✅ After running that SQL, click "Import 45 Leads" in your CRM');
