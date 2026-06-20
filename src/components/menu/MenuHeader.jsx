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

      {/* Banda decorativa azulejo — patrón de escamas/ojivas (radial-gradient) */}
      <div
        aria-hidden="true"
        style={{
          marginTop: 20,
          marginLeft: -20,
          marginRight: -20,
          height: 80,
          '--s': '40px',
          '--c1': '#f2c14e',
          '--c2': '#1d5e8c',
          '--_g': '#0000 83%,var(--c1) 85% 99%,#0000 101%',
          background:
            'radial-gradient(27% 29% at right ,var(--_g)) calc(var(--s)/ 2) calc(var(--s)*1.5),' +
            'radial-gradient(27% 29% at left  ,var(--_g)) calc(var(--s)/-2) calc(var(--s)*1.5),' +
            'radial-gradient(29% 27% at top   ,var(--_g)) 0 var(--s),' +
            'radial-gradient(29% 27% at bottom,var(--_g)) 0 0 ' +
            'var(--c2)',
          backgroundSize: 'calc(2*var(--s)) calc(2*var(--s))',
        }}
      />
    </header>
  )
}
