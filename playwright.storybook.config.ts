import { defineConfig, devices } from '@playwright/test';

// Testes de EMPILHAMENTO (z-index) rodados contra o Storybook, não contra o app.
// Ficam separados do `playwright.config.ts` de propósito: o e2e de fluxo sobe o
// Vite (`npm run dev`) e não deve pagar o boot do Storybook a cada execução.
//
// Rode com `npm run test:layers`. Os specs vivem em `e2e/storybook/` e usam a
// bancada `src/stories/padroes/camadas/Camadas.stories.tsx`.
const baseURL = process.env.STORYBOOK_BASE_URL ?? 'http://localhost:6006';

export default defineConfig({
  testDir: './e2e/storybook',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run storybook -- --no-open --quiet',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    // O primeiro boot do Storybook compila o bundle inteiro — bem mais lento
    // que o do Vite do app.
    timeout: 240_000,
  },
});
