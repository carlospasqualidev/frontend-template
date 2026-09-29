import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Config dedicada de testes (separada do vite.config.ts para não carregar
// o vite-plugin-checker durante a execução da suíte).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: true,
    // `src/lib/env.ts` valida as envs no import e lança se faltar alguma —
    // qualquer teste cuja cadeia de imports passe por ele (api, sidebar, telas)
    // quebraria na coleta, dependendo de um `.env` local não versionado.
    // Estes valores são fixos e sintéticos: a suíte é hermética e não muda de
    // resultado conforme o `.env` da máquina. Env nova e OBRIGATÓRIA no schema
    // entra aqui também.
    env: {
      VITE_API_URL: 'http://localhost:8080/api',
      VITE_PROJECT_NAME: 'Frontend',
      VITE_PROJECT_ENVIRONMENT: 'Test',
      VITE_PROJECT_SIDE: 'Client',
      // Vazio de propósito: o schema normaliza '' para `undefined`, então o
      // reporte de erro externo fica desligado nos testes.
      VITE_ERROR_LOG_URL: '',
      // A suíte não tem backend: a sessão roda na implementação fictícia.
      VITE_SESSION_MODE: 'fake',
    },
    // Vitest cobre só unidade/integração em src/tests/ (`.test.ts(x)`).
    // Os specs `.spec.ts` de `e2e/` são do Playwright — sem isso o Vitest os
    // capturaria pelo glob default e quebraria no `test.describe()`.
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
