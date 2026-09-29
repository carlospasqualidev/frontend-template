import { expect, test } from '@playwright/test';

import { login } from './helpers/session';

// Trilha de auditoria (`/audit-logs`) — listagem com filtro server-side (mock)
// e detalhe em modal. Cobre o que o usuário faz na aplicação rodando:
// navegar → ver os registros → filtrar (round-trip com dado) → abrir o detalhe.
test.describe('Auditoria', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/audit-logs');
  });

  test('lista os registros de auditoria', async ({ page }) => {
    await expect(
      page.locator('tbody tr', { hasText: 'Cadastrou o usuário Marina Alves' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buscar' })).toBeVisible();
  });

  test('filtra por conteúdo: o que casa aparece, o que não casa some', async ({ page }) => {
    // Antes do filtro, um registro que NÃO casa a busca está presente.
    const naoCasa = page.locator('tbody tr', { hasText: 'Entrou no sistema' });
    await expect(naoCasa.first()).toBeVisible();

    await page.getByLabel('Buscar no conteúdo').fill('Marina');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // O registro que casa continua; o que não casa sai da lista.
    await expect(
      page.locator('tbody tr', { hasText: 'Cadastrou o usuário Marina Alves' })
    ).toBeVisible();
    await expect(page.locator('tbody tr', { hasText: 'Entrou no sistema' })).toHaveCount(0);
  });

  test('filtra por módulo (multiSelect) mantendo só o que casa', async ({ page }) => {
    // O label do filtro multiSelect associa ao gatilho → getByLabel encontra.
    await page.getByLabel('Módulo').click();
    await page.getByRole('checkbox', { name: 'Faturamento' }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Registro do módulo Faturamento aparece; um de outro módulo some.
    await expect(page.locator('tbody tr', { hasText: 'fatura' }).first()).toBeVisible();
    await expect(
      page.locator('tbody tr', { hasText: 'Cadastrou o usuário Marina Alves' })
    ).toHaveCount(0);
  });

  // Paginação 0-based (DataTable e backend): a primeira página traz os 10
  // registros mais recentes e a seguinte, o restante — nenhum é pulado.
  test('pagina a partir do primeiro registro', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(
      page.locator('tbody tr', { hasText: 'Cadastrou o usuário Marina Alves' })
    ).toBeVisible();
    await expect(rows).toHaveCount(10);

    await page.getByRole('button', { name: 'Próxima' }).click();

    await expect(rows).toHaveCount(8);
    await expect(
      page.locator('tbody tr', { hasText: 'Cadastrou o usuário Marina Alves' })
    ).toHaveCount(0);
  });

  test('abre o detalhe da auditoria em modal com antes/depois', async ({ page }) => {
    await page.locator('tbody tr', { hasText: 'Alterou o perfil de acesso de Bruno' }).click();

    const dialog = page.getByRole('dialog', { name: 'Detalhe da auditoria' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Antes')).toBeVisible();
    await expect(dialog.getByText('Depois')).toBeVisible();
  });
});
