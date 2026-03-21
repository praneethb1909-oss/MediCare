import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
  hospitalId: string | null;
  signUp: (email: string, password: string, fullName: string, role: string, hospitalId?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  fetchUserRole: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      const roleDoc = await getDoc(doc(db, 'user_roles', userId));
      
      if (roleDoc.exists()) {
        const data = roleDoc.data();
        setRole(data.role);
        setHospitalId(data.hospital_id || null);
      } else {
        // Default role if not found in Firestore
        setRole('patient');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('patient');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, userRole: string, hospitalId?: string) => {
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
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error: any) {
      console.error('Signin error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setRole(null);
      setHospitalId(null);
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
      fetchUserRole 
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
