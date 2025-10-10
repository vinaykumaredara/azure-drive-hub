import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/', // Add base path for production deployment
  server: {
    host: 'localhost',
    port: 8080,
    strictPort: true,
    cors: true,
    hmr: {
      port: 8080,
      overlay: true,
      clientPort: 8080,
    },
    open: false,
    watch: {
      usePolling: true, // Use polling for better file watching on Windows
      interval: 300,
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
    fs: {
      strict: false,
    },
    // Disable service worker in development
    middlewareMode: false,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Bundle analyzer for production builds
    mode === 'production' &&
      visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    minify: true,
    // Using default minification settings to avoid build issues
    sourcemap: mode === 'development',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Handle optional dependencies issue in CI environments
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['lucide-react', 'framer-motion'],
          supabase: ['@supabase/supabase-js'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
        // Optimize output for better caching
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
    // Enable gzip compression
    brotliSize: true,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Enable CSS minification
    cssMinify: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
      'framer-motion',
    ],
    force: mode === 'development', // Force re-optimization in dev
    // Enable esbuild optimization
    esbuildOptions: {
      // Enable tree-shaking
      treeShaking: true,
      // Minify in development for better performance
      minify: mode === 'development',
      // Target modern browsers
      target: 'es2020',
    },
  },
  // Enable caching
  cacheDir: 'node_modules/.vite',
  // Enable worker support
  worker: {
    format: 'es',
    plugins: () => [react()],
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
}));
