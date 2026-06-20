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

      {/* Banda decorativa azulejo — arcos finos + palmeta + gota colgante */}
      <div aria-hidden="true" style={{ marginTop: 20, lineHeight: 0 }}>
        <svg
          width="100%"
          height="62"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <defs>
            <pattern
              id="azulejo-band"
              x="0" y="0"
              width="38" height="56"
              patternUnits="userSpaceOnUse"
            >
              {/* Fondo azul liso */}
              <rect width="38" height="56" fill="#1d5e8c"/>

              {/* Arco fino superior (vértice arriba, cúspides en los bordes) */}
              <path
                d="M0,10 C6,8 14,3 19,2 C24,3 32,8 38,10"
                fill="none" stroke="#d6ab2f" strokeWidth="1.2"
              />
              {/* Puntos en las uniones de los arcos y en el vértice */}
              <circle cx="0" cy="10" r="1.6" fill="#d6ab2f"/>
              <circle cx="38" cy="10" r="1.6" fill="#d6ab2f"/>
              <circle cx="19" cy="1.4" r="1" fill="#d6ab2f"/>

              {/* Palmeta — abanico de pétalos radiados */}
              <g transform="translate(19,27)" fill="#d6ab2f">
                <path d="M0,0 C1.3,-5 1.3,-11 0,-15 C-1.3,-11 -1.3,-5 0,0 Z" transform="rotate(-48)"/>
                <path d="M0,0 C1.3,-5 1.3,-11 0,-15 C-1.3,-11 -1.3,-5 0,0 Z" transform="rotate(-32)"/>
                <path d="M0,0 C1.3,-5 1.3,-11 0,-15 C-1.3,-11 -1.3,-5 0,0 Z" transform="rotate(-16)"/>
                <path d="M0,0 C1.3,-5 1.3,-11 0,-15 C-1.3,-11 -1.3,-5 0,0 Z"/>
                <path d="M0,0 C1.3,-5 1.3,-11 0,-15 C-1.3,-11 -1.3,-5 0,0 Z" transform="rotate(16)"/>
                <path d="M0,0 C1.3,-5 1.3,-11 0,-15 C-1.3,-11 -1.3,-5 0,0 Z" transform="rotate(32)"/>
                <path d="M0,0 C1.3,-5 1.3,-11 0,-15 C-1.3,-11 -1.3,-5 0,0 Z" transform="rotate(48)"/>
              </g>

              {/* Base y gota colgante sólida */}
              <circle cx="19" cy="29" r="1.6" fill="#d6ab2f"/>
              <path
                d="M19,30 C14.8,38 14.8,46 19,47.5 C23.2,46 23.2,38 19,30 Z"
                fill="#d6ab2f"
              />
            </pattern>
          </defs>

          {/* Línea dorada superior */}
          <line x1="0" y1="2.5" x2="100%" y2="2.5" stroke="#d6ab2f" strokeWidth="2.5"/>
          {/* Relleno del patrón */}
          <rect x="0" y="4" width="100%" height="56" fill="url(#azulejo-band)"/>
          {/* Línea dorada inferior */}
          <line x1="0" y1="61" x2="100%" y2="61" stroke="#d6ab2f" strokeWidth="2.5"/>
        </svg>
      </div>
    </header>
  )
}
