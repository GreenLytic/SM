import { v4 as uuidv4 } from 'uuid';
import { insert, findOne, update } from '../../lib/dbService';
import { User, LoginCredentials, RegisterData } from '../../types/auth';
import { toast } from 'react-hot-toast';

const CURRENT_USER_KEY = 'smartcoop_current_user';

function hashPassword(password: string): string {
  return btoa(password);
}

function verifyPassword(password: string, hash: string): boolean {
  return btoa(password) === hash;
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<User> {
    try {
      const userRecord = findOne(
        'users',
        'email = ?',
        [credentials.email]
      );

      if (!userRecord) {
        throw new Error('Email ou mot de passe invalide');
      }

      if (!verifyPassword(credentials.password, userRecord.password_hash)) {
        throw new Error('Email ou mot de passe invalide');
      }

      update('users', userRecord.id, {
        last_login_at: new Date().toISOString()
      });

      const user: User = {
        id: userRecord.id,
        email: userRecord.email,
        displayName: userRecord.display_name,
        role: userRecord.role,
        organizationId: userRecord.organization_id,
        createdAt: new Date(userRecord.created_at),
        lastLoginAt: new Date()
      };

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      toast.success('Connexion réussie');
      return user;
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion');
      throw error;
    }
  }

  static async register(data: RegisterData): Promise<User> {
    try {
      const existing = findOne('users', 'email = ?', [data.email]);
      if (existing) {
        throw new Error('Cet email est déjà enregistré');
      }

      const userId = uuidv4();
      const now = new Date().toISOString();

      insert('users', {
        id: userId,
        email: data.email,
        password_hash: hashPassword(data.password),
        display_name: data.displayName || '',
        role: data.role || 'user',
        organization_id: data.organizationId || null,
        created_at: now,
        updated_at: now,
        last_login_at: now
      });

      const user: User = {
        id: userId,
        email: data.email,
        displayName: data.displayName || '',
        role: data.role || 'user',
        organizationId: data.organizationId,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      toast.success('Inscription réussie');
      return user;
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'inscription');
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
      toast.success('Déconnexion réussie');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
      throw error;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (!stored) return null;

    try {
      const user = JSON.parse(stored);
      user.createdAt = new Date(user.createdAt);
      if (user.lastLoginAt) {
        user.lastLoginAt = new Date(user.lastLoginAt);
      }
      return user;
    } catch {
      return null;
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      const user = findOne('users', 'email = ?', [email]);
      if (!user) {
        throw new Error('Aucun utilisateur trouvé avec cet email');
      }

      toast.success('Email de réinitialisation envoyé');
      console.log('Password reset requested for:', email);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la réinitialisation');
      throw error;
    }
  }

  static async updatePassword(userId: string, newPassword: string): Promise<void> {
    update('users', userId, {
      password_hash: hashPassword(newPassword)
    });
  }

  static async updateProfile(userId: string, data: Partial<User>): Promise<void> {
    const updates: Record<string, any> = {};

    if (data.displayName !== undefined) {
      updates.display_name = data.displayName;
    }
    if (data.role !== undefined) {
      updates.role = data.role;
    }
    if (data.organizationId !== undefined) {
      updates.organization_id = data.organizationId;
    }

    if (Object.keys(updates).length > 0) {
      update('users', userId, updates);

      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, ...data };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      }
    }
  }
}
