import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SessionUser, fetchProfile } from '@/lib/auth';

interface AuthContextValue {
  user: SessionUser | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(!isSupabaseConfigured);
  const loadedUserId = useRef<string | null>(null);

  // Resolve the app profile for an auth session; accounts without a profile are signed out
  const loadProfile = useCallback(async (userId: string | null) => {
    if (!userId) {
      loadedUserId.current = null;
      setUser(null);
      return;
    }
    try {
      const profile = await fetchProfile(userId);
      if (!profile) {
        await supabase.auth.signOut();
        setUser(null);
        return;
      }
      loadedUserId.current = userId;
      setUser(profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(async ({ data }) => {
      await loadProfile(data.session?.user.id ?? null);
      setIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user.id ?? null;
      // Token refreshes keep the same user; only reload when the user actually changes.
      // Deferred so Supabase calls don't run inside the auth callback (avoids a deadlock).
      if (userId !== loadedUserId.current) {
        setTimeout(() => loadProfile(userId), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      throw new Error(error.message === 'Invalid login credentials' ? 'Invalid email or password' : error.message);
    }
    const profile = await fetchProfile(data.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      throw new Error('This account is not registered. Ask an administrator for access.');
    }
    loadedUserId.current = data.user.id;
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    loadedUserId.current = null;
    setUser(null);
  }, []);

  // Re-read the current profile after admin changes (e.g. own role edits)
  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await loadProfile(data.session?.user.id ?? null);
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ user, isReady, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
