import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '@/src/types';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, roleHint?: Role) => Promise<User>;
  loginWithDemo: (role: Role, username?: string) => void;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
  setSessionUser: (user: User) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'practicum_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile from Supabase profiles table
  const fetchProfile = useCallback(async (userId: string, email: string): Promise<User | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return null;
      }

      const role = (profile.role as Role) || 'student';
      return {
        id: profile.id,
        username: email.split('@')[0],
        name: profile.full_name,
        role,
        email: profile.email,
        studentId: profile.student_id,
        course: profile.section || profile.program || 'BSIT 402',
        section: profile.section,
        contactNumber: profile.contact_number,
        department: profile.department || 'College of Computer Studies',
        companyName: profile.company_name,
        companyId: profile.company_id,
        supervisorId: profile.supervisor_id,
        adviserId: profile.adviser_id,
      };
    } catch {
      return null;
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check existing localStorage session first for instant render
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try {
            const parsedUser: User = JSON.parse(cached);
            setUser(parsedUser);
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }

        // 2. Check live Supabase Auth session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profileUser = await fetchProfile(session.user.id, session.user.email || '');
          if (profileUser) {
            setUser(profileUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profileUser));
          }
        }
      } catch (err) {
        console.error('[AuthContext] Session init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profileUser = await fetchProfile(session.user.id, session.user.email || '');
        if (profileUser) {
          setUser(profileUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(profileUser));
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Set session user manually (e.g. after registration or quick login)
  const setSessionUser = useCallback((newUser: User) => {
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  }, []);

  // 1-Click Role Switcher for Thesis Defense & Testing (Backed by production seed records)
  const loginWithDemo = useCallback((role: Role, username?: string) => {
    const defaultUsername = username || role;
    const seedInfo: Record<Role, { id: string; name: string; email?: string; dept: string; studentId?: string }> = {
      student: { id: 'student-role-005', name: 'John Dwayne B. Guaniso', email: 'student@practicum.edu', dept: 'BSIT 402', studentId: '02000249822' },
      admin: { id: 'admin-main-001', name: 'John Dwayne Guaniso', email: 'johndwayneguaniso.05242004@gmail.com', dept: 'System Administration' },
      adviser: { id: 'adviser-role-003', name: 'Dr. Sarah Johnson', email: 'adviser@practicum.edu', dept: 'College of Computer Studies' },
      supervisor: { id: 'supervisor-role-004', name: 'Engr. Paolo Reyes', email: 'supervisor@practicum.edu', dept: 'InnoTech Labs' },
    };

    const targetSeed = seedInfo[role] || {
      id: `seed-${role}`,
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
      email: `${defaultUsername}@practicum.edu`,
      dept: 'College of Computer Studies',
    };

    const newUser: User = {
      id: targetSeed.id,
      username: defaultUsername,
      name: targetSeed.name,
      role,
      email: targetSeed.email || `${defaultUsername}@practicum.edu`,
      studentId: targetSeed.studentId,
      course: role === 'student' ? 'BSIT 402' : undefined,
      section: role === 'student' ? 'BSIT 402' : undefined,
      department: targetSeed.dept,
    };

    setSessionUser(newUser);
    toast.success(`Logged in as ${targetSeed.name} (${role.toUpperCase()})`);
  }, [setSessionUser]);

  // Credentials Login (via API / Supabase)
  const login = useCallback(async (email: string, password: string, roleHint?: Role): Promise<User> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: roleHint }),
    });

    const contentType = res.headers.get('content-type') || '';
    let data: any = {};
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.warn('[AuthContext] Non-JSON API response received:', text);
      throw new Error(`Authentication server returned an unexpected response (${res.status}).`);
    }

    if (!res.ok || !data.user) {
      throw new Error(data.error || 'Authentication failed. Please check your credentials.');
    }

    // Do NOT set session user here; Login.tsx will complete sign-in after MFA & password update
    return data.user;
  }, []);

  // Microsoft 365 Single Sign-On (SSO)
  const loginWithMicrosoft = useCallback(async () => {
    try {
      // 1. Try Supabase Azure provider OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email profile User.Read',
          redirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        // Fallback to Microsoft Graph OAuth Login endpoint
        window.location.href = '/api/onedrive/auth/login';
      }
    } catch {
      window.location.href = '/api/onedrive/auth/login';
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Signed out successfully.');
  }, []);

  // Refresh user profile
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const refreshed = await fetchProfile(user.id, user.email);
    if (refreshed) {
      setSessionUser(refreshed);
    }
  }, [user, fetchProfile, setSessionUser]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    loginWithDemo,
    loginWithMicrosoft,
    logout,
    setSessionUser,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
