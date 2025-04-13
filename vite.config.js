import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
    },
    server: {
        open: '/HTML/index.html'
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './'),
        },
    },
});