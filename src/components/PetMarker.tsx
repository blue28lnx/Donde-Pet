import L from 'leaflet';
import { divIcon } from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import type { Pet } from '../types';
import { STATUS_BG, STATUS_COLOR, STATUS_LABELS, TYPE_EMOJI } from '../utils/format';

interface PetMarkerProps {
  pet: Pet;
  onSelect: (pet: Pet) => void;
}

/**
 * Crea un divIcon color según estado. Usamos un pin con forma de gota.
 */
function buildIcon(pet: Pet) {
  const color = STATUS_COLOR[pet.status];
  const emoji = TYPE_EMOJI[pet.type];
  const html = `
    <div class="pet-pin" style="position:relative;width:44px;height:54px;">
      <svg width="44" height="54" viewBox="0 0 44 54" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(15,23,42,0.25));">
        <path d="M22 0C9.85 0 0 9.85 0 22c0 14 18.4 30.5 21 31.7.6.3 1.4.3 2 0C25.6 52.5 44 36 44 22 44 9.85 34.15 0 22 0z" fill="${color}"/>
        <circle cx="22" cy="22" r="14" fill="white"/>
      </svg>
      <div style="position:absolute;top:11px;left:0;right:0;text-align:center;font-size:18px;line-height:1;">${emoji}</div>
    </div>
  `;
  return divIcon({
    html,
    className: 'custom-marker',
    iconSize: [44, 54],
    iconAnchor: [22, 54],
    popupAnchor: [0, -50],
  });
}

export function PetMarker({ pet, onSelect }: PetMarkerProps) {
  const icon = buildIcon(pet);
  return (
    <Marker
      position={[pet.lat, pet.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(pet),
      }}
    >
      <Popup>
        <div className="min-w-[180px]">
          <div className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${STATUS_BG[pet.status]}`}>
            {STATUS_LABELS[pet.status]}
          </div>
          <p className="text-sm font-bold text-slate-900">{pet.name}</p>
          <p className="text-xs text-slate-500">{pet.breed}</p>
        </div>
      </Popup>
    </Marker>
  );
}

// Necesario para que TS no marque a L como unused; algunas versiones lo requieren.
export const _L = L;
