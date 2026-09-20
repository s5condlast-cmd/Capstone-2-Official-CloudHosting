import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@/src/types';
import { supabase } from '@/src/lib/supabase';
import { apiJson } from '@/src/lib/api';
import { formatAuthError } from '@/src/lib/authErrors';
import { clearAllSupervisorSignatures } from '@/src/lib/signatureStorage';

export interface PortalAuthResult {
  user: User;
  portalReady: boolean;
}

interface AuthContextType {
  user: User | null;
  pendingUser: User | null;
  loading: boolean;
  authError: string;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<PortalAuthResult>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<PortalAuthResult | null>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const generation = useRef(0);
  const interactiveSignIn = useRef(false);

  const refreshProfile = useCallback(async () => {
    const version = ++generation.current;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) {
        if (version === generation.current) { setUser(null); setPendingUser(null); setAuthError(''); }
        return null;
      }
      const result = await apiJson<PortalAuthResult>('/api/auth/me');
      if (version !== generation.current) return null;
      setPendingUser(result.user);
      setUser(result.portalReady && window.location.pathname !== '/reset-password' ? result.user : null);
      setAuthError('');
      return result;
    } catch (error) {
      if (version !== generation.current) return;
      setUser(null);
      setPendingUser(null);
      setAuthError(formatAuthError(error, true));
      return null;
    } finally { if (version === generation.current) setLoading(false); }
  }, []);

  useEffect(() => {
    localStorage.removeItem('practicum_session');
    void refreshProfile();
    // Do not await Supabase calls inside its auth-state callback (it holds an auth lock).
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { ++generation.current; setUser(null); setPendingUser(null); setAuthError(''); setLoading(false); }
      // login() performs its own awaited profile refresh. Starting a second one
      // from SIGNED_IN can supersede that request and produce a false failure.
      else if (event === 'SIGNED_IN' && interactiveSignIn.current) return;
      else {
        const timer = setTimeout(() => { timers.delete(timer); void refreshProfile(); }, 0);
        timers.add(timer);
      }
    });
    const onFocus = () => { void refreshProfile(); };
    window.addEventListener('focus', onFocus);
    const interval = setInterval(onFocus, 60000);
    return () => { ++generation.current; subscription.unsubscribe(); timers.forEach(clearTimeout); clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setUser(null); setPendingUser(null); setAuthError('');
    interactiveSignIn.current = true;
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      const result = await refreshProfile();
      if (!result) throw new Error('Unable to verify your portal account. Please retry.');
      return result;
    } finally {
      interactiveSignIn.current = false;
    }
  }, [refreshProfile]);
  const logout = useCallback(async () => {
    ++generation.current; setUser(null); setPendingUser(null);
    clearAllSupervisorSignatures();
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) { setAuthError('Sign-out could not reach the server. Retry to revoke all sessions.'); throw error; }
    setAuthError('');
  }, []);
  return <AuthContext.Provider value={{ user, pendingUser, loading, authError, isAuthenticated: !!user, login, logout, refreshProfile }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
