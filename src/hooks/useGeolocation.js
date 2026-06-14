import { useState, useCallback } from 'react'

export function useGeolocation() {
  const [state, setState] = useState({
    lat: null, lng: null, address: '', loading: false, error: null,
  })

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'Geolocalización no disponible en este dispositivo.' }))
      return
    }

    setState(s => ({ ...s, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
            { headers: { 'Accept-Language': 'es' } }
          )
          const data = await res.json()
          if (data.display_name) address = data.display_name
        } catch {
          // Nominatim falló; usamos las coordenadas como fallback
        }
        setState({ lat, lng, address, loading: false, error: null })
      },
      err => {
        const msgs = {
          1: 'Permiso de ubicación denegado.',
          2: 'No se pudo determinar la ubicación.',
          3: 'Tiempo de espera agotado.',
        }
        setState(s => ({ ...s, loading: false, error: msgs[err.code] ?? err.message }))
      },
      { timeout: 10000 }
    )
  }, [])

  return { ...state, getLocation }
}
