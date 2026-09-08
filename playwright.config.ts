import { defineConfig, devices } from '@playwright/test';

// Testes end-to-end (E2E) com Playwright. Rodam a aplicação real no navegador,
// diferente dos testes de unidade/integração em `src/tests/` (Vitest + jsdom).
// Os specs vivem em `e2e/`.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  // Os specs de EMPILHAMENTO rodam contra o Storybook, com config própria
  // (`playwright.storybook.config.ts` / `npm run test:layers`) — sem isso este
  // config tentaria abri-los no Vite do app.
  testIgnore: '**/storybook/**',
  // Falha se um `test.only` for commitado por engano.
  forbidOnly: !!process.env.CI,
  // Sem retry local; no CI, uma tentativa extra absorve flutuação de rede.
  retries: process.env.CI ? 1 : 0,
  // Serial no CI (runners têm poucos núcleos); paralelo total no dev.
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL,
    // Coleta trace apenas na primeira retentativa — barato no happy path,
    // rico para depurar a falha.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Sobe o dev server automaticamente e reaproveita um já rodando no dev.
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
