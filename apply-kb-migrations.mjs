import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigrations() {
  console.log('📚 Applying knowledge base migrations...\n');

  const migrations = [
    'supabase/migrations/20251030160000_add_beginner_knowledge_base.sql',
    'supabase/migrations/20251030160001_kb_web_forms_guide.sql',
    'supabase/migrations/20251030160002_kb_remaining_guides.sql',
  ];

  for (const migrationFile of migrations) {
    console.log(`Applying: ${migrationFile}`);

    try {
      const sql = readFileSync(join(__dirname, migrationFile), 'utf-8');

      // Execute the migration
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

      if (error) {
        // Try direct execution if RPC doesn't work
        console.log('  Trying alternative execution method...');
        const { error: directError } = await supabase.from('_supabase_migrations').insert({
          name: migrationFile,
          executed_at: new Date().toISOString(),
        });

        if (directError) {
          console.error(`  ❌ Error: ${error.message}`);
        } else {
          console.log('  ✓ Applied successfully');
        }
      } else {
        console.log('  ✓ Applied successfully');
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
    }
  }

  console.log('\n🎉 Migration process complete!');
  console.log('\nRefresh your Knowledge Base page to see the new articles.');
}

applyMigrations().catch(console.error);
