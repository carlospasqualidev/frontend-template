import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import {
  createRoleWithPermissions,
  createUserWithoutRole,
  deleteRole,
  deleteUserByEmail,
  deleteUserIfExists,
  newAdminApiContext,
  serverApiUrl,
  SEED_ADMIN,
  setUserRoles,
  uniqueSuffix,
  updateUser,
  type PreparedUser,
} from './helpers/serverApi';
import { login, openAdminSession } from './helpers/session';

function rowWith(page: Page, text: string) {
  return page.locator('tbody tr', { hasText: text });
}

function toastWith(page: Page, text: string) {
  return page.locator('[data-sonner-toast]', { hasText: text });
}

function usersUrl(filters: Record<string, unknown>): string {
  return `/users?filters=${encodeURIComponent(JSON.stringify(filters))}`;
}

// Hoje no fuso do navegador (o mesmo desta máquina), como o filtro de datas.
function todayInputDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

async function chooseRowAction(page: Page, rowText: string, action: string) {
  await rowWith(page, rowText)
    .getByRole('button', { name: 'Abrir menu' })
    .click();
  await page.getByRole('menuitem', { name: action }).click();
}

// As opções vêm da busca do servidor: o cargo é achado pelo nome digitado,
// esteja ou não na primeira página.
async function pickRole(page: Page, roleName: string) {
  await page.getByLabel('Cargos do usuário').click();
  const searched = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url().startsWith(serverApiUrl('/client/roles?')) &&
      new URL(response.url()).searchParams.get('search') === roleName
  );
  await page.getByRole('textbox', { name: 'Buscar...' }).fill(roleName);
  expect((await searched).status()).toBe(200);
  await page.getByRole('checkbox', { name: roleName }).click();
  await page.keyboard.press('Escape');
}

