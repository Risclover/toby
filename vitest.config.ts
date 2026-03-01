import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        globals: true,
        include: ['frontend/src/**/*.spec.{ts,tsx}', 'frontend/src/**/*.test.{ts,tsx}'],

    },
    define: {
        'import.meta.env.VITE_BACKEND_URL': JSON.stringify('http://localhost:5000/api'),
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './frontend/src'), // maps @ -> frontend/src
        },
    },
});