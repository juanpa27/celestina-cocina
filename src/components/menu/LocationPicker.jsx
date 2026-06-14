import { useState, useCallback, useRef } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { MapPin, Crosshair, Loader2 } from 'lucide-react'

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

export default function LocationPicker({ onConfirm, onCancel, initialAddress = '' }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? '',
  })

  const [pos, setPos] = useState(CAAGUAZU)
  const [address, setAddress] = useState(initialAddress)
  const [geocoding, setGeocoding] = useState(false)
  const [locating, setLocating] = useState(false)
  const mapRef = useRef(null)

  const onMapLoad = useCallback(map => { mapRef.current = map }, [])

  async function geocodePos(lat, lng) {
    setGeocoding(true)
    const addr = await reverseGeocode(lat, lng, apiKey)
    if (addr) setAddress(addr)
    setGeocoding(false)
  }

  function handleMapClick(e) {
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    setPos({ lat, lng })
    geocodePos(lat, lng)
  }

  function handleMarkerDrag(e) {
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    setPos({ lat, lng })
    geocodePos(lat, lng)
  }

  function handleMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const newPos = { lat: coords.latitude, lng: coords.longitude }
        setPos(newPos)
        mapRef.current?.panTo(newPos)
        mapRef.current?.setZoom(17)
        await geocodePos(newPos.lat, newPos.lng)
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  function handleConfirm() {
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
            center={pos}
            zoom={16}
            options={MAP_OPTIONS}
            onLoad={onMapLoad}
            onClick={handleMapClick}
          >
            <Marker
              position={pos}
              draggable
              onDragEnd={handleMarkerDrag}
            />
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: '#eaf3f8' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#1d5e8c' }} />
          </div>
        )}

        {/* Botón Mi ubicación encima del mapa */}
        <button
          type="button"
          onClick={handleMyLocation}
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

      <p className="text-[11px] text-center" style={{ color: '#7c8a93' }}>
        Tocá el mapa o arrastrá el pin para marcar tu puerta exacta
      </p>

      {/* Dirección resultante */}
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-3.5 flex-shrink-0" style={{ color: '#5b96bf' }} />
        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          rows={2}
          placeholder="Dirección detectada o escribila manualmente..."
          className="w-full border rounded-xl pl-8 pr-3 py-3 text-sm resize-none outline-none focus:ring-2"
          style={{ borderColor: '#dbe9f0', fontSize: '16px', fontFamily: 'inherit' }}
        />
        {geocoding && (
          <Loader2 size={13} className="absolute right-3 top-3.5 animate-spin" style={{ color: '#5b96bf' }} />
        )}
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
          disabled={!address}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: '#1d5e8c' }}
        >
          Usar esta dirección
        </button>
      </div>
    </div>
  )
}