// Usuários (`/users`) contra o server real: lista com filtros no servidor,
// criação, edição, bloqueio, exclusão e troca de cargos. O preparo cria pela
// API, com o sufixo único desta execução no nome, as pessoas e os cargos de
// que cada teste precisa; a busca pelo sufixo isola o que o spec criou.
test.describe('Usuários', () => {
  const suffix = uniqueSuffix();
  const createdEmail = `e2e.criado.${suffix}@example.com`;
  const auditRoleName = `Cargo Auditoria ${suffix}`;

  let admin: APIRequestContext | undefined;
  const preparedUsers: PreparedUser[] = [];
  const roleIds: string[] = [];

  let active: PreparedUser;
  let blocked: PreparedUser;
  let withoutRole: PreparedUser;
  let manager: PreparedUser;
  let auditRoleId: string;

  async function prepareUser(name: string): Promise<PreparedUser> {
    if (!admin) throw new Error('Sessão do admin ausente.');
    const user = await createUserWithoutRole(admin, `${name} ${suffix}`);
    preparedUsers.push(user);
    return user;
  }

  test.beforeAll(async () => {
    admin = await newAdminApiContext();

    auditRoleId = await createRoleWithPermissions(admin, auditRoleName, [
      'backoffice.audit.read',
    ]);
    roleIds.push(auditRoleId);
    // Quem gerencia usuários, mas não tem a trilha de auditoria.
    const managerRoleId = await createRoleWithPermissions(
      admin,
      `Cargo Gestão ${suffix}`,
      [
        'backoffice.users.read',
        'backoffice.users.update',
        'backoffice.roles.read',
      ]
    );
    roleIds.push(managerRoleId);

    active = await prepareUser('Pessoa Ativa');
    await setUserRoles(admin, active.id, [auditRoleId]);
    blocked = await prepareUser('Pessoa Bloqueada');
    await updateUser(admin, blocked.id, { isActive: false });
    withoutRole = await prepareUser('Pessoa Sem Cargo');
    manager = await prepareUser('Pessoa Gestora');
    await setUserRoles(admin, manager.id, [managerRoleId]);
  });

  test.afterAll(async () => {
    try {
      if (admin) {
        await deleteUserByEmail(admin, createdEmail);
        // Quem a tela já excluiu (o `doomed`) não existe mais: o 404 é o fim
        // esperado da limpeza, não uma falha.
        for (const user of preparedUsers) {
          await deleteUserIfExists(admin, user.id);
        }
        for (const roleId of roleIds) await deleteRole(admin, roleId);
      }
    } finally {
      await admin?.dispose();
    }
  });

  test.describe('como admin', () => {
    test.beforeEach(async ({ page }) => {
      await openAdminSession(page);
    });

    test('lista do servidor, com cargos e status derivado de isActive', async ({
      page,
    }) => {
      const listed = page.waitForResponse(
        (response) =>
          response.url().startsWith(serverApiUrl('/client/users?')) &&
          response.request().method() === 'GET'
      );
      await page.goto(usersUrl({ search: suffix }));
      expect((await listed).status()).toBe(200);

      const activeRow = rowWith(page, active.name);
      await expect(activeRow).toContainText(active.email);
      await expect(activeRow).toContainText(auditRoleName);
      await expect(activeRow).toContainText('Ativo');
      await expect(activeRow).toContainText('Nunca acessou');
      await expect(rowWith(page, blocked.name)).toContainText('Bloqueado');
      await expect(rowWith(page, withoutRole.name)).toContainText('Sem cargo');
    });

    test('filtra por status pelos campos: o que casa aparece, o que não casa some', async ({
      page,
    }) => {
      await page.goto(usersUrl({ search: suffix }));
      await expect(rowWith(page, active.name)).toBeVisible();

      await page.getByLabel('Status').click();
      await page.getByRole('option', { name: 'Bloqueado' }).click();
      await page.getByRole('button', { name: 'Buscar' }).click();

      await expect(rowWith(page, blocked.name)).toBeVisible();
      await expect(rowWith(page, active.name)).toHaveCount(0);
      await expect(page).toHaveURL(/isActive/);
    });

    test('filtra por cargo e por período de cadastro no servidor', async ({
      page,
    }) => {
      await page.goto(usersUrl({ search: suffix, roleId: [auditRoleId] }));
      await expect(rowWith(page, active.name)).toBeVisible();
      await expect(rowWith(page, blocked.name)).toHaveCount(0);
      await expect(page.getByLabel('Cargos')).toContainText(auditRoleName);

      const today = todayInputDate();
      await page.goto(
        usersUrl({ search: suffix, createdAt: { from: today, to: today } })
      );
      await expect(rowWith(page, blocked.name)).toBeVisible();

      await page.goto(
        usersUrl({
          search: suffix,
          createdAt: { from: '2020-01-01', to: '2020-01-31' },
        })
      );
      await expect(page.getByText('Nenhum usuário encontrado.')).toBeVisible();
      await expect(rowWith(page, blocked.name)).toHaveCount(0);
    });

    test('cria um usuário e abre o detalhe dele na aba "Cargos"', async ({
      page,
    }) => {
      await page.goto('/users');
      await page.getByRole('link', { name: 'Novo usuário' }).click();
      await expect(page).toHaveURL(/\/users\/create$/);

      await page.getByLabel('Nome').fill(`Pessoa Criada ${suffix}`);
      await page.getByLabel('E-mail').fill(createdEmail);
      await page.getByLabel('Senha', { exact: true }).fill(`senha-${suffix}`);
      await page.getByLabel('Confirmação da senha').fill(`senha-${suffix}`);
      await page.getByLabel('Tempo de inatividade (min)').fill('15');

      const created = page.waitForResponse(
        (response) =>
          response.url() === serverApiUrl('/client/users') &&
          response.request().method() === 'POST'
      );
      await page.getByRole('button', { name: 'Criar usuário' }).click();
      expect((await created).status()).toBe(201);

      await expect(toastWith(page, 'Usuário criado.')).toBeVisible();
      await expect(page).toHaveURL(/\/users\/[0-9a-f-]+\?tab=roles$/);
      await expect(page.getByLabel('Cargos do usuário')).toBeVisible();
      await expect(page.getByText('Sem cargo').first()).toBeVisible();
    });

    test('recusa o e-mail já cadastrado com o toast do servidor', async ({
      page,
    }) => {
      await page.goto('/users/create');
      await page.getByLabel('Nome').fill(`Pessoa Repetida ${suffix}`);
      await page.getByLabel('E-mail').fill(active.email);
      await page.getByLabel('Senha', { exact: true }).fill(`senha-${suffix}`);
      await page.getByLabel('Confirmação da senha').fill(`senha-${suffix}`);
      await page.getByRole('button', { name: 'Criar usuário' }).click();

      await expect(toastWith(page, 'E-mail já cadastrado.')).toBeVisible();
      await expect(page).toHaveURL(/\/users\/create$/);
    });

    test('edita o cadastro no detalhe e o valor fica no servidor', async ({
      page,
    }) => {
      await page.goto(`/users/${withoutRole.id}`);
      const phone = page.getByLabel('Telefone');
      await phone.fill('(48) 99999-0000');

      const saved = page.waitForResponse(
        (response) =>
          response.url() === serverApiUrl(`/client/users/${withoutRole.id}`) &&
          response.request().method() === 'PATCH'
      );
      await page.getByRole('button', { name: 'Salvar alterações' }).click();
      const response = await saved;
      expect(response.status()).toBe(200);
      // Só o campo alterado vai no corpo.
      expect(response.request().postDataJSON()).toEqual({
        phone: '(48) 99999-0000',
      });

      await expect(toastWith(page, 'Usuário atualizado.')).toHaveCount(1);
      await expect(
        page.getByRole('button', { name: 'Excluir usuário' })
      ).toBeVisible();

      await page.reload();
      await expect(page.getByLabel('Telefone')).toHaveValue('(48) 99999-0000');
    });

    test('troca o cargo na aba "Cargos" e mostra as permissões dele', async ({
      page,
    }) => {
      await page.goto(`/users/${withoutRole.id}?tab=roles`);
      await pickRole(page, auditRoleName);

      await expect(
        page.getByText('Visualizar trilha de auditoria')
      ).toBeVisible();
      const saved = page.waitForResponse(
        (response) =>
          response.url() ===
            serverApiUrl(`/client/users/${withoutRole.id}/roles`) &&
          response.request().method() === 'PUT'
      );
      await page.getByRole('button', { name: 'Salvar alterações' }).click();
      expect((await saved).status()).toBe(200);
      await expect(
        toastWith(page, 'Cargos do usuário atualizados.')
      ).toBeVisible();

      await page.reload();
      await expect(page.getByLabel('Cargos do usuário')).toContainText(
        auditRoleName
      );
    });

    test('bloqueia e desbloqueia pela lista, com confirmação', async ({
      page,
    }) => {
      await page.goto(usersUrl({ search: active.name }));
      const row = rowWith(page, active.name);
      await expect(row).toContainText('Ativo');

      await chooseRowAction(page, active.name, 'Bloquear');
      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toContainText('Bloquear usuário?');
      await dialog.getByRole('button', { name: 'Bloquear' }).click();
      await expect(row).toContainText('Bloqueado');
      await expect(toastWith(page, 'Usuário atualizado.')).toBeVisible();

      await chooseRowAction(page, active.name, 'Desbloquear');
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Desbloquear' })
        .click();
      await expect(row).toContainText('Ativo');
    });

    test('exclui pela lista, com confirmação', async ({ page }) => {
      // Em `preparedUsers`: o `afterAll` o apaga se a exclusão pela tela falhar.
      const doomed = await prepareUser('Pessoa Excluída');

      await page.goto(usersUrl({ search: doomed.name }));
      await chooseRowAction(page, doomed.name, 'Excluir');
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Excluir' })
        .click();

      await expect(toastWith(page, 'Usuário excluído.')).toBeVisible();
      await expect(rowWith(page, doomed.name)).toHaveCount(0);
      await expect(page.getByText('Nenhum usuário encontrado.')).toBeVisible();
    });

    // A regra é do servidor: o toast é o dele, um só, e a confirmação fica
    // aberta.
    test('a recusa do servidor aparece num toast só, sem toast da tela', async ({
      page,
    }) => {
      await page.goto(usersUrl({ search: SEED_ADMIN.email }));
      await chooseRowAction(page, SEED_ADMIN.email, 'Excluir');
      const dialog = page.getByRole('alertdialog');
      await dialog.getByRole('button', { name: 'Excluir' }).click();

      const refusal = toastWith(
        page,
        'Você não pode excluir o próprio usuário.'
      );
      await expect(refusal).toBeVisible();
      expect(await page.locator('[data-sonner-toast]').count()).toBe(1);
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Cancelar' }).click();
      await expect(rowWith(page, SEED_ADMIN.email)).toBeVisible();
    });
  });

  // Anti-escalonamento: quem gerencia usuários sem ter a trilha de auditoria
  // não pode dar um cargo que a tem. A tela deixa escolher; quem recusa é o
  // servidor, e o toast é o dele.
  test('o servidor recusa dar cargo com permissão que o autor não tem', async ({
    page,
  }) => {
    await login(page, manager);
    await page.goto(`/users/${blocked.id}?tab=roles`);

    await pickRole(page, auditRoleName);
    const refused = page.waitForResponse(
      (response) =>
        response.url() === serverApiUrl(`/client/users/${blocked.id}/roles`) &&
        response.request().method() === 'PUT'
    );
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    expect((await refused).status()).toBe(403);

    await expect(
      toastWith(page, 'Você não pode conceder permissões que não possui.')
    ).toBeVisible();
    // A troca continua pendente.
    await expect(
      page.getByRole('button', { name: 'Salvar alterações' })
    ).toBeVisible();
    // Sem `backoffice.users.delete` nem a trilha: sem "Excluir" e sem "Atividade".
    await expect(page.getByRole('tab', { name: 'Atividade' })).toHaveCount(0);
  });
});
