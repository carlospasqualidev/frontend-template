import { expect, test } from '@playwright/test';

import { login } from './helpers/session';

// Menu "Colunas" da DataTable, exercitado na listagem de Usuários: o usuário
// oculta uma coluna, a escolha sobrevive ao recarregar (fica neste navegador)
// e "Mostrar todas" volta ao padrão.
test.describe('Tabela — mostrar e ocultar colunas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/users');
  });

  test('oculta uma coluna e mantém a escolha após recarregar', async ({
    page,
  }) => {
    const statusHeader = page.getByRole('columnheader', { name: 'Status' });
    await expect(statusHeader).toBeVisible();

    await page.getByRole('button', { name: 'Configurar colunas' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Status' }).click();
    await page.keyboard.press('Escape');

    await expect(statusHeader).toHaveCount(0);
    await expect(
      page.getByRole('columnheader', { name: 'Papel' })
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole('columnheader', { name: 'Papel' })
    ).toBeVisible();
    await expect(statusHeader).toHaveCount(0);

    await page.getByRole('button', { name: 'Configurar colunas' }).click();
    await page.getByRole('menuitem', { name: 'Mostrar todas' }).click();

    await expect(statusHeader).toBeVisible();
  });

  test('ocultar colunas não altera os filtros da URL', async ({ page }) => {
    await page.getByRole('button', { name: 'Configurar colunas' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Último acesso' }).click();
    await page.keyboard.press('Escape');

    await expect(
      page.getByRole('columnheader', { name: 'Último acesso' })
    ).toHaveCount(0);
    expect(new URL(page.url()).search).not.toContain('Último');
  });
});
