import { expect, test } from '@playwright/test';

import { login } from './helpers/session';

// Sessão no modo FAKE (`VITE_SESSION_MODE=fake`, fixado pelo `webServer` do
// `playwright.config.ts`): o usuário fictício chega com as permissões que o menu
// consulta (`backoffice.*`), e o logout devolve as rotas protegidas ao login.
test.describe('Sessão', () => {
  test('o menu de Administração aparece com as permissões da sessão', async ({
    page,
  }) => {
    await login(page);

    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await sidebar.getByRole('button', { name: /Administração/ }).click();

    await expect(sidebar.getByRole('link', { name: 'Usuários' })).toBeVisible();
    await expect(
      sidebar.getByRole('link', { name: 'Auditoria' })
    ).toBeVisible();
    await expect(
      sidebar.getByRole('link', { name: 'Configurações' })
    ).toBeVisible();
  });

  test('sair encerra a sessão e as rotas protegidas voltam ao login', async ({
    page,
  }) => {
    await login(page);

    await page.getByRole('button', { name: /tester@example\.com/ }).click();
    await page.getByRole('menuitem', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login$/);
  });
});
