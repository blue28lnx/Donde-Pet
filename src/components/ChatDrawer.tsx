import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import type { Pet } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePets } from '../context/PetsContext';
import { classNames, formatRelative } from '../utils/format';

interface ChatDrawerProps {
  pet: Pet;
  onClose: () => void;
}

export function ChatDrawer({ pet, onClose }: ChatDrawerProps) {
  const { user } = useAuth();
  const { messagesByPet, addMessage } = usePets();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const messages = messagesByPet[pet.id] ?? [];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, pet.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const send = () => {
    if (!text.trim() || !user) return;
    addMessage({
      petId: pet.id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      text: text.trim(),
    });
    setText('');
  };

  // Si no hay sesión, mostramos CTA de login
  const headerAvatar = useMemo(() => pet.owner.avatar, [pet.owner.avatar]);

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in-right flex-col bg-white shadow-2xl ring-1 ring-slate-100">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-br from-emerald-50 to-orange-50 px-4 py-3">
          <img
            src={headerAvatar}
            alt={pet.owner.name}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">
              Conversación sobre <span className="text-brand-orange">{pet.name}</span>
            </p>
            <p className="truncate text-xs text-slate-500">
              con {pet.owner.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-700"
            aria-label="Cerrar chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mini resumen del reporte */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-2.5">
          <img
            src={pet.photo}
            alt={pet.name}
            className="h-12 w-12 rounded-lg object-cover ring-1 ring-slate-100"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{pet.name}</p>
            <p className="truncate text-xs text-slate-500">{pet.breed}</p>
          </div>
        </div>

        {/* Mensajes */}
        <div
          ref={scrollRef}
          className="pet-scroll flex-1 space-y-3 overflow-y-auto bg-slate-50/50 px-4 py-4"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-brand-emerald">
                <MessageCircle className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Inicien la conversación
              </p>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Coordina un punto de encuentro o pasale info útil sobre {pet.name}.
              </p>
            </div>
          )}

          {messages.map((m) => {
            const mine = user?.id === m.userId;
            return (
              <div
                key={m.id}
                className={classNames(
                  'flex items-end gap-2',
                  mine && 'flex-row-reverse'
                )}
              >
                <img
                  src={m.userAvatar}
                  alt={m.userName}
                  className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                />
                <div
                  className={classNames(
                    'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
                    mine
                      ? 'rounded-br-md bg-brand-emerald text-white'
                      : 'rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-100'
                  )}
                >
                  <p className={classNames('mb-0.5 text-[10px] font-semibold', mine ? 'text-emerald-100' : 'text-slate-500')}>
                    {mine && 'Tú · '}{m.userName}
                  </p>
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {m.text}
                  </p>
                  <p
                    className={classNames(
                      'mt-1 text-[10px]',
                      mine ? 'text-emerald-100' : 'text-slate-400'
                    )}
                  >
                    {formatRelative(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 bg-white p-3">
          {user ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={`Escribile a ${pet.owner.name.split(' ')[0]}…`}
                className="input max-h-32 min-h-[44px] resize-none"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-emerald text-white shadow-md shadow-emerald-200 transition hover:bg-brand-emerald-dark disabled:opacity-50"
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              Iniciá sesión para enviar mensajes.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
