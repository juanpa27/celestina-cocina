import { Font } from '@react-pdf/renderer'

// Registro de fuentes compartido por todos los documentos react-pdf del admin
// (Carta PDF, Reporte de ventas). Efecto de módulo: importar alcanza para registrar.
Font.register({
  family: 'Fraunces',
  fonts: [
    { src: '/fonts/fraunces-600.ttf', fontWeight: 600 },
    { src: '/fonts/fraunces-700.ttf', fontWeight: 700 },
  ],
})
Font.register({
  family: 'DM Sans',
  fonts: [
    { src: '/fonts/dmsans-400.ttf', fontWeight: 400 },
    { src: '/fonts/dmsans-500.ttf', fontWeight: 500 },
    { src: '/fonts/dmsans-700.ttf', fontWeight: 700 },
  ],
})

// Sin hifenación — nombres de platos/clientes no deben cortarse
Font.registerHyphenationCallback(word => [word])
