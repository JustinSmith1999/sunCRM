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

async function setupSunationForm() {
  console.log('Setting up Sunation web form...\n');

  // Check if form already exists
  const { data: existingForm } = await supabase
    .from('web_forms')
    .select('*')
    .eq('form_key', 'sunation-contact-form')
    .maybeSingle();

  if (existingForm) {
    console.log('✓ Web form already exists:');
    console.log(`  - Form Name: ${existingForm.form_name}`);
    console.log(`  - Form Key: ${existingForm.form_key}`);
    console.log(`  - Active: ${existingForm.is_active}`);
    console.log(`  - Submissions: ${existingForm.submissions_count || 0}`);
    return;
  }

  // Get the first admin user as default owner
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, role, organization_id')
    .eq('role', 'admin')
    .limit(1);

  if (!users || users.length === 0) {
    console.error('❌ No admin user found. Please create an admin user first.');
    process.exit(1);
  }

  const defaultOwner = users[0];
  console.log(`Using admin user: ${defaultOwner.email} (${defaultOwner.full_name})`);

  // Create the web form
  const { data: newForm, error } = await supabase
    .from('web_forms')
    .insert({
      organization_id: defaultOwner.organization_id,
      form_name: 'Sunation Contact Form',
      form_key: 'sunation-contact-form',
      description: 'Main contact form from sunation.com website',
      is_active: true,
      default_lead_source: '3 Sons Energy',
      default_owner_id: defaultOwner.id,
      success_message: 'Thank you for your submission!',
      redirect_url: 'https://www.sunation.com/cp-thankyou/',
      capture_ip: true,
      created_by: defaultOwner.id,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating web form:', error.message);
    process.exit(1);
  }

  console.log('\n✓ Web form created successfully!');
  console.log(`  - Form Name: ${newForm.form_name}`);
  console.log(`  - Form Key: ${newForm.form_key}`);
  console.log(`  - Endpoint: ${supabaseUrl}/functions/v1/web-to-lead`);
  console.log(`  - Default Owner: ${defaultOwner.email}`);
  console.log('\n📝 Your existing form should now submit to:');
  console.log(`   ${supabaseUrl}/functions/v1/web-to-lead`);
  console.log('\n   Make sure your form includes:');
  console.log('   <input type="hidden" name="form_key" value="sunation-contact-form">');
}

setupSunationForm().catch(console.error);
