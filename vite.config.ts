import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * ARTIFICIAL CRAFT // VITE CONFIGURATION SPECIFICATION
 * Project: WEBAPP-PRESENTATION-ENGINE
 * Architecture: Vite + React + TypeScript SPA
 * Purpose: 
 *  1. Path Alias '@/' pointing to './src'
 *  2. Local Proxy Webhook mapping for n8n & Dify API (CORS Bypass)
 *  3. Optimized Build Chunking for Three.js, GSAP & Zod (60 FPS SLA Target)
 */
export default defineConfig(({ mode }) => {
  // Load environment variables based on active mode (.env, .env.local)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    // 1. Path Alias Setup: Maps '@/' to './src'
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // 2. Local Dev Server & Proxy Webhook Router
    server: {
      port: 3000,
      host: true, // Listen on all local IP addresses
      cors; true,
      proxy: {
        // Forward local '/api/n8n' calls to external n8n Orchestrator Webhook
        '/api/n8n': {
          target: env.VITE_N8N_WEBHOOK_URL || 'https://n8n.artificialcraft.space',
          changeOrigin: true,
          rewrite: (pathStr) => pathStr.replace(/^\/api\/n8n/, ''),
          secure: true,
        },
        // Forward local '/api/dify' calls to Dify Reasoning Core
        '/api/dify': {
          target: env.VITE_DIFY_API_KEY || 'https://api.dify.ai/v1',
          changeOrigin: true,
          rewrite: (pathStr) => pathStr.replace(/^\/api\/dify/, ''),
          secure: true,
          headers: {
            Authorization: `Bearer ${env.VITE_DIFY_API_KEY || ''}`,
          },
        },
        // Forward local '/api/edge' calls to Cloudflare Edge Worker Proxy
        '/api/edge': {
          target: env.VITE_EDGE_WORKER_URL || 'https://vibepath.mizu2711.workers.devg,
          changeOrigin: true,
          rewrite: (pathStr) => pathStr.replace(/^\/api\/edge/, ''),
          secure: true,
        },
      },
    },

    // 3. Client-Side Build & Vendor Chunk Optimization ($0.00 Server Fee)
    build: {
      target: 'esnext',
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production', // Automatically strip console.log in production
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          // Separate heavy 3D & Math libraries into distinct vendor chunks for optimal caching & 60 FPS loading
          manualChunks: {
            'three-core': ['three'],
            'gsap-engine': ['gsap'],
            'zod-schema': ['zod'],
          },
        },
      },
    },

    // 4. Global Constants Injection
    define: {
      __APP_VERSION__: JSON.stringify('2.0.0-VITE'),
    },
   };
});
