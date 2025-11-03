// This file is kept for backward compatibility but is no longer used
// The application now uses SQLite for local data storage

export const db = null;
export const auth = null;
export const storage = null;

export const initializeSecurityRules = async () => {
  return true;
};

export const handleFirestoreError = (error: any) => {
  return error;
};
