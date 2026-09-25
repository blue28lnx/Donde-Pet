import { useEffect, useState } from 'react';
import {
  X,
  Upload,
  MapPin,
  Camera,
  AlertCircle,
  Eye,
  Search,
  CheckCircle2,
} from 'lucide-react';
import type { AnimalType, Pet, PetStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePets } from '../context/PetsContext';
import { STATUS_BG, STATUS_LABELS, TYPE_LABELS } from '../utils/format';

interface ReportFormProps {
  pendingLocation: { lat: number; lng: number } | null;
  editPet?: Pet | null;
  onClose: () => void;
  onSaved: (newPet: Pet) => void;
}

const PHOTO_SUGGESTIONS = [
  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=70',
];

const compressImage = (
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  maxSizeKB = 600
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('No se pudo leer la imagen.'));
    };

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('No se pudo procesar la imagen.'));
      };

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Reducir dimensiones manteniendo proporción
        const scale = Math.min(
          1,
          maxWidth / width,
          maxHeight / height
        );

        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('No se pudo crear el canvas.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Empezamos con buena calidad
        let quality = 0.82;

        const compress = () => {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);

          // Calculamos aproximadamente el tamaño real del Base64
          const base64 = dataUrl.split(',')[1];
          const sizeBytes = Math.ceil((base64.length * 3) / 4);
          const sizeKB = sizeBytes / 1024;

          // Si entra dentro del límite, terminamos
          if (sizeKB <= maxSizeKB || quality <= 0.4) {
            resolve(dataUrl);
            return;
          }

          // Bajamos calidad progresivamente
          quality -= 0.08;
          compress();
        };

        compress();
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
};

