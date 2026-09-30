import { defineConfig, devices } from '@playwright/test';

import { FRONTEND_PORT, FRONTEND_URL } from './e2e/helpers/frontend';
import { SERVER_API_URL } from './e2e/helpers/serverApi';

// Testes end-to-end (E2E) com Playwright. Rodam a aplicação real no navegador
// contra o server REAL (`../server-template`), diferente dos testes de
// unidade/integração em `src/tests/` (Vitest + jsdom, sem rede). Os specs vivem
// em `e2e/`.
//
// O server precisa estar no ar, com migrations e seed aplicados, em
// `VITE_API_URL` (padrão `http://localhost:8080/api`); o `globalSetup` confere
// e para com a instrução se não estiver. O Vite sobe sozinho na porta dos E2E
// (`E2E_PORT`, padrão 4173) apontando para essa API.
export default defineConfig({
  testDir: './e2e',
  // Os specs de EMPILHAMENTO rodam contra o Storybook, com config própria
  // (`playwright.storybook.config.ts` / `npm run test:layers`), sem backend.
  testIgnore: ['**/storybook/**'],
  globalSetup: './e2e/globalSetup.ts',
  // Falha se um `test.only` for commitado por engano.
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Um spec por vez: todos dividem o banco de desenvolvimento, e os de
  // configurações e de inatividade mudam a configuração da empresa enquanto
  // rodam.
  workers: 1,
  fullyParallel: false,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Sobe o Vite na porta dos E2E (`--strictPort`: porta tomada é erro, não
  // outra porta). Um servidor já de pé na porta é reaproveitado, e o
  // `globalSetup` confere, antes de qualquer spec, que ele é este frontend
  // apontando para a mesma API; se não for, para com a mensagem.
  webServer: {
    command: `npm run dev -- --port ${FRONTEND_PORT} --strictPort`,
    env: { VITE_API_URL: SERVER_API_URL },
    url: FRONTEND_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
