import { motion } from 'framer-motion'
import AzulejoStrip from '../ui/AzulejoStrip'
import { BUSINESS_NAME, BUSINESS_SUBTITLE } from '../../lib/config'

export default function MenuHeader() {
  return (
    <>
      <header
        className="relative text-white text-center overflow-hidden"
        style={{ background: '#1d5e8c', padding: '28px 20px 70px' }}
      >
        {/* Patrón decorativo izquierda */}
        <div
          className="absolute opacity-50 pointer-events-none"
          style={{
            top: -50, left: -50, width: 140, height: 140,
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent 0 8px, rgba(255,255,255,0.06) 8px 16px), radial-gradient(circle at 30% 30%, #f2c14e 0 14px, transparent 15px)',
          }}
        />
        <div
          className="absolute opacity-50 pointer-events-none"
          style={{
            bottom: -60, right: -40, width: 140, height: 140,
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent 0 8px, rgba(255,255,255,0.06) 8px 16px), radial-gradient(circle at 30% 30%, #f2c14e 0 14px, transparent 15px)',
          }}
        />

        {/* Logo */}
        <motion.div
          className="relative z-10 mx-auto mb-3 rounded-full overflow-hidden"
          style={{ width: 96, height: 96, border: '3px solid #f2c14e' }}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        >
          <img src="/logo-celestina.jpg" alt="Celestina Cocina" className="w-full h-full object-cover" />
        </motion.div>

        <motion.h1
          className="relative z-10 font-display font-bold leading-tight"
          style={{ fontSize: 'clamp(28px, 6vw, 42px)', letterSpacing: '.5px' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          {BUSINESS_NAME}
        </motion.h1>
        <motion.p
          className="relative z-10 mt-1.5 text-sm uppercase tracking-widest"
          style={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {BUSINESS_SUBTITLE}
        </motion.p>
      </header>

      <AzulejoStrip />
    </>
  )
}
