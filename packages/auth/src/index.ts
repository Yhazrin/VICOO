/**
 * Vicoo Auth
 */

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vicoo_token');
}

export async function setAuthToken(token: string): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem('vicoo_token', token);
}

export async function clearAuthToken(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('vicoo_token');
}

export default {
  getAuthToken,
  setAuthToken,
  clearAuthToken
};
