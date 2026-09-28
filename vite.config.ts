import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), checker({ typescript: true })],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    // Sourcemap oculto: o arquivo .map fica no dist mas não é referenciado pelo
    // bundle minificado, então o navegador não baixa em produção. Permite que
    // logs/reports (VITE_ERROR_LOG_URL) e ferramentas de monitoramento mapeiem
    // o stack trace de volta ao código original sem expor publicamente.
    sourcemap: 'hidden',
    rolldownOptions: {
      output: {
        // Separa as libs maiores em chunks próprios para melhorar o cache
        // (uma mudança no app não invalida o bundle do React/TanStack).
        // Radix/vaul/etc. ficam no `vendor` porque se referenciam entre si e
        // separá-los gera chunks circulares.
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return 'react-vendor';
          }

          if (id.includes('@tanstack')) {
            return 'tanstack';
          }

          return 'vendor';
        },
      },
    },
  },
});
