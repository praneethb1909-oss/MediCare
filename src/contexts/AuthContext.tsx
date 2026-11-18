import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
  hospitalId: string | null;
  signUp: (email: string, password: string, fullName: string, role: string, hospitalId?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  fetchUserRole: (userId: string) => Promise<void>;
  loginAsDemo: (demoRole: 'patient' | 'doctor' | 'admin', customEmail?: string, customName?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setDemoSession = (demoRole: 'patient' | 'doctor' | 'admin', customEmail?: string, customName?: string) => {
    const defaultEmails = {
      patient: 'patient@olmera.health',
      doctor: 'suresh.a@olmera.health',
      admin: 'admin@olmera.health'
    };
    const defaultNames = {
      patient: 'Demo Patient',
      doctor: 'Dr. A Suresh',
      admin: 'Administrator'
    };

    const email = customEmail || defaultEmails[demoRole];
    const displayName = customName || (customEmail ? customEmail.split('@')[0] : defaultNames[demoRole]);

    setUser({
      uid: 'demo-' + demoRole + '-uid',
      email,
      displayName
    } as any);
    setRole(demoRole);
    setHospitalId(demoRole === 'doctor' ? 'hosp-2' : demoRole === 'patient' ? 'hosp-1' : null);
    setLoading(false);
    sessionStorage.setItem('olmera_demo_role', demoRole);
    if (customEmail) sessionStorage.setItem('olmera_demo_email', customEmail);
    if (customName) sessionStorage.setItem('olmera_demo_name', customName);
  };

  useEffect(() => {
    const savedDemoRole = (sessionStorage.getItem('olmera_demo_role') || sessionStorage.getItem('medicare_demo_role')) as 'patient' | 'doctor' | 'admin' | null;
    if (savedDemoRole) {
      const savedEmail = sessionStorage.getItem('olmera_demo_email') || sessionStorage.getItem('medicare_demo_email') || undefined;
      const savedName = sessionStorage.getItem('olmera_demo_name') || sessionStorage.getItem('medicare_demo_name') || undefined;
      setDemoSession(savedDemoRole, savedEmail, savedName);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserRole(firebaseUser.uid);
      } else {
        setRole(null);
        setHospitalId(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      let resolvedRole = 'patient';
      const roleDoc = await getDoc(doc(db, 'user_roles', userId));
      
      if (roleDoc.exists()) {
        const data = roleDoc.data();
        resolvedRole = data.role || 'patient';
        setRole(resolvedRole);
        setHospitalId(data.hospital_id || null);
      } else {
        setRole('patient');
      }

      // If user profile does not yet have a displayName, dynamically resolve from database
      if (!auth.currentUser?.displayName) {
        let dynamicName: string | null = null;

        if (resolvedRole === 'doctor') {
          // Check doctors collection by user_id
          const docQuery = await getDocs(query(collection(db, 'doctors'), where('user_id', '==', userId), limit(1)));
          if (!docQuery.empty) {
            dynamicName = docQuery.docs[0].data().name || null;
          } else {
            const byDocId = await getDoc(doc(db, 'doctors', userId));
            if (byDocId.exists()) dynamicName = byDocId.data().name || null;
          }
        } else {
          // Check patients collection by id
          const patDoc = await getDoc(doc(db, 'patients', userId));
          if (patDoc.exists()) {
            dynamicName = patDoc.data().full_name || patDoc.data().name || null;
          }
        }

        // Also check generic users collection
        if (!dynamicName) {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const uData = userDoc.data();
            dynamicName = uData.full_name || uData.name || uData.displayName || null;
          }
        }

        if (dynamicName) {
          setUser(prev => prev ? ({ ...prev, displayName: dynamicName } as any) : null);
        }
      }
    } catch (error) {
      console.error('Error fetching user role and profile:', error);
      setRole('patient');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, userRole: string, hospitalId?: string) => {
    if (!isFirebaseConfigured) {
      setDemoSession((userRole === 'doctor' || userRole === 'admin') ? userRole : 'patient', email, fullName);
      return { error: null };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth Profile with fullName
      await updateProfile(firebaseUser, { displayName: fullName });

      // Create user_roles entry in Firestore
      await setDoc(doc(db, 'user_roles', firebaseUser.uid), {
        user_id: firebaseUser.uid,
        role: userRole,
        hospital_id: hospitalId || null,
        created_at: new Date().toISOString()
      });

      // If patient, create patient profile in Firestore
      if (userRole === 'patient') {
        await setDoc(doc(db, 'patients', firebaseUser.uid), {
          id: firebaseUser.uid,
          full_name: fullName,
          email: email,
          created_at: new Date().toISOString()
        });
      }

      return { error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error?.code === 'auth/api-key-not-valid' || error?.code === 'auth/invalid-api-key') {
        setDemoSession((userRole === 'doctor' || userRole === 'admin') ? userRole : 'patient', email, fullName);
        return { error: null };
      }
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      let inferredRole: 'admin' | 'doctor' | 'patient' = 'patient';
      if (email.includes('admin')) inferredRole = 'admin';
      else if (email.includes('doctor') || email.includes('suresh')) inferredRole = 'doctor';
      setDemoSession(inferredRole, email);
      return { error: null };
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error: any) {
      console.error('Signin error:', error);
      if (error?.code === 'auth/api-key-not-valid' || error?.code === 'auth/invalid-api-key') {
        let inferredRole: 'admin' | 'doctor' | 'patient' = 'patient';
        if (email.includes('admin')) inferredRole = 'admin';
        else if (email.includes('doctor') || email.includes('suresh')) inferredRole = 'doctor';
        setDemoSession(inferredRole, email);
        return { error: null };
      }
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    sessionStorage.removeItem('olmera_demo_role');
    sessionStorage.removeItem('olmera_demo_email');
    sessionStorage.removeItem('olmera_demo_name');
    sessionStorage.removeItem('medicare_demo_role');
    sessionStorage.removeItem('medicare_demo_email');
    sessionStorage.removeItem('medicare_demo_name');
    setUser(null);
    setRole(null);
    setHospitalId(null);
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      role, 
      hospitalId, 
      signUp, 
      signIn, 
      signOut, 
      fetchUserRole,
      loginAsDemo: setDemoSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
