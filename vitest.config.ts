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
    // `pool: 'threads'` (worker_threads) no lugar do padrão `forks` (um processo
    // filho por worker): medido em 2026-10-05 (TPL-31), em 6 pares intercalados
    // a mediana da suíte inteira caiu de ~58 s para ~53 s, verde e com o mesmo
    // número de testes (um arquivo filtrado fica igual, ~6 s). O isolamento
    // por arquivo continua (`isolate` no padrão): NÃO usar `isolate: false`, que
    // vaza estado de módulo (stores, mocks) entre arquivos.
    pool: 'threads',
    // `css: true` mantido de propósito: nenhum teste importa CSS pelo grafo de
    // módulos (`layers.test.ts` lê `src/index.css` via `fs`), então `css: false`
    // não mudou o tempo de forma reproduzível nas medições do TPL-31.
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
    },
    // Vitest cobre só unidade/integração em src/tests/ (`.test.ts(x)`).
    // Os specs `.spec.ts` de `e2e/` são do Playwright — sem isso o Vitest os
    // capturaria pelo glob default e quebraria no `test.describe()`.
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
