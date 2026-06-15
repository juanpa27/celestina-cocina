import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { MapPin, Crosshair, Loader2 } from 'lucide-react'

// Solo se usa como centro VISUAL inicial del mapa. NUNCA como ubicación confirmable:
// el pedido exige una posición fijada por el cliente (GPS o toque explícito en el mapa).
const CAAGUAZU = { lat: -25.3652, lng: -56.0183 }

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: 'greedy',
  clickableIcons: false,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
}

async function reverseGeocode(lat, lng, apiKey) {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=es&key=${apiKey}`
    )
    const data = await res.json()
    return data.results?.[0]?.formatted_address ?? ''
  } catch {
    return ''
  }
}

export default function LocationPicker({ onConfirm, onCancel }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? '',
  })

  // pos === null ⇒ el cliente todavía NO fijó su ubicación. No hay pin ni se puede confirmar.
  const [pos, setPos] = useState(null)
  const [address, setAddress] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [locating, setLocating] = useState(false)
  const [gpsFailed, setGpsFailed] = useState(false)
  const mapRef = useRef(null)
  const autoGpsTried = useRef(false)

  const onMapLoad = useCallback(map => { mapRef.current = map }, [])

  const geocodePos = useCallback(async (lat, lng) => {
    setGeocoding(true)
    const addr = await reverseGeocode(lat, lng, apiKey)
    // delivery_address no puede quedar vacío: si el reverse geocode falla, usamos las coordenadas.
    setAddress(addr || `Ubicación marcada (${lat.toFixed(5)}, ${lng.toFixed(5)})`)
    setGeocoding(false)
  }, [apiKey])

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) { setGpsFailed(true); return }
    setLocating(true)
    setGpsFailed(false)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const newPos = { lat: coords.latitude, lng: coords.longitude }
        setPos(newPos)
        mapRef.current?.panTo(newPos)
        mapRef.current?.setZoom(17)
        await geocodePos(newPos.lat, newPos.lng)
        setLocating(false)
      },
      () => { setLocating(false); setGpsFailed(true) },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [geocodePos])

  // Al abrir el mapa, intentamos el GPS automáticamente una sola vez.
  useEffect(() => {
    if (isLoaded && !autoGpsTried.current) {
      autoGpsTried.current = true
      locateMe()
    }
  }, [isLoaded, locateMe])

  function setFromMap(lat, lng) {
    setPos({ lat, lng })
    setGpsFailed(false)
    geocodePos(lat, lng)
  }

  function handleConfirm() {
    if (!pos) return
    onConfirm({ lat: pos.lat, lng: pos.lng, address })
  }

  if (!apiKey) {
    return (
      <div className="rounded-xl p-3 text-xs text-center" style={{ background: '#fef9c3', color: '#854d0e' }}>
        Configurá <code>VITE_GOOGLE_MAPS_API_KEY</code> en el <code>.env</code> para activar el mapa.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Mapa */}
      <div className="rounded-2xl overflow-hidden relative" style={{ height: 230 }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={pos ?? CAAGUAZU}
            zoom={pos ? 17 : 14}
            options={MAP_OPTIONS}
            onLoad={onMapLoad}
            onClick={e => setFromMap(e.latLng.lat(), e.latLng.lng())}
          >
            {pos && (
              <Marker
                position={pos}
                draggable
                onDragEnd={e => setFromMap(e.latLng.lat(), e.latLng.lng())}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: '#eaf3f8' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#1d5e8c' }} />
          </div>
        )}

        {/* Botón Mi ubicación encima del mapa */}
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-lg disabled:opacity-60"
          style={{ background: '#fff', color: '#1d5e8c', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        >
          {locating
            ? <Loader2 size={13} className="animate-spin" />
            : <Crosshair size={13} />}
          Mi ubicación
        </button>
      </div>

      {/* Estado / instrucción según haya o no posición fijada */}
      {!pos ? (
        <p className="text-[11px] text-center font-semibold" style={{ color: gpsFailed ? '#b45309' : '#1d5e8c' }}>
          {locating
            ? 'Obteniendo tu ubicación…'
            : gpsFailed
              ? 'No pudimos obtener tu GPS. Tocá el mapa para marcar tu casa.'
              : 'Permití el acceso a tu ubicación o tocá el mapa para marcar tu casa.'}
        </p>
      ) : (
        <p className="text-[11px] text-center" style={{ color: '#7c8a93' }}>
          Arrastrá el pin o tocá el mapa para ajustar tu puerta exacta
        </p>
      )}

      {/* Dirección detectada (solo lectura — viene del mapa, no se escribe a mano) */}
      <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: '#eaf3f8' }}>
        <MapPin size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#5b96bf' }} />
        <p className="text-sm flex-1 min-w-0" style={{ color: pos ? '#1c2b36' : '#7c8a93' }}>
          {geocoding
            ? 'Detectando dirección…'
            : pos
              ? address
              : 'Tu dirección aparecerá acá al marcar tu ubicación.'}
        </p>
        {geocoding && <Loader2 size={13} className="animate-spin flex-shrink-0 mt-0.5" style={{ color: '#5b96bf' }} />}
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-sm font-bold border"
          style={{ borderColor: '#dbe9f0', color: '#7c8a93' }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!pos || geocoding}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: '#1d5e8c' }}
        >
          Usar esta dirección
        </button>
      </div>
    </div>
  )
}
