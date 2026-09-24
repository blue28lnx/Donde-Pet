import { useState, useRef, useEffect } from 'react';
import { Search, Plus, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classNames } from '../utils/format';

interface NavbarProps {
  onPublish: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function Navbar({ onPublish, searchQuery, onSearchChange }: NavbarProps) {
  const { user, logout, loginWithGoogle } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md ring-1 ring-slate-100 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <img
            src="/logo.png"
            alt="¿Dónde Pet?"
            className="h-10 w-10 rounded-xl object-cover shadow-md ring-1 ring-emerald-100"
          />
          <div className="hidden sm:block">
            <h1 className="text-base font-extrabold leading-tight text-slate-900">
              ¿Dónde <span className="text-brand-orange">Pet?</span>
            </h1>
            <p className="text-[10px] font-medium leading-none text-slate-500">
              Mascotas perdidas y encontradas
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, raza o barrio…"
            className="w-full rounded-xl bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-emerald focus:bg-white transition"
          />
        </div>

        {/* Acción: publicar */}
        <button
          onClick={onPublish}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-200 hover:bg-brand-orange-dark transition"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Publicar</span>
        </button>

        {/* Auth */}
        {user ? (
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl bg-white px-2 py-1.5 ring-1 ring-slate-200 hover:bg-slate-50 transition"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="h-7 w-7 rounded-full object-cover ring-2 ring-brand-emerald-light"
              />
              <span className="hidden md:block text-sm font-semibold text-slate-700 max-w-[120px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <ChevronDown
                className={classNames(
                  'h-4 w-4 text-slate-400 transition-transform',
                  menuOpen && 'rotate-180'
                )}
              />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right animate-fade-in rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-100 z-40">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition"
          >
            <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.2 7.9 3l5.7-5.7A20 20 0 1 0 24 44c11 0 20-9 20-20 0-1.3-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.2 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2A12 12 0 0 1 12.7 28l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.5l6.3 5.2C40.9 35.6 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5z"/>
            </svg>
            <span className="hidden sm:inline">Iniciar sesión</span>
          </button>
        )}
      </div>
    </header>
  );
}
