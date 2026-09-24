import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function LoginModal({ open, onClose, message }: LoginModalProps) {
  const { loginWithGoogle, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="relative w-full max-w-md animate-slide-in-right rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-100">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-5 flex flex-col items-center text-center">
            <img
              src="/logo.png"
              alt="¿Dónde Pet?"
              className="mb-3 h-24 w-24 rounded-2xl object-cover shadow-lg shadow-emerald-200 ring-2 ring-emerald-100"
            />
            <h2 className="text-xl font-extrabold text-slate-900">
              ¿Dónde <span className="text-brand-orange">Pet?</span>
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {message ?? 'Iniciá sesión para publicar y chatear con la comunidad 🐾'}
            </p>
          </div>

          <button
            onClick={async () => {
              try {
                await loginWithGoogle();
                onClose();
              } catch (e) {
                setError('No pudimos iniciar sesión. Probá de nuevo.');
              }
            }}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.2 7.9 3l5.7-5.7A20 20 0 1 0 24 44c11 0 20-9 20-20 0-1.3-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.2 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2A12 12 0 0 1 12.7 28l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.5l6.3 5.2C40.9 35.6 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5z"/>
            </svg>
            {isLoading ? 'Conectando…' : 'Continuar con Google'}
          </button>

          {error && (
            <p className="mt-3 text-center text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          <p className="mt-4 text-center text-[11px] text-slate-400">
            Al continuar aceptás nuestras reglas de la manada 🐶
          </p>
        </div>
      </div>
    </div>
  );
}
