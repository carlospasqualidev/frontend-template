import { expect, test, type Page } from '@playwright/test';

import {
  isValidateResponse,
  SEED_ADMIN,
  SERVER_API_URL,
} from './helpers/serverApi';
import { login } from './helpers/session';
import { ADMIN_STORAGE_STATE } from './helpers/storageState';

// Sessão contra o server real, pela tela de login: cookie HTTP-only `token`
// gravado pelo server, validado em `GET /client/users/me`; o menu segue as
// permissões da sessão, e sair devolve as rotas protegidas ao login. Só o
// teste do login entra pela tela; o de sair parte da sessão do admin aberta
// pelo `globalSetup` (sair só apaga o cookie deste navegador: o JWT não é
// revogado, e a sessão guardada continua valendo para os outros specs).
const serverOrigin = new URL(SERVER_API_URL).origin;

function sidebarOf(page: Page) {
  return page.locator('[data-sidebar="sidebar"]');
}

async function expectAdministrationMenu(page: Page): Promise<void> {
  const sidebar = sidebarOf(page);
  const administration = sidebar.getByRole('button', {
    name: /Administração/,
  });

  if ((await administration.getAttribute('aria-expanded')) !== 'true') {
    await administration.click();
  }

  await expect(sidebar.getByRole('link', { name: 'Usuários' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Cargos' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Auditoria' })).toBeVisible();
  await expect(
    sidebar.getByRole('link', { name: 'Configurações' })
  ).toBeVisible();
}

async function findSessionCookie(page: Page) {
  const cookies = await page.context().cookies(serverOrigin);
  return cookies.find((cookie) => cookie.name === 'token');
}

test.describe('Sessão contra o server real', () => {
  test('abrir o app sem sessão vai ao login, sem toast de erro', async ({
    page,
  }) => {
    const validation = page.waitForResponse(isValidateResponse);
    await page.goto('/');

    expect((await validation).status()).toBe(401);
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: 'Bem-vindo de volta' })
    ).toBeVisible();
    // Contagem de uma vez, sem `toHaveCount(0)`: essa asserção espera, e passaria
    // quando o toast some sozinho (4 s). O toast do 401 sairia antes do
    // redirecionamento: na tela de login ele já estaria na página.
    expect(await page.locator('[data-sonner-toast]').count()).toBe(0);
  });

  test('o admin entra, vê Usuários, Cargos, Auditoria e Configurações, e recarregar mantém a sessão', async ({
    page,
  }) => {
    await login(page, SEED_ADMIN);

    const greeting = page.getByRole('heading', { level: 1, name: /Admin$/ });
    await expect(greeting).toBeVisible();
    await expectAdministrationMenu(page);

    // O cookie é do server e HTTP-only: o JavaScript da página não o lê.
    expect(await findSessionCookie(page)).toMatchObject({ httpOnly: true });
    expect(await page.evaluate(() => document.cookie)).not.toContain('token=');

    const validation = page.waitForResponse(isValidateResponse);
    await page.reload();

    expect((await validation).status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(greeting).toBeVisible();
    await expectAdministrationMenu(page);
  });

  test.describe('com a sessão aberta', () => {
    test.use({ storageState: ADMIN_STORAGE_STATE });

    test('sair volta ao login, e a rota protegida depois redireciona para o login', async ({
      page,
    }) => {
      await page.goto('/');
      expect(await findSessionCookie(page)).toMatchObject({ httpOnly: true });

      await page.getByRole('button', { name: /admin@admin\.com/ }).click();
      await page.getByRole('menuitem', { name: 'Sair' }).click();
      await expect(page).toHaveURL(/\/login$/);
      expect(await findSessionCookie(page)).toBeUndefined();

      const validation = page.waitForResponse(isValidateResponse);
      await page.goto('/settings');

      expect((await validation).status()).toBe(401);
      await expect(page).toHaveURL(/\/login$/);
    });
  });
});
