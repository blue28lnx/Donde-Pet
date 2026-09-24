export type PetStatus = 'lost' | 'found' | 'spotted';
export type AnimalType = 'dog' | 'cat' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Pet {
  id: string;
  name: string;
  type: AnimalType;
  breed: string;
  photo: string;
  status: PetStatus;
  lat: number;
  lng: number;
  dateTime: string; // ISO string
  description: string;
  owner: User;
  ownerId?: string;
  contact?: string;
  createdAt: number;
  resolvedAt?: number;
}

export interface Message {
  id: string;
  petId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: number;
}

export type StatusFilter = 'all' | PetStatus;
export type TypeFilter = 'all' | AnimalType;
