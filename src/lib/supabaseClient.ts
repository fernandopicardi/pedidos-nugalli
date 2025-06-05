import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or ANON key not set in environment variables.');
  // Depending on your application's needs, you might want to throw an error
  // or handle this case more gracefully (e.g., disable Supabase features)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);