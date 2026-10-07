import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import {
    defineConfig
} from 'vite';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    // Without this, Vite's "localhost" default resolves to the IPv6 loopback
    // ([::1]) on this machine, which the browser/HMR client can fail to
    // reach even though the Laravel page itself loads fine over IPv4 — pin
    // both the dev server and the URLs it reports back to Blade to IPv4.
    server: {
        host: '127.0.0.1',
        hmr: {
            host: '127.0.0.1',
        },
    },
});