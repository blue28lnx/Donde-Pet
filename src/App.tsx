import { useEffect, useMemo, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PetsProvider, usePets } from './context/PetsContext';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { Filters } from './components/Filters';
import { PetDrawer } from './components/PetDrawer';
import { ReportForm } from './components/ReportForm';
import { ChatDrawer } from './components/ChatDrawer';
import { LoginModal } from './components/LoginModal';
import type { AnimalType, Pet, PetStatus } from './types';

function Shell() {
  const { user } = useAuth();
  const { pets } = usePets();

  const [statusFilter, setStatusFilter] = useState<'all' | PetStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | AnimalType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [chatPet, setChatPet] = useState<Pet | null>(null);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [showReport, setShowReport] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginMsg, setLoginMsg] = useState<string | undefined>();
  const [focusOn, setFocusOn] = useState<{ lat: number; lng: number; id: number } | null>(null);

  // 📍 Geolocalización del usuario: se pide una vez al cargar.
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locStatus, setLocStatus] = useState<'idle' | 'asking' | 'granted' | 'denied'>(
    'idle'
  );

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocStatus('denied');
      return;
    }
    setLocStatus('asking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('granted');
      },
      () => setLocStatus('denied'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  }, []);

  // Apenas conseguimos la ubicación, centramos el mapa ahí (solo la primera vez).
  useEffect(() => {
    if (userLocation && focusOn === null) {
      setFocusOn({
        lat: userLocation.lat,
        lng: userLocation.lng,
        id: Date.now(),
      });
    }
  }, [userLocation, focusOn]);

  // Conteos por estado (sobre todos los pets, no filtrado)
  const counts = useMemo(() => {
    const c = { all: pets.length, lost: 0, found: 0, spotted: 0 };
    for (const p of pets) c[p.status]++;
    return c;
  }, [pets]);

  // Cuando el usuario publica, abrir formulario con coords pendientes
  const requestPublish = () => {
    if (!user) {
      setLoginMsg('Necesitás iniciar sesión para publicar una mascota 🐾');
      setShowLogin(true);
      return;
    }
    setShowReport(true);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPendingPin({ lat, lng });
    requestPublish();
  };

  const handleSavedPet = (pet: Pet) => {
    setShowReport(false);
    setPendingPin(null);
    setEditingPet(null);
    setSelectedPet(pet);
    setFocusOn({ lat: pet.lat, lng: pet.lng, id: Date.now() });
  };

  const handleSelectPet = (pet: Pet) => {
    setSelectedPet(pet);
  };

  const openChatWith = (pet: Pet) => {
    if (!user) {
      setLoginMsg('Iniciá sesión para contactar al dueño 💬');
      setShowLogin(true);
      return;
    }
    setSelectedPet(null);
    setChatPet(pet);
  };

  const startEdit = (pet: Pet) => {
    setSelectedPet(null);
    setEditingPet(pet);
    setShowReport(true);
  };

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <Navbar
        onPublish={requestPublish}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="relative flex-1">
        <MapView
          pets={pets}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          searchQuery={searchQuery}
          onSelectPet={handleSelectPet}
          onMapClick={handleMapClick}
          pendingPin={pendingPin && showReport ? pendingPin : null}
          focusOn={focusOn}
          userLocation={locStatus === 'granted' ? userLocation : null}
        />

        <Filters
          status={statusFilter}
          type={typeFilter}
          onStatusChange={setStatusFilter}
          onTypeChange={setTypeFilter}
          counts={counts}
        />

        {/* Toast sutil cuando se está pidiendo / se negó el permiso */}
        {locStatus === 'asking' && (
          <div className="pointer-events-none absolute left-1/2 bottom-6 z-30 -translate-x-1/2 rounded-full bg-slate-900/85 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur">
            📍 Pidiendo tu ubicación…
          </div>
        )}
        {locStatus === 'denied' && (
          <div className="pointer-events-none absolute left-1/2 bottom-6 z-30 -translate-x-1/2 rounded-full bg-amber-500/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur">
            No pudimos obtener tu ubicación. Habilitá los permisos del sitio 📍
          </div>
        )}
      </main>

      {/* Drawers y modales */}
      {selectedPet && (
        <PetDrawer
          pet={selectedPet}
          onClose={() => setSelectedPet(null)}
          onOpenChat={openChatWith}
          onEdit={startEdit}
        />
      )}

      {showReport && (
        <ReportForm
          pendingLocation={pendingPin}
          editPet={editingPet}
          onClose={() => {
            setShowReport(false);
            setEditingPet(null);
            setPendingPin(null);
          }}
          onSaved={handleSavedPet}
        />
      )}

      {chatPet && (
        <ChatDrawer pet={chatPet} onClose={() => setChatPet(null)} />
      )}

      <LoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        message={loginMsg}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PetsProvider>
        <Shell />
      </PetsProvider>
    </AuthProvider>
  );
}
