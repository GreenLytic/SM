export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'user';
  createdAt: Date;
  lastLoginAt?: Date;
  photoURL?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  displayName: string;
  role: 'admin' | 'manager' | 'user';
}