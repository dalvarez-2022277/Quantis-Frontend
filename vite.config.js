import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8')
)

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    react(),
  ],
  server: {
    port: 5173,
    host: true, // permite acceder desde LAN o túneles
  },
  define: {
    global: 'globalThis', // evita errores con librerías que usan "global"
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // puedes poner true si necesitas depurar
  }
})
