import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function browseEgnyte() {
  try {
    // Get Egnyte credentials
    const { data: cred, error: credError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('service_name', 'egnyte')
      .maybeSingle();

    if (credError) throw credError;
    if (!cred) throw new Error('No Egnyte credentials found');

    const credentials = cred.credentials;
    const config = cred.config;
    const apiToken = credentials.api_key;
    const domain = credentials.domain;

    console.log('\n🗂️  Egnyte File Browser');
    console.log('='.repeat(60));
    console.log(`Domain: ${domain}`);
    console.log(`Base Path: ${config.base_path}`);
    console.log('='.repeat(60));

    // Browse root folder
    await browseFolder(domain, apiToken, config.base_path || '/Shared');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', await error.response.text());
    }
  }
}

async function browseFolder(domain, apiToken, path, depth = 0) {
  const indent = '  '.repeat(depth);

  try {
    const url = `https://${domain}/pubapi/v1/fs${path}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    if (!response.ok) {
      console.error(`${indent}❌ Cannot access: ${path} (${response.status} ${response.statusText})`);
      return;
    }

    const data = await response.json();

    // Show folders
    if (data.folders && data.folders.length > 0) {
      console.log(`\n${indent}📁 Folders in ${path}:`);
      data.folders.forEach(folder => {
        console.log(`${indent}  📁 ${folder.name}`);
      });
    }

    // Show files
    if (data.files && data.files.length > 0) {
      console.log(`\n${indent}📄 Files in ${path}:`);
      data.files.forEach(file => {
        const size = formatFileSize(file.size);
        console.log(`${indent}  📄 ${file.name} (${size})`);
      });
    }

    // If we're at root level, explore first few folders
    if (depth === 0 && data.folders && data.folders.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('Exploring subfolders...');
      console.log('='.repeat(60));

      for (let i = 0; i < Math.min(5, data.folders.length); i++) {
        const folder = data.folders[i];
        await browseFolder(domain, apiToken, folder.path, depth + 1);
      }
    }

    console.log(`\n${indent}Total: ${data.folders?.length || 0} folders, ${data.files?.length || 0} files`);

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
