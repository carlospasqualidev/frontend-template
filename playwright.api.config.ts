import { defineConfig, devices } from '@playwright/test';

import { SERVER_API_URL } from './e2e/helpers/serverApi';

// E2E contra o server REAL (`npm run test:e2e:api`), opcional e fora do CI.
// Sobe o Vite em modo `api` de sessão apontando para `VITE_API_URL` (padrão
// `http://localhost:8080/api`) e roda só os specs de `e2e/api/`. O server
// (`../server-template`) precisa estar no ar, com migrations e seed aplicados;
// o `globalSetup` confere e para com a instrução se não estiver.
//
// Porta 4173 por padrão: está no `CORS_ORIGINS` padrão do server e não disputa a
// 5173 de um `npm run dev` aberto. Outra porta: `E2E_API_PORT=<porta>` aqui e a
// origem `http://localhost:<porta>` no `CORS_ORIGINS` do server.
const E2E_API_PORT = Number(process.env.E2E_API_PORT ?? 4173);
const baseURL = `http://localhost:${E2E_API_PORT}`;

export default defineConfig({
  testDir: './e2e/api',
  globalSetup: './e2e/api/globalSetup.ts',
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Um spec por vez: todos compartilham o banco de desenvolvimento, e o de
  // inatividade muda a configuração da empresa enquanto roda.
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Sem `reuseExistingServer`: um Vite já aberto na porta pode estar em modo
  // `fake` ou apontar para outra API. Porta ocupada = erro na subida.
  webServer: {
    command: `npm run dev -- --port ${E2E_API_PORT} --strictPort`,
    env: { VITE_SESSION_MODE: 'api', VITE_API_URL: SERVER_API_URL },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
