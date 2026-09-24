import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const HAS_FIREBASE = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _googleProvider: GoogleAuthProvider | null = null;

if (HAS_FIREBASE) {
  _app = initializeApp(firebaseConfig as Required<typeof firebaseConfig>);
  _db = getFirestore(_app);
  _auth = getAuth(_app);
  _googleProvider = new GoogleAuthProvider();
  _googleProvider.setCustomParameters({ prompt: 'select_account' });
}

export const app = _app;
export const db = _db;
export const auth = _auth;
export const googleProvider = _googleProvider;

if (!HAS_FIREBASE) {
  console.warn(
    '🟡 Firebase no está configurado. La app va a funcionar pero los datos NO se van a sincronizar entre usuarios. Configurá VITE_FIREBASE_* en .env.local.'
  );
}
