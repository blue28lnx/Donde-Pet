import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const RAW_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
export const HAS_GOOGLE = Boolean(RAW_CLIENT_ID && RAW_CLIENT_ID.length > 0);
export const GOOGLE_CLIENT_ID = RAW_CLIENT_ID ?? '';

function useAuthShared() {
  const [stored, setStored] = useLocalStorage<User | null>('donde-pet:user', null);
  const logout = useCallback(() => setStored(null), [setStored]);
  return { user: stored, setStored, logout };
}

function RealAuthProvider({ children }: { children: ReactNode }) {
  const { user, setStored, logout } = useAuthShared();
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = useCallback(
    async (tokenResponse: { access_token?: string }) => {
      try {
        if (!tokenResponse?.access_token) throw new Error('Sin access_token');
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const info = await res.json();
        setStored({
          id: info.sub,
          name: info.name,
          email: info.email,
          avatar: info.picture,
        });
      } catch (err) {
        console.error('No se pudo obtener el perfil de Google', err);
      } finally {
        setIsLoading(false);
      }
    },
    [setStored]
  );

  const googleLogin = useGoogleLogin({
    onSuccess: handleSuccess,
    onError: () => {
      console.warn('Login con Google cancelado o falló.');
      setIsLoading(false);
    },
    scope: 'openid profile email',
  });

  const loginWithGoogle = useCallback(() => {
    setIsLoading(true);
    googleLogin();
  }, [googleLogin]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, loginWithGoogle, logout }),
    [user, isLoading, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Cuando NO hay Client ID configurado, mostramos un mensaje claro en vez de tirar error.
function SetupRequiredProvider({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthShared();

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: false,
      loginWithGoogle: () => {
        alert(
          'Falta configurar VITE_GOOGLE_CLIENT_ID en .env.local y reiniciar pnpm dev.'
        );
      },
      logout,
    }),
    [user, logout]
  );

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-2 z-[60] flex justify-center px-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-lg ring-1 ring-amber-300">
          ⚠️ Falta configurar <code className="rounded bg-amber-600/40 px-1.5">VITE_GOOGLE_CLIENT_ID</code> en <code className="rounded bg-amber-600/40 px-1.5">.env.local</code>
        </div>
      </div>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (HAS_GOOGLE) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <RealAuthProvider>{children}</RealAuthProvider>
      </GoogleOAuthProvider>
    );
  }
  return <SetupRequiredProvider>{children}</SetupRequiredProvider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
