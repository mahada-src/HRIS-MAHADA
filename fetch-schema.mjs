import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('employees').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Data:", JSON.stringify(data, null, 2));
  }
}
run();
