import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
export const isFirebaseConfigured = Boolean(
  rawApiKey && 
  rawApiKey !== 'your_firebase_api_key_here' &&
  !rawApiKey.includes('Demo') &&
  !rawApiKey.includes('demo') &&
  !rawApiKey.includes('placeholder') &&
  !rawApiKey.includes('dummy')
);

const firebaseConfig = {
  apiKey: rawApiKey || 'AIzaSyDemoLocalTestingKey1234567890',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'olmera-app.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'olmera-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'olmera-app.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890abcdef',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX'
};

if (!isFirebaseConfigured) {
  console.warn('Firebase configuration is using demo/placeholder values. Real authentication and database operations require active Firebase keys in .env.');
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
