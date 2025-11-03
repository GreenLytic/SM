import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAUCOWAI8rid7P51WKpD5KFlvriqLeJfVw",
  authDomain: "smartcoop1-b5878.firebaseapp.com",
  projectId: "smartcoop1-b5878",
  storageBucket: "smartcoop1-b5878.appspot.com",
  messagingSenderId: "766280961744",
  appId: "1:766280961744:web:712817cc78924fd97918d5",
  measurementId: "G-NMY8V11LGW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Configure auth persistence
setPersistence(auth, browserLocalPersistence);

// Initialize security rules
export const initializeSecurityRules = async () => {
  // We'll just return true since security rules are managed in the Firebase Console
  return true;
};

// Helper function to handle Firestore errors
export const handleFirestoreError = (error: any) => {
  if (error?.code === 'permission-denied') {
    return new Error('Vous n\'avez pas les permissions nécessaires pour cette action');
  }
  return error;
};