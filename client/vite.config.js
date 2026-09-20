import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const demo = mode === 'demo';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        // Resolved at build time, not at runtime, so the demo build never
        // contains a dynamic import() for this swap (see src/bootstrap).
        // Must come before the generic '@' alias below: aliases are matched
        // in order, and '@' would otherwise prefix-match this path first.
        '@/bootstrap/demo': path.resolve(
          process.cwd(),
          demo ? 'src/bootstrap/demo-init.js' : 'src/bootstrap/demo-noop.js'
        ),
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
    server: { port: 5173, proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } } },
    build: {
      outDir: 'dist',
      target: 'es2022',
      sourcemap: false,
      // The demo is collapsed into one portable HTML file, so it ships as a
      // single chunk. A normal deployment keeps vendor code cached separately.
      assetsInlineLimit: demo ? 1024 * 1024 : 4096,
      rollupOptions: {
        output: demo
          ? { entryFileNames: 'assets/[name].js', assetFileNames: 'assets/[name][extname]' }
          : {
              manualChunks: {
                vendor: ['react', 'react-dom', 'react-router-dom'],
                query: ['@tanstack/react-query'],
              },
            },
      },
    },
  };
});
