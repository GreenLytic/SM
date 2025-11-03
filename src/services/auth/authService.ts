import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { User, LoginCredentials } from '../../types/auth';
import { toast } from 'react-hot-toast';
import { AuthError, getAuthErrorMessage } from './errors';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<User> {
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Get additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        throw new AuthError('User data not found', 'user-not-found');
      }

      const userData = userDoc.data();

      // Update last login timestamp
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastLoginAt: serverTimestamp()
      });

      // Return user data
      return {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userData.displayName,
        role: userData.role,
        createdAt: userData.createdAt?.toDate(),
        lastLoginAt: new Date()
      };
    } catch (error: any) {
      console.error('Login error:', error);
      const message = getAuthErrorMessage(error);
      toast.error(message);
      throw new AuthError(message, error.code || 'unknown', error);
    }
  }

  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Erreur lors de la déconnexion');
      throw error;
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Email de réinitialisation envoyé');
    } catch (error) {
      console.error('Password reset error:', error);
      const message = getAuthErrorMessage(error);
      toast.error(message);
      throw error;
    }
  }
}