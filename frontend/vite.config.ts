import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const frontendEnv = loadEnv(mode, __dirname, 'VITE_');
  const backendEnv = loadEnv(mode, path.resolve(__dirname, '../backend'), '');
  const supabaseUrl = (
    process.env.VITE_SUPABASE_URL ||
    frontendEnv.VITE_SUPABASE_URL ||
    backendEnv.SUPABASE_URL ||
    ''
  ).trim();
  const supabaseAnonKey = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    frontendEnv.VITE_SUPABASE_ANON_KEY ||
    backendEnv.SUPABASE_ANON_KEY ||
    ''
  ).trim();
  const usableUrl = supabaseUrl.includes('YOUR_PROJECT') ? '' : supabaseUrl;

  return {
  plugins: [react()],
  define: {
    ...(usableUrl
      ? { 'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(usableUrl) }
      : {}),
    ...(supabaseAnonKey
      ? { 'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey) }
      : {}),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // Log proxy requests for debugging
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying:', req.method, req.url, '→', proxyReq.path);
          });
        },
      },
    },
  },
  };
});

