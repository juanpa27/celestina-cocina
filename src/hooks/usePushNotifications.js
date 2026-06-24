import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window

  const [permission, setPermission] = useState(
    () => (supported ? Notification.permission : 'denied')
  )
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  // Verificar si ya hay suscripción activa
  useEffect(() => {
    if (!supported) return
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
    )
  }, [supported])

  async function subscribe() {
    if (!supported || !VAPID_KEY) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      })

      setPermission('granted')

      const subJson = sub.toJSON()

      // Evitar duplicados por endpoint
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .filter('subscription->>endpoint', 'eq', subJson.endpoint)
        .maybeSingle()

      if (!existing) {
        await supabase.from('push_subscriptions').insert({ subscription: subJson })
      }

      setSubscribed(true)
    } catch (err) {
      if (err.name === 'NotAllowedError') setPermission('denied')
      console.error('[push] subscribe error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        await supabase
          .from('push_subscriptions')
          .delete()
          .filter('subscription->>endpoint', 'eq', endpoint)
      }
      setSubscribed(false)
    } finally {
      setLoading(false)
    }
  }

  return { supported, permission, subscribed, loading, subscribe, unsubscribe }
}
