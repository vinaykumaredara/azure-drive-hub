// src/lib/auth.ts
export const ADMIN_EMAIL = "rpcars2025@gmail.com";
export const ADMIN_PASSWORD = "RP2025cars";

export type AuthState = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  email?: string;
};

const STORAGE_KEY = "rpcars_auth_v1";

export function signIn(email: string, password: string) {
  // simple client-only auth for admin; replace with server call in production
  const isAdmin = email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
  const auth: AuthState = {
    isAuthenticated: true,
    isAdmin,
    email,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  return auth;
}

export function signOut() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAuth(): AuthState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { isAuthenticated: false, isAdmin: false };
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return { isAuthenticated: false, isAdmin: false };
  }
}

export function requireAdminOrThrow() {
  const auth = getAuth();
  if (!auth.isAdmin) throw new Error("Admin required");
}