import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import AzulejoStrip from '../../components/ui/AzulejoStrip'

export default function LoginPage() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signInWithEmail(email, password)

    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
    }
    // Si no hay error, onAuthStateChange actualiza la sesión y AdminLayout redirige solo
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1c2b36' }}>
      <AzulejoStrip />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div
              className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4"
              style={{ border: '3px solid #f2c14e' }}
            >
              <img src="/logo-celestina.jpg" alt="Celestina Cocina" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-display font-bold text-2xl text-white">Celestina Cocina</h1>
            <p className="text-sm mt-1" style={{ color: '#5b96bf' }}>Panel de administración</p>
          </div>

          {/* Formulario */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 flex flex-col gap-4"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="hola@celestinacocina.com"
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2"
                style={{ borderColor: '#e5e7eb', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1d5e8c' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2"
                style={{ borderColor: '#e5e7eb', fontFamily: 'inherit' }}
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#1d5e8c' }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Ingresar
            </button>
          </form>
        </div>
      </div>

      <AzulejoStrip />
    </div>
  )
}
