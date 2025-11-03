import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SupabaseAuthService } from '../services/auth/supabaseAuthService';
import { AuthState, User, LoginCredentials, RegisterData } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Check active session
    const initializeAuth = async () => {
      try {
        const user = await SupabaseAuthService.getCurrentUser();
        setState({ user, loading: false, error: null });
      } catch (error) {
        setState({ user: null, loading: false, error: null });
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const user = await SupabaseAuthService.getCurrentUser();
        setState({ user, loading: false, error: null });
      } else if (event === 'SIGNED_OUT') {
        setState({ user: null, loading: false, error: null });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const user = await SupabaseAuthService.login(credentials);
      setState({ user, loading: false, error: null });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Échec de la connexion'
      }));
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const user = await SupabaseAuthService.register(data);
      setState({ user, loading: false, error: null });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Échec de l\'inscription'
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await SupabaseAuthService.signOut();
      setState({ user: null, loading: false, error: null });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Échec de la déconnexion'
      }));
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await SupabaseAuthService.resetPassword(email);
      setState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Échec de la réinitialisation'
      }));
      throw error;
    }
  };

  return (
    <SupabaseAuthContext.Provider value={{
      ...state,
      login,
      register,
      signOut,
      resetPassword
    }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}
