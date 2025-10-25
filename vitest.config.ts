import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        globals: true,
        include: ['frontend/src/**/*.spec.{ts,tsx}', 'frontend/src/**/*.test.{ts,tsx}'],
        css: true
    },
    define: {
        'import.meta.env.VITE_BACKEND_URL': JSON.stringify('http://localhost:5000/api'),
    },
    resolve: {
        alias: {
            '@': resolve(process.cwd(), 'frontend/src'),
        },
    },
});