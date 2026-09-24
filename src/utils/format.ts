import type { AnimalType, PetStatus } from '../types';

export const STATUS_LABELS: Record<PetStatus, string> = {
  lost: 'Perdido',
  found: 'Encontrado',
  spotted: 'Avistado',
};

// Colores por estado: rojo/naranja perdido, verde resuelto, azul avistado.
export const STATUS_COLOR: Record<PetStatus, string> = {
  lost: '#ef4444',
  found: '#10b981',
  spotted: '#3b82f6',
};

export const STATUS_BG: Record<PetStatus, string> = {
  lost: 'bg-red-50 text-red-700 ring-red-200',
  found: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  spotted: 'bg-blue-50 text-blue-700 ring-blue-200',
};

export const STATUS_DOT: Record<PetStatus, string> = {
  lost: 'bg-red-500',
  found: 'bg-emerald-500',
  spotted: 'bg-blue-500',
};

export const TYPE_LABELS: Record<AnimalType, string> = {
  dog: 'Perro',
  cat: 'Gato',
  other: 'Otro',
};

export const TYPE_EMOJI: Record<AnimalType, string> = {
  dog: '🐶',
  cat: '🐱',
  other: '🐾',
};

export function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  return new Date(ts).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}
