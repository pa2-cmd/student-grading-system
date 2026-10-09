// Auth backed by Supabase: Supabase Auth handles sign-in, the `profiles` table holds roles,
// and the `admin-users` Edge Function performs admin-only account management.
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserRole = 'admin' | 'user';

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface ManagedUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export const PRIMARY_ADMIN_EMAIL = 'pa2@skillizee.io';
export const MIN_PASSWORD_LENGTH = 6;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// Load the role for a signed-in auth user; null means the account isn't registered in the app
export async function fetchProfile(userId: string): Promise<SessionUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? (data as SessionUser) : null;
}

async function callAdmin<T = { ok: true }>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error || error.message);
    }
    throw new Error(error.message);
  }
  return data as T;
}

export async function listUsers(): Promise<ManagedUser[]> {
  const { users } = await callAdmin<{ users: ManagedUser[] }>({ action: 'list' });
  return users;
}

export async function createUser(email: string, password: string, role: UserRole): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) throw new Error('Enter a valid email address');
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  await callAdmin({ action: 'create', email: normalized, password, role });
}

export async function setPassword(id: string, password: string): Promise<void> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  await callAdmin({ action: 'setPassword', id, password });
}

export async function setRole(id: string, role: UserRole): Promise<void> {
  await callAdmin({ action: 'setRole', id, role });
}

export async function deleteUser(id: string): Promise<void> {
  await callAdmin({ action: 'delete', id });
}
