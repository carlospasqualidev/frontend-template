import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import {
  createUserWithoutRole,
  deleteRole,
  deleteUser,
  grantRoleWithPermissions,
  newAdminApiContext,
  serverApiUrl,
  uniqueSuffix,
  updateUser,
  type PreparedUser,
} from './helpers/serverApi';
import { login, openAdminSession } from './helpers/session';

// Edições de telefone no preparo: com a criação e o bloqueio, a pessoa
// auditada fica com 12 eventos, mais que uma página (10).
const PHONE_EDITS = 10;

function rowWith(page: Page, text: string) {
  return page.locator('tbody tr', { hasText: text });
}

async function searchContent(page: Page, text: string): Promise<void> {
  await page.getByLabel('Buscar no conteúdo').fill(text);
  await page.getByRole('button', { name: 'Buscar' }).click();
}

// Trilha de auditoria (`/audit-logs`) contra o server real — listagem com
// filtro server-side e detalhe em modal. O preparo cria pela API, com nomes
// únicos desta execução, uma pessoa auditada (criação, 10 edições e o
// bloqueio) e, por último, uma vizinha (só a criação, o evento mais recente).
// Buscar pelo nome da auditada isola os eventos dela dos que o banco já tem.
test.describe('Auditoria', () => {
  const suffix = uniqueSuffix();
  const auditedName = `Pessoa Auditada ${suffix}`;
  const neighborName = `Pessoa Vizinha ${suffix}`;
  const created = `Criou o usuário "${auditedName}".`;
  const blocked = `Bloqueou o usuário "${auditedName}".`;
  const neighborCreated = `Criou o usuário "${neighborName}".`;

  let admin: APIRequestContext | undefined;
  const preparedUsers: PreparedUser[] = [];

  test.beforeAll(async () => {
    admin = await newAdminApiContext();

    const audited = await createUserWithoutRole(admin, auditedName);
    preparedUsers.push(audited);
    for (let edit = 1; edit <= PHONE_EDITS; edit += 1) {
      await updateUser(admin, audited.id, {
        phone: `1199999${String(edit).padStart(4, '0')}`,
      });
    }
    await updateUser(admin, audited.id, { isActive: false });

    preparedUsers.push(await createUserWithoutRole(admin, neighborName));
  });

  test.afterAll(async () => {
    try {
      for (const user of preparedUsers) {
        if (admin) await deleteUser(admin, user.id);
      }
    } finally {
      await admin?.dispose();
    }
  });

  test.beforeEach(async ({ page }) => {
    await openAdminSession(page);
    await page.goto('/audit-logs');
  });

  test('lista os registros de auditoria, o mais recente primeiro', async ({
    page,
  }) => {
    await expect(page.locator('tbody tr').first()).toContainText(
      neighborCreated
    );
    await expect(page.getByRole('button', { name: 'Buscar' })).toBeVisible();
  });

  test('filtra por conteúdo: o que casa aparece, o que não casa some', async ({
    page,
  }) => {
    // Antes do filtro, um registro que NÃO casa a busca está presente.
    const naoCasa = rowWith(page, neighborCreated);
    await expect(naoCasa).toBeVisible();

    await searchContent(page, auditedName);

    // O registro que casa aparece; o que não casa sai da lista.
    await expect(rowWith(page, blocked)).toBeVisible();
    await expect(naoCasa).toHaveCount(0);
  });

  test('filtra por módulo (multiSelect) mantendo só o que casa', async ({
    page,
  }) => {
    await expect(rowWith(page, neighborCreated)).toBeVisible();

    // O label do filtro multiSelect associa ao gatilho → getByLabel encontra.
    await page.getByLabel('Módulo').click();
    await page.getByRole('checkbox', { name: 'Segurança' }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // O bloqueio é do módulo Segurança; a criação da vizinha, de Usuários.
    await expect(rowWith(page, blocked)).toBeVisible();
    await expect(rowWith(page, neighborCreated)).toHaveCount(0);
  });

  // Paginação 0-based (DataTable e backend): a primeira página traz os 10
  // eventos mais recentes da auditada e a seguinte, os 2 restantes — nenhum é
  // pulado.
  test('pagina a partir do primeiro registro', async ({ page }) => {
    await searchContent(page, auditedName);

    const rows = page.locator('tbody tr');
    await expect(rowWith(page, blocked)).toBeVisible();
    await expect(rows).toHaveCount(10);

    await page.getByRole('button', { name: 'Próxima' }).click();

    await expect(rowWith(page, created)).toBeVisible();
    await expect(rows).toHaveCount(2);
    await expect(rowWith(page, blocked)).toHaveCount(0);
  });

  test('abre o detalhe com o que mudou e os dados técnicos recolhidos', async ({
    page,
  }) => {
    await searchContent(page, auditedName);
    await rowWith(page, blocked).click();

    const dialog = page.getByRole('dialog', { name: 'Detalhe da auditoria' });
    await expect(
      dialog.getByRole('heading', { name: 'O que mudou' })
    ).toBeVisible();
    await expect(
      dialog.getByRole('term').filter({ hasText: 'Ativo:' })
    ).toBeVisible();
    await expect(
      dialog.getByRole('definition').filter({ hasText: 'de Sim para Não' })
    ).toBeVisible();

    // "Antes"/"Depois" crus ficam recolhidos até o usuário pedir.
    await expect(dialog.getByText('Antes', { exact: true })).toHaveCount(0);
    await dialog.getByRole('button', { name: /Dados técnicos/ }).click();
    await expect(dialog.getByText('Antes', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Depois', { exact: true })).toBeVisible();
  });

  // O login do admin no `globalSetup` deixa ao menos um evento de login, que
  // não tem campo alterado.
  test('evento sem campos alterados mostra o estado vazio do de→para', async ({
    page,
  }) => {
    await searchContent(page, 'Entrou no sistema.');
    await rowWith(page, 'Entrou no sistema.').first().click();

    const dialog = page.getByRole('dialog', { name: 'Detalhe da auditoria' });
    await expect(
      dialog.getByText('Nenhum campo alterado neste evento.')
    ).toBeVisible();
  });
});

// Filtro "Usuário": as opções vêm da listagem de usuários, que exige
// `backoffice.users.read`. O preparo cria uma pessoa auditora com um cargo só
// com `backoffice.audit.read`: ela vê a trilha sem o filtro; o admin vê o
// filtro e, pelo nome dela, chega ao login que ela acabou de fazer.
test.describe('Auditoria — filtro por usuário', () => {
  const auditorName = `Pessoa Auditora ${uniqueSuffix()}`;

  let admin: APIRequestContext | undefined;
  let auditor: PreparedUser | undefined;
  let roleId: string | undefined;

  test.beforeAll(async () => {
    admin = await newAdminApiContext();
    auditor = await createUserWithoutRole(admin, auditorName);
    roleId = await grantRoleWithPermissions(
      admin,
      auditor.id,
      `Auditoria sem usuários ${uniqueSuffix()}`,
      ['backoffice.audit.read']
    );
  });

  test.afterAll(async () => {
    try {
      if (admin && auditor) await deleteUser(admin, auditor.id);
      if (admin && roleId) await deleteRole(admin, roleId);
    } finally {
      await admin?.dispose();
    }
  });

  test('só aparece com a permissão de ver usuários, e filtra pelo autor', async ({
    page,
    browser,
  }) => {
    if (!auditor) throw new Error('Usuária do preparo ausente.');

    // Sem `backoffice.users.read`: a trilha abre, sem o filtro nem a chamada
    // à listagem de usuários.
    const usersCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().startsWith(serverApiUrl('/client/users?'))) {
        usersCalls.push(request.url());
      }
    });
    await login(page, auditor);
    await page.goto('/audit-logs');
    await expect(page.getByLabel('Módulo')).toBeVisible();
    await expect(page.getByLabel('Usuário', { exact: true })).toHaveCount(0);
    expect(usersCalls).toEqual([]);

    // Com a permissão (o admin): o filtro aparece e casa o autor do evento.
    const adminPage = await (await browser.newContext()).newPage();
    try {
      await openAdminSession(adminPage);
      await adminPage.goto('/audit-logs');

      const ownLogin = rowWith(adminPage, auditorName).filter({
        hasText: 'Entrou no sistema.',
      });
      const notByAuditor = rowWith(adminPage, 'Criou o usuário');
      await expect(notByAuditor.first()).toBeVisible();

      await adminPage.getByLabel('Usuário', { exact: true }).click();
      await adminPage.getByRole('checkbox', { name: auditorName }).click();
      await adminPage.keyboard.press('Escape');
      await adminPage.getByRole('button', { name: 'Buscar' }).click();

      await expect(ownLogin).toBeVisible();
      await expect(notByAuditor).toHaveCount(0);
    } finally {
      await adminPage.context().close();
    }
  });
});

// Aba "Atividade" do detalhe do usuário: a linha do tempo vem da trilha do
// server (`GET /client/audit-logs/entities/User/:id`). A lista e o detalhe de
// usuários ainda são dados de demonstração, com ids que o server não conhece:
// a linha do tempo volta vazia. A linha do tempo com eventos e a paginação
// voltam ao e2e quando os usuários forem do server.
test.describe('Atividade do usuário', () => {
  test('lê a linha do tempo do server e mostra o estado vazio', async ({
    page,
  }) => {
    await openAdminSession(page);

    const timeline = page.waitForResponse((response) =>
      response
        .url()
        .startsWith(serverApiUrl('/client/audit-logs/entities/User/u_005'))
    );
    await page.goto('/users/u_005?tab=activity');

    expect((await timeline).status()).toBe(200);
    await expect(page.getByText('Sem atividade registrada')).toBeVisible();
  });
});
