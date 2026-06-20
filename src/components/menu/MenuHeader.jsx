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

      {/* Banda azulejo — mismo patrón que el footer */}
      <div
        aria-hidden="true"
        style={{
          marginTop: 20,
          marginLeft: -20,
          marginRight: -20,
          height: 14,
          background: 'repeating-linear-gradient(90deg, #1d5e8c 0 28px, #f2c14e 28px 32px, #5b96bf 32px 60px, #f2c14e 60px 64px)',
        }}
      />
    </header>
  )
}
