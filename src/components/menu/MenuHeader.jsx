import { motion } from 'framer-motion'
import { BUSINESS_NAME, BUSINESS_SUBTITLE } from '../../lib/config'


export default function MenuHeader() {
  return (
    <header
      className="relative text-white text-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #091c2e 0%, #1a5480 50%, #1d5e8c 80%)',
        paddingTop: 32,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 0,
      }}
    >
      {/* Logo */}
      <motion.div
        className="relative z-10 mx-auto mb-2 rounded-full overflow-hidden"
        style={{
          width: 112, height: 112,
          border: '2.5px solid #c9a020',
          boxShadow: '0 0 0 5px rgba(201,160,32,0.25), 0 6px 28px rgba(0,0,0,0.45)',
        }}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <img src="/logo_v2.jpeg" alt="Celestina Cocina" className="w-full h-full object-cover" />
      </motion.div>

      <motion.h1
        className="relative z-10 font-display font-bold leading-tight"
        style={{ fontSize: 'clamp(26px, 6vw, 38px)', letterSpacing: '.5px' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        {BUSINESS_NAME}
      </motion.h1>

      <motion.p
        className="relative z-10 mt-1 text-sm uppercase tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        {BUSINESS_SUBTITLE}
      </motion.p>

      {/* Banda decorativa azulejo — diamantes + líneas + puntos */}
      <div aria-hidden="true" style={{ marginTop: 20, marginLeft: -20, marginRight: -20, lineHeight: 0 }}>
        <svg width="100%" height="44" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <defs>
            <pattern id="tile" x="0" y="0" width="44" height="40" patternUnits="userSpaceOnUse">
              {/* Fondo azul */}
              <rect width="44" height="40" fill="#1d5e8c"/>
              {/* Líneas horizontales conectando diamantes */}
              <line x1="0"  y1="20" x2="9"  y2="20" stroke="#f2c14e" strokeWidth="1.4"/>
              <line x1="35" y1="20" x2="44" y2="20" stroke="#f2c14e" strokeWidth="1.4"/>
              {/* Diamante exterior */}
              <path d="M22,4 L36,20 L22,36 L8,20 Z" fill="#1d5e8c" stroke="#f2c14e" strokeWidth="1.6"/>
              {/* Diamante interior */}
              <path d="M22,11 L30,20 L22,29 L14,20 Z" fill="#f2c14e" opacity="0.18" stroke="#f2c14e" strokeWidth="1"/>
              {/* Punto central */}
              <circle cx="22" cy="20" r="3" fill="#f2c14e"/>
              {/* Puntos en los vértices del diamante */}
              <circle cx="22" cy="4"  r="2" fill="#f2c14e"/>
              <circle cx="36" cy="20" r="2" fill="#f2c14e"/>
              <circle cx="22" cy="36" r="2" fill="#f2c14e"/>
              <circle cx="8"  cy="20" r="2" fill="#f2c14e"/>
            </pattern>
          </defs>
          {/* Línea dorada superior */}
          <line x1="0" y1="1.5" x2="100%" y2="1.5" stroke="#f2c14e" strokeWidth="2.5"/>
          {/* Relleno del patrón */}
          <rect x="0" y="4" width="100%" height="36" fill="url(#tile)"/>
          {/* Línea dorada inferior */}
          <line x1="0" y1="42.5" x2="100%" y2="42.5" stroke="#f2c14e" strokeWidth="2.5"/>
        </svg>
      </div>
    </header>
  )
}
