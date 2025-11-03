import { supabase, handleSupabaseError } from '../../lib/supabase';
import { User, LoginCredentials, RegisterData } from '../../types/auth';

export class SupabaseAuthService {
  static async login(credentials: LoginCredentials): Promise<User> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Aucune donnée utilisateur');

      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      return {
        id: data.user.id,
        email: data.user.email!,
        displayName: profile.display_name || '',
        role: profile.role || 'user',
        organizationId: profile.organization_id,
        createdAt: new Date(data.user.created_at),
        lastLoginAt: new Date()
      };
    } catch (error: any) {
      throw handleSupabaseError(error);
    }
  }

  static async register(data: RegisterData): Promise<User> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Échec de la création du compte');

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          display_name: data.displayName,
          role: data.role || 'user',
          organization_id: data.organizationId
        });

      if (profileError) throw profileError;

      return {
        id: authData.user.id,
        email: authData.user.email!,
        displayName: data.displayName,
        role: data.role || 'user',
        organizationId: data.organizationId,
        createdAt: new Date(authData.user.created_at)
      };
    } catch (error: any) {
      throw handleSupabaseError(error);
    }
  }

  static async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      throw handleSupabaseError(error);
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error: any) {
      throw handleSupabaseError(error);
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) return null;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) return null;

      return {
        id: user.id,
        email: user.email!,
        displayName: profile.display_name || '',
        role: profile.role || 'user',
        organizationId: profile.organization_id,
        createdAt: new Date(user.created_at)
      };
    } catch (error) {
      return null;
    }
  }
}
