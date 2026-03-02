import { createClient } from '@supabase/supabase-js';

// These values will be filled with environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials missing. The application will not be able to connect to the database. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
