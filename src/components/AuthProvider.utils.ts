// Utility functions for AuthProvider
export const clearAuthCache = () => {
  // Clear all auth-related data from storage
  const keysToRemove: string[] = [];
  
  // Find all Supabase auth keys in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('supabase.') || key.startsWith('sb-'))) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all found keys
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Clear session storage
  sessionStorage.clear();
};