import { expect, test } from '@playwright/test';

import { ADMIN_STORAGE_STATE } from './helpers/storageState';

// Menu "Configurar colunas" da DataTable, exercitado na listagem de Usuários: o
// padrão oculta "Último acesso" e "Criado em"; o usuário oculta outra coluna, a
// escolha sobrevive ao recarregar (fica neste navegador) e "Mostrar todas" exibe
// todas as colunas e grava a lista de ocultas vazia.
test.describe('Tabela — mostrar e ocultar colunas', () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
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
      page.getByRole('columnheader', { name: 'Cargos' })
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole('columnheader', { name: 'Cargos' })
    ).toBeVisible();
    await expect(statusHeader).toHaveCount(0);

    await page.getByRole('button', { name: 'Configurar colunas' }).click();
    await page.getByRole('menuitem', { name: 'Mostrar todas' }).click();

    await expect(statusHeader).toBeVisible();
  });

  test('abrir o menu de colunas mantém a cor do cabeçalho', async ({
    page,
  }) => {
    const headerRow = page.locator('thead tr');
    const background = () =>
      headerRow.evaluate((row) => getComputedStyle(row).backgroundColor);
    const closedBackground = await background();

    await page.getByRole('button', { name: 'Configurar colunas' }).click();
    await expect(page.getByRole('menu')).toBeVisible();

    expect(await background()).toBe(closedBackground);
  });

  test('ocultar colunas não altera os filtros da URL', async ({ page }) => {
    await page.getByRole('button', { name: 'Configurar colunas' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Cargos' }).click();
    await page.keyboard.press('Escape');

    await expect(
      page.getByRole('columnheader', { name: 'Cargos' })
    ).toHaveCount(0);
    expect(new URL(page.url()).search).not.toContain('Cargos');
  });
});
