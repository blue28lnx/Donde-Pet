import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { auth as fbAuth, googleProvider as fbProvider, HAS_FIREBASE } from '../services/firebase';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isFirebase: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const FALLBACK_POOL: User[] = [
  {
    id: 'demo-1',
    name: 'Santi Demo',
    email: 'santi.demo@gmail.com',
    avatar: 'https://i.pravatar.cc/120?img=5',
  },
];

function mapFirebaseUser(u: FirebaseUser): User {
  return {
    id: u.uid,
    name: u.displayName ?? u.email ?? 'Usuario',
    email: u.email ?? '',
    avatar: u.photoURL ?? `https://i.pravatar.cc/120?u=${encodeURIComponent(u.uid)}`,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // localStorage se usa únicamente como espejo / fallback cuando NO hay Firebase.
  const [stored, setStored] = useLocalStorage<User | null>('donde-pet:v2:user', null);
  const [isLoading, setIsLoading] = useState(false);
  const [fbUser, setFbUser] = useState<User | null>(null);

  // Suscribirse a Firebase Auth cuando esté disponible
  useEffect(() => {
    if (!HAS_FIREBASE || !fbAuth) return;
    const unsub = onAuthStateChanged(fbAuth, (u) => {
      if (u) {
        setFbUser(mapFirebaseUser(u));
      } else {
        setFbUser(null);
      }
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (HAS_FIREBASE && fbAuth && fbProvider) {
      setIsLoading(true);
      try {
        await signInWithPopup(fbAuth, fbProvider);
      } catch (err: any) {
        // popup cerrado por el usuario no es error grave
        if (err?.code !== 'auth/popup-closed-by-user') {
          console.error('Firebase login error:', err);
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }
    // Fallback: simulación local
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const idx = Math.floor(Date.now() / 1000) % FALLBACK_POOL.length;
    setStored(FALLBACK_POOL[idx]);
    setIsLoading(false);
  }, [setStored]);

  const logout = useCallback(async () => {
    if (HAS_FIREBASE && fbAuth) {
      try {
        await signOut(fbAuth);
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    setStored(null);
  }, [setStored]);

  const user = HAS_FIREBASE ? fbUser : stored;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isFirebase: HAS_FIREBASE,
      loginWithGoogle,
      logout,
    }),
    [user, isLoading, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
