import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  server: {
    allowedHosts: ['dongavo.duckdns.org', 'otro-host.com'], // Agrega tus hosts permitidos aquí
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['__tests__/**/*.test.js'],
    exclude: ['e2e/**', 'node_modules/**'],
    setupFiles: ['__tests__/setup.js'],
  },
})