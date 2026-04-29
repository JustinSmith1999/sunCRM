const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.husbupeealwuxyopfwwb:Snizzle1@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('📝 Adding columns to leads table...');
    await client.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS city text,
      ADD COLUMN IF NOT EXISTS state text,
      ADD COLUMN IF NOT EXISTS street text,
      ADD COLUMN IF NOT EXISTS zip_postal_code text,
      ADD COLUMN IF NOT EXISTS county text,
      ADD COLUMN IF NOT EXISTS primary_phone text,
      ADD COLUMN IF NOT EXISTS mobile_phone text,
      ADD COLUMN IF NOT EXISTS title text,
      ADD COLUMN IF NOT EXISTS company text,
      ADD COLUMN IF NOT EXISTS lead_source text,
      ADD COLUMN IF NOT EXISTS other_source text,
      ADD COLUMN IF NOT EXISTS lead_status text DEFAULT 'Open',
      ADD COLUMN IF NOT EXISTS type_of_installation text,
      ADD COLUMN IF NOT EXISTS created_by_alias text,
      ADD COLUMN IF NOT EXISTS country text DEFAULT 'USA';
    `);
    
    console.log('✅ All columns added!\n');
    console.log('🎉 Done! Now click "Import 45 Leads" in your CRM.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
