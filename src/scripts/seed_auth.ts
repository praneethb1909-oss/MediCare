import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function getOrCreateUser(email: string, pass: string, name: string) {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCred.user, { displayName: name });
    console.log(`Created new user: ${email} (UID: ${userCred.user.uid})`);
    return userCred.user.uid;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      console.log(`User already exists, signed in: ${email} (UID: ${userCred.user.uid})`);
      return userCred.user.uid;
    }
    throw error;
  }
}

async function seedAuth() {
  console.log('Starting to seed Auth users and link them to Firestore...');

  try {
    // 1. Create Dr. A Suresh
    const sureshUid = await getOrCreateUser('suresh.a@medicare.in', 'Suresh@123', 'Dr. A Suresh');
    
    // Link Suresh to user_roles
    await setDoc(doc(db, 'user_roles', sureshUid), {
      user_id: sureshUid,
      role: 'doctor',
      hospital_id: 'hosp-5', // Apollo Vizag
      created_at: new Date().toISOString()
    });
    console.log(`Linked A. Suresh to user_roles as doctor`);

    // Add credits to Dr. A Suresh
    const doctorsRef = collection(db, 'doctors');
    const q = query(doctorsRef, where('name', '==', 'Dr. A Suresh'));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doctorDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'doctors', doctorDoc.id), {
        user_id: sureshUid
      });
      console.log(`Updated doctor document for A. Suresh with UID`);
    }

    // 2. Create Demo Patient
    const patientUid = await getOrCreateUser('patient@medicare.in', 'Patient@123', 'Demo Patient');
    
    // Link Patient to user_roles
    await setDoc(doc(db, 'user_roles', patientUid), {
      user_id: patientUid,
      role: 'patient',
      hospital_id: null,
      created_at: new Date().toISOString()
    });
    console.log(`Linked Demo Patient to user_roles`);

    // Create patient document
    await setDoc(doc(db, 'patients', patientUid), {
      id: patientUid,
      full_name: 'Demo Patient',
      email: 'patient@medicare.in',
      age: 28,
      gender: 'Male',
      last_visit: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
    console.log(`Created patient document for Demo Patient`);

    console.log('Auth seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Auth:', error);
    process.exit(1);
  }
}

seedAuth();
