import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from "path";
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test-utils/setup.ts"],
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      host: 'localhost',
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  css: {
    preprocessorOptions: {},
  }
})