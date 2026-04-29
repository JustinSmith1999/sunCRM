// This script adds missing columns to the leads table
const columns = [
  'city', 'state', 'street', 'zip_postal_code', 'county',
  'primary_phone', 'mobile_phone', 'title', 'company',
  'lead_source', 'other_source', 'lead_status',
  'type_of_installation', 'created_by_alias', 'country'
];

console.log('The leads table is missing these columns:', columns.join(', '));
console.log('\nTo fix this, please run the following SQL in your Supabase Dashboard:');
console.log('\n1. Go to: https://husbupeealwuxyopfwwb.supabase.co/project/husbupeealwuxyopfwwb/sql/new');
console.log('2. Paste this SQL:\n');

columns.forEach(col => {
  const defaultVal = col === 'lead_status' ? " DEFAULT 'Open'" : (col === 'country' ? " DEFAULT 'USA'" : '');
  console.log(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS ${col} text${defaultVal};`);
});

console.log('\n3. Click "Run"');
console.log('\n4. Then come back and click "Import 45 Leads" again!');
