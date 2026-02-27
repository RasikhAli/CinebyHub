import { defineConfig } from 'vite';

export default defineConfig({
    // Set base to '/' for custom domains or './' for relative paths
    // Using './' is often safest for GitHub Pages to ensure assets load correctly
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        // Ensure the build produces clean relative paths
        rollupOptions: {
            input: {
                main: 'index.html',
                about: 'about.html',
                'privacy-policy': 'privacy-policy.html',
                contact: 'contact.html',
            },
            output: {
                manualChunks: undefined,
            },
        },
    },
    server: {
        port: 5173,
        strictPort: true,
    },
});
