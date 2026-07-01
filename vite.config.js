import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,           // se gestiona en public/manifest.json
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,webp,woff2,svg}'],
        // El recorte de fondo (flyer "Texto + foto") arrastra onnxruntime-web
        // (~800KB) — nadie lo usa en el 99% de las sesiones, así que no debe
        // precachearse con el resto del admin. Se sigue bajando normal la
        // primera vez que alguien lo usa (fetch a demanda, sin SW de por medio).
        globIgnores: ['**/bg-removal-*.js'],
      },
      // No activar el SW en desarrollo para no interferir con HMR
      devOptions: { enabled: false },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@imgly/background-removal') || id.includes('onnxruntime')) {
            return 'bg-removal'
          }
        },
      },
    },
  },
})
