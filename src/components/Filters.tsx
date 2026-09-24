import type { AnimalType, PetStatus } from '../types';
import { classNames, STATUS_LABELS } from '../utils/format';
import { Dog, Cat, PawPrint, CircleDot, Eye, CheckCircle2 } from 'lucide-react';

interface FiltersProps {
  status: 'all' | PetStatus;
  type: 'all' | AnimalType;
  onStatusChange: (s: 'all' | PetStatus) => void;
  onTypeChange: (t: 'all' | AnimalType) => void;
  counts: { all: number; lost: number; found: number; spotted: number };
}

export function Filters({
  status,
  type,
  onStatusChange,
  onTypeChange,
  counts,
}: FiltersProps) {
  const statusOptions: { key: 'all' | PetStatus; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Todos', icon: <CircleDot className="h-3.5 w-3.5" /> },
    { key: 'lost', label: STATUS_LABELS.lost, icon: <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> },
    { key: 'spotted', label: STATUS_LABELS.spotted, icon: <Eye className="h-3.5 w-3.5" /> },
    { key: 'found', label: STATUS_LABELS.found, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  ];

  const typeOptions: { key: 'all' | AnimalType; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Todos', icon: <PawPrint className="h-3.5 w-3.5" /> },
    { key: 'dog', label: 'Perros', icon: <Dog className="h-3.5 w-3.5" /> },
    { key: 'cat', label: 'Gatos', icon: <Cat className="h-3.5 w-3.5" /> },
    { key: 'other', label: 'Otros', icon: <PawPrint className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-20 flex w-full max-w-2xl -translate-x-1/2 flex-col gap-2 px-3 sm:top-4">
      <div className="pointer-events-auto flex justify-center">
        <div className="flex max-w-full overflow-x-auto rounded-2xl bg-white/95 p-1.5 shadow-lg ring-1 ring-slate-100 backdrop-blur pet-scroll">
          {statusOptions.map((opt) => {
            const active = status === opt.key;
            const count =
              opt.key === 'all' ? counts.all : (counts as any)[opt.key] ?? 0;
            return (
              <button
                key={opt.key}
                onClick={() => onStatusChange(opt.key)}
                className={classNames(
                  'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition',
                  active
                    ? 'bg-brand-emerald text-white shadow-sm shadow-emerald-200'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {opt.icon}
                <span>{opt.label}</span>
                <span
                  className={classNames(
                    'rounded-full px-1.5 text-[10px] font-bold',
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-auto flex justify-center">
        <div className="flex max-w-full overflow-x-auto rounded-2xl bg-white/85 p-1 ring-1 ring-slate-100 backdrop-blur">
          {typeOptions.map((opt) => {
            const active = type === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => onTypeChange(opt.key)}
                className={classNames(
                  'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium transition',
                  active
                    ? 'bg-brand-orange text-white shadow-sm shadow-orange-200'
                    : 'text-slate-600 hover:bg-white'
                )}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
