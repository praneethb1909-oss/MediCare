import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const SUPABASE_URL = "https://ekubzscnqlevizipthue.supabase.co";
const SUPABASE_KEY = "sb_publishable_G_e9naAN9VozrcsAeMwSeA_m4OlPu5B";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tables = [
  'hospitals',
  'departments',
  'doctors',
  'patients',
  'user_roles',
  'appointments',
  'medical_reports',
  'messages',
  'medical_types',
  'prescriptions'
];

async function migrate() {
  console.log('Starting migration from Supabase to Firebase...');

  // Since we are using an anon key, we can't query information_schema easily.
  // We will try to fetch from each table. If it fails with 'not found', it's likely missing.
  
  for (const table of tables) {
    console.log(`Checking table: ${table}...`);
    
    try {
      const { data, error, status } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        if (status === 404 || error.message.includes('cache')) {
          console.warn(`[SKIP] Table '${table}' does not exist in the public schema.`);
        } else {
          console.error(`[ERROR] Table '${table}':`, error.message);
        }
        continue;
      }

      // Fetch all data
      const { data: allData, error: fetchError } = await supabase.from(table).select('*');
      
      if (fetchError) {
        console.error(`[ERROR] Fetching all from ${table}:`, fetchError.message);
        continue;
      }

      if (!allData || allData.length === 0) {
        console.log(`[EMPTY] Table '${table}' is empty.`);
        continue;
      }

      console.log(`[MIGRATE] Found ${allData.length} records in '${table}'. Uploading to Firestore...`);

      for (const item of allData) {
        const docId = item.id || item.user_id; 
        
        if (docId) {
          await setDoc(doc(db, table, docId.toString()), item);
        } else {
          await addDoc(collection(db, table), item);
        }
      }
      
      console.log(`[DONE] Successfully migrated ${table}.`);
    } catch (err) {
      console.error(`[FATAL] Failed to migrate ${table}:`, err);
    }
  }

  console.log('Migration completed!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
