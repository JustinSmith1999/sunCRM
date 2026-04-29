import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function getCredentials() {
  const { data } = await supabase
    .from('api_credentials')
    .select('*')
    .eq('service_name', 'egnyte')
    .maybeSingle();

  if (!data) {
    console.error('❌ No Egnyte credentials found in database');
    process.exit(1);
  }

  const creds = data.credentials;
  const config = data.config;

  return {
    domain: creds.domain || 'sunation.egnyte.com',
    api_key: data.access_token || creds.api_key,
    base_path: config.base_path || '/Shared'
  };
}

let credentials;

async function browseEgnyte() {
  try {
    credentials = await getCredentials();

    console.log('\n🗂️  Egnyte File Browser');
    console.log('='.repeat(60));
    console.log(`Domain: ${credentials.domain}`);
    console.log(`Base Path: ${credentials.base_path}`);
    console.log('='.repeat(60));

    // Browse root folder
    await browseFolder(credentials.base_path);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function browseFolder(path, depth = 0) {
  const indent = '  '.repeat(depth);

  try {
    const url = `https://${credentials.domain}/pubapi/v1/fs${path}`;

    console.log(`\n${indent}🔍 Checking: ${path}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${credentials.api_key}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${indent}❌ Cannot access: ${path}`);
      console.error(`${indent}   Status: ${response.status} ${response.statusText}`);
      console.error(`${indent}   Response: ${errorText.substring(0, 200)}`);
      return;
    }

    const data = await response.json();

    // Show folders
    if (data.folders && data.folders.length > 0) {
      console.log(`\n${indent}📁 Folders (${data.folders.length}):`);
      data.folders.forEach((folder, idx) => {
        if (idx < 20) { // Show first 20
          console.log(`${indent}  📁 ${folder.name}`);
        }
      });
      if (data.folders.length > 20) {
        console.log(`${indent}  ... and ${data.folders.length - 20} more folders`);
      }
    }

    // Show files
    if (data.files && data.files.length > 0) {
      console.log(`\n${indent}📄 Files (${data.files.length}):`);
      data.files.forEach((file, idx) => {
        if (idx < 20) { // Show first 20
          const size = formatFileSize(file.size);
          const date = new Date(file.last_modified).toLocaleDateString();
          console.log(`${indent}  📄 ${file.name} (${size}) - ${date}`);
        }
      });
      if (data.files.length > 20) {
        console.log(`${indent}  ... and ${data.files.length - 20} more files`);
      }
    }

    // If we're at root level, explore first few folders
    if (depth === 0 && data.folders && data.folders.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('Exploring subfolders...');
      console.log('='.repeat(60));

      for (let i = 0; i < Math.min(3, data.folders.length); i++) {
        const folder = data.folders[i];
        await browseFolder(folder.path, depth + 1);
      }
    }

    console.log(`\n${indent}📊 Total: ${data.folders?.length || 0} folders, ${data.files?.length || 0} files`);

  } catch (error) {
    console.error(`${indent}❌ Error browsing ${path}:`, error.message);
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

browseEgnyte();
