import { config } from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

config();

const connectionString = process.env.DATABASE_URL;

async function addSalesforceIdColumns() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('🔗 Connected to database\n');

    const tables = ['activities', 'cases', 'campaigns', 'products', 'documents', 'notifications'];

    for (const table of tables) {
      console.log(`Processing ${table}...`);

      // Check if salesforce_id column exists
      const checkResult = await client.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_name = $1 AND column_name = 'salesforce_id'
      `, [table]);

      if (checkResult.rows.length === 0) {
        // Add column
        await client.query(`ALTER TABLE ${table} ADD COLUMN salesforce_id text`);
        console.log(`  ✓ Added salesforce_id column`);

        // Add unique constraint
        await client.query(`ALTER TABLE ${table} ADD CONSTRAINT ${table}_salesforce_id_unique UNIQUE (salesforce_id)`);
        console.log(`  ✓ Added unique constraint`);

        // Add index
        await client.query(`CREATE INDEX idx_${table}_salesforce_id ON ${table}(salesforce_id)`);
        console.log(`  ✓ Added index`);
      } else {
        console.log(`  ⚠️  salesforce_id already exists, skipping`);
      }
    }

    console.log('\n✅ All columns added successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

addSalesforceIdColumns().catch(console.error);
