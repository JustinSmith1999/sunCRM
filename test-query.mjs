import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('Testing different query variations...\n');

// Test accounts with different column references
console.log('=== Testing accounts ===');

const test1 = await supabase.from('accounts').select('Id', { count: 'exact', head: true });
console.log('select Id:', test1.count, test1.error?.message || '✅');

const test2 = await supabase.from('accounts').select('"Id"', { count: 'exact', head: true });
console.log('select "Id":', test2.count, test2.error?.message || '✅');

const test3 = await supabase.from('accounts').select('*', { count: 'exact', head: true });
console.log('select *:', test3.count, test3.error?.message || '✅');

// Test opportunities
console.log('\n=== Testing opportunities ===');

const test4 = await supabase.from('opportunities').select('Id', { count: 'exact', head: true });
console.log('select Id:', test4.count, test4.error?.message || '✅');

const test5 = await supabase.from('opportunities').select('"Id"', { count: 'exact', head: true });
console.log('select "Id":', test5.count, test5.error?.message || '✅');

const test6 = await supabase.from('opportunities').select('*', { count: 'exact', head: true });
console.log('select *:', test6.count, test6.error?.message || '✅');
