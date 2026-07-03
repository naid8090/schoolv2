import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl) {
  console.log('No Supabase URL in environment');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('routine_entries')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error selecting from routine_entries:', error);
  } else {
    console.log('Columns in routine_entries:', data.length > 0 ? Object.keys(data[0]) : 'No data in table');
  }
}

run();
