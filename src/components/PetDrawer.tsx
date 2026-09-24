import { useEffect } from 'react';
import { X, MapPin, Calendar, MessageCircle, CheckCircle2, Pencil, Trash2, Phone, User as UserIcon } from 'lucide-react';
import type { Pet } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePets } from '../context/PetsContext';
import {
  STATUS_BG,
  STATUS_LABELS,
  TYPE_EMOJI,
  TYPE_LABELS,
  formatDateTime,
  formatRelative,
} from '../utils/format';

interface PetDrawerProps {
  pet: Pet | null;
  onClose: () => void;
  onOpenChat: (pet: Pet) => void;
  onEdit?: (pet: Pet) => void;
}

export function PetDrawer({ pet, onClose, onOpenChat, onEdit }: PetDrawerProps) {
  const { user } = useAuth();
  const { deletePet, markAsFound } = usePets();
  const isOwner = !!user && !!pet && pet.owner.id === user.id;
  const isResolved = pet?.status === 'found';

  // Cerrar con Escape
  useEffect(() => {
    if (!pet) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [pet, onClose]);

  // Bloquear scroll de fondo
  useEffect(() => {
    if (pet) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [pet]);

  if (!pet) return null;

  return (
    <div className="fixed inset-0 z-40 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in-right flex-col bg-white shadow-2xl ring-1 ring-slate-100 sm:max-w-lg">
        {/* Header con imagen */}
        <div className="relative h-64 shrink-0 overflow-hidden bg-slate-100">
          <img
            src={pet.photo}
            alt={pet.name}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://via.placeholder.com/600x400/10b981/ffffff?text=Pet';
            }}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md ring-1 ring-slate-200 hover:bg-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute left-3 top-3 flex gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset backdrop-blur ${STATUS_BG[pet.status]}`}
            >
              {TYPE_EMOJI[pet.type]} {STATUS_LABELS[pet.status]}
            </span>
            {isResolved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Resuelto
              </span>
            )}
          </div>
          <div className="absolute inset-x-4 bottom-3 flex items-end justify-between">
            <div className="text-white drop-shadow">
              <h2 className="text-2xl font-extrabold">{pet.name}</h2>
              <p className="text-sm opacity-90">
                {TYPE_LABELS[pet.type]} · {pet.breed}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="pet-scroll flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="label mb-1">Cuándo</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-brand-emerald" />
                {formatDateTime(pet.dateTime)}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                publicado {formatRelative(pet.createdAt)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="label mb-1">Ubicación</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-brand-orange" />
                <span className="truncate">
                  {pet.lat.toFixed(4)}, {pet.lng.toFixed(4)}
                </span>
              </div>
              <button
                onClick={() => onOpenChat(pet)}
                className="mt-0.5 text-[11px] font-semibold text-brand-emerald hover:underline"
              >
                Ver en el mapa →
              </button>
            </div>
          </div>

          <div className="mb-4">
            <p className="label mb-1.5">Descripción</p>
            <p className="text-sm leading-relaxed text-slate-700">
              {pet.description}
            </p>
          </div>

          <div className="mb-4 rounded-xl bg-brand-emerald-light/60 p-4 ring-1 ring-emerald-100">
            <p className="label mb-2 text-brand-emerald-dark">Publicado por</p>
            <div className="flex items-center gap-3">
              <img
                src={pet.owner.avatar}
                alt={pet.owner.name}
                className="h-11 w-11 rounded-full object-cover ring-2 ring-white"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {pet.owner.name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {pet.owner.email}
                </p>
                {pet.contact && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-semibold text-slate-700">
                    <Phone className="h-3 w-3" />
                    {pet.contact}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-2">
            {!isOwner && user && (
              <button
                onClick={() => onOpenChat(pet)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-emerald py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-brand-emerald-dark transition"
              >
                <MessageCircle className="h-4 w-4" />
                Contactar al dueño
              </button>
            )}

            {!user && (
              <button
                onClick={() => alert('Iniciá sesión para contactar al dueño')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-emerald py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-brand-emerald-dark"
              >
                <UserIcon className="h-4 w-4" />
                Iniciá sesión para contactar
              </button>
            )}

            {isOwner && (
              <>
                {!isResolved && (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `¿Marcar a ${pet.name} como encontrado/resuelto?`
                        )
                      ) {
                        markAsFound(pet.id);
                      }
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Marcar como encontrado
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onEdit?.(pet)}
                    className="btn-secondary"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `¿Eliminar el reporte de ${pet.name}? Esta acción no se puede deshacer.`
                        )
                      ) {
                        deletePet(pet.id);
                        onClose();
                      }
                    }}
                    className="btn-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
