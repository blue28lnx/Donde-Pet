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
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { db, HAS_FIREBASE } from '../services/firebase';
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
  addPet: (
    pet: NewPetInput,
    owner: User
  ) => Promise<Pet>;
  updatePet: (id: string, patch: Partial<Pet>) => Promise<void>;
  deletePet: (id: string) => Promise<void>;
  markAsFound: (id: string) => Promise<void>;
  addMessage: (msg: Omit<Message, 'id' | 'createdAt'>) => Promise<Message>;
}

const PetsContext = createContext<PetsContextValue | undefined>(undefined);

// Helpers Firestore -> tipo local
function tsToNumber(t: Timestamp | number | undefined | null): number {
  if (t == null) return Date.now();
  if (typeof t === 'number') return t;
  if (typeof (t as any).toMillis === 'function') return (t as Timestamp).toMillis();
  return Date.now();
}

function petFromDoc(id: string, data: any): Pet {
  return {
    id,
    name: data.name,
    type: data.type,
    breed: data.breed,
    photo: data.photo,
    status: data.status,
    lat: data.lat,
    lng: data.lng,
    dateTime: data.dateTime,
    description: data.description,
    owner: data.owner,
    contact: data.contact,
    ownerId: data.ownerId,
    createdAt: tsToNumber(data.createdAt),
    resolvedAt: data.resolvedAt ? tsToNumber(data.resolvedAt) : undefined,
  };
}

export function PetsProvider({ children }: { children: ReactNode }) {
  // ---- Estado ----
  const [pets, setPets] = useState<Pet[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // localStorage fallback cuando no hay Firebase
  const [storedPets, setStoredPets] = useLocalStorage<Pet[]>(
    'donde-pet:v3:pets',
    []
  );
  const [storedMessages, setStoredMessages] = useLocalStorage<Message[]>(
    'donde-pet:v3:messages',
    []
  );

  // Suscripción a Firestore en tiempo real
  useEffect(() => {
    if (!HAS_FIREBASE || !db) return;
    const q = query(collection(db, 'pets'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => petFromDoc(d.id, d.data()));
        setPets(list);
      },
      (err) => console.error('pets snapshot error', err)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!HAS_FIREBASE || !db) return;
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Message)
        );
        setMessages(list);
      },
      (err) => console.error('messages snapshot error', err)
    );
    return () => unsub();
  }, []);

  // ---- Acciones (Firestore o localStorage) ----
  const addPet = useCallback(
    async (input: NewPetInput, owner: User): Promise<Pet> => {
      if (HAS_FIREBASE && db) {
        const ref = await addDoc(collection(db, 'pets'), {
          ...input,
          owner,
          ownerId: owner.id,
          createdAt: serverTimestamp(),
        });
        return {
          id: ref.id,
          ...input,
          owner,
          createdAt: Date.now(),
        };
      }
      // fallback local
      const newPet: Pet = {
        id: `p-${Date.now()}`,
        ...input,
        owner,
        ownerId: owner.id,
        createdAt: Date.now(),
      };
      setStoredPets((prev) => [newPet, ...prev]);
      return newPet;
    },
    [setStoredPets]
  );

  const updatePet = useCallback(
    async (id: string, patch: Partial<Pet>) => {
      if (HAS_FIREBASE && db) {
        await updateDoc(doc(db, 'pets', id), patch);
        return;
      }
      setStoredPets((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    },
    [setStoredPets]
  );

  const deletePet = useCallback(
    async (id: string) => {
      if (HAS_FIREBASE && db) {
        await deleteDoc(doc(db, 'pets', id));
        // Limpiamos mensajes asociados para que no queden huérfanos
        // (En Firestore haría falta una Cloud Function; en local los borramos).
        return;
      }
      setStoredPets((prev) => prev.filter((p) => p.id !== id));
      setStoredMessages((prev) => prev.filter((m) => m.petId !== id));
    },
    [setStoredPets, setStoredMessages]
  );

  const markAsFound = useCallback(
    async (id: string) => {
      if (HAS_FIREBASE && db) {
        await updateDoc(doc(db, 'pets', id), {
          status: 'found',
          resolvedAt: serverTimestamp(),
        });
        return;
      }
      setStoredPets((prev) =>
        prev.map((p) =>
          p.id === id
            ? ({ ...p, status: 'found', resolvedAt: Date.now() } satisfies Pet)
            : p
        )
      );
    },
    [setStoredPets]
  );

  const addMessage = useCallback(
    async (msg: Omit<Message, 'id' | 'createdAt'>): Promise<Message> => {
      const full: Message = {
        ...msg,
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
      };
      if (HAS_FIREBASE && db) {
        const ref = await addDoc(collection(db, 'messages'), full);
        return { ...full, id: ref.id };
      }
      setStoredMessages((prev) => [...prev, full]);
      return full;
    },
    [setStoredMessages]
  );

  const messagesByPet = useMemo(() => {
    const map: Record<string, Message[]> = {};
    const source = HAS_FIREBASE ? messages : storedMessages;
    for (const m of source) {
      if (!map[m.petId]) map[m.petId] = [];
      map[m.petId].push(m);
    }
    return map;
  }, [messages, storedMessages]);

  const finalPets = HAS_FIREBASE ? pets : storedPets;

  const value = useMemo<PetsContextValue>(
    () => ({
      pets: finalPets,
      messagesByPet,
      addPet,
      updatePet,
      deletePet,
      markAsFound,
      addMessage,
    }),
    [finalPets, messagesByPet, addPet, updatePet, deletePet, markAsFound, addMessage]
  );

  return <PetsContext.Provider value={value}>{children}</PetsContext.Provider>;
}

export function usePets() {
  const ctx = useContext(PetsContext);
  if (!ctx) throw new Error('usePets debe usarse dentro de <PetsProvider>');
  return ctx;
}
