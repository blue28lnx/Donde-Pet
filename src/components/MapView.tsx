import { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed, PawPrint } from 'lucide-react';
import type { AnimalType, Pet, PetStatus } from '../types';
import { PetMarker } from './PetMarker';
import { STATUS_COLOR } from '../utils/format';

// Icono azul genérico cuando el usuario hace click en el mapa (crear reporte)
const NEW_PIN_ICON = L.divIcon({
  html: `
    <div style="position:relative;width:36px;height:46px;">
      <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(15,23,42,0.25));">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 11.5 15 25 16.7 26.1.5.3 1.1.3 1.6 0C21 43 36 29.5 36 18 36 8.06 27.94 0 18 0z" fill="#3b82f6"/>
        <circle cx="18" cy="18" r="10" fill="white"/>
      </svg>
      <div style="position:absolute;top:9px;left:0;right:0;text-align:center;font-size:14px;">+</div>
    </div>
  `,
  className: 'custom-marker',
  iconSize: [36, 46],
  iconAnchor: [18, 46],
});

// Marker de "Estás acá" con halo animado
const USER_LOC_ICON = L.divIcon({
  html: `
    <div style="position:relative;width:22px;height:22px;">
      <span style="position:absolute;inset:-12px;border-radius:50%;background:rgba(59,130,246,0.25);animation:userPulse 1.8s ease-out infinite;"></span>
      <span style="position:absolute;inset:-6px;border-radius:50%;background:rgba(59,130,246,0.4);animation:userPulse 1.8s ease-out infinite;"></span>
      <span style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 2px rgba(59,130,246,0.5);"></span>
    </div>
    <style>
      @keyframes userPulse {
        0%   { transform: scale(0.6); opacity: 1; }
        100% { transform: scale(2.2); opacity: 0; }
      }
    </style>
  `,
  className: 'custom-marker user-loc-marker',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

interface MapViewProps {
  pets: Pet[];
  statusFilter: 'all' | PetStatus;
  typeFilter: 'all' | AnimalType;
  searchQuery: string;
  onSelectPet: (pet: Pet) => void;
  onMapClick: (lat: number, lng: number) => void;
  pendingPin: { lat: number; lng: number } | null;
  focusOn?: { lat: number; lng: number; id: number } | null;
  userLocation?: { lat: number; lng: number } | null;
}

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816]; // Microcentro, CABA

/** Escucha clicks en el mapa → callback. */
function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Recenta el mapa cuando focusOn cambia. */
function Recenter({ target }: { target?: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 15), {
      duration: 0.8,
    });
  }, [target, map]);
  return null;
}

/** Botón "Mi ubicación" — solo UI, llama geolocation del browser. */
function LocateButton() {
  const map = useMap();
  const handleClick = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización 😕');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const userIcon = L.divIcon({
          html: `
            <div style="width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.25);"></div>
          `,
          className: 'custom-marker',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        // Guardamos referencia para no acumular marcadores
        // @ts-expect-error: type personalizado
        if (map._userLocMarker) map.removeLayer(map._userLocMarker);
        // @ts-expect-error: type personalizado
        map._userLocMarker = L.marker([latitude, longitude], { icon: userIcon }).addTo(
          map
        );
        map.flyTo([latitude, longitude], 14, { duration: 0.8 });
      },
      () => alert('No pudimos obtener tu ubicación.')
    );
  };
  return (
    <button
      onClick={handleClick}
      className="absolute right-3 bottom-24 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-emerald shadow-lg ring-1 ring-slate-100 hover:bg-slate-50 transition"
      title="Mi ubicación"
      aria-label="Centrar en mi ubicación"
    >
      <LocateFixed className="h-5 w-5" />
    </button>
  );
}

export function MapView({
  pets,
  statusFilter,
  typeFilter,
  searchQuery,
  onSelectPet,
  onMapClick,
  pendingPin,
  focusOn,
  userLocation,
}: MapViewProps) {
  // Filtrado en cliente
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pets.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.breed.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [pets, statusFilter, typeFilter, searchQuery]);

  // Mantenemos instancia del map via ref
  const mapRef = useRef<L.Map | null>(null);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
        whenReady={() => {
          /* noop */
        }}
        ref={(instance) => {
          mapRef.current = instance;
        }}
      >
        {/* OpenStreetMap — tiles públicos gratis, sin API key */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <ClickHandler onMapClick={onMapClick} />
        <Recenter target={focusOn ?? null} />

        {filtered.map((pet) => (
          <PetMarker key={pet.id} pet={pet} onSelect={onSelectPet} />
        ))}

        {pendingPin && (
          <Marker
            position={[pendingPin.lat, pendingPin.lng]}
            icon={NEW_PIN_ICON}
            interactive={false}
          />
        )}

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={USER_LOC_ICON}
            interactive={false}
            zIndexOffset={999}
          />
        )}

        <LocateButton />
      </MapContainer>

      {/* Empty state: cuando no hay mascotas para mostrar */}
      {filtered.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center px-4">
          <div className="pointer-events-auto max-w-sm rounded-2xl bg-white/95 p-5 text-center shadow-xl ring-1 ring-slate-100 backdrop-blur">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-brand-emerald">
              <PawPrint className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-900">
              No hay mascotas reportadas
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {searchQuery.trim()
                ? 'Probá con otro nombre, raza o barrio en el buscador.'
                : 'Sé el primero en publicar. Tocá el mapa o el botón naranja "Publicar" arriba.'}
            </p>
          </div>
        </div>
      )}

      {/* Leyenda flotante */}
      <div className="absolute bottom-6 left-3 z-10 rounded-2xl bg-white/95 p-3 text-xs shadow-lg ring-1 ring-slate-100 backdrop-blur">
        <p className="mb-2 font-semibold text-slate-700">Estados</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: STATUS_COLOR.lost }}
            />
            <span className="text-slate-600">Perdido</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: STATUS_COLOR.spotted }}
            />
            <span className="text-slate-600">Avistado</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: STATUS_COLOR.found }}
            />
            <span className="text-slate-600">Encontrado</span>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-slate-400">Tip: tocá el mapa para publicar</p>
      </div>
    </div>
  );
}
