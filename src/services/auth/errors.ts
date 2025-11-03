export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const getAuthErrorMessage = (error: any): string => {
  // Firebase Auth errors
  if (error?.code?.startsWith('auth/')) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'Cette adresse email est déjà utilisée';
      case 'auth/invalid-credential':
        return 'Email ou mot de passe incorrect';
      case 'auth/user-not-found':
        return 'Aucun compte trouvé avec cet email';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect';
      case 'auth/invalid-email':
        return 'Adresse email invalide';
      case 'auth/weak-password':
        return 'Le mot de passe doit contenir au moins 8 caractères';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Veuillez réessayer plus tard';
      case 'auth/network-request-failed':
        return 'Erreur de connexion. Vérifiez votre connexion internet';
      case 'auth/unauthorized-continue-uri':
        return 'URL de redirection non autorisée';
      default:
        return 'Une erreur est survenue lors de l\'authentification';
    }
  }

  // Firestore errors
  if (error?.code === 'permission-denied') {
    return 'Vous n\'avez pas les permissions nécessaires';
  }

  // Custom validation errors
  if (error?.code === 'validation-error') {
    return error.message || 'Données invalides';
  }

  // Default error message
  return 'Une erreur inattendue est survenue';
};