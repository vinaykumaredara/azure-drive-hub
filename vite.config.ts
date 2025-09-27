import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost", // Use localhost for better WebSocket stability
    port: 5173,
    strictPort: true, // Force port 5173 to avoid confusion
    cors: true,
    hmr: {
      port: 5173,
      overlay: true,
      clientPort: 5173
    },
    open: false,
    watch: {
      usePolling: true, // Use polling for better file watching on Windows
      interval: 300,
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    fs: {
      strict: false
    },
    // Disable service worker in development
    middlewareMode: false
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: mode === 'development',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['lucide-react', 'framer-motion'],
          supabase: ['@supabase/supabase-js'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
    // Enable gzip compression
    brotliSize: true,
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      '@tanstack/react-query',
      'lucide-react',
      'framer-motion'
    ],
    force: mode === 'development', // Force re-optimization in dev
  },
}));
