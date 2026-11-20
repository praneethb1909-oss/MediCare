import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? (process.env || {}) : {});

const rawApiKey = env.VITE_FIREBASE_API_KEY;
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
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'olmera-app.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'olmera-app',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'olmera-app.appspot.com',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890abcdef',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX'
};

if (!isFirebaseConfigured) {
  console.warn('Firebase configuration is using demo/placeholder values. Real authentication and database operations require active Firebase keys in .env.');
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
