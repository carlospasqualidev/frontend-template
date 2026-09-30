import { expect, test } from '@playwright/test';

import { login } from './helpers/session';

// Trilha de auditoria (`/audit-logs`) — listagem com filtro server-side (mock)
// e detalhe em modal. Cobre o que o usuário faz na aplicação rodando:
// navegar → ver os registros → filtrar (round-trip com dado) → abrir o detalhe
// e ler o que mudou (de→para), com os dados técnicos recolhidos.
test.describe('Auditoria', () => {
  const RECENT_ROW =
    'Alterou a configuração "Prazo para anonimizar a auditoria (meses)".';

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/audit-logs');
  });

  test('lista os registros de auditoria', async ({ page }) => {
    await expect(
      page.locator('tbody tr', { hasText: RECENT_ROW })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buscar' })).toBeVisible();
  });

  test('filtra por conteúdo: o que casa aparece, o que não casa some', async ({
    page,
  }) => {
    // Antes do filtro, um registro que NÃO casa a busca está presente.
    const naoCasa = page.locator('tbody tr', { hasText: 'Entrou no sistema.' });
    await expect(naoCasa.first()).toBeVisible();

    await page.getByLabel('Buscar no conteúdo').fill('Priscila');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // O registro que casa aparece; o que não casa sai da lista.
    await expect(
      page.locator('tbody tr', {
        hasText: 'Criou o usuário "Priscila Camargo".',
      })
    ).toBeVisible();
    await expect(naoCasa).toHaveCount(0);
  });

  test('filtra por módulo (multiSelect) mantendo só o que casa', async ({
    page,
  }) => {
    // O label do filtro multiSelect associa ao gatilho → getByLabel encontra.
    await page.getByLabel('Módulo').click();
    await page.getByRole('checkbox', { name: 'Configurações' }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Registro do módulo Configurações aparece; um de outro módulo some.
    await expect(
      page.locator('tbody tr', { hasText: 'Notificações por e-mail' })
    ).toBeVisible();
    await expect(
      page.locator('tbody tr', { hasText: 'Entrou no sistema.' })
    ).toHaveCount(0);
  });

  // Paginação 0-based (DataTable e backend): a primeira página traz os 10
  // registros mais recentes e a seguinte, os próximos 10 — nenhum é pulado.
  test('pagina a partir do primeiro registro', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(
      page.locator('tbody tr', { hasText: RECENT_ROW })
    ).toBeVisible();
    await expect(rows).toHaveCount(10);

    await page.getByRole('button', { name: 'Próxima' }).click();

    await expect(
      page.locator('tbody tr', {
        hasText: 'Criou o usuário "Priscila Camargo".',
      })
    ).toBeVisible();
    await expect(rows).toHaveCount(10);
    await expect(page.locator('tbody tr', { hasText: RECENT_ROW })).toHaveCount(
      0
    );
  });

  test('abre o detalhe com o que mudou e os dados técnicos recolhidos', async ({
    page,
  }) => {
    await page
      .locator('tbody tr', { hasText: 'Notificações por e-mail' })
      .click();

    const dialog = page.getByRole('dialog', { name: 'Detalhe da auditoria' });
    await expect(
      dialog.getByRole('heading', { name: 'O que mudou' })
    ).toBeVisible();
    await expect(
      dialog.getByRole('term').filter({ hasText: 'Valor:' })
    ).toBeVisible();
    await expect(
      dialog.getByRole('definition').filter({ hasText: 'de Não para Sim' })
    ).toBeVisible();

    // "Antes"/"Depois" crus ficam recolhidos até o usuário pedir.
    await expect(dialog.getByText('Antes', { exact: true })).toHaveCount(0);
    await dialog.getByRole('button', { name: /Dados técnicos/ }).click();
    await expect(dialog.getByText('Antes', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Depois', { exact: true })).toBeVisible();
  });

  test('evento sem campos alterados mostra o estado vazio do de→para', async ({
    page,
  }) => {
    await page
      .locator('tbody tr', { hasText: 'Entrou no sistema.' })
      .first()
      .click();

    const dialog = page.getByRole('dialog', { name: 'Detalhe da auditoria' });
    await expect(
      dialog.getByText('Nenhum campo alterado neste evento.')
    ).toBeVisible();
  });
});

// Aba "Atividade" do detalhe do usuário: a linha do tempo dele, vinda da mesma
// trilha (`fetchEntityAuditLogs`), paginada com a página na URL.
test.describe('Atividade do usuário', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('mostra a linha do tempo com o de→para e pagina', async ({ page }) => {
    await page.goto('/users/u_003?tab=activity');

    // Texto exato: "Desbloqueou…" também contém "bloqueou".
    const blocked = page.getByRole('listitem').filter({
      has: page.getByText('Bloqueou o usuário "Camila Oliveira".', {
        exact: true,
      }),
    });
    await expect(blocked).toBeVisible();
    await expect(blocked.getByRole('definition')).toHaveText('de Sim para Não');
    await expect(page.getByText('1–10 de 12 eventos')).toBeVisible();

    await page.getByRole('button', { name: 'Próxima' }).click();

    const created = page
      .getByRole('listitem')
      .filter({ hasText: 'Criou o usuário "Camila Oliveira".' });
    await expect(created).toBeVisible();
    await expect(
      created.getByRole('definition').filter({ hasText: 'Camila Oliveira' })
    ).toHaveText('de [Vazio] para Camila Oliveira');
    await expect(blocked).toHaveCount(0);
    await expect(page).toHaveURL(/activityPage=1/);
  });

  test('usuário sem eventos mostra o estado vazio', async ({ page }) => {
    await page.goto('/users/u_005?tab=activity');

    await expect(page.getByText('Sem atividade registrada')).toBeVisible();
  });
});
