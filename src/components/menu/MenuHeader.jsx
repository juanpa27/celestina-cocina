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

      {/* Banda decorativa azulejo — arcos ojivales con flor de lis */}
      <div aria-hidden="true" style={{ marginTop: 20, lineHeight: 0 }}>
        <svg
          width="100%"
          height="68"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <defs>
            <pattern
              id="azulejo-band"
              x="0" y="0"
              width="46" height="60"
              patternUnits="userSpaceOnUse"
            >
              {/* Fondo azulejo con sombra superior */}
              <rect width="46" height="60" fill="#1d5e8c"/>
              <rect width="46" height="14" fill="#184e74"/>

              {/* Arco ojival exterior (tipo cebolla, vértice al centro) */}
              <path
                d="M0,22 C2,10 18,16 23,6 C28,16 44,10 46,22"
                fill="none" stroke="#d6ab2f" strokeWidth="1.8"
              />
              {/* Arco interior */}
              <path
                d="M0,25 C4,13 18,19 23,11 C28,19 42,13 46,25"
                fill="none" stroke="#d6ab2f" strokeWidth="0.8" opacity="0.8"
              />

              {/* Rombo dorado en el vértice */}
              <path d="M23,1 L25.4,5 L23,9 L20.6,5 Z" fill="#f2c14e"/>
              {/* Puntos donde se encuentran los arcos */}
              <circle cx="0" cy="22" r="1.6" fill="#d6ab2f"/>
              <circle cx="46" cy="22" r="1.6" fill="#d6ab2f"/>

              {/* Flor de lis centrada en la celda */}
              <g transform="translate(23,34)" fill="#d6ab2f">
                {/* Pétalo central superior */}
                <path d="M0,-18 C3.2,-12.5 3.2,-6.5 1.4,-3 L-1.4,-3 C-3.2,-6.5 -3.2,-12.5 0,-18 Z"/>
                {/* Pétalo lateral izquierdo */}
                <path d="M-1.5,-3.5 C-4.5,-9 -9,-13 -11,-8.5 C-12.2,-4.5 -8,-1.5 -2,-2 Z"/>
                {/* Pétalo lateral derecho */}
                <path d="M1.5,-3.5 C4.5,-9 9,-13 11,-8.5 C12.2,-4.5 8,-1.5 2,-2 Z"/>
                {/* Banda horizontal (lazo) */}
                <path d="M-10,-2.4 L10,-2.4 L10,1.6 L-10,1.6 Z"/>
                {/* Cuerpo inferior que se abre */}
                <path d="M-2,2 C-6.5,8 -9,15.5 -3.5,17.5 C-1,18.4 1,18.4 3.5,17.5 C9,15.5 6.5,8 2,2 Z"/>
                {/* Acento brillante central */}
                <path d="M0,-14.5 C1.8,-11 1.8,-6.5 0,-4.5 C-1.8,-6.5 -1.8,-11 0,-14.5 Z" fill="#f2c14e"/>
              </g>
            </pattern>
          </defs>

          {/* Línea dorada superior */}
          <line x1="0" y1="2.5" x2="100%" y2="2.5" stroke="#d6ab2f" strokeWidth="2.5"/>
          {/* Relleno del patrón */}
          <rect x="0" y="4" width="100%" height="60" fill="url(#azulejo-band)"/>
          {/* Línea dorada inferior */}
          <line x1="0" y1="65.5" x2="100%" y2="65.5" stroke="#d6ab2f" strokeWidth="2.5"/>
        </svg>
      </div>
    </header>
  )
}
