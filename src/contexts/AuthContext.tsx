import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/auth/authService';
import { AuthState, User, LoginCredentials, RegisterData } from '../types/auth';
import { initDatabase } from '../lib/database';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    async function loadUser() {
      const timeout = setTimeout(() => {
        setState({
          user: null,
          loading: false,
          error: 'Database initialization timeout. Please refresh the page.'
        });
      }, 10000);

      try {
        await initDatabase();
        const user = await AuthService.getCurrentUser();
        clearTimeout(timeout);
        setState({ user, loading: false, error: null });
      } catch (error) {
        clearTimeout(timeout);
        console.error('Error loading user data:', error);
        setState({ user: null, loading: false, error: 'Error loading user data' });
      }
    }

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const user = await AuthService.login(credentials);
      setState({ user, loading: false, error: null });
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Login failed' 
      }));
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const user = await AuthService.register(data);
      setState({ user, loading: false, error: null });
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Registration failed' 
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await AuthService.signOut();
      setState({ user: null, loading: false, error: null });
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Sign out failed' 
      }));
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await AuthService.resetPassword(email);
      setState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Password reset failed' 
      }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}