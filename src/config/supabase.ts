// Supabase configuration with fallback values for development
// This file helps manage Supabase configuration across the application

export const supabaseConfig = {
  // These will be overridden by environment variables if they exist
  url: import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
  
  // Development fallback values
  devUrl: 'https://your-project.supabase.co',
  devAnonKey: 'your-anon-key',
  
  // Check if we're using real Supabase credentials
  isConfigured: () => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    return url && 
           key && 
           url !== 'https://your-project.supabase.co' && 
           key !== 'your-anon-key' &&
           url.includes('supabase.co') &&
           key.length > 20
  },
  
  // Get the actual values to use
  getUrl: () => {
    const envUrl = import.meta.env.VITE_SUPABASE_URL
    return envUrl && envUrl !== 'https://your-project.supabase.co' 
      ? envUrl 
      : supabaseConfig.devUrl
  },
  
  getAnonKey: () => {
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    return envKey && envKey !== 'your-anon-key' 
      ? envKey 
      : supabaseConfig.devAnonKey
  }
}

// Helper function to show configuration status
export const getSupabaseStatus = () => {
  const isConfigured = supabaseConfig.isConfigured()
  const url = supabaseConfig.getUrl()
  const key = supabaseConfig.getAnonKey()
  
  return {
    isConfigured,
    url,
    key: key.substring(0, 10) + '...' + key.substring(key.length - 4), // Masked key
    message: isConfigured 
      ? 'Supabase is properly configured' 
      : 'Supabase is using fallback values - please configure your environment variables'
  }
}
