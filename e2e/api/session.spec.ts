import { expect, test, type Page } from '@playwright/test';

import {
  isValidateResponse,
  SEED_ADMIN,
  SERVER_API_URL,
} from '../helpers/serverApi';
import { login } from '../helpers/session';

// Sessão contra o server real (`npm run test:e2e:api`): cookie HTTP-only
// `token` gravado pelo server, validado em `GET /client/users/me`.
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

  test('o admin entra, vê Usuários, Auditoria e Configurações, e recarregar mantém a sessão', async ({
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

  test('sair volta ao login, e a rota protegida depois redireciona para o login', async ({
    page,
  }) => {
    await login(page, SEED_ADMIN);

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
