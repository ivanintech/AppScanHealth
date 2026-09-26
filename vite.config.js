import path from "path";
import { fileURLToPath, URL } from 'node:url';

// Configuración de Vite con alias corregidos
export default {
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".ngrok.io",
      ".ngrok-free.app",
      ".ngrok.app"
    ],
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: false,
  },
  plugins: [],
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/shared/components"),
      "@/hooks": path.resolve(__dirname, "./src/shared/hooks"),
      "@/lib": path.resolve(__dirname, "./src/shared/lib"),
      "@/config": path.resolve(__dirname, "./src/shared/config"),
      "@/types": path.resolve(__dirname, "./src/shared/types"),
      "@/services": path.resolve(__dirname, "./src/shared/services"),
      "@/supabase": path.resolve(__dirname, "./src/shared/supabase"),
    },
  },
};