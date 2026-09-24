import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { AnimalType, Message, Pet, PetStatus, User } from '../types';

interface NewPetInput {
  name: string;
  type: AnimalType;
  breed: string;
  photo: string;
  status: PetStatus;
  lat: number;
  lng: number;
  dateTime: string;
  description: string;
  contact?: string;
}

interface PetsContextValue {
  pets: Pet[];
  messagesByPet: Record<string, Message[]>;
  addPet: (pet: NewPetInput, owner: { id: string; name: string; email: string; avatar: string }) => Pet;
  updatePet: (id: string, patch: Partial<Pet>) => void;
  deletePet: (id: string) => void;
  markAsFound: (id: string) => void;
  addMessage: (msg: Omit<Message, 'id' | 'createdAt'>) => Message;
}

const PetsContext = createContext<PetsContextValue | undefined>(undefined);

export function PetsProvider({ children }: { children: ReactNode }) {
  const [pets, setPets] = useLocalStorage<Pet[]>('donde-pet:v2:pets', []);
  const [messages, setMessages] = useLocalStorage<Message[]>(
    'donde-pet:v2:messages',
    []
  );

  // Migración: limpia las keys viejas de la versión con seeds de prueba.
  useEffect(() => {
    try {
      localStorage.removeItem('donde-pet:pets');
      localStorage.removeItem('donde-pet:messages');
    } catch {
      /* sin localStorage disponible */
    }
  }, []);

  const addPet = useCallback(
    (input: NewPetInput, owner: User) => {
      const pet: Pet = {
        id: `p-${Date.now()}`,
        ...input,
        owner,
        createdAt: Date.now(),
      };
      setPets((prev) => [pet, ...prev]);
      return pet;
    },
    [setPets]
  );

  const updatePet = useCallback(
    (id: string, patch: Partial<Pet>) => {
      setPets((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    [setPets]
  );

  const deletePet = useCallback(
    (id: string) => {
      setPets((prev) => prev.filter((p) => p.id !== id));
      setMessages((prev) => prev.filter((m) => m.petId !== id));
    },
    [setPets, setMessages]
  );

  const markAsFound = useCallback(
    (id: string) => {
      setPets((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'found' satisfies PetStatus, resolvedAt: Date.now() }
            : p
        )
      );
    },
    [setPets]
  );

  const addMessage = useCallback(
    (msg: Omit<Message, 'id' | 'createdAt'>) => {
      const full: Message = {
        ...msg,
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, full]);
      return full;
    },
    [setMessages]
  );

  const messagesByPet = useMemo(() => {
    const map: Record<string, Message[]> = {};
    for (const m of messages) {
      if (!map[m.petId]) map[m.petId] = [];
      map[m.petId].push(m);
    }
    return map;
  }, [messages]);

  const value = useMemo(
    () => ({ pets, messagesByPet, addPet, updatePet, deletePet, markAsFound, addMessage }),
    [pets, messagesByPet, addPet, updatePet, deletePet, markAsFound, addMessage]
  );

  return <PetsContext.Provider value={value}>{children}</PetsContext.Provider>;
}

export function usePets() {
  const ctx = useContext(PetsContext);
  if (!ctx) throw new Error('usePets debe usarse dentro de <PetsProvider>');
  return ctx;
}
