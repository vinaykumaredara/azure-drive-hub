import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // Handle rollup optional dependencies issue
    deps: {
      optimizer: {
        web: {
          enabled: false
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // Add rollup options to handle optional dependencies
  build: {
    rollupOptions: {
      external: []
    }
  }
})