export function ReportForm({
  pendingLocation,
  editPet,
  onClose,
  onSaved,
}: ReportFormProps) {
  const { user } = useAuth();
  const { addPet, updatePet } = usePets();
  const isEdit = !!editPet;

  const [name, setName] = useState(editPet?.name ?? '');
  const [type, setType] = useState<AnimalType>(editPet?.type ?? 'dog');
  const [breed, setBreed] = useState(editPet?.breed ?? '');
  const [status, setStatus] = useState<PetStatus>(editPet?.status ?? 'lost');
  const [photo, setPhoto] = useState(editPet?.photo ?? '');
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const [dateTime, setDateTime] = useState(
    editPet?.dateTime ?? new Date().toISOString().slice(0, 16)
  );
  const [description, setDescription] = useState(editPet?.description ?? '');
  const [contact, setContact] = useState(editPet?.contact ?? '');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    editPet
      ? { lat: editPet.lat, lng: editPet.lng }
      : pendingLocation
  );
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);

  // Bloquear scroll mientras está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleFile = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  try {
    setError(null);
    setPhotoError(false);

    // Verificar que realmente sea una imagen
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo seleccionado no es una imagen.');
    }

    // Comprimir y convertir a JPEG
    const compressedImage = await compressImage(file);

    // Guardamos la imagen comprimida
    setPhotoFile(compressedImage);

    // La usamos también como preview
    setPhoto(compressedImage);

    console.log(
      '[Image] Imagen comprimida:',
      Math.round((compressedImage.length * 3) / 4 / 1024),
      'KB aproximadamente'
    );
  } catch (err) {
    console.error('[Image] Error:', err);

    setPhotoFile(null);
    setPhotoError(true);

    setError(
      err instanceof Error
        ? err.message
        : 'No se pudo procesar la imagen.'
    );
  }
};

  const useMockPhoto = (url: string) => {
    setPhoto(url);
    setPhotoFile(null);
    setPhotoError(false);
  };

  const handleSave = async () => {
    setError(null);
    if (!user) {
      setError('Necesitás iniciar sesión para publicar.');
      return;
    }
    if (!name.trim() || !breed.trim() || !description.trim() || !photo.trim()) {
      setError('Completá nombre, raza, descripción y foto.');
      return;
    }
    if (!coords) {
      setError('Elegí una ubicación (click en el mapa o "Usar mi ubicación").');
      return;
    }

    if (isEdit && editPet) {
      try {
        await updatePet(editPet.id, {
          name,
          type,
          breed,
          status,
          photo,
          dateTime,
          description,
          contact: contact || undefined,
          lat: coords.lat,
          lng: coords.lng,
          resolvedAt:
            status === 'found' ? editPet.resolvedAt ?? Date.now() : undefined,
        });
        onSaved({ ...editPet, name, type, breed, status, photo, dateTime, description, contact, lat: coords.lat, lng: coords.lng });
      } catch (err: any) {
        console.error('[Publish] error:', err);
        const code = err?.code ?? '';
        if (code.includes('permission') || code === 'permission-denied') {
          setError('Permisos insuficientes. Verificá que estés autenticado y que las reglas de Firestore estén publicadas.');
        } else if (code === 'unauthenticated') {
          setError('Tu sesión expiró. Cerrá sesión y volvé a iniciar con Google.');
        } else {
          setError(`No se pudo guardar: ${err?.message ?? 'error desconocido'}`);
        }
      }
      return;
    }

    try {
      const created = await addPet(
      {
        name,
        type,
        breed,
        status,
        photo,
        lat: coords.lat,
        lng: coords.lng,
        dateTime,
        description,
        contact: contact || undefined,
      },
      {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      }
    );
      onSaved(created);
    } catch (err: any) {
      console.error('[Publish] error:', err);
      const code = err?.code ?? '';
      if (code.includes('permission') || code === 'permission-denied') {
        setError('Permisos insuficientes. Verificá que estés autenticado y que las reglas de Firestore estén publicadas.');
      } else if (code === 'unauthenticated') {
        setError('Tu sesión expiró. Cerrá sesión y volvé a iniciar con Google.');
      } else {
        setError(`No se pudo publicar: ${err?.message ?? 'error desconocido'}`);
      }
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización 😕');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => alert('No pudimos obtener tu ubicación.')
    );
  };

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
        <div className="relative flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-100 sm:rounded-3xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {isEdit ? 'Editar reporte' : 'Publicar mascota'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? 'Modificá los datos del reporte.'
                  : 'Ayudá a que vuelva a casa 🐾'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body scrolleable */}
          <div className="pet-scroll flex-1 overflow-y-auto px-5 py-4">
            {/* Foto */}
            <div className="mb-5">
              <p className="label mb-2">Foto</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 sm:w-44">
                  {photo && !photoError ? (
                    <img
                      src={photo}
                      alt="preview"
                      onError={() => setPhotoError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                      <Camera className="h-6 w-6" />
                      <p className="mt-1 text-[11px]">Sin foto</p>
                    </div>
                  )}
                  <label className="absolute inset-0 flex cursor-pointer items-end justify-end bg-gradient-to-t from-black/40 to-transparent p-2 text-[11px] font-semibold text-white opacity-0 hover:opacity-100 transition">
                    <Upload className="mr-1 h-3 w-3" /> Subir
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFile}
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <input
                    type="url"
                    value={photoFile ? '' : photo}
                    onChange={(e) => {
                      setPhoto(e.target.value);
                      setPhotoFile(null);
                      setPhotoError(false);
                    }}
                    placeholder="https://... (o subí archivo)"
                    className="input"
                  />
                  <p className="mt-2 text-[11px] text-slate-500">Sugerencias:</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {PHOTO_SUGGESTIONS.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => useMockPhoto(url)}
                        className="h-12 w-12 overflow-hidden rounded-lg ring-1 ring-slate-200 hover:ring-brand-emerald transition"
                      >
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Nombre + Tipo */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <p className="label mb-1.5">Nombre</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Milo"
                  className="input"
                />
              </div>
              <div>
                <p className="label mb-1.5">Tipo</p>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AnimalType)}
                  className="input"
                >
                  <option value="dog">{TYPE_LABELS.dog}</option>
                  <option value="cat">{TYPE_LABELS.cat}</option>
                  <option value="other">{TYPE_LABELS.other}</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <p className="label mb-1.5">Raza / características</p>
              <input
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="Ej: Caniche toy color crema"
                className="input"
              />
            </div>

            {/* Estado */}
            <div className="mb-4">
              <p className="label mb-1.5">Estado</p>
              <div className="grid grid-cols-3 gap-2">
                {(['lost', 'spotted', 'found'] as PetStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    type="button"
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold ring-1 transition ${
                      status === s
                        ? STATUS_BG[s].replace('bg-', 'bg-white ring-2 ring-')
                        : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s === 'lost' && <AlertCircle className="h-3.5 w-3.5" />}
                    {s === 'spotted' && <Eye className="h-3.5 w-3.5" />}
                    {s === 'found' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Fecha y contacto */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="label mb-1.5">Fecha y hora aprox.</p>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <p className="label mb-1.5">Contacto (opcional)</p>
                <input
                  type="tel"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+54 11 ..."
                  className="input"
                />
              </div>
            </div>

            <div className="mb-4">
              <p className="label mb-1.5">Descripción detallada</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Collar, señas particulares, último lugar visto…"
                className="input resize-none"
              />
            </div>

            {/* Ubicación */}
            <div className="mb-5">
              <p className="label mb-1.5">Ubicación</p>
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <MapPin className="h-4 w-4 text-brand-orange" />
                {coords ? (
                  <span className="font-mono text-sm text-slate-700">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">
                    Hacé click en el mapa primero 📍
                  </span>
                )}
                <button
                  type="button"
                  onClick={useMyLocation}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-emerald ring-1 ring-brand-emerald-light hover:bg-emerald-50"
                >
                  <Search className="h-3 w-3" />
                  Usar mi ubicación
                </button>
              </div>
              {!coords && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Cerrá este formulario, hacé click sobre el mapa y volvé a abrirlo.
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
            <button onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={handleSave} className="btn-primary">
              <CheckCircle2 className="h-4 w-4" />
              {isEdit ? 'Guardar cambios' : 'Publicar reporte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
