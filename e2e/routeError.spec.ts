import { expect, test, type Page } from '@playwright/test';

import { ADMIN_STORAGE_STATE } from './helpers/storageState';

const ERROR_HEADING = /Encontramos um problema e nossa equipe foi notificada/;
const RECOVERED_TEXT = 'Tela recuperada pelo e2e';

/*
 * Falha de render sem mexer no código: o módulo da tela, pelo caminho da fonte
 * que o Vite de desenvolvimento entrega ao `lazyRouteComponent` da rota
 * (`/src/screens/settings/index.tsx`, `/src/screens/session/login.tsx`), é
 * trocado por um que lança no render até o teste chamar `recoverScreen`.
 * Depois disso ele desenha só um texto, que é o que "Tentar novamente" precisa
 * mostrar. Só serve para módulo sem outro importador além da rota (ver E2E no
 * CLAUDE.md).
 */
async function breakScreen(
  page: Page,
  modulePath: string,
  exportName: string
): Promise<void> {
  await page.route(
    (url) => url.pathname === modulePath,
    (route) =>
      route.fulfill({
        contentType: 'text/javascript',
        body: `export function ${exportName}() {
  if (window.__e2eScreenRecovered !== true) {
    throw new Error('Falha de render simulada pelo e2e');
  }
  return ${JSON.stringify(RECOVERED_TEXT)};
}`,
      })
  );
}

async function recoverScreen(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.assign(window, { __e2eScreenRecovered: true });
  });
}

function sidebar(page: Page) {
  return page.locator('[data-sidebar="sidebar"]');
}

// A tela de erro de uma rota protegida fica no lugar do conteúdo, dentro do
// layout: o menu e o cabeçalho continuam.
test.describe('Tela de erro por rota: telas protegidas', () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
    await breakScreen(page, '/src/screens/settings/index.tsx', 'SettingsPage');
  });

  test('o erro no render troca só o conteúdo, e "Tentar novamente" desenha a tela de novo', async ({
    page,
  }) => {
    await page.goto('/settings');

    await expect(
      page.getByRole('heading', { name: ERROR_HEADING })
    ).toBeVisible();
    await expect(
      sidebar(page).getByRole('link', { name: 'Início' })
    ).toBeVisible();
    await expect(
      page
        .getByRole('navigation', { name: 'breadcrumb' })
        .getByText('Configurações')
    ).toBeVisible();

    await recoverScreen(page);
    await page.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(page.getByText(RECOVERED_TEXT)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: ERROR_HEADING })
    ).toHaveCount(0);
  });

  test('ir para outra tela pelo menu limpa o erro', async ({ page }) => {
    await page.goto('/settings');
    await expect(
      page.getByRole('heading', { name: ERROR_HEADING })
    ).toBeVisible();

    await sidebar(page).getByRole('link', { name: 'Início' }).click();

    await expect(
      page.getByRole('heading', { level: 1, name: /Admin$/ })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: ERROR_HEADING })
    ).toHaveCount(0);
  });
});

// Rota pública, sem o layout: a mesma tela de erro, cheia.
test.describe('Tela de erro por rota: rotas públicas', () => {
  test('o erro no render do login mostra a tela de erro sem o menu, e "Tentar novamente" desenha de novo', async ({
    page,
  }) => {
    await breakScreen(page, '/src/screens/session/login.tsx', 'LoginScreen');
    await page.goto('/login');

    await expect(
      page.getByRole('heading', { name: ERROR_HEADING })
    ).toBeVisible();
    expect(await sidebar(page).count()).toBe(0);

    await recoverScreen(page);
    await page.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(page.getByText(RECOVERED_TEXT)).toBeVisible();
  });
});
