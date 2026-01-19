import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Get these from your Supabase project settings: https://app.supabase.com
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected on first setup)
      throw error;
    }
    return { success: true, message: 'Connected to Supabase successfully' };
  } catch (error) {
    return { success: false, message: error.message || 'Failed to connect to Supabase' };
  }
};
