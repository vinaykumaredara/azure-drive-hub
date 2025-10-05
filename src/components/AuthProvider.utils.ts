// Utility functions for AuthProvider
export const clearAuthCache = () => {
  // Clear any cached data
  localStorage.removeItem('supabase.auth.token');
};